"use client";
import { useEffect, useState } from "react";

/**
 * รายการออเดอร์ของลูกค้า "เครื่องนี้" (เก็บใน localStorage)
 * - ออเดอร์ที่จบแล้ว (เสร็จสิ้น+จ่ายแล้ว หรือยกเลิก) จะหายออกจากรายการอัตโนมัติ
 * - ออเดอร์ที่ยังไม่จบ (รอรับ/กำลังทำ/พร้อมรับ/ยังไม่จ่าย) ยังอยู่ ลูกค้าคนเดิมสั่งเพิ่มก็ยังเห็น
 * - หมดอายุ 12 ชั่วโมง และสแกน QR โต๊ะอื่นจะล้างของโต๊ะเดิม
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

const isActive = (o: MyOrder) => o.status !== "cancelled" && !(o.status === "done" && o.payment_status === "paid");

/** ดึงสถานะล่าสุดจากเซิร์ฟเวอร์ แล้วตัดออเดอร์ที่จบแล้วออกจากรายการ (ถ้าเน็ตมีปัญหาจะคืน null) */
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
      const alive = orders.filter(isActive).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      const aliveIds = new Set(alive.map((o) => o.id));
      if (entries.some((e) => !aliveIds.has(e.id))) {
        localStorage.setItem(KEY, JSON.stringify(entries.filter((e) => aliveIds.has(e.id))));
      }
      cache = { t: Date.now(), v: alive };
      return alive;
    } catch {
      return null;
    }
  })().finally(() => {
    inflight = null;
  });
  return inflight;
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
