# ClickGo – คลิกเดียว พร้อมรับ

ระบบสแกน QR สั่งสินค้า  |  Next.js 15 + Tailwind CSS 3 + Supabase

## เริ่มใช้งาน (5 ขั้นตอน)

### 1) สร้างโปรเจกต์ Supabase
เข้า https://supabase.com → New project

### 2) สร้างตารางทั้งหมด
Supabase → **SQL Editor** → วางเนื้อหาไฟล์ `supabase/schema.sql` → **Run**
(ได้ตาราง, นโยบาย RLS, bucket เก็บรูป, Realtime และข้อมูลตัวอย่างให้เลย)

> ถ้าเคยรัน schema.sql เวอร์ชันแรกไปแล้ว ให้รัน `supabase/update_v2.sql` เพิ่มอีกไฟล์เดียว (ไม่ต้องรัน schema.sql ซ้ำ)

> ติดตั้งใหม่: รัน `schema.sql` → `update_v2.sql` → `update_v3.sql` → `update_v4.sql` ตามลำดับ
> (ไม่บังคับ) `update_v5.sql` เพิ่มสินค้าตัวอย่างหมวดไอศกรีม/ของหวาน
> `update_v6.sql` จำกัดสิทธิ์แอดมินเฉพาะพนักงาน + เปิดสมัครสมาชิกร้านค้าด้วยรหัสเชิญ (ตั้ง `STAFF_SIGNUP_CODE`)
> เคยรันไปแล้ว: รันเฉพาะไฟล์ที่ยังไม่เคยรัน (`update_v3.sql` เพิ่มระบบ 2 ภาษา + ตัวเลือกสินค้า)

### 3) สร้างบัญชีแอดมิน
Supabase → **Authentication → Users → Add user** → ใส่อีเมล/รหัสผ่าน (ติ๊ก Auto Confirm User)

### 4) ตั้งค่า Environment
```bash
cp .env.example .env.local
```
แก้ `.env.local` ด้วยค่าจาก Supabase → **Project Settings → API**
- `NEXT_PUBLIC_SUPABASE_URL`  = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key (ความลับ! ห้ามเผยแพร่)

### 5) ติดตั้งและรัน
```bash
npm install
npm run dev
```
เปิด http://localhost:3000

## วิธีทดลองใช้
1. ไปที่ `/admin/login` → ล็อกอิน
2. `/admin/settings` ใส่เบอร์ PromptPay ของร้าน
3. `/admin/qr` ดู QR ของแต่ละโต๊ะ (คลิกขวาเปิดลิงก์ หรือสแกนด้วยมือถือ)
   - ทดสอบบนมือถือ: เปิดหน้านี้ด้วย `http://<IP เครื่อง>:3000/admin/qr` เพื่อให้ QR มี IP ที่มือถือเข้าถึงได้
4. ฝั่งลูกค้า: สแกน QR → เลือกสินค้า → ตะกร้า → ยืนยัน → ดูหมายเลขคิว/จ่ายผ่าน PromptPay
5. ฝั่งร้าน: `/admin/orders` กด "เปิดเสียงแจ้งเตือน" แล้วจะเห็นออเดอร์เด้งเข้าทันที

## โครงสร้างหน้า
| Route | หน้า |
|---|---|
| `/t/[tableId]` | หน้าแรกร้าน (QR ชี้มาที่นี่): ชื่อร้าน, ดูเมนู, ติดตามออเดอร์, โทร, แผนที่, สลับ TH/EN |
| `/t/[tableId]/menu` | เมนูสินค้า: ค้นหา, แบนเนอร์, หมวดหมู่, ยอดนิยม, รายการทั้งหมด + ปุ่ม + |
| `/product/[id]` | รายละเอียดสินค้า |
| `/cart` | ตะกร้า + ยืนยันคำสั่งซื้อ |
| `/pay/[orderId]` | ชำระเงิน: เลือกจ่ายเงินสด หรือสแกนจ่าย PromptPay (QR ตามยอด) + ปุ่ม "ฉันโอนแล้ว" |
| `/order/[orderId]` | หมายเลขคิว, สถานะออเดอร์, สถานะการชำระเงิน |
| `/admin/login` | เข้าสู่ระบบร้าน |
| `/admin/orders` | ออเดอร์เรียลไทม์, ประวัติ, ยอดขายวันนี้ |
| `/admin/products` | เพิ่ม/แก้ไข/ปิดขาย/อัปโหลดรูป |
| `/admin/qr` | สร้างและพิมพ์ QR |
| `/admin/settings` | ชื่อร้าน, PromptPay, เปิด-ปิดรับออเดอร์ |

## ความปลอดภัยที่ทำไว้
- ลูกค้าไม่มีสิทธิ์อ่าน/เขียนตาราง orders โดยตรง (RLS) — ผ่าน `/api/orders` เท่านั้น
- ราคาคำนวณใหม่ฝั่งเซิร์ฟเวอร์จากฐานข้อมูล ลูกค้าแก้ราคาไม่ได้
- ตรวจโต๊ะ, สินค้าหมด, จำนวน, ร้านปิด และจำกัด 6 ออเดอร์/นาที/IP

## ข้อจำกัดที่ควรรู้
- ระบบ PromptPay แสดง QR ตามยอด แต่ **ไม่ตรวจสลิปอัตโนมัติ** — แอดมินกด "รับเงินแล้ว" เอง
  (ถ้าต้องการอัตโนมัติ ให้ต่อ payment gateway เช่น Omise/Stripe)
- Rate limit เป็นแบบในหน่วยความจำ เหมาะกับเซิร์ฟเวอร์เดียว; บน Vercel ควรใช้ Upstash Redis แทน

## Deploy
Push ขึ้น GitHub → import ที่ Vercel → ใส่ Environment Variables 3 ตัวเดิม → Deploy
