import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "not found" }, { status: 404 });

  const db = supabaseAdmin();
  const { data: order } = await db
    .from("orders")
    .select(
      "id, order_no, table_id, customer_name, total, status, payment_status, payment_method, pay_claimed, created_at, tables(name, name_en)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: items } = await db
    .from("order_items")
    .select("id, name, name_en, price, qty, note, options")
    .eq("order_id", id);

  const { tables, ...rest } = order as any;
  return NextResponse.json({
    order: { ...rest, table_name: tables?.name ?? null, table_name_en: tables?.name_en ?? null },
    items: items ?? [],
  });
}

// ลูกค้าเลือกวิธีชำระเงิน / กด "ฉันโอนแล้ว"  (การยืนยันรับเงินจริงทำโดยแอดมินเท่านั้น)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ code: "not_found" }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ code: "bad_request" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: order } = await db
    .from("orders")
    .select("id, status, payment_status")
    .eq("id", id)
    .maybeSingle();
  if (!order) return NextResponse.json({ code: "not_found" }, { status: 404 });
  if (order.status === "cancelled" || order.payment_status === "paid")
    return NextResponse.json({ code: "locked" }, { status: 409 });

  let patch: Record<string, unknown>;
  if (body?.action === "choose" && (body.method === "cash" || body.method === "promptpay")) {
    patch = { payment_method: body.method, pay_claimed: false };
  } else if (body?.action === "claim") {
    patch = { payment_method: "promptpay", pay_claimed: true };
  } else {
    return NextResponse.json({ code: "bad_request" }, { status: 400 });
  }

  if (patch.payment_method === "promptpay") {
    const { data: s } = await db.from("settings").select("promptpay_id").eq("id", 1).single();
    if (!s?.promptpay_id) return NextResponse.json({ code: "no_promptpay" }, { status: 400 });
  }

  const { error } = await db.from("orders").update(patch).eq("id", id);
  if (error) return NextResponse.json({ code: "save_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
