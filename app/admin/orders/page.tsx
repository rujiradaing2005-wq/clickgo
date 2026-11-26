"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { baht, queueNo } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/types";

const NEXT: Record<string, string> = { pending: "preparing", preparing: "ready", ready: "done" };
const NEXT_LABEL: Record<string, string> = {
  pending: "รับออเดอร์",
  preparing: "พร้อมรับ",
  ready: "เสร็จสิ้น",
};

export default function AdminOrders() {
  const [tab, setTab] = useState<"active" | "history">("active");
  const [orders, setOrders] = useState<any[]>([]);
  const [sales, setSales] = useState({ count: 0, sum: 0 });

  const load = useCallback(async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const q = supabase.from("orders").select("*, tables(name), order_items(*)");
    const { data } =
      tab === "active"
        ? await q.in("status", ["pending", "preparing", "ready"]).order("created_at")
        : await q
            .in("status", ["done", "cancelled"])
            .gte("created_at", start.toISOString())
            .order("created_at", { ascending: false });
    setOrders(data ?? []);

    const { data: today } = await supabase
      .from("orders")
      .select("total")
      .gte("created_at", start.toISOString())
      .neq("status", "cancelled");
    setSales({ count: today?.length ?? 0, sum: (today ?? []).reduce((s, o: any) => s + Number(o.total), 0) });
  }, [tab]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => load())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => load())
      .subscribe();
    const poll = setInterval(load, 15000); 
    return () => {
      supabase.removeChannel(ch);
      clearInterval(poll);
    };
  }, [load]);

  const update = async (id: string, patch: Record<string, string>) => {
    await supabase.from("orders").update(patch).eq("id", id);
    load();
  };

  return (
    <main className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {(["active", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1 text-sm ${tab === t ? "bg-orange-500 text-white" : "bg-gray-100"}`}
          >
            {t === "active" ? "กำลังดำเนินการ" : "ประวัติวันนี้"}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-600">
          ยอดขายวันนี้ <b>{baht(sales.sum)}</b> ({sales.count} ออเดอร์)
        </span>
      </div>

      {orders.length === 0 && <p className="py-10 text-center text-gray-500">ยังไม่มีออเดอร์</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((o) => (
          <div key={o.id} className="rounded-xl border p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-extrabold text-orange-500">{queueNo(o.order_no)}</p>
                <p className="text-sm text-gray-600">
                  {o.tables?.name ?? "-"} {o.customer_name && `· ${o.customer_name}`}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(o.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="space-y-1 text-right text-xs">
                <p className="rounded bg-gray-100 px-2 py-1">{STATUS_LABEL[o.status]}</p>
                <p className={`rounded px-2 py-1 ${o.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {o.payment_status === "paid" ? "จ่ายแล้ว" : "ยังไม่จ่าย"}
                </p>
                {o.payment_method && (
                  <p className="rounded bg-blue-50 px-2 py-1 text-blue-700">
                    {o.payment_method === "cash" ? "💵 เงินสด" : "📱 สแกนจ่าย"}
                  </p>
                )}
                {o.pay_claimed && o.payment_status === "unpaid" && (
                  <p className="animate-pulse rounded bg-green-100 px-2 py-1 font-semibold text-green-700">
                    ลูกค้ายืนยันชำระเงินแล้ว
                  </p>
                )}
              </div>
            </div>

            <ul className="my-3 space-y-0.5 text-sm">
              {o.order_items.map((i: any) => (
                <li key={i.id}>
                  {i.name} × {i.qty}
                  {i.note && <em className="text-gray-500"> – {i.note}</em>}
                </li>
              ))}
            </ul>
            <p className="font-bold">{baht(o.total)}</p>

            {tab === "active" && (
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {NEXT[o.status] && (
                  <button onClick={() => update(o.id, { status: NEXT[o.status] })} className="rounded bg-orange-500 px-3 py-1 text-white">
                    {NEXT_LABEL[o.status]}
                  </button>
                )}
                {o.payment_status === "unpaid" && (
                  <>
                    <button
                      onClick={() => update(o.id, { payment_status: "paid", payment_method: "cash" })}
                      className="rounded bg-green-600 px-3 py-1 text-white"
                    >
                      รับเงินสดแล้ว
                    </button>
                    <button
                      onClick={() => update(o.id, { payment_status: "paid", payment_method: "promptpay" })}
                      className="rounded bg-emerald-700 px-3 py-1 text-white"
                    >
                      รับเงินโอนแล้ว
                    </button>
                  </>
                )}
                <button
                  onClick={() => confirm("ยกเลิกออเดอร์นี้?") && update(o.id, { status: "cancelled" })}
                  className="rounded border px-3 py-1 text-red-500"
                >
                  ยกเลิก
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
