"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import generatePayload from "promptpay-qr";
import { getSettings } from "@/lib/supabase";
import { useLang } from "@/lib/i18n";
import { baht, queueNo } from "@/lib/format";
import BottomNav from "@/components/BottomNav";
import LangToggle from "@/components/LangToggle";
import type { Settings } from "@/lib/types";

export default function PayPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { t, tr } = useLang();
  const [data, setData] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
    if (res.status === 404) return setNotFound(true);
    if (res.ok) setData(await res.json());
  }, [orderId]);

  useEffect(() => {
    getSettings().then(setSettings);
    load();
    const timer = setInterval(load, 4000); // เช็คว่าร้านยืนยันรับเงินแล้วหรือยัง
    return () => clearInterval(timer);
  }, [orderId, load]);

  async function act(body: Record<string, string>) {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) setErr(t("pay_err"));
      await load();
    } catch {
      setErr(t("pay_err"));
    }
    setBusy(false);
  }

  if (notFound) return <p className="p-6 text-center">{t("order_nf")}</p>;
  if (!data) return <p className="p-6 text-center text-gray-500">{t("loading")}</p>;

  const { order } = data;
  const paid = order.payment_status === "paid";
  const cancelled = order.status === "cancelled";
  const canScan = !!settings?.promptpay_id;
  const method: string | null = order.payment_method;

  let payload = "";
  if (canScan && method === "promptpay") {
    try {
      payload = generatePayload(settings!.promptpay_id!, { amount: Number(order.total) });
    } catch {}
  }

  const card = (key: "promptpay" | "cash", icon: string, title: string, desc: string, off = false) => (
    <button
      key={key}
      disabled={busy || off}
      onClick={() => act({ action: "choose", method: key })}
      className={`relative flex flex-col items-center rounded-2xl border-2 p-4 text-center ${off ? "opacity-50 " : ""}${
        method === key ? "border-brand bg-orange-50" : "border-gray-200 bg-white"
      }`}
    >
      {method === key && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs text-white">
          ✓
        </span>
      )}
      <span className="text-4xl">{icon}</span>
      <span className="mt-2 font-semibold text-coffee">{title}</span>
      <span className="text-xs text-gray-500">{desc}</span>
    </button>
  );

  return (
    <main className="pb-24">
      <header className="rounded-b-3xl bg-coffee px-4 pb-6 pt-4 text-center text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">{t("pay_title")}</h1>
          <LangToggle />
        </div>
        <p className="mt-3 text-sm text-white/70">{t("pay_amount")}</p>
        <p className="text-5xl font-extrabold text-brand">{baht(order.total)}</p>
        <p className="mt-1 text-sm text-white/70">
          {t("queue")} {queueNo(order.order_no)}
        </p>
      </header>

      <div className="space-y-4 p-4">
        {cancelled ? (
          <p className="rounded-xl bg-red-50 p-3 text-center text-red-600">{t("cancelled")}</p>
        ) : paid ? (
          <div className="rounded-2xl bg-green-50 p-6 text-center text-green-700">
            <p className="text-5xl">✅</p>
            <p className="mt-2 font-semibold">{t("paid_ok")}</p>
          </div>
        ) : (
          <>
            <h2 className="font-semibold text-coffee">{t("pay_choose")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {card("promptpay", "📱", t("pay_scan"), canScan ? t("pay_scan_desc") : t("pay_scan_off"), !canScan)}
              {card("cash", "💵", t("pay_cash"), t("pay_cash_desc"))}
            </div>

            {err && <p className="rounded-lg bg-red-50 p-2 text-center text-sm text-red-600">{err}</p>}

            {method === "promptpay" && canScan && (
              <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
                <p className="font-semibold text-coffee">{tr(settings?.shop_name, settings?.shop_name_en)}</p>
                {payload ? (
                  <div className="my-3 flex justify-center">
                    <QRCodeSVG value={payload} size={230} marginSize={2} />
                  </div>
                ) : (
                  <p className="my-6 text-sm text-red-500">QR error</p>
                )}
                <p className="text-2xl font-bold text-brand">{baht(order.total)}</p>
                <p className="mt-1 text-xs text-gray-500">{t("pay_scan_hint")}</p>

                {order.pay_claimed ? (
                  <p className="mt-4 rounded-full bg-green-50 py-2 text-sm font-medium text-green-700">
                    ✓ {t("pay_claimed")}
                  </p>
                ) : (
                  <button
                    disabled={busy}
                    onClick={() => act({ action: "claim" })}
                    className="mt-4 w-full rounded-full bg-brand py-3 font-semibold text-white shadow disabled:opacity-50"
                  >
                    {t("pay_done_btn")}
                  </button>
                )}
              </div>
            )}

            {method === "cash" && (
              <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
                <p className="text-5xl">💵</p>
                <p className="mt-2 text-sm text-gray-600">{t("pay_cash_msg")}</p>
                <p className="mt-3 text-4xl font-extrabold tracking-wide text-brand">{queueNo(order.order_no)}</p>
              </div>
            )}
          </>
        )}

        <Link
          href={`/order/${orderId}`}
          className="block rounded-full border border-brand py-2.5 text-center font-medium text-brand"
        >
          {t("pay_status_link")}
        </Link>
      </div>

      <BottomNav active="orders" tableId={order.table_id} />
    </main>
  );
}
