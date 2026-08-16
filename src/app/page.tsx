"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Wallet, 
  Settings,
  BarChart3,
  Receipt,
  CircleDollarSign
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Account } from "@/types/database";
import { HomeDashboardSkeleton } from "@/components/ui/Skeleton";
import MultiAccountMatrix from "@/components/home/MultiAccountMatrix";

// Fungsi ikon per kas (Gambar 3D)
const getIconForAccount = (name: string) => {
  if (!name) return "/icons/umum.jpg";
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("bca")) return "/icons/bca.png";
  if (lowerName.includes("bri")) return "/icons/bri.png";
  if (lowerName.includes("mandiri")) return "/icons/mandiri.png";
  if (lowerName.includes("bni")) return "/icons/bni.png";
  if (lowerName.includes("dana")) return "/icons/dana.png";
  if (lowerName.includes("gopay")) return "/icons/gopay.png";
  if (lowerName.includes("ovo")) return "/icons/ovo.png";
  if (lowerName.includes("shopee") || lowerName.includes("spay")) return "/icons/spay.png";
  if (lowerName.includes("dompet") || lowerName.includes("tunai") || lowerName.includes("cash")) return "/icons/tunai.png";
  if (lowerName.includes("emas") || lowerName.includes("gold")) return "/icons/emas.png";
  
  return "/icons/umum.jpg";
};

interface AccountWithBalance extends Account {
  calculatedBalance: number;
}

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsWithBalance, setAccountsWithBalance] = useState<AccountWithBalance[]>([]);
  const [totalFamilyBalance, setTotalFamilyBalance] = useState<number>(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState<Record<string, number>>({});
  const [accountsError, setAccountsError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("My Family");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: accountsData, error: accError } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: true });

      const { data: transactions } = await supabase
        .from('transactions')
        .select('account_id, type, amount, created_at, is_transfer');

      if (accError) {
        setAccountsError(true);
      } else {
        const accs = (accountsData || []) as Account[];
        setAccounts(accs);
        
        const newMonthlyExpenses: Record<string, number> = {};
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        accs.forEach(acc => { 
          newMonthlyExpenses[acc.id] = 0;
        });
        
        transactions?.forEach(tx => {
          const amount = Number(tx.amount);
          const txDate = new Date(tx.created_at);
          const isCurrentMonth = txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;

          if (tx.type === 'expense' && isCurrentMonth && !tx.is_transfer) {
            newMonthlyExpenses[tx.account_id] = (newMonthlyExpenses[tx.account_id] || 0) + amount;
          }
        });
        
        setMonthlyExpenses(newMonthlyExpenses);

        // Hitung Saldo Tiap Kas & Total Saldo Keluarga
        let totalBal = 0;
        const calculatedAccs: AccountWithBalance[] = accs.map((acc) => {
          const accTxs = transactions?.filter((t) => t.account_id === acc.id) || [];
          const income = accTxs
            .filter((t) => t.type === 'income')
            .reduce((s, t) => s + Number(t.amount || 0), 0);
          const expense = accTxs
            .filter((t) => t.type === 'expense')
            .reduce((s, t) => s + Number(t.amount || 0), 0);
          const curBal = Number(acc.initial_balance || 0) + (income - expense);
          totalBal += curBal;
          return { ...acc, calculatedBalance: curBal };
        });

        setAccountsWithBalance(calculatedAccs);
        setTotalFamilyBalance(totalBal);
      }
      setLoading(false);
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
      if (user?.user_metadata?.full_name) {
        setFullName(user.user_metadata.full_name);
      }
    });

    fetchData();
  }, []);

  if (loading) {
    return <HomeDashboardSkeleton />;
  }

  return (
    <main className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Full-width hero header */}
      <div className="w-full bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-800 pb-16 pt-0 shadow-[0_10px_40px_rgba(16,185,129,0.3)] relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="max-w-6xl mx-auto px-6 pt-8 relative z-10">
          {/* Header Profile */}
          <header className="flex justify-between items-center mb-2 gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white tracking-tight truncate">{fullName}</h1>
              <p className="text-sm text-emerald-50 font-medium opacity-90 truncate">Selalu Sehat dan Bahagia</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link 
                href="/laporan" 
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors backdrop-blur-sm shadow-sm border border-white/20"
                title="Laporan & Analisis Keuangan"
              >
                <BarChart3 size={20} />
              </Link>
              <Link 
                href="/profil" 
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors backdrop-blur-sm shadow-sm border border-white/20"
                title="Pengaturan Profil"
              >
                <Settings size={20} />
              </Link>
              <Link href="/profil" className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-xl shadow-lg border-[3px] border-emerald-300/50 overflow-hidden relative transition-transform hover:scale-105 active:scale-95">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Profil" fill className="object-cover" />
                ) : (
                  "👨‍👩‍👧"
                )}
              </Link>
            </div>
          </header>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 pb-28 relative z-10 space-y-5">
        {/* Multi-Account Asset Proportion Matrix */}
        <MultiAccountMatrix
          accounts={accountsWithBalance}
          totalBalance={totalFamilyBalance}
        />

        {/* Menu Kas Container */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border border-white/50 min-h-[200px]">
        {accountsError && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 mb-4">
            Gagal mengambil data dari database. Pastikan koneksi aman.
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-75"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white animate-bounce">
                <Wallet size={36} className="text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] animate-pulse">Menyiapkan Kas...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 sm:gap-6">
              {accounts?.map((account) => (
                <Link 
                  href={`/kas/${account.id}`} 
                  key={account.id} 
                  className="group flex flex-col items-center justify-start cursor-pointer active:scale-95 transition-transform w-[72px] sm:w-[84px]"
                >
                  {/* Icon Box */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] flex items-center justify-center mb-2 shadow-sm bg-white p-1 border border-slate-100/80 group-hover:shadow-md group-hover:border-slate-200 transition-all">
                    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner">
                      <Image src={getIconForAccount(account.name)} alt={account.name} fill className="object-cover" sizes="64px" />
                    </div>
                  </div>
                  
                  {/* Text / Title */}
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 text-center uppercase tracking-wide px-1 line-clamp-2 leading-tight mt-1">
                    {account.name}
                  </span>
                  
                  {/* Budget Progress (if exists) */}
                  {account.budget_limit > 0 && (
                    <div className="w-12 sm:w-14 mt-1.5 flex flex-col items-center">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            (monthlyExpenses[account.id] / account.budget_limit) > 0.85 
                              ? 'bg-red-500' 
                              : (monthlyExpenses[account.id] / account.budget_limit) > 0.6 
                                ? 'bg-orange-400' 
                                : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min((monthlyExpenses[account.id] / account.budget_limit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Quick Actions Grid: Laporan, Tagihan, & Hutang Piutang */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
              {/* Tagihan Rutin Banner */}
              <div className="p-3 bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-white rounded-2xl border border-amber-100/80 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-200">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800">Tagihan Rutin & Pengingat</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Pantau listrik, WiFi, SPP & bayar tepat waktu</p>
                  </div>
                </div>

                <Link
                  href="/tagihan"
                  className="px-3 py-1.5 bg-white border border-amber-200 text-amber-800 hover:bg-amber-50 active:scale-95 text-xs font-bold rounded-xl transition-all whitespace-nowrap shadow-sm"
                >
                  Buka Tagihan
                </Link>
              </div>

              {/* Catatan Hutang & Piutang Banner */}
              <div className="p-3 bg-gradient-to-r from-rose-50/70 via-red-50/40 to-white rounded-2xl border border-red-100/80 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-200">
                    <CircleDollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800">Catatan Hutang & Piutang</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Buku pinjaman keluarga & rekap cicilan</p>
                  </div>
                </div>

                <Link
                  href="/hutang-piutang"
                  className="px-3 py-1.5 bg-white border border-red-200 text-red-700 hover:bg-red-50 active:scale-95 text-xs font-bold rounded-xl transition-all whitespace-nowrap shadow-sm"
                >
                  Buka Hutang
                </Link>
              </div>

              {/* Laporan & Ekspor Arus Kas Banner */}
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800">Laporan & Ekspor Arus Kas</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Analisis tren, cetak PDF, atau unduh CSV/Excel</p>
                  </div>
                </div>

                <Link
                  href="/laporan"
                  className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 active:scale-95 text-xs font-bold rounded-xl transition-all whitespace-nowrap shadow-sm"
                >
                  Buka Laporan
                </Link>
              </div>
            </div>

            {(!accounts || accounts.length === 0) && !accountsError && (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">Belum ada akun kas yang dibuat.</p>
                <Link href="/profil" className="text-emerald-600 text-sm font-semibold hover:underline mt-2 inline-block">
                  Tambah Akun Kas di Profil
                </Link>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </main>
  );
}
