"use client";
import { useLang } from "@/lib/i18n";

export default function LangToggle({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark"; // light = วางบนพื้นเข้ม, dark = วางบนพื้นสว่าง
}) {
  const { lang, setLang } = useLang();
  const wrap = tone === "light" ? "border-white/40" : "border-coffee/30";
  const on = tone === "light" ? "bg-white text-coffee" : "bg-coffee text-white";
  const off = tone === "light" ? "text-white" : "text-coffee";
  return (
    <div className={`flex overflow-hidden rounded-full border text-xs font-semibold ${wrap} ${className}`}>
      {(["th", "en"] as const).map((l) => (
        <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 ${lang === l ? on : off}`}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
