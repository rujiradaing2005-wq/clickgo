-- (ไม่บังคับ) เพิ่มสินค้าตัวอย่างหมวด "ไอศกรีม" และ "ของหวาน" พร้อมตัวเลือกและชื่ออังกฤษ
-- วางใน Supabase → SQL Editor → Run  (รันซ้ำได้ ไม่ซ้ำสินค้าเดิม)
-- ต้องรัน update_v3.sql มาก่อน   |   ไม่รันไฟล์นี้ก็ได้ เพิ่มสินค้าเองที่ /admin/products

insert into public.products (name, name_en, description, description_en, price, category, category_en, kind, is_popular)
select v.* from (values
  ('ไอศกรีมวานิลลา',   'Vanilla Ice Cream',   'เนื้อเนียนนุ่ม หอมวานิลลา',          'Smooth and creamy vanilla',          35::numeric, 'ไอศกรีม', 'Ice cream', 'food', true),
  ('ไอศกรีมช็อกโกแลต', 'Chocolate Ice Cream', 'เข้มข้น หวานกำลังดี',                'Rich chocolate, perfectly sweet',    35::numeric, 'ไอศกรีม', 'Ice cream', 'food', false),
  ('ข้าวเหนียวมะม่วง', 'Mango Sticky Rice',   'มะม่วงสุกหวานฉ่ำ ราดกะทิ',          'Sweet ripe mango with coconut cream', 80::numeric, 'ของหวาน', 'Desserts',  'food', true),
  ('บัวลอยไข่หวาน',    'Bua Loy',             'บัวลอยในน้ำกะทิหอมมัน',             'Rice balls in warm coconut milk',    45::numeric, 'ของหวาน', 'Desserts',  'food', false)
) as v(name, name_en, description, description_en, price, category, category_en, kind, is_popular)
where not exists (select 1 from public.products p where p.name = v.name);

update public.products set option_groups = $j$[
 {"id":"flavor","name":"รสชาติ","name_en":"Flavor","type":"single","required":true,"options":[
   {"id":"flavor-vanilla","name":"วานิลลา","name_en":"Vanilla","price":0},
   {"id":"flavor-choc","name":"ช็อกโกแลต","name_en":"Chocolate","price":0},
   {"id":"flavor-straw","name":"สตรอว์เบอร์รี","name_en":"Strawberry","price":0},
   {"id":"flavor-matcha","name":"ชาเขียว","name_en":"Matcha","price":0}]},
 {"id":"scoop","name":"จำนวนสกู๊ป","name_en":"Scoops","type":"single","required":true,"options":[
   {"id":"scoop-1","name":"1 สกู๊ป","name_en":"1 scoop","price":0},
   {"id":"scoop-2","name":"2 สกู๊ป","name_en":"2 scoops","price":20},
   {"id":"scoop-3","name":"3 สกู๊ป","name_en":"3 scoops","price":40}]},
 {"id":"topping","name":"ท็อปปิ้ง","name_en":"Toppings","type":"multi","required":false,"options":[
   {"id":"top-sauce","name":"ซอสช็อกโกแลต","name_en":"Chocolate sauce","price":10},
   {"id":"top-nuts","name":"ถั่วบด","name_en":"Crushed nuts","price":10},
   {"id":"top-cookie","name":"คุกกี้","name_en":"Cookie crumbs","price":10},
   {"id":"top-cream","name":"วิปครีม","name_en":"Whipped cream","price":15}]}
]$j$::jsonb
where name in ('ไอศกรีมวานิลลา', 'ไอศกรีมช็อกโกแลต') and option_groups = '[]'::jsonb;

update public.products set option_groups = $j$[
 {"id":"size","name":"ขนาด","name_en":"Size","type":"single","required":true,"options":[
   {"id":"size-reg","name":"ธรรมดา","name_en":"Regular","price":0},
   {"id":"size-large","name":"ชุดใหญ่","name_en":"Large","price":20}]},
 {"id":"addon","name":"เพิ่มเติม","name_en":"Add-ons","type":"multi","required":false,"options":[
   {"id":"add-icecream","name":"ไอศกรีมวานิลลา","name_en":"Vanilla ice cream","price":20},
   {"id":"add-sauce","name":"ซอสช็อกโกแลต","name_en":"Chocolate sauce","price":10},
   {"id":"add-cream","name":"วิปครีม","name_en":"Whipped cream","price":15},
   {"id":"add-fruit","name":"ผลไม้","name_en":"Fresh fruit","price":20}]}
]$j$::jsonb
where name in ('ข้าวเหนียวมะม่วง', 'บัวลอยไข่หวาน') and option_groups = '[]'::jsonb;
