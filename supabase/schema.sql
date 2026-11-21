-- ClickGo schema  |  วางทั้งไฟล์ใน Supabase → SQL Editor → Run

-- ---------- ตาราง ----------
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  shop_name text not null default 'ClickGo',
  promptpay_id text,                       -- เบอร์โทร 10 หลัก หรือเลขบัตร ปชช. 13 หลัก
  is_open boolean not null default true,
  tagline text default 'คลิกเดียว พร้อมรับ',
  phone text,
  map_url text,
  banner_url text,
  promo_text text
);
insert into public.settings (id) values (1) on conflict do nothing;

create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  category text not null default 'ทั่วไป',
  is_available boolean not null default true,
  is_popular boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity,
  table_id uuid references public.tables(id) on delete set null,
  customer_name text,
  total numeric(10,2) not null,
  status text not null default 'pending'
    check (status in ('pending','preparing','ready','done','cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','paid')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  price numeric(10,2) not null,
  qty int not null check (qty > 0),
  note text
);

-- ---------- Row Level Security ----------
alter table public.settings enable row level security;
alter table public.tables enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- ลูกค้า (anon): อ่านได้เฉพาะ ร้าน / โต๊ะ / สินค้า
create policy "public read settings" on public.settings for select using (true);
create policy "public read tables"   on public.tables   for select using (true);
create policy "public read products" on public.products for select using (true);

-- แอดมิน (ล็อกอินแล้ว): จัดการได้ทั้งหมด
create policy "admin all settings"    on public.settings    for all to authenticated using (true) with check (true);
create policy "admin all tables"      on public.tables      for all to authenticated using (true) with check (true);
create policy "admin all products"    on public.products    for all to authenticated using (true) with check (true);
create policy "admin all orders"      on public.orders      for all to authenticated using (true) with check (true);
create policy "admin all order_items" on public.order_items for all to authenticated using (true) with check (true);

-- orders / order_items: ลูกค้าไม่มีสิทธิ์โดยตรง
-- การสร้าง/ดูออเดอร์ทำผ่าน API ของเซิร์ฟเวอร์ (service role) เท่านั้น

-- ---------- Realtime สำหรับหน้าแอดมิน ----------
alter publication supabase_realtime add table public.orders;

-- ---------- Storage: รูปสินค้า ----------
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

create policy "public read product images" on storage.objects
  for select using (bucket_id = 'products');
create policy "admin upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'products');
create policy "admin update product images" on storage.objects
  for update to authenticated using (bucket_id = 'products');
create policy "admin delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'products');

-- ---------- ข้อมูลตัวอย่าง ----------
insert into public.tables (name) values ('โต๊ะ 1'), ('โต๊ะ 2'), ('โต๊ะ 3');

insert into public.products (name, description, price, category, is_popular) values
  ('ข้าวกะเพราหมูสับไข่ดาว', 'เผ็ดกลาง เสิร์ฟพร้อมไข่ดาว', 60, 'อาหาร', true),
  ('ข้าวผัดกุ้ง', 'กุ้งตัวโต ผัดไฟแรง', 70, 'อาหาร', false),
  ('ต้มยำกุ้ง', 'รสจัดจ้าน น้ำข้น', 120, 'อาหาร', false),
  ('ชาไทยเย็น', 'หวานมัน หวานน้อยได้', 40, 'เครื่องดื่ม', true),
  ('กาแฟเย็น', 'เข้มข้น หอมกลิ่นคั่ว', 45, 'เครื่องดื่ม', true),
  ('น้ำเปล่า', 'ขวดใหญ่', 10, 'เครื่องดื่ม', false);
