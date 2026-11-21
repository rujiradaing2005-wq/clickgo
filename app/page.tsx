import { redirect } from "next/navigation";

// หน้าแรกของเว็บ = หน้าเข้าสู่ระบบร้านค้า (ลูกค้าเข้าผ่าน QR Code ที่โต๊ะเท่านั้น)
export default function Root() {
  redirect("/admin/login");
}
