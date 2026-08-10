"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  History,
  AlertCircle,
  Eye,
  EyeOff,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

const getGradientForAccount = (name: string) => {
  if (!name) return "from-emerald-500 to-teal-500";
  const lowerName = name.toLowerCase();
  if (lowerName.includes("keluarga") || lowerName.includes("rumah")) return "from-emerald-500 to-teal-500";
  if (lowerName.includes("kantor") || lowerName.includes("psv") || lowerName.includes("kerja")) return "from-blue-500 to-indigo-500";
  if (lowerName.includes("sekolah") || lowerName.includes("pendidikan") || lowerName.includes("kuliah")) return "from-orange-400 to-red-500";
  if (lowerName.includes("mobil") || lowerName.includes("motor") || lowerName.includes("kendaraan")) return "from-purple-500 to-pink-500";
  if (lowerName.includes("belanja") || lowerName.includes("toko")) return "from-pink-500 to-rose-500";
  return "from-slate-700 to-slate-900";
};

export default function KasDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  const [account, setAccount] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  
  // Budgeting state
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [isSavingBudget, setIsSavingBudget] = useState(false);

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
        .order('created_at', { ascending: false });

      if (!txError && txData) {
        setTransactions(txData);
        
        // Calculate balance & monthly expense
        let currentBalance = 0;
        let currentMonthlyExpense = 0;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        txData.forEach(tx => {
          const amount = Number(tx.amount);
          if (tx.type === 'income') {
            currentBalance += amount;
          } else {
            currentBalance -= amount;
            const txDate = new Date(tx.created_at);
            if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
              currentMonthlyExpense += amount;
            }
          }
        });
        setBalance(currentBalance);
        setMonthlyExpense(currentMonthlyExpense);
        setBudgetInput(accData.budget_limit ? accData.budget_limit.toLocaleString('id-ID') : "");
      }
      
      setLoading(false);
    }

    fetchData();
  }, [accountId]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBudget(true);
    const newLimit = parseFloat(budgetInput.replace(/\D/g, "")) || 0;
    
    const { error } = await supabase.from('accounts').update({ budget_limit: newLimit }).eq('id', accountId);
    if (!error) {
      setAccount({ ...account, budget_limit: newLimit });
      setShowBudgetModal(false);
    } else {
      alert("Gagal menyimpan target budget");
    }
    setIsSavingBudget(false);
  };

  // Filter transaksi berdasarkan rentang tanggal
  const filteredTxList = transactions.filter(tx => {
    const txDate = tx.created_at.split('T')[0];
    if (filterStartDate && txDate < filterStartDate) return false;
    if (filterEndDate && txDate > filterEndDate) return false;
    return true;
  });

  // Kelompokkan transaksi berdasarkan tanggal
  const groupedTransactions = filteredTxList.reduce((groups: any, tx: any) => {
    const dateStr = new Date(tx.created_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(tx);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-75"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white animate-bounce">
              <Wallet size={36} className="text-white" />
            </div>
          </div>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] animate-pulse">Mengambil Data...</p>
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

  const gradient = getGradientForAccount(account.name);

  return (
    <main className="min-h-screen bg-slate-50 pb-24 relative overflow-x-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between p-6 pt-8 text-slate-800 relative z-10">
        <button onClick={() => router.push('/')} className="w-10 h-10 bg-white border border-slate-200 hover:bg-slate-100 shadow-sm rounded-full flex items-center justify-center transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg text-center flex-1 line-clamp-1">{account.name}</h1>
        <button onClick={() => setShowBudgetModal(true)} className="text-[10px] sm:text-xs font-bold text-slate-600 bg-white shadow-sm px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
          Target
        </button>
      </nav>

      {/* Saldo Card */}
      <div className="px-6 relative z-10 mt-2 mb-8">
        <div className={`bg-gradient-to-br ${gradient} rounded-[28px] p-5 shadow-xl shadow-emerald-500/20 flex flex-col text-white`}>
          <div className="flex items-center justify-between w-full gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-inner border border-white/20 shrink-0">
              <Wallet size={24} />
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <h2 className="text-[15px] font-medium tracking-widest truncate text-right opacity-95">
                {showBalance ? `Rp ${balance.toLocaleString('id-ID')}` : 'Rp •••••••••'}
              </h2>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors active:scale-95 bg-white/10"
              >
                {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>

          {/* Budget Progress (if exists) */}
          {account.budget_limit > 0 && (
            <div className="w-full bg-white/10 rounded-2xl p-4 mt-4">
              <div className="flex justify-between text-xs font-medium text-white/90 mb-2">
                <span>Pengeluaran Bulan Ini</span>
                <span>Rp {monthlyExpense.toLocaleString('id-ID')} / Rp {Number(account.budget_limit).toLocaleString('id-ID')}</span>
              </div>
              <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    (monthlyExpense / account.budget_limit) > 0.85 ? 'bg-red-400' : (monthlyExpense / account.budget_limit) > 0.6 ? 'bg-orange-400' : 'bg-emerald-300'
                  }`}
                  style={{ width: `${Math.min((monthlyExpense / account.budget_limit) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Riwayat Khusus */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-1.5 shrink-0">
            <History size={18} className="text-emerald-500" />
            <span className="hidden sm:inline">Riwayat</span>
          </h3>
          <div className="flex items-center gap-1.5">
            <input 
              type="date" 
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:border-emerald-500 shadow-sm w-[90px] sm:w-[110px]"
            />
            <span className="text-[9px] text-slate-400 font-black uppercase">s/d</span>
            <input 
              type="date" 
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none focus:border-emerald-500 shadow-sm w-[90px] sm:w-[110px]"
            />
          </div>
        </div>

        <div className="space-y-5">
          {Object.keys(groupedTransactions).map((date) => (
            <div key={date}>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                {date}
              </h4>
              <div className="space-y-2.5">
                {groupedTransactions[date].map((tx: any) => (
                  <div 
                    key={tx.id} 
                    onClick={() => setSelectedTx(tx)}
                    className="bg-white px-3 py-2.5 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-colors cursor-pointer"
                  >
                    <div className="flex gap-2.5 items-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner border ${
                        tx.type === 'income' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-colors' 
                          : 'bg-red-50 text-red-500 border-red-100 group-hover:bg-red-500 group-hover:text-white transition-colors'
                      }`}>
                        {tx.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-[13px] line-clamp-1">{tx.description}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {tx.user_name && (
                            <>
                              <span className="text-[9px] text-slate-300">•</span>
                              <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                                👤 {tx.user_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className={`font-bold text-[13px] ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {tx.type === 'income' ? '+' : '-'}Rp {Number(tx.amount).toLocaleString('id-ID')}
                      </p>
                      {tx.receipt_url && (
                        <span className="inline-block mt-0.5 text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-semibold border border-slate-200">
                          Ada Nota
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredTxList.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm mt-4">
              <History size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="font-medium text-slate-600 text-sm">Belum ada transaksi</p>
              <p className="text-xs mt-1">Tidak ada catatan pada periode ini.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Opsi Transaksi */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{selectedTx.description}</h3>
              <p className={`text-2xl font-black mt-2 ${selectedTx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                {selectedTx.type === 'income' ? '+' : '-'}Rp {Number(selectedTx.amount).toLocaleString('id-ID')}
              </p>
            </div>

            <div className="space-y-3">
              <Link 
                href={`/transaksi/edit/${selectedTx.id}?returnTo=/kas/${accountId}`}
                className="w-full py-4 bg-emerald-50 text-emerald-600 font-bold rounded-2xl flex items-center justify-center transition-colors hover:bg-emerald-100"
              >
                Ubah Transaksi
              </Link>
              
              <button 
                onClick={async () => {
                  if (confirm("Yakin ingin menghapus transaksi ini?")) {
                    setIsDeleting(true);
                    const { error } = await supabase.from('transactions').delete().eq('id', selectedTx.id);
                    if (!error) {
                      setTransactions(transactions.filter(t => t.id !== selectedTx.id));
                      const amount = Number(selectedTx.amount);
                      if (selectedTx.type === 'income') setBalance(prev => prev - amount);
                      else setBalance(prev => prev + amount);
                    }
                    setIsDeleting(false);
                    setSelectedTx(null);
                  }
                }}
                disabled={isDeleting}
                className="w-full py-4 bg-red-50 text-red-500 font-bold rounded-2xl flex items-center justify-center transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                {isDeleting ? "Menghapus..." : "Hapus Transaksi"}
              </button>
              
              <button 
                onClick={() => setSelectedTx(null)}
                className="w-full py-4 bg-white text-slate-500 font-bold rounded-2xl border border-slate-200 flex items-center justify-center transition-colors hover:bg-slate-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Atur Budget */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Target Pengeluaran</h2>
            <p className="text-sm text-slate-500 mb-6">Tentukan batas maksimal pengeluaran bulanan untuk kas ini. (Isi 0 jika tidak ada target)</p>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Batas Pengeluaran (Rp)</label>
                <input
                  type="text"
                  value={budgetInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setBudgetInput(val ? Number(val).toLocaleString('id-ID') : "");
                  }}
                  placeholder="Misal: 5.000.000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-bold text-slate-800"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingBudget}
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50"
                >
                  {isSavingBudget ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pb-safe">
        {showFabMenu && (
          <div className="flex flex-col gap-3 items-end animate-in slide-in-from-bottom-5 fade-in duration-200">
            <Link 
              href={`/transaksi/baru?accountId=${accountId}&type=income`}
              className="flex items-center gap-3 bg-white px-5 py-3 rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-bold text-slate-700">Uang Masuk</span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <TrendingUp size={16} />
              </div>
            </Link>
            <Link 
              href={`/transaksi/baru?accountId=${accountId}&type=expense`}
              className="flex items-center gap-3 bg-white px-5 py-3 rounded-full shadow-lg border border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-bold text-slate-700">Uang Keluar</span>
              <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
                <TrendingDown size={16} />
              </div>
            </Link>
          </div>
        )}
        <button
          onClick={() => setShowFabMenu(!showFabMenu)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 ${
            showFabMenu ? "bg-slate-800 rotate-45 shadow-slate-900/20" : "bg-emerald-500 hover:bg-emerald-600 hover:scale-105 shadow-emerald-500/30"
          }`}
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </div>

      {/* Overlay for FAB */}
      {showFabMenu && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" 
          onClick={() => setShowFabMenu(false)}
        />
      )}
    </main>
  );
}
