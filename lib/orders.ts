"use client";
import { useEffect, useState } from "react";

/**
 * รายการออเดอร์ของลูกค้า "เครื่องนี้" (เก็บใน localStorage)
 * - ออเดอร์เดิมยังอยู่ แม้เสร็จสิ้น/ชำระแล้ว ลูกค้าสั่งเพิ่มก็ยังเห็นออเดอร์ก่อนหน้า
 * - เริ่มรอบใหม่ (ล้างรายการ) เมื่อสแกน QR ใหม่ "และ" ออเดอร์เก่าจบครบทุกใบแล้ว
 * - สแกน QR โต๊ะอื่น = ล้างของโต๊ะเดิม / หมดอายุ 12 ชั่วโมง
 */
const KEY = "clickgo-my-orders";
const EVT = "clickgo-orders-changed";
const TTL = 12 * 60 * 60 * 1000;

type Entry = { id: string; table_id?: string | null; ts: number };

export type MyOrder = {
  id: string;
  order_no: number;
  table_id: string | null;
  table_name: string | null;
  table_name_en: string | null;
  total: number;
  status: "pending" | "preparing" | "ready" | "done" | "cancelled";
  payment_status: "unpaid" | "paid";
  payment_method: string | null;
  pay_claimed: boolean;
  created_at: string;
  items: { name: string; name_en: string | null; qty: number }[];
};

let cache: { t: number; v: MyOrder[] } | null = null;
let inflight: Promise<MyOrder[] | null> | null = null;

function read(): Entry[] {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    const now = Date.now();
    return (Array.isArray(arr) ? arr : []).filter((e) => e && e.id && now - e.ts < TTL);
  } catch {
    return [];
  }
}
function write(arr: Entry[]) {
  localStorage.setItem(KEY, JSON.stringify(arr.slice(-10)));
  cache = null;
  window.dispatchEvent(new Event(EVT));
}

export function addMyOrder(id: string, table_id?: string | null) {
  write([...read().filter((e) => e.id !== id), { id, table_id: table_id ?? null, ts: Date.now() }]);
}

/** สแกน QR โต๊ะอื่น = เริ่มใหม่ ล้างออเดอร์ของโต๊ะเดิม */
export function dropOrdersNotAtTable(tableId: string) {
  const all = read();
  const keep = all.filter((e) => !e.table_id || e.table_id === tableId);
  if (keep.length !== all.length) write(keep);
}

/** ออเดอร์ที่ยังไม่จบ = ยังไม่ยกเลิก และยังไม่ (เสร็จสิ้น + จ่ายแล้ว) */
export const isActive = (o: MyOrder) => o.status !== "cancelled" && !(o.status === "done" && o.payment_status === "paid");

/** ดึงสถานะล่าสุดจากเซิร์ฟเวอร์ (ถ้าเน็ตมีปัญหาจะคืน null) — เรียงออเดอร์ที่ยังไม่จบก่อน */
export function refreshMyOrders(): Promise<MyOrder[] | null> {
  if (cache && Date.now() - cache.t < 2000) return Promise.resolve(cache.v);
  if (inflight) return inflight;

  inflight = (async () => {
    const entries = read();
    if (!entries.length) {
      cache = { t: Date.now(), v: [] };
      return [];
    }
    try {
      const res = await fetch(`/api/orders?ids=${entries.map((e) => e.id).join(",")}`, { cache: "no-store" });
      if (!res.ok) return null;
      const { orders } = (await res.json()) as { orders: MyOrder[] };
      const found = new Set(orders.map((o) => o.id));
      if (entries.some((e) => !found.has(e.id))) {
        // ออเดอร์ที่ถูกลบออกจากระบบแล้ว
        localStorage.setItem(KEY, JSON.stringify(entries.filter((e) => found.has(e.id))));
      }
      const sorted = [...orders].sort((a, b) => {
        const d = Number(isActive(b)) - Number(isActive(a));
        return d !== 0 ? d : +new Date(b.created_at) - +new Date(a.created_at);
      });
      cache = { t: Date.now(), v: sorted };
      return sorted;
    } catch {
      return null;
    }
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** เรียกตอนลูกค้าสแกน QR เข้ามาใหม่: ถ้าออเดอร์เก่าจบครบทุกใบแล้ว ถือว่าเริ่มรอบใหม่ */
export async function resetVisitIfFinished() {
  const list = await refreshMyOrders();
  if (list && list.length > 0 && list.every((o) => !isActive(o))) write([]);
}

export function useMyOrders(pollMs = 0) {
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  useEffect(() => {
    let stop = false;
    const run = async () => {
      const r = await refreshMyOrders();
      if (!stop && r) setOrders(r);
    };
    run();
    window.addEventListener(EVT, run);
    const timer = pollMs ? setInterval(run, pollMs) : null;
    return () => {
      stop = true;
      window.removeEventListener(EVT, run);
      if (timer) clearInterval(timer);
    };
  }, [pollMs]);
  return orders;
}
