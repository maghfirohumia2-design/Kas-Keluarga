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
  CircleDollarSign,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Fungsi untuk mendapatkan ikon berdasarkan nama kas
const getIconForAccount = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("keluarga") || lowerName.includes("rumah")) return <HomeIcon size={32} />;
  if (lowerName.includes("kantor") || lowerName.includes("psv") || lowerName.includes("kerja")) return <Briefcase size={32} />;
  if (lowerName.includes("sekolah") || lowerName.includes("pendidikan") || lowerName.includes("kuliah")) return <GraduationCap size={32} />;
  if (lowerName.includes("mobil") || lowerName.includes("motor") || lowerName.includes("kendaraan")) return <Car size={32} />;
  if (lowerName.includes("belanja") || lowerName.includes("toko")) return <ShoppingBag size={32} />;
  return <CircleDollarSign size={32} />;
};

// Fungsi warna gradien per kas
const getGradientForAccount = (index: number) => {
  const gradients = [
    "from-emerald-500 to-teal-500 text-white", // Default / Keluarga
    "from-blue-500 to-indigo-500 text-white", // Kantor
    "from-orange-400 to-red-500 text-white", // Sekolah
    "from-purple-500 to-pink-500 text-white", // Lain-lain
    "from-amber-500 to-orange-600 text-white"
  ];
  return gradients[index % gradients.length];
};

export default function Home() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [totalBalance, setTotalBalance] = useState(0);
  const [accountsError, setAccountsError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("My Family");

  useEffect(() => {
    async function fetchData() {
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: true });

      const { data: transactions } = await supabase
        .from('transactions')
        .select('account_id, type, amount');

      if (accountsError) {
        setAccountsError(true);
      } else {
        setAccounts(accountsData || []);
        
        const newBalances: Record<string, number> = {};
        let newTotal = 0;
        
        accountsData?.forEach(acc => { newBalances[acc.id] = 0; });
        
        transactions?.forEach(tx => {
          const amount = Number(tx.amount);
          if (tx.type === 'income') {
            newBalances[tx.account_id] += amount;
            newTotal += amount;
          } else {
            newBalances[tx.account_id] -= amount;
            newTotal -= amount;
          }
        });
        
        setBalances(newBalances);
        setTotalBalance(newTotal);
      }
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

  return (
    <main className="p-6 pb-24 relative min-h-screen bg-slate-50">
      {/* Header Profile */}
      <header className="mb-6 pt-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{fullName}</h1>
          <p className="text-sm text-slate-500">Selalu Sehat dan Bahagia</p>
        </div>
        <Link href="/profil" className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl shadow-md border-2 border-emerald-100 overflow-hidden relative transition-transform hover:scale-105 active:scale-95">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Profil" fill className="object-cover" />
          ) : (
            "👨‍👩‍👧"
          )}
        </Link>
      </header>

      {/* Mini Banner Total (Tidak sebesar dulu) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-8 flex justify-between items-center">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Keseluruhan</p>
          <p className="text-xl font-bold text-slate-800">Rp {totalBalance.toLocaleString('id-ID')}</p>
        </div>
        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
          <Wallet size={20} />
        </div>
      </div>

      <h3 className="font-bold text-slate-800 mb-4 px-1 text-lg">Pilih Menu Kas</h3>

      {/* Grid Kotak-Kotak (Gaya Shopee) */}
      <div className="grid grid-cols-2 gap-4">
        {accountsError && (
          <div className="col-span-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            Gagal mengambil data dari database. Pastikan koneksi aman.
          </div>
        )}

        {accounts?.map((account, index) => (
          <Link 
            href={`/kas/${account.id}`} 
            key={account.id} 
            className="group block relative overflow-hidden bg-white rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-emerald-200 active:scale-95"
          >
            {/* Top Color Banner */}
            <div className={`h-24 w-full bg-gradient-to-br ${getGradientForAccount(index)} p-4 flex flex-col justify-end relative overflow-hidden`}>
              <div className="absolute top-[-10px] right-[-10px] opacity-20 transform group-hover:scale-110 transition-transform duration-300">
                {getIconForAccount(account.name)}
              </div>
              <div className="bg-white/20 backdrop-blur-md w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner mb-2 border border-white/10">
                {getIconForAccount(account.name)}
              </div>
            </div>
            
            {/* Bottom Content */}
            <div className="p-4 pt-3">
              <h2 className="font-bold text-slate-800 text-[15px] leading-tight mb-1 line-clamp-1">{account.name}</h2>
              <p className={`font-semibold text-sm ${balances[account.id] < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                Rp {balances[account.id]?.toLocaleString('id-ID') || 0}
              </p>
              
              <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-slate-400 text-xs font-medium group-hover:text-emerald-500 transition-colors">
                <span>Buka Kas</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {(!accounts || accounts.length === 0) && !accountsError && (
        <div className="p-8 text-center text-slate-500 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm mt-4">
          <Wallet size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="font-medium text-slate-600">Belum ada Menu Kas</p>
          <p className="text-xs mt-1">Anda perlu menambahkannya di database.</p>
        </div>
      )}
    </main>
  );
}
