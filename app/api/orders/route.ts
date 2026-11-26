import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

// rate limit แบบง่าย (ในหน่วยความจำ) — 6 ออเดอร์ / นาที / IP
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 6;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (code: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ code, ...extra }, { status });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return fail("rate_limited", 429);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return fail("bad_request", 400);
  }

  const { tableId, customerName, items } = body ?? {};
  if (!UUID.test(tableId ?? "") || !Array.isArray(items) || items.length === 0 || items.length > 50)
    return fail("bad_request", 400);

  const db = supabaseAdmin();

  // 1) ร้านเปิดอยู่ไหม
  const { data: settings } = await db.from("settings").select("is_open").eq("id", 1).single();
  if (settings && !settings.is_open) return fail("shop_closed", 403);

  // 2) โต๊ะมีจริงไหม
  const { data: table } = await db.from("tables").select("id").eq("id", tableId).maybeSingle();
  if (!table) return fail("table_not_found", 400);

  // 3) ดึงสินค้า/ราคาจริงจากฐานข้อมูล (ไม่เชื่อราคาจากฝั่งลูกค้า)
  const ids: string[] = items.map((i: any) => String(i.id));
  if (ids.some((id) => !UUID.test(id))) return fail("bad_request", 400);

  const { data: products } = await db.from("products").select("*").in("id", ids);
  const map = new Map((products ?? []).map((p: any) => [p.id, p]));

  const lines: any[] = [];
  for (const i of items) {
    const p: any = map.get(String(i.id));
    const qty = Number(i.qty);
    if (!p) return fail("product_not_found", 400);
    if (!p.is_available) return fail("unavailable", 409, { name: p.name });
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) return fail("bad_qty", 400);

    // ตรวจตัวเลือก + คำนวณราคาต่อหน่วยจากฐานข้อมูล
    const groups: any[] = Array.isArray(p.option_groups) ? p.option_groups : [];
    const picked: string[] = Array.isArray(i.options) ? i.options.map(String) : [];
    if (new Set(picked).size !== picked.length) return fail("bad_option", 400);

    const allOptions = new Map<string, any>();
    groups.forEach((g) => (g.options ?? []).forEach((o: any) => allOptions.set(o.id, o)));
    if (picked.some((id) => !allOptions.has(id))) return fail("bad_option", 400);

    const chosen: any[] = [];
    for (const g of groups) {
      const sel = (g.options ?? []).filter((o: any) => picked.includes(o.id));
      if (g.type === "single" && sel.length > 1) return fail("bad_option", 400);
      if (g.required && sel.length < 1) return fail("option_required", 400, { name: p.name });
      chosen.push(...sel);
    }

    const unit = Number(p.price) + chosen.reduce((s, o) => s + Number(o.price || 0), 0);
    lines.push({
      product_id: p.id,
      name: p.name,
      name_en: p.name_en ?? null,
      price: unit,
      qty,
      note: i.note ? String(i.note).slice(0, 200) : null,
      options: chosen.map((o) => ({ name: o.name, name_en: o.name_en ?? null, price: Number(o.price || 0) })),
    });
  }
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

  // 4) บันทึกออเดอร์
  const { data: order, error } = await db
    .from("orders")
    .insert({
      table_id: tableId,
      customer_name: customerName ? String(customerName).slice(0, 40) : null,
      total,
    })
    .select("id, order_no")
    .single();
  if (error || !order) return fail("save_failed", 500);

  const { error: e2 } = await db.from("order_items").insert(lines.map((l) => ({ ...l, order_id: order.id })));
  if (e2) {
    await db.from("orders").delete().eq("id", order.id);
    return fail("save_failed", 500);
  }

  return NextResponse.json({ id: order.id, order_no: order.order_no });
}

// สรุปสถานะหลายออเดอร์ (ใช้กับแท็บ "ออเดอร์ของฉัน") — รับ ?ids=uuid,uuid,...
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter((x) => UUID.test(x))
    .slice(0, 10);
  if (!ids.length) return NextResponse.json({ orders: [] });

  const db = supabaseAdmin();
  const { data } = await db
    .from("orders")
    .select(
      "id, order_no, table_id, total, status, payment_status, payment_method, pay_claimed, created_at, tables(name, name_en), order_items(name, name_en, qty)"
    )
    .in("id", ids);

  const orders = (data ?? []).map((o: any) => {
    const { tables, order_items, ...rest } = o;
    return {
      ...rest,
      table_name: tables?.name ?? null,
      table_name_en: tables?.name_en ?? null,
      items: order_items ?? [],
    };
  });
  return NextResponse.json({ orders });
}
