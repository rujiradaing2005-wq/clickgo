"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ERRORS: Record<string, string> = {
  disabled: "ยังไม่เปิดรับสมัครสมาชิก",
  rate_limited: "ลองบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่",
  bad_email: "รูปแบบอีเมลไม่ถูกต้อง",
  weak_password: "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร",
  bad_code: "รหัสเชิญไม่ถูกต้อง",
  exists: "อีเมลนี้สมัครไว้แล้ว กรุณาเข้าสู่ระบบ",
  failed: "สมัครไม่สำเร็จ กรุณาลองใหม่",
};

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [canRegister, setCanRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/register", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCanRegister(!!d.enabled))
      .catch(() => {});
  }, []);

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErr("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setBusy(false);
    } else router.push("/admin/orders");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");

    if (mode === "login") return signIn();

    if (password !== confirm) {
      setErr("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(ERRORS[data.code] ?? ERRORS.failed);
        setBusy(false);
        return;
      }
      await signIn(); // สมัครเสร็จแล้วเข้าสู่ระบบให้เลย
    } catch {
      setErr(ERRORS.failed);
      setBusy(false);
    }
  }

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setErr("");
  };

  const input =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
  const isReg = mode === "register";

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
          <p className="mt-1 text-brand">{isReg ? "สมัครสมาชิกร้านค้า" : "เข้าสู่ระบบร้านค้า"}</p>
        </div>
      </section>

      {/* ---------- ฟอร์ม ---------- */}
      <section className="relative z-10 -mt-8 flex flex-1 flex-col rounded-t-[2rem] bg-cream px-6 pb-8 pt-9">
        <form onSubmit={submit} className="space-y-4">
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
            <span className="mb-1 block text-sm font-medium text-coffee">
              รหัสผ่าน{isReg && <span className="font-normal text-gray-400"> (อย่างน้อย 8 ตัวอักษร)</span>}
            </span>
            <input
              type="password"
              required
              minLength={isReg ? 8 : undefined}
              autoComplete={isReg ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={input}
            />
          </label>

          {isReg && (
            <>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-coffee">ยืนยันรหัสผ่าน</span>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className={input}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-coffee">
                  รหัสเชิญ <span className="font-normal text-gray-400">(ขอจากเจ้าของร้าน)</span>
                </span>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={input}
                />
              </label>
            </>
          )}

          {err && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{err}</p>}

          <button
            disabled={busy}
            className="w-full rounded-2xl bg-brand py-3.5 font-bold text-white shadow-lg shadow-orange-300/50 transition active:scale-[0.99] disabled:opacity-50"
          >
            {busy ? "กำลังดำเนินการ..." : isReg ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
          </button>
        </form>

        {(canRegister || isReg) && (
          <p className="mt-6 text-center text-sm text-coffee/70">
            {isReg ? "มีบัญชีอยู่แล้ว?" : "ยังไม่มีบัญชี?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(isReg ? "login" : "register")}
              className="font-semibold text-brand underline-offset-4 hover:underline"
            >
              {isReg ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
            </button>
          </p>
        )}
      </section>
    </main>
  );
}
