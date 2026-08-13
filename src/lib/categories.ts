export interface Category {
  id: string;
  name: string;
  icon: string;
  bgClass: string;
  textClass: string;
}

export const ExpenseCategories: Category[] = [
  { id: "sembako", name: "🛒 Makanan & Sembako", icon: "🛒", bgClass: "bg-emerald-50 border-emerald-200", textClass: "text-emerald-700" },
  { id: "tagihan", name: "⚡ Tagihan & Utility", icon: "⚡", bgClass: "bg-amber-50 border-amber-200", textClass: "text-amber-700" },
  { id: "transport", name: "🚗 Bensin & Transport", icon: "🚗", bgClass: "bg-blue-50 border-blue-200", textClass: "text-blue-700" },
  { id: "pendidikan", name: "🎓 Pendidikan & SPP", icon: "🎓", bgClass: "bg-purple-50 border-purple-200", textClass: "text-purple-700" },
  { id: "belanja", name: "🛍️ Belanja Kebutuhan", icon: "🛍️", bgClass: "bg-pink-50 border-pink-200", textClass: "text-pink-700" },
  { id: "jajan", name: "🍿 Jajan & Hiburan", icon: "🍿", bgClass: "bg-orange-50 border-orange-200", textClass: "text-orange-700" },
  { id: "kesehatan", name: "🏥 Kesehatan & Obat", icon: "🏥", bgClass: "bg-rose-50 border-rose-200", textClass: "text-rose-700" },
  { id: "lainnya", name: "📦 Pengeluaran Lain", icon: "📦", bgClass: "bg-slate-100 border-slate-200", textClass: "text-slate-700" },
];

export const IncomeCategories: Category[] = [
  { id: "gaji", name: "💵 Gaji & Honor", icon: "💵", bgClass: "bg-emerald-50 border-emerald-200", textClass: "text-emerald-700" },
  { id: "usaha", name: "💼 Hasil Usaha", icon: "💼", bgClass: "bg-teal-50 border-teal-200", textClass: "text-teal-700" },
  { id: "bonus", name: "🎁 Bonus & Hadiah", icon: "🎁", bgClass: "bg-amber-50 border-amber-200", textClass: "text-amber-700" },
  { id: "transfer", name: "🔄 Setoran / Transfer", icon: "🔄", bgClass: "bg-blue-50 border-blue-200", textClass: "text-blue-700" },
  { id: "lainnya", name: "📦 Pemasukan Lain", icon: "📦", bgClass: "bg-slate-100 border-slate-200", textClass: "text-slate-700" },
];

export function getCategories(type: "income" | "expense"): Category[] {
  return type === "income" ? IncomeCategories : ExpenseCategories;
}

export function getCategoryBadgeInfo(categoryName?: string, type: "income" | "expense" = "expense") {
  if (!categoryName) return null;
  const list = getCategories(type);
  const found = list.find((c) => c.name.toLowerCase() === categoryName.toLowerCase() || c.id === categoryName);
  if (found) return found;
  return {
    id: "custom",
    name: categoryName,
    icon: "🏷️",
    bgClass: "bg-slate-100 border-slate-200",
    textClass: "text-slate-700",
  };
}
