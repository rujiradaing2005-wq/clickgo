"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { baht, queueNo } from "@/lib/format";
import BottomNav from "@/components/BottomNav";
import LangToggle from "@/components/LangToggle";

const steps = ["pending", "preparing", "ready", "done"] as const;

export default function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { t, tr, tn } = useLang();
  const [data, setData] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let stop = false;

    async function load() {
      const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
      if (res.status === 404) return setNotFound(true);
      if (res.ok && !stop) setData(await res.json());
    }
    load();
    const timer = setInterval(load, 4000); // เช็คสถานะทุก 4 วินาที
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [orderId]);

  if (notFound) return <p className="p-6 text-center">{t("order_nf")}</p>;
  if (!data) return <p className="p-6 text-center text-gray-500">{t("loading")}</p>;

  const { order, items } = data;
  const current = steps.indexOf(order.status);

  return (
    <main className="pb-24">
      <div className="rounded-b-3xl bg-coffee px-4 pb-6 pt-4 text-center text-white">
        <div className="flex justify-end">
          <LangToggle />
        </div>
        <p className="text-sm text-white/70">{t("queue")}</p>
        <p className="text-6xl font-extrabold tracking-wide text-brand">{queueNo(order.order_no)}</p>
        {order.table_name && (
          <p className="mt-1 text-sm text-white/70">📍 {tn(order.table_name, order.table_name_en)}</p>
        )}
      </div>

      <div className="space-y-5 p-4">
        {order.status === "cancelled" ? (
          <p className="rounded-xl bg-red-50 p-3 text-center text-red-600">{t("cancelled")}</p>
        ) : (
          <ol className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
            {steps.map((s, i) => (
              <li
                key={s}
                className={`flex items-center gap-3 ${i <= current ? "font-semibold text-brand" : "text-gray-400"}`}
              >
                <span className={`h-3 w-3 rounded-full ${i <= current ? "bg-brand" : "bg-gray-300"}`} />
                {t(`st_${s}` as any)}
                {i === current && s !== "done" && <span className="text-xs text-gray-400">{t("now")}</span>}
              </li>
            ))}
          </ol>
        )}

        {order.payment_status === "paid" ? (
          <p className="rounded-xl bg-green-50 p-3 text-center text-green-700">{t("paid_ok")}</p>
        ) : (
          order.status !== "cancelled" && (
            <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
              <p className="font-semibold text-coffee">
                {t("pay_unpaid")} · {baht(order.total)}
              </p>
              {order.payment_method && (
                <p className="mt-1 text-sm text-gray-500">
                  {order.payment_method === "cash" ? "💵 " + t("method_cash") : "📱 " + t("method_scan")}
                  {order.pay_claimed ? ` · ${t("pay_claimed")}` : ""}
                </p>
              )}
              <Link
                href={`/pay/${orderId}`}
                className="mt-3 inline-block rounded-full bg-brand px-6 py-2 font-semibold text-white"
              >
                {t("pay_go")}
              </Link>
            </div>
          )
        )}

        <div className="space-y-1 rounded-2xl bg-white p-4 text-sm shadow-sm">
          {items.map((i: any) => (
            <div key={i.id}>
              <div className="flex justify-between">
                <span>
                  {tr(i.name, i.name_en)} × {i.qty}
                </span>
                <span>{baht(i.price * i.qty)}</span>
              </div>
              {Array.isArray(i.options) && i.options.length > 0 && (
                <p className="text-xs text-gray-500">{i.options.map((o: any) => tr(o.name, o.name_en)).join(", ")}</p>
              )}
              {i.note && (
                <p className="text-xs text-gray-500">
                  {t("note_label")}: {i.note}
                </p>
              )}
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold">
            <span>{t("sum")}</span>
            <span>{baht(order.total)}</span>
          </div>
        </div>

        {order.table_id && (
          <Link
            href={`/t/${order.table_id}/menu`}
            className="block rounded-full border border-brand py-2.5 text-center font-medium text-brand"
          >
            {t("order_more")}
          </Link>
        )}
      </div>

      <BottomNav active="orders" tableId={order.table_id} />
    </main>
  );
}
