"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Wallet, 
  Home as HomeIcon, 
  Briefcase, 
  GraduationCap, 
  Car,
  ShoppingBag,
  Coins,
  Monitor,
  ClipboardList,
  ArrowRight,
  Plus,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Settings
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ... (other functions remain the same) ...

// Fungsi warna icon per kas
const getColorClassesForAccount = (name: string) => {
  if (!name) return "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 border-emerald-100/50";
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("keluarga") || lowerName.includes("rumah")) 
    return "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 border-emerald-100/50";
    
  if (lowerName.includes("it") || lowerName.includes("komputer") || lowerName.includes("tech")) 
    return "bg-teal-50 text-teal-600 group-hover:bg-teal-100 group-hover:text-teal-700 border-teal-100/50";
    
  if (lowerName.includes("spv") || lowerName.includes("supervisor") || lowerName.includes("psv")) 
    return "bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700 border-blue-100/50";
    
  if (lowerName.includes("kantor") || lowerName.includes("kerja")) 
    return "bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100 group-hover:text-cyan-700 border-cyan-100/50";
    
  if (lowerName.includes("sekolah") || lowerName.includes("pendidikan") || lowerName.includes("kuliah") || lowerName.includes("paud")) 
    return "bg-orange-50 text-orange-600 group-hover:bg-orange-100 group-hover:text-orange-700 border-orange-100/50";
    
  if (lowerName.includes("mobil") || lowerName.includes("motor") || lowerName.includes("kendaraan")) 
    return "bg-purple-50 text-purple-600 group-hover:bg-purple-100 group-hover:text-purple-700 border-purple-100/50";
    
  if (lowerName.includes("belanja") || lowerName.includes("toko")) 
    return "bg-pink-50 text-pink-600 group-hover:bg-pink-100 group-hover:text-pink-700 border-pink-100/50";
    
  return "bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-700 border-slate-200/50";
};

// Fungsi ikon per kas (Gambar 3D)
const getIconForAccount = (name: string) => {
  if (!name) return "/icons/umum.jpg";
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("keluarga") || lowerName.includes("rumah")) return "/icons/rumah.jpg";
  if (lowerName.includes("it") || lowerName.includes("komputer") || lowerName.includes("tech")) return "/icons/it.jpg";
  if (lowerName.includes("spv") || lowerName.includes("supervisor") || lowerName.includes("psv") || lowerName.includes("laporan")) return "/icons/spv.jpg";
  if (lowerName.includes("kantor") || lowerName.includes("kerja")) return "/icons/kantor.jpg";
  if (lowerName.includes("sekolah") || lowerName.includes("pendidikan") || lowerName.includes("kuliah") || lowerName.includes("paud")) return "/icons/pendidikan.jpg";
  if (lowerName.includes("mobil") || lowerName.includes("motor") || lowerName.includes("kendaraan")) return "/icons/mobil.jpg";
  if (lowerName.includes("belanja") || lowerName.includes("toko")) return "/icons/belanja.jpg";
  return "/icons/umum.jpg";
};

export default function Home() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [monthlyExpenses, setMonthlyExpenses] = useState<Record<string, number>>({});
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenseTotal, setMonthlyExpenseTotal] = useState(0);
  const [showTotal, setShowTotal] = useState(false);
  const [accountsError, setAccountsError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("My Family");
  
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    const { data: accountsData, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: true });

    const { data: transactions } = await supabase
      .from('transactions')
      .select('account_id, type, amount, created_at, is_transfer');

    if (accountsError) {
      setAccountsError(true);
    } else {
      setAccounts(accountsData || []);
      
      const newBalances: Record<string, number> = {};
      const newMonthlyExpenses: Record<string, number> = {};
      let newTotal = 0;
      let mIncome = 0;
      let mExpense = 0;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      accountsData?.forEach(acc => { 
        const initBal = Number(acc.initial_balance || 0);
        newBalances[acc.id] = initBal; 
        newMonthlyExpenses[acc.id] = 0;
        newTotal += initBal;
      });
      
      transactions?.forEach(tx => {
        const amount = Number(tx.amount);
        const txDate = new Date(tx.created_at);
        const isCurrentMonth = txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;

        if (tx.type === 'income') {
          newBalances[tx.account_id] = (newBalances[tx.account_id] || 0) + amount;
          newTotal += amount;
          // Hanya hitung income bukan transfer untuk statistik bulanan
          if (isCurrentMonth && !tx.is_transfer) mIncome += amount;
        } else if (tx.type === 'expense') {
          newBalances[tx.account_id] = (newBalances[tx.account_id] || 0) - amount;
          newTotal -= amount;
          if (isCurrentMonth) {
            // Hanya hitung expense bukan transfer untuk statistik bulanan
            if (!tx.is_transfer) {
              mExpense += amount;
            }
            newMonthlyExpenses[tx.account_id] = (newMonthlyExpenses[tx.account_id] || 0) + amount;
          }
        }
      });
      
      setBalances(newBalances);
      setMonthlyExpenses(newMonthlyExpenses);
      setTotalBalance(newTotal);
      setMonthlyIncome(mIncome);
      setMonthlyExpenseTotal(mExpense);
    }
    setLoading(false);
  }

  useEffect(() => {
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

  return (
    <main className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Full-width hero header */}
      <div className="w-full bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-800 pb-20 pt-0 shadow-[0_10px_40px_rgba(16,185,129,0.3)] relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="max-w-6xl mx-auto px-6 pt-8 relative z-10">
          {/* Header Profile */}
          <header className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">{fullName}</h1>
              <p className="text-sm text-emerald-50 font-medium opacity-90">Selalu Sehat dan Bahagia</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/profil" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors backdrop-blur-sm shadow-sm border border-white/20">
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 pb-28 relative z-10">
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

            {(!accounts || accounts.length === 0) && !accountsError && (
              <div className="py-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl mt-4">
                <Wallet size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="font-medium text-slate-600">Belum ada Menu Kas</p>
                <p className="text-xs mt-1">Tambahkan kas baru untuk memulai.</p>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </main>
  );
}
