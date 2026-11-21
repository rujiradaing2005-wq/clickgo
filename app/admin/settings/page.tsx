"use client";
import { useEffect, useState } from "react";
import { supabase, getSettings } from "@/lib/supabase";
import { resizeImage } from "@/lib/image";

export default function AdminSettings() {
  const [f, setF] = useState({
    shop_name: "",
    shop_name_en: "",
    tagline: "",
    tagline_en: "",
    promo_text: "",
    promo_text_en: "",
    phone: "",
    map_url: "",
    banner_url: "",
    promptpay: "",
    is_open: true,
  });
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getSettings().then((s) =>
      setF({
        shop_name: s.shop_name,
        shop_name_en: s.shop_name_en ?? "",
        tagline: s.tagline ?? "",
        tagline_en: s.tagline_en ?? "",
        promo_text: s.promo_text ?? "",
        promo_text_en: s.promo_text_en ?? "",
        phone: s.phone ?? "",
        map_url: s.map_url ?? "",
        banner_url: s.banner_url ?? "",
        promptpay: s.promptpay_id ?? "",
        is_open: s.is_open,
      })
    );
  }, []);

  async function uploadBanner(file: File) {
    setUploading(true);
    const { blob, ext } = await resizeImage(file, 1400);
    const path = `banner-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("products").upload(path, blob, {
      contentType: blob.type || "image/jpeg",
    });
    if (error) setMsg("อัปโหลดรูปไม่สำเร็จ: " + error.message);
    else setF((p) => ({ ...p, banner_url: supabase.storage.from("products").getPublicUrl(path).data.publicUrl }));
    setUploading(false);
  }

  async function save() {
    const digits = f.promptpay.replace(/[^0-9]/g, "");
    if (digits && ![10, 13].includes(digits.length))
      return setMsg("PromptPay ต้องเป็นเบอร์โทร 10 หลัก หรือเลขบัตรประชาชน 13 หลัก");
    const { error } = await supabase
      .from("settings")
      .update({
        shop_name: f.shop_name.trim() || "ClickGo",
        shop_name_en: f.shop_name_en.trim() || null,
        tagline: f.tagline.trim() || null,
        tagline_en: f.tagline_en.trim() || null,
        promo_text: f.promo_text.trim() || null,
        promo_text_en: f.promo_text_en.trim() || null,
        phone: f.phone.trim() || null,
        map_url: f.map_url.trim() || null,
        banner_url: f.banner_url || null,
        promptpay_id: digits || null,
        is_open: f.is_open,
      })
      .eq("id", 1);
    setMsg(error ? "บันทึกไม่สำเร็จ: " + error.message : "บันทึกแล้ว ✓");
  }

  const input = "mt-1 w-full rounded border p-2";
  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-xl font-bold">ตั้งค่าร้าน</h1>

      <label className="block">
        <span className="text-sm text-gray-600">ชื่อร้าน</span>
        <input value={f.shop_name} onChange={(e) => setF({ ...f, shop_name: e.target.value })} className={input} />
      </label>
      <label className="block">
        <span className="text-sm text-gray-600">ชื่อร้าน (English)</span>
        <input value={f.shop_name_en} onChange={(e) => setF({ ...f, shop_name_en: e.target.value })} className={input} />
      </label>
      <label className="block">
        <span className="text-sm text-gray-600">สโลแกน (แสดงใต้ชื่อร้าน)</span>
        <input value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} placeholder="คลิกเดียว พร้อมรับ" className={input} />
      </label>
      <label className="block">
        <span className="text-sm text-gray-600">สโลแกน (English)</span>
        <input value={f.tagline_en} onChange={(e) => setF({ ...f, tagline_en: e.target.value })} placeholder="One click, ready to go" className={input} />
      </label>
      <label className="block">
        <span className="text-sm text-gray-600">ข้อความโปรโมชัน/ประกาศ (แสดงบนแบนเนอร์หน้าเมนู)</span>
        <input value={f.promo_text} onChange={(e) => setF({ ...f, promo_text: e.target.value })} placeholder="เมนูใหม่ ลองเลย!" className={input} />
      </label>
      <label className="block">
        <span className="text-sm text-gray-600">ข้อความโปรโมชัน/ประกาศ (English)</span>
        <input value={f.promo_text_en} onChange={(e) => setF({ ...f, promo_text_en: e.target.value })} placeholder="New menu, try it now!" className={input} />
      </label>
      <label className="block">
        <span className="text-sm text-gray-600">เบอร์โทรร้าน</span>
        <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="0812345678" className={input} />
      </label>
      <label className="block">
        <span className="text-sm text-gray-600">ลิงก์แผนที่ (Google Maps)</span>
        <input value={f.map_url} onChange={(e) => setF({ ...f, map_url: e.target.value })} placeholder="https://maps.app.goo.gl/..." className={input} />
      </label>

      <div className="block">
        <span className="text-sm text-gray-600">รูปแบนเนอร์/พื้นหลังหน้าแรก</span>
        <div className="mt-1 flex items-center gap-3">
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadBanner(e.target.files[0])} className="text-sm" />
          {uploading && <span className="text-sm text-gray-500">กำลังอัปโหลด...</span>}
        </div>
        {f.banner_url && (
          <div className="mt-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.banner_url} alt="" className="h-20 w-32 rounded object-cover" />
            <button onClick={() => setF({ ...f, banner_url: "" })} className="text-sm text-red-500">ลบรูป</button>
          </div>
        )}
      </div>

      <label className="block">
        <span className="text-sm text-gray-600">PromptPay (เบอร์โทร / เลขบัตร ปชช.)</span>
        <span className="block text-xs text-orange-600">ต้องกรอกช่องนี้ ลูกค้าจึงจะเลือก "สแกนจ่าย" และเห็น QR ได้ (เว้นว่าง = จ่ายเงินสดอย่างเดียว)</span>
        <input value={f.promptpay} onChange={(e) => setF({ ...f, promptpay: e.target.value })} placeholder="0812345678" className={input} />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={f.is_open} onChange={(e) => setF({ ...f, is_open: e.target.checked })} className="h-5 w-5" />
        <span>เปิดรับออเดอร์</span>
      </label>

      {msg && <p className="text-sm">{msg}</p>}
      <button onClick={save} className="rounded bg-orange-500 px-6 py-2 text-white">บันทึก</button>
    </main>
  );
}
