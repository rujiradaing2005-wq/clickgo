import { createClient } from "@supabase/supabase-js";
import type { Settings } from "./types";

// ใช้ฝั่งเบราว์เซอร์ (anon key) — ลูกค้าอ่านได้แค่ร้าน/โต๊ะ/สินค้า
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getSettings(): Promise<Settings> {
  const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
  return (
    data ?? {
      shop_name: "ClickGo",
      shop_name_en: null,
      promptpay_id: null,
      is_open: true,
      tagline: "คลิกเดียว พร้อมรับ",
      tagline_en: "One click, ready to go",
      phone: null,
      map_url: null,
      banner_url: null,
      promo_text: null,
      promo_text_en: null,
    }
  );
}
