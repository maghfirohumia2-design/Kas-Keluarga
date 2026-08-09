"use client";

import { ArrowDownRight, ArrowUpRight, Receipt, Trash2, Edit2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function TransactionList({ initialTransactions }: { initialTransactions: any[] }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;
    
    setIsDeleting(id);
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      
      // Update state secara lokal agar UI langsung berubah
      setTransactions(transactions.filter(t => t.id !== id));
      router.refresh(); // Refresh server state (saldo dll)
    } catch (error) {
      console.error("Gagal menghapus:", error);
      alert("Terjadi kesalahan saat menghapus transaksi.");
    } finally {
      setIsDeleting(null);
    }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm">
        Belum ada transaksi.
      </div>
    );
  }

  return (
    <>
      {transactions.map((tx) => (
        <div key={tx.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 group relative overflow-hidden">
          {/* Main Transaction Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {tx.type === 'income' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">{tx.description}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{tx.accounts?.name}</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
              </p>
              {tx.receipt_url && (
                <a href={tx.receipt_url} target="_blank" rel="noreferrer" className="text-[10px] font-medium text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors">
                  <Receipt size={10} /> Nota
                </a>
              )}
            </div>
          </div>
          
          {/* Action Buttons (Edit / Delete) */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-50/50 mt-1">
            <Link 
              href={`/transaksi/edit/${tx.id}`}
              className="flex-1 py-2 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg flex items-center justify-center gap-1.5 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <Edit2 size={12} /> Ubah
            </Link>
            <button 
              onClick={() => handleDelete(tx.id)}
              disabled={isDeleting === tx.id}
              className={`flex-1 py-2 text-xs font-medium bg-red-50 text-red-500 rounded-lg flex items-center justify-center gap-1.5 hover:bg-red-100 hover:text-red-600 transition-colors ${isDeleting === tx.id ? 'opacity-50' : ''}`}
            >
              <Trash2 size={12} /> {isDeleting === tx.id ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
