"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { baht } from "@/lib/format";
import { resizeImage } from "@/lib/image";
import type { OptionGroup, Product } from "@/lib/types";

const rid = () => Math.random().toString(36).slice(2, 9);

const drinkPreset = (): OptionGroup[] => [
  { id: rid(), name: "ระดับความหวาน", name_en: "Sugar level", type: "single", required: true, options: [
    { id: rid(), name: "0%", name_en: "", price: 0 },
    { id: rid(), name: "25%", name_en: "", price: 0 },
    { id: rid(), name: "50%", name_en: "", price: 0 },
    { id: rid(), name: "100%", name_en: "", price: 0 },
  ]},
];
const foodPreset = (): OptionGroup[] => [
  { id: rid(), name: "เพิ่มเติม", name_en: "Customize", type: "multi", required: false, options: [
    { id: rid(), name: "ไข่ดาว", name_en: "Fried egg", price: 10 },
    { id: rid(), name: "ข้าวเพิ่ม", name_en: "Extra rice", price: 10 },
  ]},
];

const CATEGORY_PRESETS = [
  { key: "food", th: "อาหาร", en: "Food", icon: "🍛", kind: "food" as const },
  { key: "drink", th: "เครื่องดื่ม", en: "Drinks", icon: "🧋", kind: "drink" as const },
  { key: "icecream", th: "ไอศกรีม", en: "Ice cream", icon: "🍦", kind: "food" as const },
  { key: "dessert", th: "ของหวาน", en: "Desserts", icon: "🍰", kind: "food" as const },
];

const iceCreamPreset = (): OptionGroup[] => [
  { id: rid(), name: "ท็อปปิ้ง", name_en: "Toppings", type: "multi", required: false, options: [
    { id: rid(), name: "เยลลี่", name_en: "Jelly", price: 10 },
    { id: rid(), name: "ถั่วบด", name_en: "Crushed nuts", price: 10 },
    { id: rid(), name: "คุกกี้", name_en: "Cookie crumbs", price: 10 },
    { id: rid(), name: "วิปครีม", name_en: "Whipped cream", price: 15 },
  ]},
];

const empty = {
  name: "", name_en: "", price: "", category: "อาหาร", category_en: "Food",
  description: "", description_en: "", image_url: "",
  is_popular: false, kind: "food" as "drink" | "food", catKey: "food",
  option_groups: [] as OptionGroup[],
};

export default function AdminProducts() {
  const [list, setList] = useState<Product[]>([]);
  const [f, setF] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const { data } = await supabase.from("products").select("*").order("category").order("name");
    setList((data as Product[]) ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  async function uploadFile(file: File): Promise<string | null> {
    setUploading(true);
    const { blob, ext } = await resizeImage(file, 900);
    const path = `${Date.now()}-${rid()}.${ext}`;
    const { error } = await supabase.storage.from("products").upload(path, blob, {
      contentType: blob.type || "image/jpeg",
    });
    setUploading(false);
    if (error) {
      setMsg("อัปโหลดรูปไม่สำเร็จ: " + error.message);
      return null;
    }
    return supabase.storage.from("products").getPublicUrl(path).data.publicUrl;
  }

  const setGroups = (fn: (g: OptionGroup[]) => OptionGroup[]) =>
    setF((p) => ({ ...p, option_groups: fn(p.option_groups) }));
  const patchGroup = (gi: number, patch: Partial<OptionGroup>) =>
    setGroups((gs) => gs.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const patchOption = (gi: number, oi: number, patch: Record<string, any>) =>
    setGroups((gs) =>
      gs.map((g, i) => (i === gi ? { ...g, options: g.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) } : g))
    );

  function pickCategory(key: string) {
    const c = CATEGORY_PRESETS.find((x) => x.key === key);
    if (!c) return setF({ ...f, catKey: "custom", category: "", category_en: "" });
    setF({ ...f, catKey: key, category: c.th, category_en: c.en, kind: c.kind });
  }

  async function save() {
    if (!f.name.trim() || f.price === "" || Number(f.price) < 0) return setMsg("กรุณากรอกชื่อและราคา");
    const groups = f.option_groups
      .filter((g) => g.name.trim() && g.options.some((o) => o.name.trim()))
      .map((g) => ({
        ...g,
        name: g.name.trim(),
        name_en: g.name_en?.trim() || null,
        options: g.options
          .filter((o) => o.name.trim())
          .map((o) => ({
            id: o.id,
            name: o.name.trim(),
            name_en: o.name_en?.trim() || null,
            price: Number(o.price) || 0,
            image_url: o.image_url || null,
          })),
      }));
    const row = {
      name: f.name.trim(),
      name_en: f.name_en.trim() || null,
      price: Number(f.price),
      category: f.category.trim() || "ทั่วไป",
      category_en: f.category_en.trim() || null,
      description: f.description.trim() || null,
      description_en: f.description_en.trim() || null,
      image_url: f.image_url || null,
      is_popular: f.is_popular,
      kind: f.kind,
      option_groups: groups,
    };
    const { error } = editing
      ? await supabase.from("products").update(row).eq("id", editing)
      : await supabase.from("products").insert(row);
    if (error) return setMsg("บันทึกไม่สำเร็จ: " + error.message);
    setMsg("");
    setF(empty);
    setEditing(null);
    load();
  }

  async function toggle(p: Product, field: "is_available" | "is_popular") {
    await supabase.from("products").update({ [field]: !p[field] }).eq("id", p.id);
    load();
  }
  async function del(p: Product) {
    if (!confirm(`ลบ "${p.name}" ?`)) return;
    await supabase.from("products").delete().eq("id", p.id);
    load();
  }

  const inp = "rounded border p-2";

  return (
    <main className="space-y-6 p-4">
      <div className="space-y-3 rounded-xl border p-4">
        <h2 className="font-semibold">{editing ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h2>

        <div className="grid gap-2 sm:grid-cols-2">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="ชื่อสินค้า (ไทย) *" className={inp} />
          <input value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} placeholder="Product name (English)" className={inp} />
          <select value={f.catKey} onChange={(e) => pickCategory(e.target.value)} className={inp}>
            {CATEGORY_PRESETS.map((c) => (
              <option key={c.key} value={c.key}>{c.icon} {c.th}</option>
            ))}
          </select>
          {f.catKey === "custom" && (
            <>
              <input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="ชื่อหมวดหมู่ (ไทย)" className={inp} />
              <input value={f.category_en} onChange={(e) => setF({ ...f, category_en: e.target.value })} placeholder="Category (English)" className={inp} />
            </>
          )}
          <input type="number" min="0" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} placeholder="ราคาพื้นฐาน (บาท) *" className={inp} />
          <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as "drink" | "food" })} className={inp}>
            <option value="food">หน้าสินค้า : (รูปวงกลมใหญ่ + เลือกขนาด)</option>
            <option value="drink">หน้าสินค้า : (พื้นเบจ + ตัวเลือก)</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input type="file" accept="image/*" onChange={async (e) => { const u = e.target.files?.[0] && (await uploadFile(e.target.files[0])); if (u) setF((p) => ({ ...p, image_url: u })); }} className="text-sm" />
          {uploading && <span className="text-sm text-gray-500">กำลังอัปโหลด...</span>}
          {f.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.image_url} alt="" className="h-14 w-14 rounded object-cover" />
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.is_popular} onChange={(e) => setF({ ...f, is_popular: e.target.checked })} className="h-4 w-4" />
          แสดงในหมวด "ยอดนิยม" 🔥
        </label>

        {/* ---------- ตัวเลือกสินค้า ---------- */}
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">ตัวเลือกสินค้า (ความหวาน / ไซส์ / ท็อปปิ้ง ฯลฯ)</h3>
            <button onClick={() => setF({ ...f, kind: "drink", option_groups: drinkPreset() })} className="rounded border bg-white px-2 py-1 text-xs">ใช้เทมเพลตเครื่องดื่ม</button>
            <button onClick={() => setF({ ...f, kind: "food", option_groups: foodPreset() })} className="rounded border bg-white px-2 py-1 text-xs">ใช้เทมเพลตอาหาร</button>
            <button onClick={() => setF({ ...f, kind: "food", option_groups: iceCreamPreset() })} className="rounded border bg-white px-2 py-1 text-xs">ใช้เทมเพลตไอศกรีม</button>
            <button onClick={() => setGroups((g) => [...g, { id: rid(), name: "", name_en: "", type: "single", required: false, options: [{ id: rid(), name: "", name_en: "", price: 0 }] }])} className="rounded border bg-white px-2 py-1 text-xs">+ เพิ่มกลุ่มตัวเลือก</button>
            {f.option_groups.length > 0 && (
              <button onClick={() => setGroups(() => [])} className="rounded border bg-white px-2 py-1 text-xs text-red-500">ล้างทั้งหมด</button>
            )}
          </div>

          {f.option_groups.map((g, gi) => (
            <div key={g.id} className="mt-3 space-y-2 rounded-lg border bg-white p-3">
              <div className="flex flex-wrap gap-2">
                <input value={g.name} onChange={(e) => patchGroup(gi, { name: e.target.value })} placeholder="ชื่อกลุ่ม (ไทย)" className={`${inp} flex-1`} />
                <input value={g.name_en ?? ""} onChange={(e) => patchGroup(gi, { name_en: e.target.value })} placeholder="Group name (EN)" className={`${inp} flex-1`} />
                <select value={g.type} onChange={(e) => patchGroup(gi, { type: e.target.value as "single" | "multi" })} className={inp}>
                  <option value="single">เลือกได้ 1 อย่าง</option>
                  <option value="multi">เลือกได้หลายอย่าง</option>
                </select>
                <label className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={g.required} onChange={(e) => patchGroup(gi, { required: e.target.checked })} /> บังคับเลือก
                </label>
                <button onClick={() => setGroups((gs) => gs.filter((_, i) => i !== gi))} className="text-sm text-red-500">ลบกลุ่ม</button>
              </div>

              {g.options.map((o, oi) => (
                <div key={o.id} className="flex flex-wrap items-center gap-2 pl-3">
                  <input value={o.name} onChange={(e) => patchOption(gi, oi, { name: e.target.value })} placeholder="ตัวเลือก (ไทย)" className={`${inp} w-36`} />
                  <input value={o.name_en ?? ""} onChange={(e) => patchOption(gi, oi, { name_en: e.target.value })} placeholder="Option (EN)" className={`${inp} w-36`} />
                  <input type="number" min="0" value={o.price} onChange={(e) => patchOption(gi, oi, { price: e.target.value })} placeholder="+ราคา" className={`${inp} w-24`} />
                  {g.type === "multi" && (
                    <>
                      <label className="cursor-pointer rounded border px-2 py-1 text-xs">
                        รูป
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const u = e.target.files?.[0] && (await uploadFile(e.target.files[0])); if (u) patchOption(gi, oi, { image_url: u }); }} />
                      </label>
                      {o.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                      )}
                    </>
                  )}
                  <button onClick={() => setGroups((gs) => gs.map((x, i) => (i === gi ? { ...x, options: x.options.filter((_, j) => j !== oi) } : x)))} className="text-xs text-red-500">ลบ</button>
                </div>
              ))}
              <button onClick={() => setGroups((gs) => gs.map((x, i) => (i === gi ? { ...x, options: [...x.options, { id: rid(), name: "", name_en: "", price: 0 }] } : x)))} className="ml-3 text-sm text-blue-600">+ เพิ่มตัวเลือก</button>
            </div>
          ))}
        </div>

        {msg && <p className="text-sm text-red-500">{msg}</p>}
        <div className="flex gap-2">
          <button onClick={save} className="rounded bg-orange-500 px-5 py-2 text-white">
            {editing ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setF(empty); setMsg(""); }} className="rounded border px-5 py-2">
              ยกเลิก
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="py-2">สินค้า</th><th>ราคา</th><th>หมวดหมู่</th><th>ตัวเลือก</th><th>ยอดนิยม</th><th>สถานะ</th><th />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="flex items-center gap-2 py-2">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="h-9 w-9 rounded object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded bg-gray-100">🍽️</span>
                  )}
                  <div>
                    <p>{p.name}</p>
                    {p.name_en && <p className="text-xs text-gray-400">{p.name_en}</p>}
                  </div>
                </td>
                <td>{baht(p.price)}</td>
                <td>{CATEGORY_PRESETS.find((c) => c.th === p.category)?.icon ?? "🍽️"} {p.category}</td>
                <td>{p.option_groups?.length ? `${p.option_groups.length} กลุ่ม` : "-"}</td>
                <td>
                  <button onClick={() => toggle(p, "is_popular")} className={p.is_popular ? "text-orange-500" : "text-gray-300"}>🔥</button>
                </td>
                <td>
                  <button onClick={() => toggle(p, "is_available")} className={p.is_available ? "text-green-600" : "text-gray-400"}>
                    {p.is_available ? "พร้อมขาย" : "หมด/ปิดขาย"}
                  </button>
                </td>
                <td className="space-x-3 whitespace-nowrap">
                  <button
                    onClick={() => {
                      setEditing(p.id);
                      setF({
                        name: p.name, name_en: p.name_en ?? "", price: String(p.price),
                        category: p.category, category_en: p.category_en ?? "",
                        description: p.description ?? "", description_en: p.description_en ?? "",
                        image_url: p.image_url ?? "", is_popular: p.is_popular,
                        kind: p.kind ?? "food", option_groups: p.option_groups ?? [],
                        catKey: CATEGORY_PRESETS.find((c) => c.th === p.category)?.key ?? "custom",
                      });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-blue-600"
                  >
                    แก้ไข
                  </button>
                  <button onClick={() => del(p)} className="text-red-500">ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
