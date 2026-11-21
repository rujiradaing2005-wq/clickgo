import { catIcon } from "@/lib/category";

/**
 * กรอบรูปสินค้า: ขนาดกำหนดจาก className (เช่น "h-16 w-16" หรือ "aspect-square w-full")
 * รูปจริงวางแบบ absolute เต็มกรอบ + object-cover จึงถูกครอปให้พอดีเสมอ ไม่ว่ารูปต้นฉบับจะใหญ่แค่ไหน
 */
export default function Thumb({
  src,
  name,
  category,
  className = "",
}: {
  src: string | null;
  name: string;
  category: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-orange-100 to-amber-200 text-4xl ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      ) : (
        catIcon(category)
      )}
    </div>
  );
}
