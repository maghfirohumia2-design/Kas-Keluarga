"use client";

import { TrendingUp, TrendingDown, Scale, CalendarClock } from "lucide-react";
import { formatRupiah } from "@/lib/format";

interface FinancialSummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  dayCount: number;
}

export default function FinancialSummaryCards({
  totalIncome,
  totalExpense,
  netFlow,
  dayCount
}: FinancialSummaryCardsProps) {
  const isSurplus = netFlow >= 0;
  const avgDailyExpense = dayCount > 0 ? Math.round(totalExpense / dayCount) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* 1. Total Pemasukan */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
          <TrendingUp size={16} />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pemasukan</p>
        <h3 className="text-base sm:text-lg font-black text-emerald-600 truncate mt-0.5">
          {formatRupiah(totalIncome)}
        </h3>
      </div>

      {/* 2. Total Pengeluaran */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
          <TrendingDown size={16} />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pengeluaran</p>
        <h3 className="text-base sm:text-lg font-black text-rose-600 truncate mt-0.5">
          {formatRupiah(totalExpense)}
        </h3>
      </div>

      {/* 3. Arus Kas Bersih (Net Flow) */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
          isSurplus ? "bg-teal-50 text-teal-600" : "bg-red-50 text-red-600"
        }`}>
          <Scale size={16} />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {isSurplus ? "Surplus Kas" : "Defisit Kas"}
        </p>
        <h3 className={`text-base sm:text-lg font-black truncate mt-0.5 ${
          isSurplus ? "text-teal-700" : "text-red-600"
        }`}>
          {isSurplus ? "+" : ""}{formatRupiah(netFlow)}
        </h3>
      </div>

      {/* 4. Rata-rata Harian */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
          <CalendarClock size={16} />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata Harian</p>
        <h3 className="text-base sm:text-lg font-black text-slate-800 truncate mt-0.5">
          {formatRupiah(avgDailyExpense)}
          <span className="text-[10px] font-medium text-slate-400">/hari</span>
        </h3>
      </div>
    </div>
  );
}
