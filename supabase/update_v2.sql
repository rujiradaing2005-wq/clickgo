-- อัปเดตฐานข้อมูลเดิม (สำหรับคนที่รัน schema.sql เวอร์ชันแรกไปแล้ว)
-- วางใน Supabase → SQL Editor → Run  (รันซ้ำได้ ไม่เป็นไร)

alter table public.settings
  add column if not exists tagline text default 'คลิกเดียว พร้อมรับ',
  add column if not exists phone text,
  add column if not exists map_url text,
  add column if not exists banner_url text,
  add column if not exists promo_text text;

alter table public.products
  add column if not exists is_popular boolean not null default false;

update public.settings set tagline = 'คลิกเดียว พร้อมรับ' where id = 1 and tagline is null;

-- ตั้งสินค้าตัวอย่างให้เป็น "ยอดนิยม"
update public.products set is_popular = true
where name in ('ข้าวกะเพราหมูสับไข่ดาว', 'ชาไทยเย็น', 'กาแฟเย็น');
