"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { useLang, type TKey } from "@/lib/i18n";
import { baht } from "@/lib/format";
import { addMyOrder } from "@/lib/orders";
import BottomNav from "@/components/BottomNav";
import LangToggle from "@/components/LangToggle";

export default function CartPage() {
  const { items, remove, changeQty, clear, total, tableId } = useCart();
  const { t, tr } = useLang();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function confirmOrder() {
    if (!items.length) return;
    if (!tableId) {
      setError(t("no_table"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          customerName: name.trim() || null,
          items: items.map((i) => ({
            id: i.id,
            qty: i.qty,
            note: i.note ?? null,
            options: i.options.map((o) => o.id),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const key = `err_${data.code}` as TKey;
        const msg = data.code ? t(key) : t("err_generic");
        setError(data.name ? `${data.name}: ${msg}` : msg);
        setLoading(false);
        return;
      }
      addMyOrder(data.id, tableId);
      clear();
      router.push(`/pay/${data.id}`);
    } catch {
      setError(t("err_generic"));
      setLoading(false);
    }
  }

  return (
    <main className="pb-44">
      <header className="flex items-center justify-between rounded-b-3xl bg-coffee p-4 text-white">
        <h1 className="text-xl font-bold">🛒 {t("cart_title")}</h1>
        <div className="flex items-center gap-3">
          <Link href={tableId ? `/t/${tableId}/menu` : "/"} className="text-sm text-brand underline">
            {t("add_more")}
          </Link>
          <LangToggle />
        </div>
      </header>

      {items.length === 0 ? (
        <p className="p-10 text-center text-gray-500">{t("empty_cart")}</p>
      ) : (
        <div className="space-y-3 p-4">
          {items.map((i) => (
            <div key={i.key} className="rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{tr(i.name, i.name_en)}</p>
                  {i.options.length > 0 && (
                    <p className="text-sm text-gray-500">{i.options.map((o) => tr(o.name, o.name_en)).join(", ")}</p>
                  )}
                  {i.note && (
                    <p className="text-sm text-gray-500">
                      {t("note_label")}: {i.note}
                    </p>
                  )}
                </div>
                <p className="shrink-0 font-semibold text-brand">{baht(i.price * i.qty)}</p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => changeQty(i.key, -1)} className="h-7 w-7 rounded-full bg-gray-100 text-lg leading-none">−</button>
                  <span className="w-5 text-center">{i.qty}</span>
                  <button onClick={() => changeQty(i.key, 1)} className="h-7 w-7 rounded-full bg-brand text-lg leading-none text-white">+</button>
                </div>
                <button onClick={() => remove(i.key)} className="text-sm text-red-500">
                  {t("remove")}
                </button>
              </div>
            </div>
          ))}

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name_ph")}
            maxLength={40}
            className="w-full rounded-xl border bg-white p-3"
          />
          <div className="flex justify-between text-lg font-bold text-coffee">
            <span>{t("total")}</span>
            <span>{baht(total)}</span>
          </div>
          {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        </div>
      )}

      <button
        onClick={confirmOrder}
        disabled={loading || !items.length}
        className="fixed bottom-20 left-1/2 w-[90%] max-w-sm -translate-x-1/2 rounded-full bg-brand py-3.5 font-semibold text-white shadow-lg disabled:opacity-50"
      >
        {loading ? t("sending") : t("confirm")}
      </button>

      <BottomNav active="cart" />
    </main>
  );
}
