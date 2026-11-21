-- อัปเดต v3: สองภาษา (TH/EN) + ตัวเลือกสินค้า (ความหวาน/ไซส์/ท็อปปิ้ง) + ประเภทสินค้า (เครื่องดื่ม/อาหาร)
-- วางใน Supabase → SQL Editor → Run  (รันซ้ำได้ ไม่เป็นไร)
-- ต้องรัน schema.sql และ update_v2.sql มาก่อน

alter table public.products
  add column if not exists name_en text,
  add column if not exists description_en text,
  add column if not exists category_en text,
  add column if not exists kind text not null default 'food',
  add column if not exists option_groups jsonb not null default '[]'::jsonb;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'products_kind_check') then
    alter table public.products add constraint products_kind_check check (kind in ('drink', 'food'));
  end if;
end $$;

alter table public.settings
  add column if not exists shop_name_en text,
  add column if not exists tagline_en text,
  add column if not exists promo_text_en text;

alter table public.tables
  add column if not exists name_en text;

alter table public.order_items
  add column if not exists name_en text,
  add column if not exists options jsonb not null default '[]'::jsonb;

-- ---------- ข้อมูลตัวอย่าง ----------
update public.settings set tagline_en = 'One click, ready to go' where id = 1 and tagline_en is null;

update public.products set kind = 'drink', category_en = 'Drinks' where category = 'เครื่องดื่ม';
update public.products set category_en = 'Food' where category = 'อาหาร';

update public.products set name_en = 'Basil Pork with Fried Egg', description_en = 'Medium spicy, served with a fried egg' where name = 'ข้าวกะเพราหมูสับไข่ดาว';
update public.products set name_en = 'Shrimp Fried Rice',         description_en = 'Big shrimp, stir-fried over high heat' where name = 'ข้าวผัดกุ้ง';
update public.products set name_en = 'Tom Yum Goong',             description_en = 'Bold and spicy, creamy broth'         where name = 'ต้มยำกุ้ง';
update public.products set name_en = 'Thai Iced Tea',             description_en = 'Sweet and creamy, less sugar available' where name = 'ชาไทยเย็น';
update public.products set name_en = 'Iced Coffee',               description_en = 'Rich and aromatic'                     where name = 'กาแฟเย็น';
update public.products set name_en = 'Drinking Water',            description_en = 'Large bottle'                          where name = 'น้ำเปล่า';

update public.tables set name_en = replace(name, 'โต๊ะ ', 'Table ') where name_en is null and name like 'โต๊ะ %';

-- ตัวเลือกเครื่องดื่ม (ความหวาน / ขนาด / น้ำแข็ง / ท็อปปิ้ง)
update public.products set option_groups = $j$[
 {"id":"sugar","name":"ระดับความหวาน","name_en":"Sugar level","type":"single","required":true,"options":[
   {"id":"sugar-normal","name":"ปกติ","name_en":"Normal","price":0},
   {"id":"sugar-less","name":"หวานน้อย","name_en":"Less sugar","price":0}]},
 {"id":"size","name":"ขนาด","name_en":"Size","type":"single","required":true,"options":[
   {"id":"size-regular","name":"ธรรมดา","name_en":"Regular","price":0},
   {"id":"size-large","name":"แก้วใหญ่","name_en":"Large","price":10}]},
 {"id":"ice","name":"ระดับน้ำแข็ง","name_en":"Ice level","type":"single","required":true,"options":[
   {"id":"ice-normal","name":"ปกติ","name_en":"Normal","price":0},
   {"id":"ice-less","name":"น้ำแข็งน้อย","name_en":"Less ice","price":0},
   {"id":"ice-no","name":"ไม่ใส่น้ำแข็ง","name_en":"No ice","price":0}]},
 {"id":"topping","name":"ท็อปปิ้ง","name_en":"Topping","type":"multi","required":false,"options":[
   {"id":"top-boba","name":"ไข่มุก","name_en":"Boba","price":10},
   {"id":"top-jelly","name":"เยลลี่","name_en":"Jelly","price":10},
   {"id":"top-cream","name":"วิปครีม","name_en":"Whipped cream","price":15}]}
]$j$::jsonb
where name in ('ชาไทยเย็น', 'กาแฟเย็น') and option_groups = '[]'::jsonb;

-- ตัวเลือกอาหาร (ขนาด S/M/L + เพิ่มเติม)
update public.products set option_groups = $j$[
 {"id":"size","name":"เลือกขนาด","name_en":"Choose size","type":"single","required":true,"options":[
   {"id":"size-s","name":"S","name_en":"S","price":0},
   {"id":"size-m","name":"M","name_en":"M","price":10},
   {"id":"size-l","name":"L","name_en":"L","price":20}]},
 {"id":"extra","name":"เพิ่มเติม","name_en":"Customize","type":"multi","required":false,"options":[
   {"id":"extra-egg","name":"ไข่ดาว","name_en":"Fried egg","price":10},
   {"id":"extra-shrimp","name":"กุ้ง","name_en":"Shrimp","price":30},
   {"id":"extra-rice","name":"ข้าวเพิ่ม","name_en":"Extra rice","price":10}]}
]$j$::jsonb
where name in ('ข้าวกะเพราหมูสับไข่ดาว', 'ข้าวผัดกุ้ง') and option_groups = '[]'::jsonb;
