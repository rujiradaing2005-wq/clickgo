"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { queueNo } from "@/lib/format";
import { unlockAudio, isAudioRunning, playNewOrder, playPayment } from "@/lib/alert";

export default function OrderAlerts() {
  const [muted, setMuted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [pending, setPending] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const mutedRef = useRef(false);
  const pendingRef = useRef(0);
  const seen = useRef<Set<string>>(new Set());
  const claimed = useRef<Set<string>>(new Set());
  const ready = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ----- ปิด/เปิดเสียง (จำค่าไว้ — ค่าเริ่มต้น = เปิด) -----
  useEffect(() => {
    const m = localStorage.getItem("clickgo-admin-muted") === "1";
    setMuted(m);
    mutedRef.current = m;
  }, []);
  const toggleMute = () => {
    const m = !mutedRef.current;
    mutedRef.current = m;
    setMuted(m);
    localStorage.setItem("clickgo-admin-muted", m ? "1" : "0");
    if (!m) unlockAudio().then((ok) => ok && playNewOrder());
  };

  // ----- ปลดล็อกเสียงเมื่อมีการแตะ/คลิก/กดแป้นครั้งแรก -----
  useEffect(() => {
    const unlock = async () => setLocked(!(await unlockAudio()));
    unlock();
    const evs = ["pointerdown", "touchstart", "keydown", "click"];
    evs.forEach((e) => document.addEventListener(e, unlock, { passive: true }));
    const t = setInterval(() => setLocked(!isAudioRunning()), 2000);
    return () => {
      evs.forEach((e) => document.removeEventListener(e, unlock));
      clearInterval(t);
    };
  }, []);

  const notify = useCallback((kind: "order" | "pay", text: string) => {
    if (!mutedRef.current) (kind === "order" ? playNewOrder : playPayment)();
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([200, 100, 200]);
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 8000);
  }, []);

  // ----- ซิงก์ออเดอร์ที่ยังเปิดอยู่ แล้วเทียบว่ามีอะไรใหม่ -----
  const sync = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, order_no, status, payment_status, pay_claimed")
      .in("status", ["pending", "preparing", "ready"]);
    const rows = data ?? [];
    const pend = rows.filter((r) => r.status === "pending");
    const claims = rows.filter((r) => r.payment_status === "unpaid" && r.pay_claimed);

    setPending(pend.length);
    pendingRef.current = pend.length;

    pend.forEach((r) => {
      if (!seen.current.has(r.id)) {
        seen.current.add(r.id);
        if (ready.current) notify("order", `🛎️ ออเดอร์ใหม่ ${queueNo(r.order_no)}`);
      }
    });
    claims.forEach((r) => {
      if (!claimed.current.has(r.id)) {
        claimed.current.add(r.id);
        if (ready.current) notify("pay", `💸 ลูกค้ายืนยันการชำระเงิน ${queueNo(r.order_no)}`);
      }
    });
    ready.current = true; // ครั้งแรกแค่จดจำ ไม่ส่งเสียง
  }, [notify]);

  useEffect(() => {
    sync();
    const ch = supabase
      .channel("admin-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => sync())
      .subscribe();
    const poll = setInterval(sync, 10000); // เผื่อ realtime หลุด
    // เตือนซ้ำทุก 15 วินาที ตราบใดที่ยังมีออเดอร์รอรับ
    const remind = setInterval(() => {
      if (pendingRef.current > 0 && !mutedRef.current) playNewOrder();
    }, 15000);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(poll);
      clearInterval(remind);
    };
  }, [sync]);

  // ----- ชื่อแท็บแสดงจำนวนออเดอร์รอ -----
  useEffect(() => {
    document.title = pending > 0 ? `(${pending}) ออเดอร์ใหม่ – ClickGo Admin` : "ClickGo Admin";
  }, [pending]);

  // ----- กันหน้าจอดับ (แท็บเล็ตหน้าร้านจะได้ได้ยินเสียงตลอด) -----
  useEffect(() => {
    let lock: any = null;
    const req = async () => {
      try {
        lock = await (navigator as any).wakeLock?.request("screen");
      } catch {}
    };
    req();
    const vis = () => document.visibilityState === "visible" && req();
    document.addEventListener("visibilitychange", vis);
    return () => {
      document.removeEventListener("visibilitychange", vis);
      lock?.release?.();
    };
  }, []);

  return (
    <>
      {toast && (
        <Link
          href="/admin/orders"
          className="fixed bottom-20 right-4 z-50 animate-bounce rounded-2xl bg-orange-500 px-5 py-3 font-semibold text-white shadow-xl print:hidden"
        >
          {toast}
        </Link>
      )}

      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 print:hidden">
        <button
          onClick={toggleMute}
          className={`rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${
            muted ? "bg-gray-700 text-white" : "bg-green-600 text-white"
          }`}
        >
          {muted ? "🔕 ปิดเสียงอยู่" : "🔔 เสียงแจ้งเตือน: เปิด"}
        </button>
        <button
          onClick={() => unlockAudio().then((ok) => { setLocked(!ok); playNewOrder(); })}
          className="rounded-full bg-white px-3 py-2 text-xs shadow-lg"
        >
          ทดสอบเสียง
        </button>
      </div>
    </>
  );
}
