"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSettings } from "@/lib/supabase";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import LangToggle from "@/components/LangToggle";
import type { Settings } from "@/lib/types";

const Svg = ({ children, className = "h-6 w-6" }: { children: React.ReactNode; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const PhoneIcon = () => (
  <Svg className="h-5 w-5">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  </Svg>
);
const PinIcon = () => (
  <Svg className="h-5 w-5">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);
const LockIcon = () => (
  <Svg className="h-3.5 w-3.5">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Svg>
);

export default function Home() {
  const { t, tr } = useLang();
  const { tableId } = useCart();
  const [s, setS] = useState<Settings | null>(null);

  useEffect(() => {
    getSettings().then(setS);
  }, []);

  const heroStyle = s?.banner_url
    ? { background: `linear-gradient(rgba(43,22,11,.55), rgba(43,22,11,.93)), url(${s.banner_url}) center/cover` }
    : undefined;

  const contact =
    "flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-medium text-coffee shadow-sm ring-1 ring-black/5";

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

        <div className="relative mt-6 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-24 w-24 rounded-[1.6rem] shadow-2xl ring-4 ring-white/10" />
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight">
            {tr(s?.shop_name ?? "ClickGo", s?.shop_name_en)}
          </h1>
          <p className="mt-1 text-base text-brand">
            {s ? tr(s.tagline, s.tagline_en) : "คลิกเดียว พร้อมรับ"}
          </p>
        </div>
      </section>

      {/* ---------- ส่วนเนื้อหา ---------- */}
      <section className="relative z-10 -mt-8 flex flex-1 flex-col rounded-t-[2rem] bg-cream px-5 pb-8 pt-10">
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <p className="text-base text-coffee/70">{t("home_scan_title")}</p>

          {tableId && (
            <Link
              href={`/t/${tableId}`}
              className="mt-5 flex w-full items-center justify-center rounded-2xl bg-brand py-3.5 font-bold text-white shadow-lg shadow-orange-300/50 active:scale-[0.99]"
            >
              {t("continue_order")}
            </Link>
          )}
        </div>

        {(s?.phone || s?.map_url) && (
          <div className="mt-5 flex gap-3">
            {s?.phone && (
              <a href={`tel:${s.phone}`} className={contact}>
                <span className="text-brand">
                  <PhoneIcon />
                </span>
                {t("call")}
              </a>
            )}
            {s?.map_url && (
              <a href={s.map_url} target="_blank" rel="noreferrer" className={contact}>
                <span className="text-brand">
                  <PinIcon />
                </span>
                {t("map")}
              </a>
            )}
          </div>
        )}

        <div className="pt-6 text-center">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs text-coffee/50 ring-1 ring-coffee/10"
          >
            <LockIcon />
            {t("for_staff")}
          </Link>
        </div>
      </section>
    </main>
  );
}
