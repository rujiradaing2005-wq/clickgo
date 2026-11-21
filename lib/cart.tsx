"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type CartOption = { id: string; name: string; name_en?: string | null; price: number };

export type CartItem = {
  key: string; // สินค้า + ตัวเลือก + หมายเหตุ (ต่างกัน = คนละบรรทัด)
  id: string;
  name: string;
  name_en?: string | null;
  price: number; // ราคาต่อหน่วย รวมตัวเลือกแล้ว
  qty: number;
  note?: string;
  options: CartOption[];
};

type Ctx = {
  items: CartItem[];
  tableId: string | null;
  setTableId: (id: string) => void;
  add: (i: Omit<CartItem, "key">) => void;
  remove: (key: string) => void;
  changeQty: (key: string, delta: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartCtx = createContext<Ctx>(null!);
export const useCart = () => useContext(CartCtx);

const makeKey = (i: Omit<CartItem, "key">) =>
  `${i.id}|${i.options.map((o) => o.id).sort().join(",")}|${i.note ?? ""}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableId, setTable] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("clickgo-cart-v2");
      if (s) {
        const d = JSON.parse(s);
        setItems(d.items ?? []);
        setTable(d.tableId ?? null);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("clickgo-cart-v2", JSON.stringify({ items, tableId }));
  }, [items, tableId, loaded]);

  const setTableId = (id: string) => {
    setTable((prev) => {
      if (prev && prev !== id) setItems([]); // เปลี่ยนโต๊ะ = เริ่มตะกร้าใหม่
      return id;
    });
  };

  const add = (i: Omit<CartItem, "key">) =>
    setItems((p) => {
      const key = makeKey(i);
      const f = p.find((x) => x.key === key);
      return f
        ? p.map((x) => (x.key === key ? { ...x, qty: Math.min(99, x.qty + i.qty) } : x))
        : [...p, { ...i, key }];
    });
  const remove = (key: string) => setItems((p) => p.filter((x) => x.key !== key));
  const changeQty = (key: string, delta: number) =>
    setItems((p) =>
      p.map((x) => (x.key === key ? { ...x, qty: Math.max(1, Math.min(99, x.qty + delta)) } : x))
    );
  const clear = () => setItems([]);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartCtx.Provider value={{ items, tableId, setTableId, add, remove, changeQty, clear, total, count }}>
      {children}
    </CartCtx.Provider>
  );
}
