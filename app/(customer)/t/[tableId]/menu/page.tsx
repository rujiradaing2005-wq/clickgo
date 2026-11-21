"use client";
import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase, getSettings } from "@/lib/supabase";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { baht } from "@/lib/format";
import { catIcon } from "@/lib/category";
import Thumb from "@/components/Thumb";
import BottomNav from "@/components/BottomNav";
import LangToggle from "@/components/LangToggle";
import { dropOrdersNotAtTable } from "@/lib/orders";
import type { Product, Settings } from "@/lib/types";

export default function MenuPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params);
  const { setTableId, add } = useCart();
  const { t, tr, tn } = useLang();
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState<{ name: string; name_en: string | null } | null>(null);
  const [s, setS] = useState<Settings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cat, setCat] = useState("__all");
  const [q, setQ] = useState("");
  const [toast, setToast] = useState("");

  // ----- จำหมวดที่เลือก + ตำแหน่งเลื่อน (กลับจากหน้าสินค้าแล้วอยู่ที่เดิม) -----
  const restoreY = useRef(0);
  const saveReady = useRef(false);
  const catRef = useRef("__all");

  useEffect(() => {
    try {
      const st = JSON.parse(sessionStorage.getItem("clickgo-menu-state") || "{}");
      if (st.table === tableId) {
        if (st.cat) {
          catRef.current = st.cat;
          setCat(st.cat);
        }
        restoreY.current = Number(st.y) || 0;
      }
    } catch {}
  }, [tableId]);

  const persist = () => {
    if (!saveReady.current) return;
    sessionStorage.setItem(
      "clickgo-menu-state",
      JSON.stringify({ table: tableId, cat: catRef.current, y: window.scrollY })
    );
  };
  useEffect(() => {
    catRef.current = cat;
    persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat]);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(persist);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);

  useEffect(() => {
    (async () => {
      const [tb, p, st] = await Promise.all([
        supabase.from("tables").select("name, name_en").eq("id", tableId).maybeSingle(),
        supabase.from("products").select("*").eq("is_available", true).order("category").order("name"),
        getSettings(),
      ]);
      if (tb.data) {
        setTable(tb.data);
        setTableId(tableId);
        dropOrdersNotAtTable(tableId);
      }
      setProducts((p.data as Product[]) ?? []);
      setS(st);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);

  useEffect(() => {
    if (loading) return;
    const id = requestAnimationFrame(() => {
      if (restoreY.current > 0) window.scrollTo(0, restoreY.current);
      restoreY.current = 0;
      saveReady.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, [loading]);

  const hasOptions = (p: Product) => (p.option_groups?.length ?? 0) > 0;

  function quickAdd(p: Product) {
    add({ id: p.id, name: p.name, name_en: p.name_en, price: Number(p.price), qty: 1, options: [] });
    setToast(`${tr(p.name, p.name_en)} · ${t("added")}`);
    setTimeout(() => setToast(""), 1500);
  }

  if (loading) return <p className="p-10 text-center text-gray-500">{t("loading")}</p>;

  if (!table)
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <p className="text-5xl">⚠️</p>
        <h1 className="mt-2 text-xl font-bold">{t("qr_bad")}</h1>
        <p className="text-gray-500">{t("qr_bad_desc")}</p>
      </main>
    );

  // หมวดหมู่ (ไม่ซ้ำ)
  const catMap = new Map<string, string | null>();
  products.forEach((p) => {
    if (!catMap.has(p.category) || (!catMap.get(p.category) && p.category_en)) catMap.set(p.category, p.category_en);
  });
  const ORDER = ["อาหาร", "เครื่องดื่ม", "ไอศกรีม", "ของหวาน"];
  const rank = (c: string) => (ORDER.includes(c) ? ORDER.indexOf(c) : ORDER.length);
  const cats = Array.from(catMap.entries()).sort((a, b) => rank(a[0]) - rank(b[0]));
  const activeCat = cat === "__all" || catMap.has(cat) ? cat : "__all"; 

  const keyword = q.trim().toLowerCase();
  const filtered = products.filter(
    (p) =>
      (activeCat === "__all" || p.category === activeCat) &&
      (!keyword ||
        [p.name, p.name_en, p.description, p.description_en].some((x) => (x ?? "").toLowerCase().includes(keyword)))
  );
  const popular = filtered.filter((p) => p.is_popular);
  const showPopular = popular.length > 0 && !keyword;
  const closed = s && !s.is_open;

  // ปุ่ม + : ถ้าสินค้ามีตัวเลือก → ไปหน้ารายละเอียด, ไม่มี → ใส่ตะกร้าเลย
  const AddBtn = ({ p, cls }: { p: Product; cls: string }) =>
    hasOptions(p) ? (
      <Link href={`/product/${p.id}`} className={`flex items-center justify-center ${cls}`}>
        +
      </Link>
    ) : (
      <button onClick={() => quickAdd(p)} disabled={!!closed} className={`${cls} disabled:bg-gray-300`}>
        +
      </button>
    );

  return (
    <main className="pb-24">
      <header className="rounded-b-3xl bg-coffee px-4 pb-5 pt-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{tr(s?.shop_name, s?.shop_name_en)}</h1>
            <p className="text-xs text-white/70">📍 {tn(table.name, table.name_en)}</p>
          </div>
          <LangToggle />
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-gray-800">
          <span>🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            className="w-full bg-transparent text-sm outline-none"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-gray-400">
              ✕
            </button>
          )}
        </div>
      </header>

      <p className="px-4 pt-4 text-lg font-semibold text-coffee">{t("greet")}</p>

      {closed && <div className="mx-4 mt-3 rounded-lg bg-red-50 p-3 text-center text-red-600">{t("closed")}</div>}

      {!keyword && (
        <section
          className="relative mx-4 mt-3 overflow-hidden rounded-3xl bg-gradient-to-br from-coffee via-coffee-800 to-[#6b3414] p-5 text-white shadow-lg shadow-black/10"
          style={
            s?.banner_url
              ? { background: `linear-gradient(90deg, rgba(43,22,11,.95) 40%, rgba(43,22,11,.25)), url(${s.banner_url}) center/cover` }
              : undefined
          }
        >
          {!s?.banner_url && (
            <>
              <svg
                viewBox="0 0 200 200"
                className="pointer-events-none absolute -right-12 -top-12 h-60 w-60 text-brand"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <circle cx="100" cy="100" r="95" strokeWidth="1.5" opacity=".25" />
                <circle cx="100" cy="100" r="72" strokeWidth="1.5" opacity=".3" />
                <circle cx="100" cy="100" r="49" strokeWidth="1.5" opacity=".35" />
                <circle cx="100" cy="100" r="26" fill="currentColor" stroke="none" opacity=".35" />
              </svg>
              <span className="pointer-events-none absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-brand/20 blur-2xl" />
            </>
          )}

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide text-brand ring-1 ring-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              {tr(s?.shop_name, s?.shop_name_en)}
            </span>
            <h2 className="mt-3 max-w-[78%] text-2xl font-extrabold leading-snug">
              {tr(s?.promo_text, s?.promo_text_en) || tr(s?.tagline, s?.tagline_en) || t("hero_default")}
            </h2>
            <p className="mt-1 max-w-[75%] text-sm text-white/70">{t("hero_sub")}</p>
            <a
              href="#all"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/25 active:scale-[0.98]"
            >
              {t("order_now")}
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>
        </section>
      )}

      <section className="mt-5">
        <h3 className="px-4 font-semibold text-coffee">{t("categories")}</h3>
        <div className="flex gap-3 overflow-x-auto px-4 pb-1 pt-2">
          {[
            { key: "__all", label: t("all"), icon: "✨" },
            ...cats.map(([c, en]) => ({ key: c, label: tr(c, en), icon: catIcon(`${c} ${en ?? ""}`) })),
          ].map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`flex w-20 shrink-0 flex-col items-center rounded-2xl border p-2 text-xs ${
                activeCat === c.key ? "border-brand bg-orange-50 font-semibold text-brand" : "border-transparent bg-white text-gray-600 shadow-sm"
              }`}
            >
              <span className="text-2xl">{c.icon}</span>
              <span className="mt-1 line-clamp-2 w-full text-center leading-tight">{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      {showPopular && (
        <section className="mt-5">
          <h3 className="px-4 font-semibold text-coffee">🔥 {t("popular")}</h3>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 pt-2">
            {popular.map((p) => (
              <div key={p.id} className="w-36 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm">
                <Link href={`/product/${p.id}`}>
                  <Thumb src={p.image_url} name={p.name} category={p.category} className="aspect-square w-full" />
                </Link>
                <div className="p-2">
                  <p className="truncate text-sm font-medium">{tr(p.name, p.name_en)}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-bold text-brand">{baht(p.price)}</span>
                    <AddBtn p={p} cls="h-7 w-7 rounded-lg bg-brand text-lg leading-none text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="all" className="mt-5 scroll-mt-4 px-4">
        <h3 className="font-semibold text-coffee">{t("all_menu")}</h3>
        {filtered.length === 0 && <p className="py-8 text-center text-gray-500">{t("no_items")}</p>}
        <div className="mt-2 space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-2 shadow-sm">
              <Link href={`/product/${p.id}`} className="shrink-0">
                <Thumb src={p.image_url} name={p.name} category={p.category} className="h-16 w-16 rounded-xl" />
              </Link>
              <Link href={`/product/${p.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium">{tr(p.name, p.name_en)}</p>
                {p.description && <p className="truncate text-xs text-gray-500">{tr(p.description, p.description_en)}</p>}
                <p className="mt-0.5 font-bold text-brand">{baht(p.price)}</p>
              </Link>
              <AddBtn p={p} cls="h-9 w-9 shrink-0 rounded-xl bg-brand text-xl leading-none text-white" />
            </div>
          ))}
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-full bg-coffee px-5 py-2 text-sm text-white shadow-lg">
          ✓ {toast}
        </div>
      )}

      <BottomNav active="menu" tableId={tableId} />
    </main>
  );
}
