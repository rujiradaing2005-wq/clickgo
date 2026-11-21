export function catIcon(name: string) {
  const n = name.toLowerCase();
  if (/ไอศกรีม|ไอติม|ice ?cream|gelato/.test(n)) return "🍦";
  if (/กาแฟ|coffee|latte|espresso/.test(n)) return "☕";
  if (/ชา|tea/.test(n)) return "🍵";
  if (/ของหวาน|ขนม|เค้ก|เบเกอรี่|dessert|cake|bakery|sweet/.test(n)) return "🍰";
  if (/ก๋วยเตี๋ยว|เส้น|noodle/.test(n)) return "🍜";
  if (/ยำ|ส้มตำ|สลัด|salad/.test(n)) return "🥗";
  if (/ทอด|ไก่|fried|chicken/.test(n)) return "🍗";
  if (/เครื่องดื่ม|น้ำ|ปั่น|drink|juice|smoothie/.test(n)) return "🥤";
  if (/อาหาร|ข้าว|food|rice|main/.test(n)) return "🍛";
  return "🍽️";
}
