import { catIcon } from "@/lib/category";

/**
 * กรอบรูปสินค้า: ขนาดกำหนดจาก className (เช่น "h-16 w-16" หรือ "aspect-square w-full")
 * รูปจริงวางแบบ absolute เต็มกรอบ + object-cover จึงถูกครอปให้พอดีเสมอ ไม่ว่ารูปต้นฉบับจะใหญ่แค่ไหน
 * soldOut = สินค้าหมด/ปิดขาย → รูปจางลง ขาวดำ และมีข้อความ soldOutLabel ทับตรงกลาง
 */
export default function Thumb({
  src,
  name,
  category,
  className = "",
  soldOut = false,
  soldOutLabel = "",
  soldOutClass = "text-sm",
}: {
  src: string | null;
  name: string;
  category: string;
  className?: string;
  soldOut?: boolean;
  soldOutLabel?: string;
  soldOutClass?: string;
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

      {soldOut && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-grayscale">
          <span className={`px-1 text-center font-bold leading-tight text-gray-700 ${soldOutClass}`}>
            {soldOutLabel}
          </span>
        </div>
      )}
    </div>
  );
}
