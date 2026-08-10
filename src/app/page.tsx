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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
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

      {/* Grid Menu Kas (Gaya Icon Shopee) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[200px]">
        {accountsError && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 mb-4">
            Gagal mengambil data dari database. Pastikan koneksi aman.
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-y-6 gap-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center animate-pulse">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 rounded-2xl mb-3"></div>
                <div className="h-3 w-12 bg-slate-200 rounded"></div>
              </div>
            ))}
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
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors border border-emerald-100/50 shadow-inner text-emerald-600 group-hover:text-emerald-700">
                    {getIconForAccount(account.name)}
                  </div>
                  
                  {/* Text / Title */}
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 text-center uppercase tracking-wide px-1 line-clamp-2 leading-tight mt-1">
                    {account.name}
                  </span>
                </Link>
              ))}
              
              {/* Menu "Tambah Kas" atau Placeholder kosong (Opsional) */}
              {accounts && accounts.length > 0 && (
                 <Link href="#" onClick={(e) => { e.preventDefault(); alert('Untuk menambah Kas baru, silakan tambahkan di Database Supabase Anda.'); }} className="group flex flex-col items-center justify-start cursor-pointer active:scale-95 transition-transform">
                   <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-slate-100 transition-colors border border-slate-100 shadow-inner text-slate-400 group-hover:text-slate-500">
                     <div className="grid grid-cols-2 gap-1 w-6 h-6">
                       <div className="bg-current rounded-sm"></div>
                       <div className="bg-current rounded-sm"></div>
                       <div className="bg-current rounded-sm"></div>
                       <div className="bg-current rounded-sm rotate-45 transform scale-75"></div>
                     </div>
                   </div>
                   <span className="text-[10px] sm:text-xs font-bold text-slate-700 text-center uppercase tracking-wide px-1">
                     LAINNYA
                   </span>
                 </Link>
              )}
            </div>

            {(!accounts || accounts.length === 0) && !accountsError && (
              <div className="py-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl mt-4">
                <Wallet size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="font-medium text-slate-600">Belum ada Menu Kas</p>
                <p className="text-xs mt-1">Tambahkan dari database.</p>
              </div>
            )}
          </>
        )}
      </div>

    </main>
  );
}
