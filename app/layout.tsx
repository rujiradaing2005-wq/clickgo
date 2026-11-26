// @ts-ignore: Next.js loads global CSS imports during the build
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";

// เปลี่ยนฟอนต์ได้ที่นี่ เช่น Prompt, Noto_Sans_Thai, IBM_Plex_Sans_Thai, Mitr
const font = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-main",
});

export const metadata: Metadata = {
  title: "ClickGo – คลิกเดียว พร้อมรับ",
  description: "สแกน QR สั่งสินค้าได้ด้วยตัวเอง",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={font.variable}>
      <body className="bg-gray-100 font-sans text-gray-900 antialiased">{children}</body>
    </html>
  );
}
