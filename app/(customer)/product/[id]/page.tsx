"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCart, type CartOption } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { baht } from "@/lib/format";
import Thumb from "@/components/Thumb";
import LangToggle from "@/components/LangToggle";
import OptionGroupView from "@/components/OptionGroupView";
import type { Product } from "@/lib/types";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { add, tableId } = useCart();
  const { t, tr } = useLang();
  const [p, setP] = useState<Product | null>(null);
  const [missing, setMissing] = useState(false);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [sel, setSel] = useState<Record<string, string[]>>({});

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return setMissing(true);
        const prod = data as Product;
        setP(prod);
        // ตัวเลือกแบบ "เลือก 1 อย่าง + จำเป็น" เลือกอันแรกไว้ให้ก่อน
        const init: Record<string, string[]> = {};
        (prod.option_groups ?? []).forEach((g) => {
          init[g.id] = g.type === "single" && g.required && g.options[0] ? [g.options[0].id] : [];
        });
        setSel(init);
      });
  }, [id]);

  const back = tableId ? `/t/${tableId}/menu` : "/";

  if (missing) return <p className="p-6 text-center">{t("prod_nf")}</p>;
  if (!p) return <p className="p-6 text-center text-gray-500">{t("loading")}</p>;

  const groups = p.option_groups ?? [];
  const chosen: CartOption[] = groups.flatMap((g) =>
    g.options
      .filter((o) => (sel[g.id] ?? []).includes(o.id))
      .map((o) => ({ id: o.id, name: o.name, name_en: o.name_en ?? null, price: Number(o.price) }))
  );
  const unit = Number(p.price) + chosen.reduce((s, o) => s + o.price, 0);
  const valid = groups.every((g) => !g.required || (sel[g.id]?.length ?? 0) >= 1);

  function toggle(gid: string, oid: string, type: "single" | "multi", required: boolean) {
    setSel((prev) => {
      const cur = prev[gid] ?? [];
      if (type === "single") {
        if (cur[0] === oid) return required ? prev : { ...prev, [gid]: [] };
        return { ...prev, [gid]: [oid] };
      }
      return { ...prev, [gid]: cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid] };
    });
  }

  function addToCart() {
    add({
      id: p!.id,
      name: p!.name,
      name_en: p!.name_en,
      price: unit,
      qty,
      note: note.trim() || undefined,
      options: chosen,
    });
    router.push(back);
  }

  const isDrink = p.kind === "drink";

  const qtyControl = (
    <div className="flex items-center gap-4">
      <button onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-coffee/40 text-lg text-coffee">
        −
      </button>
      <span className="w-6 text-center text-lg font-semibold">{qty}</span>
      <button onClick={() => setQty(Math.min(99, qty + 1))} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand bg-brand text-lg text-white">
        +
      </button>
    </div>
  );

  const noteBox = (
    <section className="py-4">
      <h3 className="font-semibold text-coffee">{t("note_title")}</h3>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("note_ph")}
        className="mt-2 w-full rounded-xl border bg-white p-3"
        rows={2}
      />
    </section>
  );

  const bottomBar = (
    <div className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 items-center justify-between gap-4 border-t bg-white px-5 py-3 shadow-[0_-4px_12px_rgba(0,0,0,.06)]">
      <div>
        <p className="text-xs text-gray-500">{t("total_pay")}</p>
        <p className="text-xl font-bold text-coffee">{baht(unit * qty)}</p>
      </div>
      <button
        disabled={!p.is_available || !valid}
        onClick={addToCart}
        className="flex-1 rounded-full bg-brand py-3 font-semibold text-white shadow disabled:bg-gray-300"
      >
        {p.is_available ? (valid ? t("add_to_cart") : t("pick_required")) : t("sold_out")}
      </button>
    </div>
  );

  const backBtn = (
    <button
      onClick={() => router.push(back)}
      className={`rounded-full px-4 py-1.5 text-sm font-medium text-coffee shadow ${isDrink ? "bg-white/70" : "bg-white"}`}
    >
      {t("back_menu")}
    </button>
  );

  // ================= เครื่องดื่ม (แบบตัวอย่าง Oreo Latte) =================
  if (isDrink)
    return (
      <main className="min-h-screen bg-[#ecd3b5] pb-28">
        <div className="flex items-center justify-between px-4 pt-4">
          {backBtn}
          <LangToggle tone="dark" />
        </div>

        <div className="flex items-start gap-3 px-5 pb-10 pt-5">
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="text-3xl font-bold leading-tight text-coffee">{tr(p.name, p.name_en)}</h1>
            {p.description && <p className="text-sm text-coffee/80">{tr(p.description, p.description_en)}</p>}
            <p className="text-2xl font-bold text-coffee">{baht(p.price)}</p>
            <div className="pt-1">{qtyControl}</div>
          </div>
          <Thumb src={p.image_url} name={p.name} category={p.category} className="h-44 w-36 rounded-3xl text-6xl shadow-xl" />
        </div>

        <div className="-mt-4 min-h-[55vh] rounded-t-3xl bg-white px-5 pb-6 pt-2">
          {groups.map((g) => (
            <OptionGroupView
              key={g.id}
              group={g}
              variant="drink"
              selected={sel[g.id] ?? []}
              onToggle={(oid) => toggle(g.id, oid, g.type, g.required)}
            />
          ))}
          {noteBox}
        </div>
        {bottomBar}
      </main>
    );

  // ================= อาหาร (แบบตัวอย่างราเมน) =================
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-cream pb-28">
      <div className="flex items-center justify-between px-4 pt-4">
        {backBtn}
        <LangToggle tone="dark" />
      </div>

      <div className="flex flex-col items-center px-5 pt-4">
        <Thumb src={p.image_url} name={p.name} category={p.category} className="h-44 w-44 rounded-full text-7xl shadow-xl ring-4 ring-white" />
        <h1 className="mt-5 text-center text-2xl font-bold text-coffee">{tr(p.name, p.name_en)}</h1>
        {p.description && <p className="mt-1 text-center text-sm text-gray-500">{tr(p.description, p.description_en)}</p>}
        <p className="mt-1 text-xl font-bold text-brand">{baht(p.price)}</p>
      </div>

      <div className="px-5">
        {groups.map((g) => (
          <OptionGroupView
            key={g.id}
            group={g}
            variant="food"
            selected={sel[g.id] ?? []}
            onToggle={(oid) => toggle(g.id, oid, g.type, g.required)}
          />
        ))}
        {noteBox}
        <div className="flex items-center justify-between pb-4">
          <span className="font-semibold text-coffee">{t("qty")}</span>
          {qtyControl}
        </div>
      </div>
      {bottomBar}
    </main>
  );
}
