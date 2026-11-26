"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { useMyOrders, isActive } from "@/lib/orders";

export default function BottomNav({
  active,
  tableId: override,
}: {
  active: "home" | "menu" | "orders" | "cart";
  tableId?: string | null;
}) {
  const { count, tableId } = useCart();
  const { t } = useLang();
  const orders = useMyOrders();
  const tid = override ?? tableId;

  const items = [
    { k: "home", href: tid ? `/t/${tid}` : "/", icon: "🏠", label: t("nav_home"), badge: 0 },
    { k: "menu", href: tid ? `/t/${tid}/menu` : "/", icon: "📖", label: t("nav_menu"), badge: 0 },
    { k: "orders", href: "/orders", icon: "🧾", label: t("nav_orders"), badge: orders?.filter(isActive).length ?? 0 },
    { k: "cart", href: "/cart", icon: "🛒", label: t("nav_cart"), badge: count },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 border-t bg-white">
      {items.map((i) => (
        <Link
          key={i.k}
          href={i.href}
          className={`relative flex flex-1 flex-col items-center py-2 text-xs ${
            active === i.k ? "font-semibold text-brand" : "text-gray-500"
          }`}
        >
          <span className="text-xl">{i.icon}</span>
          {i.label}
          {i.badge > 0 && (
            <span className="absolute right-1/4 top-1 rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
              {i.badge}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
