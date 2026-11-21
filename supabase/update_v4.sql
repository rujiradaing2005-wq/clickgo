-- อัปเดต v4: หน้าชำระเงิน (เลือกจ่ายเงินสด / สแกนจ่าย PromptPay)
-- วางใน Supabase → SQL Editor → Run  (รันซ้ำได้ ไม่เป็นไร)

alter table public.orders
  add column if not exists payment_method text check (payment_method in ('cash', 'promptpay')),
  add column if not exists pay_claimed boolean not null default false;  -- ลูกค้ากด "ฉันโอนแล้ว"
