/** ย่อรูปก่อนอัปโหลด (ด้านยาวสุด max px, JPEG) — รูปจากมือถือหลาย MB จะเหลือไม่กี่ร้อย KB */
export async function resizeImage(
  file: File,
  max = 900,
  quality = 0.82
): Promise<{ blob: Blob; ext: string }> {
  const fallback = { blob: file as Blob, ext: file.name.split(".").pop() || "jpg" };
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return fallback;

  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (blob) return { blob, ext: "jpg" };
  } catch {}
  return fallback;
}
