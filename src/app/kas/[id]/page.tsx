"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  History,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

export default function KasDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  const [account, setAccount] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!accountId) return;
      
      setLoading(true);
      // Fetch account details
      const { data: accData, error: accError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (accError || !accData) {
        setError(true);
        setLoading(false);
        return;
      }
      setAccount(accData);

      // Fetch transactions for this account
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('account_id', accountId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (!txError && txData) {
        setTransactions(txData);
        
        // Calculate balance
        let currentBalance = 0;
        txData.forEach(tx => {
          if (tx.type === 'income') currentBalance += Number(tx.amount);
          else currentBalance -= Number(tx.amount);
        });
        setBalance(currentBalance);
      }
      
      setLoading(false);
    }

    fetchData();
  }, [accountId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-slate-800 mb-2">Kas Tidak Ditemukan</h1>
        <p className="text-sm text-slate-500 mb-6">Menu kas ini mungkin sudah dihapus atau tidak tersedia.</p>
        <button onClick={() => router.push('/')} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold">
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24 relative overflow-x-hidden">
      {/* Background Header */}
      <div className="absolute top-0 left-0 w-full h-64 bg-slate-800 rounded-b-[40px] -z-10" />

      {/* Navbar */}
      <nav className="flex items-center justify-between p-6 pt-8 text-white relative z-10">
        <button onClick={() => router.push('/')} className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg">{account.name}</h1>
        <div className="w-10 h-10"></div> {/* Placeholder for balance alignment */}
      </nav>

      {/* Saldo Card */}
      <div className="px-6 relative z-10 mt-2 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mb-4 shadow-inner border border-slate-200">
            <Wallet size={28} />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Total Saldo</p>
          <h2 className={`text-4xl font-black tracking-tight mb-6 ${balance < 0 ? 'text-red-500' : 'text-slate-800'}`}>
            Rp {balance.toLocaleString('id-ID')}
          </h2>
          
          <div className="flex gap-4 w-full">
            <Link 
              href={`/transaksi/baru?accountId=${accountId}&type=income`}
              className="flex-1 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-100 rounded-2xl py-3 flex flex-col items-center justify-center gap-1"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                <TrendingUp size={16} />
              </div>
              <span className="text-xs font-bold text-emerald-700 mt-1">Uang Masuk</span>
            </Link>
            
            <Link 
              href={`/transaksi/baru?accountId=${accountId}&type=expense`}
              className="flex-1 bg-red-50 hover:bg-red-100 transition-colors border border-red-100 rounded-2xl py-3 flex flex-col items-center justify-center gap-1"
            >
              <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm">
                <TrendingDown size={16} />
              </div>
              <span className="text-xs font-bold text-red-700 mt-1">Uang Keluar</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Riwayat Khusus */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <History size={18} className="text-emerald-500" />
            Riwayat {account.name}
          </h3>
          <span className="text-xs font-medium text-slate-400 bg-slate-200/50 px-2 py-1 rounded-md">
            {transactions.length} Catatan
          </span>
        </div>

        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-colors cursor-pointer">
              <div className="flex gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner border ${
                  tx.type === 'income' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-colors' 
                    : 'bg-red-50 text-red-500 border-red-100 group-hover:bg-red-500 group-hover:text-white transition-colors'
                }`}>
                  {tx.type === 'income' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm line-clamp-1">{tx.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    {new Date(tx.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {tx.type === 'income' ? '+' : '-'}Rp {Number(tx.amount).toLocaleString('id-ID')}
                </p>
                {tx.receipt_url && (
                  <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-semibold border border-slate-200">
                    Ada Nota
                  </span>
                )}
              </div>
            </div>
          ))}

          {transactions.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm mt-4">
              <History size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="font-medium text-slate-600 text-sm">Belum ada transaksi</p>
              <p className="text-xs mt-1">Catat pemasukan atau pengeluaran pertama Anda.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
