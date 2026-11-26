"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import OrderAlerts from "@/components/OrderAlerts";

const links = [
  { href: "/admin/orders", label: "ออเดอร์" },
  { href: "/admin/products", label: "สินค้า" },
  { href: "/admin/qr", label: "QR Code" },
  { href: "/admin/settings", label: "ตั้งค่าร้าน" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [ok, setOk] = useState(false);
  const isLogin = path === "/admin/login";

  useEffect(() => {
    if (isLogin) {
      setOk(true);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return router.replace("/admin/login");
      // ต้องเป็นพนักงานในตาราง staff (ถ้าตารางยังไม่ถูกสร้าง จะปล่อยผ่านไปก่อน — สิทธิ์จริงคุมที่ฐานข้อมูล)
      const { data: row, error } = await supabase
        .from("staff")
        .select("user_id")
        .eq("user_id", data.session.user.id)
        .maybeSingle();
      if (!error && !row) {
        await supabase.auth.signOut();
        return router.replace("/admin/login");
      }
      setOk(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace("/admin/login");
    });
    return () => sub.subscription.unsubscribe();
  }, [isLogin, router]);

  if (!ok) return null;
  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-screen bg-white">
      <nav className="flex flex-wrap items-center gap-4 bg-gray-800 px-4 py-3 text-sm text-white print:hidden">
        <span className="font-bold text-orange-400">ClickGo Admin</span>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={path === l.href ? "underline" : "opacity-80 hover:opacity-100"}>
            {l.label}
          </Link>
        ))}
        <button
          className="ml-auto opacity-80 hover:opacity-100"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/admin/login");
          }}
        >
          ออกจากระบบ
        </button>
      </nav>
      <OrderAlerts />
      {children}
    </div>
  );
}
