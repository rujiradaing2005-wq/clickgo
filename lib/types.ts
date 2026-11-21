export type Option = {
  id: string;
  name: string;
  name_en?: string | null;
  price: number;
  image_url?: string | null;
};

export type OptionGroup = {
  id: string;
  name: string;
  name_en?: string | null;
  type: "single" | "multi";
  required: boolean;
  options: Option[];
};

export type Product = {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  price: number;
  image_url: string | null;
  category: string;
  category_en: string | null;
  kind: "drink" | "food";
  is_available: boolean;
  is_popular: boolean;
  option_groups: OptionGroup[];
};

export type Settings = {
  shop_name: string;
  shop_name_en: string | null;
  promptpay_id: string | null;
  is_open: boolean;
  tagline: string | null;
  tagline_en: string | null;
  phone: string | null;
  map_url: string | null;
  banner_url: string | null;
  promo_text: string | null;
  promo_text_en: string | null;
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "รอร้านรับออเดอร์",
  preparing: "กำลังเตรียม",
  ready: "พร้อมรับแล้ว",
  done: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};
