"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Upload, Loader2, Lock, Tag, CheckCircle } from "lucide-react";
import Link from "next/link";

function TransactionFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillAccountId = searchParams.get("accountId");
  const prefillType = searchParams.get("type");

  const [type, setType] = useState<"income" | "expense">((prefillType as "income" | "expense") || "expense");
  const [category, setCategory] = useState<string>("");
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState(prefillAccountId || "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserName, setCurrentUserName] = useState("Admin");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: accData } = await supabase.from("accounts").select("*").order("name");
      if (accData) {
        setAccounts(accData);
        if (!prefillAccountId && accData.length > 0) setAccountId(accData[0].id);
      }

      const { data: catData } = await supabase.from("categories").select("*").order("name");
      if (catData) {
        setDbCategories(catData);
        // Set initial category based on type
        const filtered = catData.filter(c => c.type === (prefillType || "expense"));
        if (filtered.length > 0) setCategory(filtered[0].name);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata?.full_name) {
        setCurrentUserName(user.user_metadata.full_name);
      }
    }
    fetchData();
  }, [prefillAccountId]);

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/\D/g, "")) || 0;
    if (numAmount <= 0) {
      alert("Masukkan nominal transaksi yang valid (lebih dari 0)!");
      return;
    }
    if (!accountId) {
      alert("Pilih kas terlebih dahulu!");
      return;
    }
    if (!category) {
      alert("Pilih kategori terlebih dahulu!");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleSaveTransaction = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      const numAmount = parseFloat(amount.replace(/\D/g, "")) || 0;

      // Budget limit warning check for expenses
      if (type === "expense" && accountId) {
        const selectedAccount = accounts.find(a => a.id === accountId);
        if (selectedAccount && Number(selectedAccount.budget_limit) > 0) {
          const budgetLimit = Number(selectedAccount.budget_limit);
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();

          // Fetch current month expenses
          const { data: existingTx } = await supabase
            .from("transactions")
            .select("amount, created_at, type, is_transfer")
            .eq("account_id", accountId)
            .eq("type", "expense");

          let currentExpenseTotal = 0;
          existingTx?.forEach(tx => {
            const txDate = new Date(tx.created_at);
            if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear && !tx.is_transfer) {
              currentExpenseTotal += Number(tx.amount);
            }
          });

          const projectedTotal = currentExpenseTotal + numAmount;
          if (projectedTotal > budgetLimit) {
            const over = projectedTotal - budgetLimit;
            const confirmSave = window.confirm(
              `⚠️ PERINGATAN BUDGET!\n\nPengeluaran ini (Rp ${numAmount.toLocaleString("id-ID")}) akan menyebabkan total pengeluaran bulan ini (Rp ${projectedTotal.toLocaleString("id-ID")}) melebihi target budget Anda (Rp ${budgetLimit.toLocaleString("id-ID")}) sebesar Rp ${over.toLocaleString("id-ID")}.\n\nTetap simpan transaksi ini?`
            );
            if (!confirmSave) {
              setLoading(false);
              return;
            }
          }
        }
      }

      let receipt_url = null;

      // Upload file jika ada
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("receipts")
          .getPublicUrl(filePath);

        receipt_url = publicUrlData.publicUrl;
      }

      // Simpan transaksi
      const { error } = await supabase.from("transactions").insert({
        type,
        account_id: accountId,
        amount: parseFloat(amount.replace(/\D/g, "")),
        description,
        category,
        receipt_url,
        user_name: currentUserName,
      });

      if (error) throw error;

      if (prefillAccountId) {
        router.push(`/kas/${prefillAccountId}`);
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (error) {
      console.error("Gagal menyimpan transaksi:", error);
      alert("Terjadi kesalahan saat menyimpan transaksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 pb-24 bg-slate-50 min-h-screen">
      <header className="mb-6 pt-4 flex items-center gap-4">
        <Link 
          href={prefillAccountId ? `/kas/${prefillAccountId}` : "/"} 
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Catat Transaksi</h1>
      </header>

      <form onSubmit={handleReview} className="space-y-6">
        {/* Pilihan Jenis */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setType("expense");
              const exps = dbCategories.filter(c => c.type === "expense");
              if (exps.length > 0) setCategory(exps[0].name);
            }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${type === "expense" ? "bg-red-500 text-white shadow-md shadow-red-200" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => {
              setType("income");
              const incs = dbCategories.filter(c => c.type === "income");
              if (incs.length > 0) setCategory(incs[0].name);
            }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${type === "income" ? "bg-emerald-500 text-white shadow-md shadow-emerald-200" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Pemasukan
          </button>
        </div>

        {/* Pilihan Kategori (Chip Badges) */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Tag size={14} className="text-emerald-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pilih Kategori</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dbCategories.filter(c => c.type === type).map((cat) => {
              const isSelected = category === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.name);
                    // Frictionless UX: Auto-advance focus to Amount input
                    amountInputRef.current?.focus();
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? type === "income"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200 scale-105"
                        : "bg-red-500 text-white border-red-500 shadow-md shadow-red-200 scale-105"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.name.replace(cat.icon + " ", "")}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
          {/* Nominal */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nominal</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rp</span>
              <input
                ref={amountInputRef}
                type="text"
                inputMode="numeric"
                required
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (!val) {
                    setAmount("");
                  } else {
                    setAmount(parseInt(val, 10).toLocaleString("id-ID"));
                  }
                }}
                placeholder="0"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-lg font-bold text-slate-800 transition-all"
              />
            </div>
          </div>

          {/* Akun/Kas */}
          {prefillAccountId ? (
            <div className="bg-slate-100 p-4 rounded-xl flex items-center gap-3 border border-slate-200">
              <Lock size={16} className="text-slate-400" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kas Terkunci</p>
                <p className="text-sm font-semibold text-slate-700">
                  {accounts.find(a => a.id === accountId)?.name || "Memuat..."}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pilih Kas</label>
              <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 transition-all font-medium appearance-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Keterangan</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Beli token listrik, Terima honor..."
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 transition-all font-medium"
            />
          </div>

          {/* Upload Nota (Opsional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Foto Nota (Opsional)</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-slate-400" />
                <p className="text-sm text-slate-500 font-medium">
                  {file ? file.name : "Ketuk untuk upload foto"}
                </p>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
            type === "income" 
              ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200" 
              : "bg-red-500 hover:bg-red-600 shadow-red-200"
          } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              Menyimpan...
            </>
          ) : (
            "Simpan Transaksi"
          )}
        </button>
      </form>

      {/* Konfirmasi Simpan (Pre-Save Modal) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 pb-safe">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Konfirmasi Transaksi</h2>
              <p className="text-sm text-slate-500 mt-1">Periksa kembali detail sebelum menyimpan</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 mb-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-xs font-semibold text-slate-400 uppercase">Jenis</span>
                <span className={`text-sm font-bold ${type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-xs font-semibold text-slate-400 uppercase">Nominal</span>
                <span className="text-base font-black text-slate-800">Rp {amount}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-xs font-semibold text-slate-400 uppercase">Kategori</span>
                <span className="text-sm font-bold text-slate-700">{category}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-xs font-semibold text-slate-400 uppercase">Kas</span>
                <span className="text-sm font-bold text-slate-700">{accounts.find(a => a.id === accountId)?.name}</span>
              </div>
              <div className="flex justify-between items-start pt-1">
                <span className="text-xs font-semibold text-slate-400 uppercase mt-0.5">Ket</span>
                <span className="text-sm font-medium text-slate-700 text-right max-w-[60%]">{description}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveTransaction}
                disabled={loading}
                className={`flex-1 py-3.5 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                  type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-red-500 hover:bg-red-600 shadow-red-200'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Yakin & Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function BaruTransaksi() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <TransactionFormContent />
    </Suspense>
  );
}
