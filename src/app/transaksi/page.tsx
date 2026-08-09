import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Plus, Receipt } from "lucide-react";

export const revalidate = 0;

export default async function TransaksiPage() {
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      *,
      accounts ( name )
    `)
    .order('created_at', { ascending: false });

  return (
    <main className="p-6">
      <header className="mb-6 pt-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h1>
          <p className="text-sm text-slate-500">Semua arus kas Anda</p>
        </div>
        <Link href="/transaksi/baru" className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors">
          <Plus size={20} />
        </Link>
      </header>

      <div className="space-y-4 pb-20">
        {transactions?.map((tx) => (
          <div key={tx.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
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
                <a href={tx.receipt_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md">
                  <Receipt size={12} /> Nota
                </a>
              )}
            </div>
          </div>
        ))}

        {(!transactions || transactions.length === 0) && (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm">
            Belum ada transaksi.
          </div>
        )}
      </div>
    </main>
  );
}
