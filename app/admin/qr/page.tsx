"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";

export default function AdminQR() {
  const [tables, setTables] = useState<{ id: string; name: string; name_en: string | null }[]>([]);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [origin, setOrigin] = useState("");

  const load = async () => {
    const { data } = await supabase.from("tables").select("*").order("name");
    setTables(data ?? []);
  };
  useEffect(() => {
    setOrigin(window.location.origin);
    load();
  }, []);

  async function add() {
    if (!name.trim()) return;
    await supabase.from("tables").insert({ name: name.trim(), name_en: nameEn.trim() || null });
    setName("");
    setNameEn("");
    load();
  }
  async function del(id: string) {
    if (!confirm("ลบโต๊ะนี้? (QR เดิมจะใช้ไม่ได้)")) return;
    await supabase.from("tables").delete().eq("id", id);
    load();
  }

  return (
    <main className="space-y-4 p-4">
      <div className="flex flex-wrap gap-2 print:hidden">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อโต๊ะ / จุดรับสินค้า" className="rounded border p-2" />
        <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="English name (ไม่บังคับ)" className="rounded border p-2" />
        <button onClick={add} className="rounded bg-orange-500 px-4 text-white">เพิ่ม</button>
        <button onClick={() => window.print()} className="rounded border px-4">🖨️ พิมพ์ QR</button>
      </div>
      {origin.includes("localhost") && (
        <p className="rounded bg-yellow-50 p-2 text-sm text-yellow-800 print:hidden">
          ตอนนี้ QR ชี้ไปที่ localhost ซึ่งมือถือสแกนแล้วเปิดไม่ได้ — ทดสอบด้วยการเปิดหน้านี้ผ่าน IP เครื่อง
          (เช่น http://192.168.x.x:3000/admin/qr) หรือ deploy ขึ้น Vercel ก่อนพิมพ์ใช้งานจริง
        </p>
      )}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {tables.map((t) => (
          <div key={t.id} className="flex break-inside-avoid flex-col items-center rounded-xl border p-4">
            <QRCodeSVG value={`${origin}/t/${t.id}`} size={160} />
            <p className="mt-2 text-lg font-semibold">{t.name}</p>
            <p className="text-xs text-gray-500">สแกนเพื่อสั่งซื้อ</p>
            <button onClick={() => del(t.id)} className="mt-1 text-xs text-red-500 print:hidden">ลบ</button>
          </div>
        ))}
      </div>
    </main>
  );
}
