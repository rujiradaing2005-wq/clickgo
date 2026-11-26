import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const fail = (code: string, status: number) => NextResponse.json({ code }, { status });

// 5 ครั้ง / 10 นาที / IP (ในหน่วยความจำ)
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 5;
}

// ให้หน้าล็อกอินรู้ว่าเปิดรับสมัครหรือไม่ (เปิดเมื่อตั้ง STAFF_SIGNUP_CODE แล้วเท่านั้น)
export async function GET() {
  return NextResponse.json({ enabled: !!process.env.STAFF_SIGNUP_CODE });
}

export async function POST(req: Request) {
  const secret = process.env.STAFF_SIGNUP_CODE;
  if (!secret) return fail("disabled", 403);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return fail("rate_limited", 429);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return fail("bad_request", 400);
  }
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const code = String(body?.code ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("bad_email", 400);
  if (password.length < 8) return fail("weak_password", 400);

  const a = Buffer.from(code);
  const b = Buffer.from(secret);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return fail("bad_code", 403);

  const db = supabaseAdmin();
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data?.user) {
    const msg = (error?.message ?? "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) return fail("exists", 409);
    return fail("failed", 500);
  }

  const { error: e2 } = await db.from("staff").insert({ user_id: data.user.id, email });
  if (e2) {
    await db.auth.admin.deleteUser(data.user.id); // ไม่ให้เหลือบัญชีที่ไม่มีสิทธิ์ค้างอยู่
    return fail("failed", 500);
  }
  return NextResponse.json({ ok: true });
}
