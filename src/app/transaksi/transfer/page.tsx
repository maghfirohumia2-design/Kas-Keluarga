"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowLeftRight, Loader2 } from "lucide-react";
import Link from "next/link";

function TransferFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillFromId = searchParams.get("fromId");

  const [accounts, setAccounts] = useState<any[]>([]);
  const [fromAccountId, setFromAccountId] = useState(prefillFromId || "");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUserName, setCurrentUserName] = useState("Admin");

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from("accounts").select("*").order("name");
      if (data && data.length > 0) {
        setAccounts(data);
        const initialFrom = prefillFromId || data[0].id;
        setFromAccountId(initialFrom);
        // Find default "to" account different from "from"
        const defaultTo = data.find((a: any) => a.id !== initialFrom)?.id || "";
        setToAccountId(defaultTo);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata?.full_name) {
        setCurrentUserName(user.user_metadata.full_name);
      }
    }
    fetchData();
  }, [prefillFromId]);

  const handleFromChange = (newFromId: string) => {
    setFromAccountId(newFromId);
    if (newFromId === toAccountId) {
      const other = accounts.find((a: any) => a.id !== newFromId);
      if (other) setToAccountId(other.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccountId === toAccountId) {
      alert("Kas asal dan kas tujuan tidak boleh sama!");
      return;
    }

    const numAmount = parseFloat(amount.replace(/\D/g, "")) || 0;
    if (numAmount <= 0) {
      alert("Masukkan nominal transfer yang valid!");
      return;
    }

    setLoading(true);

    try {
      const fromAccount = accounts.find((a) => a.id === fromAccountId);
      const toAccount = accounts.find((a) => a.id === toAccountId);

      const noteText = description ? ` (${description})` : "";

      // 1. Catat pengeluaran di Kas Asal
      const { data: txOut, error: errOut } = await supabase
        .from("transactions")
        .insert({
          account_id: fromAccountId,
          type: "expense",
          amount: numAmount,
          description: `Transfer ke ${toAccount?.name || "Kas lain"}${noteText}`,
          user_name: currentUserName,
          is_transfer: true,
        })
        .select()
        .single();

      if (errOut) throw errOut;

      // 2. Catat pemasukan di Kas Tujuan
      const { data: txIn, error: errIn } = await supabase
        .from("transactions")
        .insert({
          account_id: toAccountId,
          type: "income",
          amount: numAmount,
          description: `Transfer dari ${fromAccount?.name || "Kas lain"}${noteText}`,
          user_name: currentUserName,
          is_transfer: true,
          linked_tx_id: txOut?.id || null,
        })
        .select()
        .single();

      if (errIn) throw errIn;

      // 3. Link txOut back to txIn if txIn created
      if (txOut && txIn) {
        await supabase
          .from("transactions")
          .update({ linked_tx_id: txIn.id })
          .eq("id", txOut.id);
      }

      alert(`✅ Transfer sebesar Rp ${numAmount.toLocaleString("id-ID")} berhasil!`);

      if (prefillFromId) {
        router.push(`/kas/${prefillFromId}`);
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (error: any) {
      console.error("Gagal melakukan transfer:", error);
      alert("Terjadi kesalahan saat melakukan transfer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 pb-24 bg-slate-50 min-h-screen">
      <header className="mb-6 pt-4 flex items-center gap-4">
        <Link
          href={prefillFromId ? `/kas/${prefillFromId}` : "/"}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ArrowLeftRight className="text-blue-500" size={22} />
          Transfer Antar Kas
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
          {/* Kas Asal & Tujuan Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 relative">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Dari Kas (Asal)
              </label>
              <select
                required
                value={fromAccountId}
                onChange={(e) => handleFromChange(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-bold text-sm appearance-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Ke Kas (Tujuan)
              </label>
              <select
                required
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-bold text-sm appearance-none"
              >
                {accounts
                  .filter((acc) => acc.id !== fromAccountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Nominal Transfer
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                Rp
              </span>
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
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-lg font-bold text-slate-800 transition-all"
              />
            </div>
          </div>

          {/* Keterangan Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Catatan / Alasan Transfer (Opsional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Operan saldo mingguan, bayar SPP..."
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-all font-medium text-sm"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg bg-blue-600 hover:bg-blue-700 shadow-blue-200 transition-all flex items-center justify-center gap-2 ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              Memproses Transfer...
            </>
          ) : (
            "Kirim Transfer"
          )}
        </button>
      </form>
    </main>
  );
}

export default function TransferPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <TransferFormContent />
    </Suspense>
  );
}
