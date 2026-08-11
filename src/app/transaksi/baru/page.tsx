"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Upload, Loader2, Lock } from "lucide-react";
import Link from "next/link";

function TransactionFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillAccountId = searchParams.get("accountId");
  const prefillType = searchParams.get("type");

  const [type, setType] = useState<"income" | "expense">((prefillType as "income" | "expense") || "expense");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState(prefillAccountId || "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserName, setCurrentUserName] = useState("Admin");

  useEffect(() => {
    async function fetchAccountsAndUser() {
      const { data } = await supabase.from("accounts").select("*").order("name");
      if (data) {
        setAccounts(data);
        if (!prefillAccountId && data.length > 0) setAccountId(data[0].id);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata?.full_name) {
        setCurrentUserName(user.user_metadata.full_name);
      }
    }
    fetchAccountsAndUser();
  }, [prefillAccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
            .select("amount, created_at, type")
            .eq("account_id", accountId)
            .eq("type", "expense");

          let currentExpenseTotal = 0;
          existingTx?.forEach(tx => {
            const txDate = new Date(tx.created_at);
            if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pilihan Jenis */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${type === "expense" ? "bg-red-500 text-white shadow-md shadow-red-200" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${type === "income" ? "bg-emerald-500 text-white shadow-md shadow-emerald-200" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Pemasukan
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
          {/* Nominal */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nominal</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rp</span>
              <input
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
