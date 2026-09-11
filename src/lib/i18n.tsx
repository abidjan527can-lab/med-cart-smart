import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "ur";

const dict = {
  appName: { en: "Jan Pharma SmartStock", ur: "جان فارما سمارٹ اسٹاک" },
  tagline: { en: "Pharmacy & medical management", ur: "فارمیسی اور میڈیکل مینجمنٹ" },
  home: { en: "Home", ur: "ہوم" },
  stock: { en: "Stock", ur: "اسٹاک" },
  scan: { en: "Scan", ur: "اسکین" },
  orders: { en: "Orders", ur: "آرڈرز" },
  invoices: { en: "Invoices", ur: "انوائس" },
  more: { en: "More", ur: "مزید" },
  settings: { en: "Settings", ur: "سیٹنگز" },
  signIn: { en: "Sign in", ur: "سائن ان" },
  signUp: { en: "Create account", ur: "اکاؤنٹ بنائیں" },
  signOut: { en: "Sign out", ur: "سائن آؤٹ" },
  email: { en: "Email", ur: "ای میل" },
  password: { en: "Password", ur: "پاس ورڈ" },
  fullName: { en: "Full name", ur: "پورا نام" },
  continueGoogle: { en: "Continue with Google", ur: "گوگل سے جاری رکھیں" },
  totalMedicines: { en: "Medicines", ur: "ادویات" },
  stockValue: { en: "Stock value", ur: "اسٹاک ویلیو" },
  lowStock: { en: "Low stock", ur: "کم اسٹاک" },
  expiringSoon: { en: "Expiring soon", ur: "میعاد قریب" },
  pendingOrders: { en: "Pending orders", ur: "زیرِ التوا آرڈرز" },
  quickActions: { en: "Quick actions", ur: "فوری کام" },
  scanBarcode: { en: "Scan barcode", ur: "بارکوڈ اسکین" },
  bulkPhotos: { en: "Bulk medicine photos", ur: "ادویات کی تصاویر" },
  invoicePhoto: { en: "Invoice photo", ur: "انوائس کی تصویر" },
  prescription: { en: "Prescription", ur: "نسخہ" },
  newOrder: { en: "New order", ur: "نیا آرڈر" },
  addMedicine: { en: "Add medicine", ur: "دوا شامل کریں" },
  search: { en: "Search medicines", ur: "ادویات تلاش کریں" },
  name: { en: "Name", ur: "نام" },
  quantity: { en: "Quantity", ur: "مقدار" },
  price: { en: "Price", ur: "قیمت" },
  salePrice: { en: "Sale price", ur: "فروخت قیمت" },
  purchasePrice: { en: "Purchase price", ur: "خرید قیمت" },
  batch: { en: "Batch", ur: "بیچ" },
  expiry: { en: "Expiry", ur: "میعاد" },
  save: { en: "Save", ur: "محفوظ کریں" },
  cancel: { en: "Cancel", ur: "منسوخ" },
  add: { en: "Add", ur: "شامل" },
  subtract: { en: "Subtract", ur: "کم کریں" },
  addStock: { en: "Add stock", ur: "اسٹاک شامل" },
  removeStock: { en: "Remove stock", ur: "اسٹاک کم" },
  camera: { en: "Camera", ur: "کیمرہ" },
  capture: { en: "Capture", ur: "تصویر لیں" },
  retake: { en: "Retake", ur: "دوبارہ" },
  gallery: { en: "Gallery", ur: "گیلری" },
  analyzing: { en: "Reading with AI...", ur: "AI پڑھ رہا ہے..." },
  review: { en: "Review & confirm", ur: "جائزہ اور تصدیق" },
  confirmAdd: { en: "Confirm and add to stock", ur: "تصدیق کر کے اسٹاک میں شامل کریں" },
  supplier: { en: "Supplier", ur: "سپلائر" },
  customer: { en: "Customer", ur: "گاہک" },
  phone: { en: "Phone", ur: "فون" },
  status: { en: "Status", ur: "حالت" },
  total: { en: "Total", ur: "کل" },
  items: { en: "Items", ur: "اشیاء" },
  language: { en: "Language", ur: "زبان" },
  staff: { en: "Staff", ur: "عملہ" },
  admin: { en: "Admin", ur: "ایڈمن" },
  noResults: { en: "Nothing here yet", ur: "ابھی کچھ نہیں" },
  aiAssistant: { en: "AI assistant", ur: "اے آئی اسسٹنٹ" },
  askAi: { en: "Ask about your pharmacy", ur: "اپنی فارمیسی کے بارے میں پوچھیں" },
  reports: { en: "Reports", ur: "رپورٹس" },
} as const;

export type TKey = keyof typeof dict;

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict[k].en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("jps_lang") as Lang | null;
    if (saved === "ur" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("jps_lang", l);
  }, []);

  const t = useCallback((k: TKey) => dict[k][lang] ?? dict[k].en, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n() {
  return useContext(LangContext);
}
