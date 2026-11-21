"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErr("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setBusy(false);
    } else router.push("/admin/orders");
  }

  const input =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-coffee shadow-xl">
      {/* ---------- ส่วนหัว ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-coffee to-coffee-800 px-6 pb-14 pt-14 text-center text-white">
        <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand/25 blur-3xl" />
        <span className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-brand/15 blur-3xl" />
        <div className="relative flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-20 w-20 rounded-[1.4rem] shadow-2xl ring-4 ring-white/10" />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">ClickGo</h1>
          <p className="mt-1 text-brand">เข้าสู่ระบบร้านค้า</p>
        </div>
      </section>

      {/* ---------- ฟอร์ม ---------- */}
      <section className="relative z-10 -mt-8 flex flex-1 flex-col rounded-t-[2rem] bg-cream px-6 pb-8 pt-9">
        <form onSubmit={login} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-coffee">อีเมล</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={input}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-coffee">รหัสผ่าน</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={input}
            />
          </label>

          {err && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{err}</p>}

          <button
            disabled={busy}
            className="w-full rounded-2xl bg-brand py-3.5 font-bold text-white shadow-lg shadow-orange-300/50 transition active:scale-[0.99] disabled:opacity-50"
          >
            {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </section>
    </main>
  );
}
