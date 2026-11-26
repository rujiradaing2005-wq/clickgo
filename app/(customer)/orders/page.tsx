"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { useMyOrders, isActive, type MyOrder } from "@/lib/orders";
import { baht, queueNo } from "@/lib/format";
import BottomNav from "@/components/BottomNav";
import LangToggle from "@/components/LangToggle";

export default function MyOrdersPage() {
  const { t, tr, tn } = useLang();
  const { tableId } = useCart();
  const orders = useMyOrders(5000); // อัปเดตสถานะทุก 5 วินาที

  const active = (orders ?? []).filter(isActive);
  const past = (orders ?? []).filter((o) => !isActive(o));

  const card = (o: MyOrder, dim = false) => {
    const time = new Date(o.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    const summary = o.items.map((i) => `${tr(i.name, i.name_en)} ×${i.qty}`).join(", ");
    return (
      <div key={o.id} className={`rounded-2xl bg-white p-4 shadow-sm ${dim ? "opacity-80" : ""}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-3xl font-extrabold ${dim ? "text-gray-400" : "text-brand"}`}>{queueNo(o.order_no)}</p>
            <p className="text-xs text-gray-500">
              {o.table_name ? `${tn(o.table_name, o.table_name_en)} · ` : ""}
              {time}
            </p>
          </div>
          <div className="space-y-1 text-right text-xs">
            <p className="rounded-full bg-orange-50 px-3 py-1 font-medium text-brand">{t(`st_${o.status}` as any)}</p>
            {o.status !== "cancelled" && (
              <p
                className={`rounded-full px-3 py-1 ${
                  o.payment_status === "paid" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                }`}
              >
                {o.payment_status === "paid" ? t("paid_short") : t("pay_unpaid")}
              </p>
            )}
          </div>
        </div>

        {summary && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{summary}</p>}
        <p className="mt-1 font-semibold text-coffee">{baht(o.total)}</p>

        <div className="mt-3 flex gap-2">
          <Link
            href={`/order/${o.id}`}
            className="flex-1 rounded-full border border-brand py-2 text-center text-sm font-medium text-brand"
          >
            {t("view_status")}
          </Link>
          {o.payment_status === "unpaid" && o.status !== "cancelled" && (
            <Link
              href={`/pay/${o.id}`}
              className="flex-1 rounded-full bg-brand py-2 text-center text-sm font-semibold text-white"
            >
              {t("pay_now")}
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="pb-24">
      <header className="flex items-center justify-between rounded-b-3xl bg-coffee p-4 text-white">
        <h1 className="text-xl font-bold">{t("orders_title")}</h1>
        <LangToggle />
      </header>

      <div className="space-y-3 p-4">
        {orders === null && <p className="p-10 text-center text-gray-500">{t("loading")}</p>}

        {orders && orders.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">{t("orders_empty")}</p>
            <Link
              href={tableId ? `/t/${tableId}/menu` : "/"}
              className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 font-semibold text-white"
            >
              {t("nav_menu")}
            </Link>
          </div>
        )}

        {active.length > 0 && (
          <>
            <h2 className="pt-1 text-sm font-semibold text-coffee">{t("orders_active")}</h2>
            {active.map((o) => card(o))}
          </>
        )}

        {past.length > 0 && (
          <>
            <h2 className="pt-3 text-sm font-semibold text-gray-500">{t("orders_past")}</h2>
            {past.map((o) => card(o, true))}
          </>
        )}
      </div>

      <BottomNav active="orders" />
    </main>
  );
}
