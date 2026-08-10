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
  Loader2
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

// Fungsi ikon per kas
const getIconForAccount = (name: string) => {
  if (!name) return <Coins size={32} />;
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("keluarga") || lowerName.includes("rumah")) return <HomeIcon size={32} />;
  if (lowerName.includes("it") || lowerName.includes("komputer") || lowerName.includes("tech")) return <Monitor size={32} />;
  if (lowerName.includes("spv") || lowerName.includes("supervisor") || lowerName.includes("psv")) return <ClipboardList size={32} />;
  if (lowerName.includes("kantor") || lowerName.includes("kerja")) return <Briefcase size={32} />;
  if (lowerName.includes("sekolah") || lowerName.includes("pendidikan") || lowerName.includes("kuliah") || lowerName.includes("paud")) return <GraduationCap size={32} />;
  if (lowerName.includes("mobil") || lowerName.includes("motor") || lowerName.includes("kendaraan")) return <Car size={32} />;
  if (lowerName.includes("belanja") || lowerName.includes("toko")) return <ShoppingBag size={32} />;
  return <Coins size={32} />;
};

export default function Home() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [monthlyExpenses, setMonthlyExpenses] = useState<Record<string, number>>({});
  const [totalBalance, setTotalBalance] = useState(0);
  const [accountsError, setAccountsError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("My Family");
  
  // State untuk modal tambah Kas
  const [showAddKas, setShowAddKas] = useState(false);
  const [newKasName, setNewKasName] = useState("");
  const [newKasDesc, setNewKasDesc] = useState("");
  const [isSubmittingKas, setIsSubmittingKas] = useState(false);

  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    const { data: accountsData, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: true });

    const { data: transactions } = await supabase
      .from('transactions')
      .select('account_id, type, amount, created_at');

    if (accountsError) {
      setAccountsError(true);
    } else {
      setAccounts(accountsData || []);
      
      const newBalances: Record<string, number> = {};
      const newMonthlyExpenses: Record<string, number> = {};
      let newTotal = 0;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      accountsData?.forEach(acc => { 
        newBalances[acc.id] = 0; 
        newMonthlyExpenses[acc.id] = 0;
      });
      
      transactions?.forEach(tx => {
        const amount = Number(tx.amount);
        if (tx.type === 'income') {
          newBalances[tx.account_id] += amount;
          newTotal += amount;
        } else {
          newBalances[tx.account_id] -= amount;
          newTotal -= amount;
          
          const txDate = new Date(tx.created_at);
          if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
            newMonthlyExpenses[tx.account_id] += amount;
          }
        }
      });
      
      setBalances(newBalances);
      setMonthlyExpenses(newMonthlyExpenses);
      setTotalBalance(newTotal);
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

  const handleAddKas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKasName.trim()) return;
    
    setIsSubmittingKas(true);
    const { error } = await supabase.from('accounts').insert({
      name: newKasName,
      description: newKasDesc
    });

    if (error) {
      alert("Gagal menambahkan Kas. Coba lagi.");
    } else {
      setNewKasName("");
      setNewKasDesc("");
      setShowAddKas(false);
      fetchData(); // Refresh data
    }
    setIsSubmittingKas(false);
  };

  return (
    <main className="p-6 pb-24 relative min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[340px] bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-800 rounded-b-[48px] z-0 shadow-[0_10px_40px_rgba(16,185,129,0.3)]" />
      <div className="absolute top-0 left-0 w-full h-[340px] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 rounded-b-[48px] z-0" />

      {/* Header Profile */}
      <header className="mb-8 pt-6 flex justify-between items-center relative z-10">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{fullName}</h1>
          <p className="text-sm text-emerald-50 font-medium opacity-90">Selalu Sehat dan Bahagia</p>
        </div>
        <Link href="/profil" className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-xl shadow-lg border-[3px] border-emerald-300/50 overflow-hidden relative transition-transform hover:scale-105 active:scale-95">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Profil" fill className="object-cover" />
          ) : (
            "👨‍👩‍👧"
          )}
        </Link>
      </header>

      {/* Grid Menu Kas (Gaya Icon Shopee) */}
      <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border border-white/50 min-h-[200px] relative z-10 mt-2">
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
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-y-6 gap-x-2">
              {accounts?.map((account) => (
                <Link 
                  href={`/kas/${account.id}`} 
                  key={account.id} 
                  className="group flex flex-col items-center justify-start cursor-pointer active:scale-95 transition-transform"
                >
                  {/* Icon Box */}
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-3 transition-colors border shadow-inner ${getColorClassesForAccount(account.name)}`}>
                    {getIconForAccount(account.name)}
                  </div>
                  
                  {/* Text / Title */}
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 text-center uppercase tracking-wide px-1 line-clamp-2 leading-tight mt-1">
                    {account.name}
                  </span>
                  
                  {/* Budget Progress (if exists) */}
                  {account.budget_limit > 0 && (
                    <div className="w-14 sm:w-16 mt-2 flex flex-col items-center">
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
              
              {/* Menu Tambah Kas */}
              <button 
                onClick={() => setShowAddKas(true)}
                className="group flex flex-col items-center justify-start cursor-pointer active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-emerald-50 transition-colors border border-dashed border-slate-300 shadow-inner text-slate-400 group-hover:text-emerald-500 group-hover:border-emerald-200">
                  <Plus size={28} />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 group-hover:text-emerald-600 text-center uppercase tracking-wide px-1">
                  TAMBAH
                </span>
              </button>
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

      {/* Modal Tambah Kas */}
      {showAddKas && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Tambah Kas Baru</h2>
            <form onSubmit={handleAddKas} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nama Kas</label>
                <input
                  type="text"
                  required
                  value={newKasName}
                  onChange={(e) => setNewKasName(e.target.value)}
                  placeholder="Misal: Kas Tabungan"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Deskripsi (Opsional)</label>
                <input
                  type="text"
                  value={newKasDesc}
                  onChange={(e) => setNewKasDesc(e.target.value)}
                  placeholder="Misal: Tabungan masa depan..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-medium"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddKas(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingKas || !newKasName.trim()}
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50 flex justify-center items-center"
                >
                  {isSubmittingKas ? <Loader2 className="animate-spin" size={20} /> : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
