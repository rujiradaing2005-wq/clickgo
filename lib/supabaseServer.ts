import { createClient } from "@supabase/supabase-js";

// ใช้เฉพาะใน API Route (ฝั่งเซิร์ฟเวอร์) เท่านั้น — ข้าม RLS
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
