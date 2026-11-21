export const baht = (n: number | string) =>
  "฿" + Number(n).toLocaleString("th-TH", { maximumFractionDigits: 2 });

export const queueNo = (n: number | string) => "A" + String(n).padStart(3, "0");
