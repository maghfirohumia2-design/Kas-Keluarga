import { supabase } from "@/lib/supabase";
import { Wallet, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function Home() {
  // Fetch data kas dari Supabase
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: true });

  // Fetch semua transaksi untuk menghitung saldo
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('account_id, type, amount');

  // Menghitung saldo tiap kas
  const balances: Record<string, number> = {};
  let totalBalance = 0;

  if (accounts) {
    accounts.forEach(acc => { balances[acc.id] = 0; });
  }
import Image from "next/image";

export default function Home() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [totalBalance, setTotalBalance] = useState(0);
  const [accountsError, setAccountsError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
    });

    fetchData();
  }, []);

  return (
    <main className="p-6">
      <header className="mb-8 pt-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Family</h1>
          <p className="text-sm text-slate-500">Selalu Sehat dan Bahagia</p>
        </div>
        <Link href="/profil" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl shadow-inner border border-slate-200 overflow-hidden relative">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Profil" fill className="object-cover" />
          ) : (
            "👨‍👩‍👧"
          )}
        </Link>
      </header>

      {/* Saldo Total Keseluruhan */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl p-6 text-white shadow-lg shadow-emerald-200 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Wallet size={80} />
        </div>
        <p className="text-emerald-100 text-sm font-medium mb-1">Total Saldo Keseluruhan</p>
        <h2 className="text-3xl font-bold tracking-tight mb-4">Rp {totalBalance.toLocaleString('id-ID')}</h2>
        
        <div className="flex gap-4 relative z-10">
          <Link href="/transaksi/baru?type=income" className="flex-1 bg-white/20 hover:bg-white/30 transition-colors rounded-xl p-3 flex flex-col items-center justify-center gap-1 backdrop-blur-sm cursor-pointer">
            <TrendingUp size={20} className="text-emerald-100" />
            <span className="text-xs font-medium">Pemasukan</span>
          </Link>
          <Link href="/transaksi/baru?type=expense" className="flex-1 bg-white/20 hover:bg-white/30 transition-colors rounded-xl p-3 flex flex-col items-center justify-center gap-1 backdrop-blur-sm cursor-pointer">
            <TrendingDown size={20} className="text-red-200" />
            <span className="text-xs font-medium">Pengeluaran</span>
          </Link>
        </div>
      </div>

      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <ArrowRightLeft size={18} className="text-slate-400" />
        Daftar Kas Anda
      </h3>

      <div className="space-y-4">
        {accountsError && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            Gagal mengambil data dari database. Pastikan kredensial Supabase benar.
          </div>
        )}

        {accounts?.map((account) => (
          <div key={account.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors text-slate-500 rounded-full flex items-center justify-center">
                <Wallet size={24} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800 text-sm">{account.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{account.description || 'Kas'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold text-sm ${balances[account.id] < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                Rp {balances[account.id]?.toLocaleString('id-ID') || 0}
              </p>
            </div>
          </div>
        ))}
        
        {(!accounts || accounts.length === 0) && !accountsError && (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm">
            Belum ada data kas. Pastikan Anda sudah menjalankan script SQL di tabel Supabase Anda.
          </div>
        )}
      </div>
    </main>
  );
}
