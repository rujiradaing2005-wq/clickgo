// เสียงแจ้งเตือนฝั่งแอดมิน (Web Audio) — ใช้ AudioContext ตัวเดียวทั้งแอป
let ctx: AudioContext | null = null;
let lastPlay = 0;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as any).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  return ctx;
}

/** เบราว์เซอร์บล็อกเสียงจนกว่าผู้ใช้จะแตะ/คลิกหน้าเว็บอย่างน้อย 1 ครั้ง */
export async function unlockAudio(): Promise<boolean> {
  const c = getCtx();
  if (!c) return false;
  if (c.state !== "running") {
    try {
      await c.resume();
    } catch {}
  }
  return c.state === "running";
}

export const isAudioRunning = () => ctx?.state === "running";

function tone(c: AudioContext, freq: number, start: number, dur: number, vol = 0.4, type: OscillatorType = "sine") {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g);
  g.connect(c.destination);
  const t0 = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function guard(): AudioContext | null {
  const c = getCtx();
  if (!c || c.state !== "running") return null;
  const now = Date.now();
  if (now - lastPlay < 800) return null; // กันเสียงซ้อนกัน
  lastPlay = now;
  return c;
}

/** ออเดอร์ใหม่: "ติ๊ง-ต่อง" 2 รอบ */
export function playNewOrder() {
  const c = guard();
  if (!c) return;
  [0, 0.7].forEach((d) => {
    tone(c, 880, d, 0.35, 0.45, "triangle");
    tone(c, 1175, d + 0.25, 0.5, 0.45, "triangle");
  });
}

/** ลูกค้าแจ้งโอนเงิน: เสียงสูงขึ้น 3 จังหวะ */
export function playPayment() {
  const c = guard();
  if (!c) return;
  [660, 880, 1320].forEach((f, i) => tone(c, f, i * 0.16, 0.22, 0.4, "sine"));
}
