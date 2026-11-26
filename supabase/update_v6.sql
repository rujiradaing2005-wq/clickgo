-- อัปเดต v6: สิทธิ์แอดมินเฉพาะ "พนักงาน" (ตาราง staff) + รองรับการสมัครสมาชิกร้านค้าด้วยรหัสเชิญ
-- วางใน Supabase → SQL Editor → Run  (รันซ้ำได้ ไม่เป็นไร)
--
-- ก่อนรัน: ดู Authentication → Users ให้แน่ใจว่ามีแต่บัญชีของคุณและพนักงานที่ไว้ใจ
-- (ทุกบัญชีที่มีอยู่ตอนนี้จะถูกนับเป็นพนักงานอัตโนมัติ)

create table if not exists public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);
alter table public.staff enable row level security;

insert into public.staff (user_id, email)
select id, email from auth.users
on conflict (user_id) do nothing;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;
grant execute on function public.is_staff() to authenticated;

-- staff: อ่านแถวของตัวเองได้ / พนักงานอ่านทั้งหมดและลบคนอื่นได้ (เพิ่มได้ผ่านเซิร์ฟเวอร์เท่านั้น)
drop policy if exists "staff read" on public.staff;
create policy "staff read" on public.staff for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
drop policy if exists "staff delete" on public.staff;
create policy "staff delete" on public.staff for delete to authenticated
  using (public.is_staff() and user_id <> auth.uid());

-- ตารางหลัก: เปลี่ยนจาก "ล็อกอินแล้ว = ทำได้ทุกอย่าง" เป็น "ต้องเป็นพนักงาน"
drop policy if exists "admin all settings" on public.settings;
create policy "admin all settings" on public.settings for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "admin all tables" on public.tables;
create policy "admin all tables" on public.tables for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "admin all products" on public.products;
create policy "admin all products" on public.products for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "admin all orders" on public.orders;
create policy "admin all orders" on public.orders for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "admin all order_items" on public.order_items;
create policy "admin all order_items" on public.order_items for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- รูปสินค้า: อัปโหลด/แก้/ลบ ได้เฉพาะพนักงาน (ทุกคนยังดูรูปได้)
drop policy if exists "admin upload product images" on storage.objects;
create policy "admin upload product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'products' and public.is_staff());

drop policy if exists "admin update product images" on storage.objects;
create policy "admin update product images" on storage.objects for update to authenticated
  using (bucket_id = 'products' and public.is_staff());

drop policy if exists "admin delete product images" on storage.objects;
create policy "admin delete product images" on storage.objects for delete to authenticated
  using (bucket_id = 'products' and public.is_staff());
