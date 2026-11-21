"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabase, getSettings } from "@/lib/supabase";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { baht } from "@/lib/format";
import { useMyOrders, dropOrdersNotAtTable } from "@/lib/orders";
import LangToggle from "@/components/LangToggle";
import BottomNav from "@/components/BottomNav";
import Thumb from "@/components/Thumb";
import type { Settings } from "@/lib/types";

type Pop = { id: string; name: string; name_en: string | null; price: number; image_url: string | null; category: string };

const Svg = ({ children, className = "h-5 w-5" }: { children: React.ReactNode; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const BookIcon = () => (
  <Svg className="h-6 w-6">
    <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
    <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
  </Svg>
);
const ReceiptIcon = () => (
  <Svg>
    <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" />
    <path d="M9 7h6M9 11h6" />
  </Svg>
);
const PhoneIcon = () => (
  <Svg>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  </Svg>
);
const PinIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);
const ArrowIcon = () => (
  <Svg className="h-5 w-5">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export default function Landing({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params);
  const { setTableId } = useCart();
  const { t, tr, tn } = useLang();
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState<{ name: string; name_en: string | null } | null>(null);
  const [s, setS] = useState<Settings | null>(null);
  const [popular, setPopular] = useState<Pop[]>([]);
  const myOrders = useMyOrders();

  useEffect(() => {
    sessionStorage.removeItem("clickgo-menu-state"); // สแกนเข้ามาใหม่ = เมนูเริ่มที่หมวด "ทั้งหมด"
    Promise.all([
      supabase.from("tables").select("name, name_en").eq("id", tableId).maybeSingle(),
      getSettings(),
      supabase
        .from("products")
        .select("id, name, name_en, price, image_url, category")
        .eq("is_available", true)
        .eq("is_popular", true)
        .limit(8),
    ]).then(([tb, st, pop]) => {
      if (tb.data) {
        setTable(tb.data);
        setTableId(tableId);
        dropOrdersNotAtTable(tableId);
      }
      setS(st);
      setPopular((pop.data as Pop[]) ?? []);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);

  if (loading) return <p className="p-10 text-center text-gray-500">{t("loading")}</p>;

  if (!table)
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="text-xl font-bold">{t("qr_bad")}</h1>
        <p className="mt-1 text-gray-500">{t("qr_bad_desc")}</p>
      </main>
    );

  const heroStyle = s?.banner_url
    ? { background: `linear-gradient(rgba(43,22,11,.55), rgba(43,22,11,.93)), url(${s.banner_url}) center/cover` }
    : undefined;

  const hasOrders = !!myOrders && myOrders.length > 0;
  const tile =
    "flex flex-1 flex-col items-center gap-1.5 rounded-2xl bg-white py-3.5 text-xs font-medium text-coffee shadow-sm ring-1 ring-black/5";

  return (
    <main className="flex min-h-screen flex-col bg-coffee">
      {/* ---------- ส่วนหัว ---------- */}
      <section
        className={`relative overflow-hidden px-6 pb-14 pt-5 text-center text-white ${
          s?.banner_url ? "" : "bg-gradient-to-b from-coffee to-coffee-800"
        }`}
        style={heroStyle}
      >
        <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand/25 blur-3xl" />
        <span className="pointer-events-none absolute -left-16 top-32 h-56 w-56 rounded-full bg-brand/15 blur-3xl" />

        <div className="relative flex justify-end">
          <LangToggle />
        </div>

        <div className="relative mt-5 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-24 w-24 rounded-[1.6rem] shadow-2xl ring-4 ring-white/10" />
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight">{tr(s?.shop_name, s?.shop_name_en)}</h1>
          {s?.tagline && <p className="mt-1 text-base text-brand">{tr(s.tagline, s.tagline_en)}</p>}
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm ring-1 ring-white/15 backdrop-blur">
            <PinIcon className="h-4 w-4 text-brand" />
            {tn(table.name, table.name_en)}
          </p>
        </div>
      </section>

      {/* ---------- ส่วนเนื้อหา ---------- */}
      <section className="relative z-10 -mt-8 flex flex-1 flex-col rounded-t-[2rem] bg-cream px-5 pb-28 pt-9">
        {s && !s.is_open && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">{t("closed")}</div>
        )}

        <p className="text-center text-sm text-coffee/60">{t("hint")}</p>

        <Link
          href={`/t/${tableId}/menu`}
          className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-brand py-4 text-lg font-bold text-white shadow-lg shadow-orange-300/50 active:scale-[0.99]"
        >
          <BookIcon />
          {t("view_menu")}
          <ArrowIcon />
        </Link>

        {(hasOrders || s?.phone || s?.map_url) && (
          <div className="mt-4 flex gap-3">
            {hasOrders && (
              <Link href={myOrders!.length === 1 ? `/order/${myOrders![0].id}` : "/orders"} className={`${tile} relative`}>
                <span className="text-brand">
                  <ReceiptIcon />
                </span>
                {t("track")}
                {myOrders!.length > 1 && (
                  <span className="absolute right-3 top-2 rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
                    {myOrders!.length}
                  </span>
                )}
              </Link>
            )}
            {s?.phone && (
              <a href={`tel:${s.phone}`} className={tile}>
                <span className="text-brand">
                  <PhoneIcon />
                </span>
                {t("call")}
              </a>
            )}
            {s?.map_url && (
              <a href={s.map_url} target="_blank" rel="noreferrer" className={tile}>
                <span className="text-brand">
                  <PinIcon />
                </span>
                {t("map")}
              </a>
            )}
          </div>
        )}

        {popular.length > 0 && (
          <div className="mt-7">
            <h2 className="mb-3 font-semibold text-coffee">{t("popular")}</h2>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
              {popular.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} className="w-28 shrink-0">
                  <Thumb src={p.image_url} name={p.name} category={p.category} className="aspect-square w-full rounded-2xl shadow-sm" />
                  <p className="mt-1.5 truncate text-sm font-medium text-coffee">{tr(p.name, p.name_en)}</p>
                  <p className="text-sm font-bold text-brand">{baht(p.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <BottomNav active="home" tableId={tableId} />
    </main>
  );
}
