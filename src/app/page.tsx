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
  Monitor,
  ClipboardList,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Fungsi untuk mendapatkan ikon berdasarkan nama kas
const getIconForAccount = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("keluarga") || lowerName.includes("rumah")) return <HomeIcon size={32} />;
  if (lowerName.includes("it") || lowerName.includes("komputer") || lowerName.includes("tech")) return <Monitor size={32} />;
  if (lowerName.includes("spv") || lowerName.includes("supervisor") || lowerName.includes("psv")) return <ClipboardList size={32} />;
  if (lowerName.includes("kantor") || lowerName.includes("kerja")) return <Briefcase size={32} />;
  if (lowerName.includes("sekolah") || lowerName.includes("pendidikan") || lowerName.includes("kuliah")) return <GraduationCap size={32} />;
  if (lowerName.includes("mobil") || lowerName.includes("motor") || lowerName.includes("kendaraan")) return <Car size={32} />;
  if (lowerName.includes("belanja") || lowerName.includes("toko")) return <ShoppingBag size={32} />;
  return <CircleDollarSign size={32} />;
};

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
    
  if (lowerName.includes("sekolah") || lowerName.includes("pendidikan") || lowerName.includes("kuliah")) 
    return "bg-orange-50 text-orange-600 group-hover:bg-orange-100 group-hover:text-orange-700 border-orange-100/50";
    
  if (lowerName.includes("mobil") || lowerName.includes("motor") || lowerName.includes("kendaraan")) 
    return "bg-purple-50 text-purple-600 group-hover:bg-purple-100 group-hover:text-purple-700 border-purple-100/50";
    
  if (lowerName.includes("belanja") || lowerName.includes("toko")) 
    return "bg-pink-50 text-pink-600 group-hover:bg-pink-100 group-hover:text-pink-700 border-pink-100/50";
    
  return "bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-700 border-slate-200/50";
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
          <div className="flex flex-col items-center justify-center py-12 animate-pulse">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <Wallet size={36} className="text-emerald-500" />
            </div>
            <p className="text-sm text-slate-400 font-semibold uppercase tracking-widest">Membuka Brankas...</p>
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
