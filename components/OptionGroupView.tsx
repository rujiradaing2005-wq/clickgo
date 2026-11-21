"use client";
import { useLang } from "@/lib/i18n";
import { baht } from "@/lib/format";
import type { OptionGroup } from "@/lib/types";

type Props = {
  group: OptionGroup;
  selected: string[];
  onToggle: (optionId: string) => void;
  variant: "drink" | "food";
};

const plus = (p: number) => (p > 0 ? `+${baht(p)}` : "");

const Check = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export default function OptionGroupView({ group, selected, onToggle, variant }: Props) {
  const { t, tr } = useLang();
  const hint =
    group.type === "single"
      ? group.required ? t("req_single") : t("opt_single")
      : group.required ? t("req_multi") : t("opt_multi");
  const isSel = (id: string) => selected.includes(id);
  const title = tr(group.name, group.name_en);

  // ---------- เลือกหลายอย่าง (ท็อปปิ้ง / เพิ่มเติม): การ์ดสะอาด ไม่ใช้อิโมจิ ----------
  if (group.type === "multi")
    return (
      <section className={variant === "drink" ? "border-b py-4" : "py-4"}>
        <h3 className="font-semibold text-coffee">{title}</h3>
        <p className="text-xs text-brand">{hint}</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {group.options.map((o) => {
            const on = isSel(o.id);
            return (
              <button
                key={o.id}
                onClick={() => onToggle(o.id)}
                className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${
                  o.image_url ? "col-span-2" : ""
                } ${on ? "border-brand bg-orange-50 shadow-sm" : "border-gray-200 bg-white"}`}
              >
                {o.image_url && (
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={o.image_url} alt="" className="h-full w-full object-cover" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-snug text-coffee">{tr(o.name, o.name_en)}</span>
                  {o.price > 0 && <span className="block text-xs font-medium text-brand">{plus(o.price)}</span>}
                </span>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    on ? "border-brand bg-brand text-white" : "border-gray-300 text-transparent"
                  }`}
                >
                  <Check />
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );

  // ---------- เลือก 1 อย่าง: เครื่องดื่ม = ปุ่มวงกลม ----------
  if (variant === "drink")
    return (
      <section className="border-b py-4">
        <h3 className="font-semibold text-coffee">{title}</h3>
        <p className="text-xs text-brand">{hint}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {group.options.map((o) => (
            <button key={o.id} onClick={() => onToggle(o.id)} className="flex items-center gap-2 text-sm">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  isSel(o.id) ? "border-brand" : "border-gray-300"
                }`}
              >
                {isSel(o.id) && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
              </span>
              <span>{tr(o.name, o.name_en)}</span>
              {o.price > 0 && <span className="text-xs text-gray-500">({plus(o.price)})</span>}
            </button>
          ))}
        </div>
      </section>
    );

  // ---------- เลือก 1 อย่าง: อาหาร = กล่องขนาด S / M / L ----------
  return (
    <section className="py-4 text-center">
      <h3 className="font-semibold text-coffee">{title}</h3>
      <p className="text-xs text-brand">{hint}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-4">
        {group.options.map((o) => (
          <button key={o.id} onClick={() => onToggle(o.id)} className="flex flex-col items-center">
            <span
              className={`flex h-12 min-w-12 items-center justify-center rounded-xl border-2 px-4 text-base font-semibold ${
                isSel(o.id) ? "border-coffee bg-white text-coffee shadow" : "border-transparent text-gray-500"
              }`}
            >
              {tr(o.name, o.name_en)}
            </span>
            <span className="mt-1 text-xs text-gray-500">{plus(o.price) || "\u00a0"}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
