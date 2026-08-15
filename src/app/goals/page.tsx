"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { 
  Target, 
  Plus, 
  Loader2, 
  Wallet, 
  ArrowRight, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Banknote, 
  X,
  Trophy
} from "lucide-react";
import { FamilyGoal, Account } from "@/types/database";

const PRESET_ICONS = ["🎯", "🏖️", "🎮", "🚗", "📱", "🐮", "🏠", "🚲", "💻", "🎒", "✈️", "👟"];

export default function GoalsPage() {
  const { profile } = useAuth();
  const [goals, setGoals] = useState<FamilyGoal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State: Tambah / Edit Target
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FamilyGoal | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalIcon, setGoalIcon] = useState("🎯");
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  // Modal State: Ikut Patungan
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FamilyGoal | null>(null);
  const [amount, setAmount] = useState("");
  const [sourceType, setSourceType] = useState<"account" | "cash">("account");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State: Cairkan Dana
  const [showCairkanModal, setShowCairkanModal] = useState(false);
  const [cairkanGoal, setCairkanGoal] = useState<FamilyGoal | null>(null);
  const [cairkanDestination, setCairkanDestination] = useState<"account" | "cash">("account");
  const [cairkanAccountId, setCairkanAccountId] = useState("");
  const [isCairkanLoading, setIsCairkanLoading] = useState(false);

  const refreshData = async () => {
    const { data: gData } = await supabase.from("family_goals").select("*").order("created_at", { ascending: false });
    if (gData) setGoals(gData as FamilyGoal[]);

    const { data: aData } = await supabase.from("accounts").select("*").order("name", { ascending: true });
    if (aData) {
      const accList = aData as Account[];
      setAccounts(accList);
      if (accList.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accList[0].id);
        setCairkanAccountId(accList[0].id);
      }
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: gData } = await supabase.from("family_goals").select("*").order("created_at", { ascending: false });
      if (gData) setGoals(gData as FamilyGoal[]);

      const { data: aData } = await supabase.from("accounts").select("*").order("name", { ascending: true });
      if (aData) {
        const accList = aData as Account[];
        setAccounts(accList);
        if (accList.length > 0) {
          setSelectedAccountId(accList[0].id);
          setCairkanAccountId(accList[0].id);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // --- Handlers Buat / Edit Goal ---
  const handleOpenCreateGoal = () => {
    setEditingGoal(null);
    setGoalTitle("");
    setGoalTarget("");
    setGoalIcon("🎯");
    setShowGoalModal(true);
  };

  const handleOpenEditGoal = (goal: FamilyGoal) => {
    setEditingGoal(goal);
    setGoalTitle(goal.title);
    setGoalTarget(goal.target_amount.toLocaleString("id-ID"));
    setGoalIcon(goal.icon || "🎯");
    setShowGoalModal(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(goalTarget.replace(/\D/g, "")) || 0;
    if (!goalTitle.trim() || numTarget <= 0) {
      alert("Mohon isi judul dan nominal target yang valid!");
      return;
    }

    setIsSavingGoal(true);
    try {
      if (editingGoal) {
        // Update Goal
        const { error } = await supabase
          .from("family_goals")
          .update({
            title: goalTitle.trim(),
            target_amount: numTarget,
            icon: goalIcon
          })
          .eq("id", editingGoal.id);

        if (error) throw error;
        alert("Target patungan berhasil diperbarui!");
      } else {
        // Create Goal
        const { error } = await supabase
          .from("family_goals")
          .insert({
            title: goalTitle.trim(),
            target_amount: numTarget,
            current_amount: 0,
            icon: goalIcon
          });

        if (error) throw error;
        alert("Target patungan baru berhasil dibuat!");
      }

      setShowGoalModal(false);
      refreshData();
    } catch {
      alert("Gagal menyimpan target patungan.");
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleDeleteGoal = async (goal: FamilyGoal) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus target "${goal.title}"?`)) return;

    try {
      const { error } = await supabase.from("family_goals").delete().eq("id", goal.id);
      if (error) throw error;
      alert("Target patungan berhasil dihapus.");
      refreshData();
    } catch {
      alert("Gagal menghapus target.");
    }
  };

  // --- Handlers Ikut Patungan ---
  const handleContributeClick = (goal: FamilyGoal) => {
    setSelectedGoal(goal);
    setAmount("");
    setSourceType("account");
    if (accounts.length > 0) setSelectedAccountId(accounts[0].id);
    setShowContributeModal(true);
  };

  const submitContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const numAmount = parseFloat(amount.replace(/\D/g, "")) || 0;
    if (numAmount <= 0) {
      alert("Masukkan nominal patungan yang valid!");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Jika potong dari Kas/Dompet, buat transaksi pengeluaran
      if (sourceType === "account") {
        if (!selectedAccountId) {
          alert("Pilih kas asal yang akan dipotong!");
          setIsSubmitting(false);
          return;
        }

        const { error: txError } = await supabase.from("transactions").insert({
          account_id: selectedAccountId,
          type: "expense",
          amount: numAmount,
          description: `Patungan Impian: ${selectedGoal.title}`,
          category: "🎯 Patungan Impian",
          user_name: profile?.full_name || "Anggota",
          is_transfer: false
        });

        if (txError) throw txError;
      }

      // 2. Tambah nominal terkumpul di family_goals
      const newTotal = selectedGoal.current_amount + numAmount;
      const { error: goalError } = await supabase
        .from("family_goals")
        .update({ current_amount: newTotal })
        .eq("id", selectedGoal.id);

      if (goalError) throw goalError;

      // 3. Tambah reward poin untuk member (Rp 1.000 = 1 poin)
      if (profile && profile.role === "member") {
        const bonusPoints = Math.floor(numAmount / 1000);
        if (bonusPoints > 0) {
          await supabase
            .from("profiles")
            .update({ points: (profile.points || 0) + bonusPoints })
            .eq("id", profile.id);
          alert(`🎉 Hebat! Patungan Rp ${numAmount.toLocaleString("id-ID")} berhasil dicatat. Kamu mendapatkan +${bonusPoints} Poin Reward!`);
        } else {
          alert(`✅ Patungan Rp ${numAmount.toLocaleString("id-ID")} berhasil dicatat!`);
        }
      } else {
        alert(`✅ Patungan Rp ${numAmount.toLocaleString("id-ID")} berhasil dicatat!`);
      }

      setShowContributeModal(false);
      refreshData();
    } catch {
      alert("Gagal memproses patungan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handlers Pencairan Dana ---
  const handleOpenCairkan = (goal: FamilyGoal) => {
    if (goal.current_amount <= 0) {
      alert("Dana patungan ini masih kosong (Rp 0).");
      return;
    }
    setCairkanGoal(goal);
    setCairkanDestination("account");
    if (accounts.length > 0) setCairkanAccountId(accounts[0].id);
    setShowCairkanModal(true);
  };

  const submitPencairan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cairkanGoal || cairkanGoal.current_amount <= 0) return;

    setIsCairkanLoading(true);
    try {
      const cairkanAmount = cairkanGoal.current_amount;

      // Jika disetor ke Kas/Dompet, catat transaksi pemasukan
      if (cairkanDestination === "account") {
        if (!cairkanAccountId) {
          alert("Pilih kas tujuan penyetoran!");
          setIsCairkanLoading(false);
          return;
        }

        const { error: txError } = await supabase.from("transactions").insert({
          account_id: cairkanAccountId,
          type: "income",
          amount: cairkanAmount,
          description: `Pencairan Patungan: ${cairkanGoal.title}`,
          category: "🎯 Patungan Impian",
          user_name: profile?.full_name || "Super Admin",
          is_transfer: false
        });

        if (txError) throw txError;
      }

      // Reset saldo patungan menjadi 0
      const { error: goalError } = await supabase
        .from("family_goals")
        .update({ current_amount: 0 })
        .eq("id", cairkanGoal.id);

      if (goalError) throw goalError;

      alert(`✅ Dana patungan sebesar Rp ${cairkanAmount.toLocaleString("id-ID")} berhasil dicairkan!`);
      setShowCairkanModal(false);
      refreshData();
    } catch {
      alert("Gagal mencairkan dana patungan.");
    } finally {
      setIsCairkanLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50">
        <Loader2 className="animate-spin text-orange-500 mb-3" size={36} />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Patungan...</p>
      </div>
    );
  }

  return (
    <main className="p-6 pb-28 min-h-screen bg-slate-50">
      {/* Header */}
      <header className="mb-6 pt-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Target className="text-orange-500" />
            Patungan Impian
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Kumpulkan dana bersama untuk tujuan keluarga</p>
        </div>
        {profile?.role === "super_admin" && (
          <button 
            onClick={handleOpenCreateGoal}
            className="text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-md shadow-orange-200 hover:brightness-105 active:scale-95 transition-all"
          >
            <Plus size={16} /> Buat Target
          </button>
        )}
      </header>

      {/* List Goals */}
      <div className="space-y-5">
        {goals.map(goal => {
          const progress = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
          const isReached = goal.current_amount >= goal.target_amount;
          const sisaNominal = Math.max(0, goal.target_amount - goal.current_amount);

          return (
            <div 
              key={goal.id} 
              className={`bg-white rounded-3xl p-5 border transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-md ${
                isReached ? 'border-emerald-200 ring-2 ring-emerald-400/20' : 'border-slate-100'
              }`}
            >
              {/* Badge Tercapai */}
              {isReached && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-2xl flex items-center gap-1 shadow-sm">
                  <Trophy size={12} /> Target Tercapai!
                </div>
              )}

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-13 h-13 bg-orange-50 text-2xl flex items-center justify-center rounded-2xl shadow-inner border border-orange-100/80 shrink-0">
                    {goal.icon || "🎯"}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{goal.title}</h3>
                    <p className="text-xs font-semibold text-orange-600">
                      Terkumpul Rp {goal.current_amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {profile?.role === "super_admin" && (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenEditGoal(goal)}
                      className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                      title="Edit Target"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button 
                      onClick={() => handleDeleteGoal(goal)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Hapus Target"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* Target & Sisa Box */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl mb-4 border border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Total</p>
                  <p className="text-sm font-black text-slate-800">Rp {goal.target_amount.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kekurangan</p>
                  <p className={`text-sm font-black ${isReached ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {isReached ? 'Lunas / Penuh' : `Rp ${sisaNominal.toLocaleString('id-ID')}`}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-5 relative z-10">
                <div className="flex justify-between text-[11px] font-bold mb-1.5">
                  <span className={isReached ? "text-emerald-600 flex items-center gap-1" : "text-orange-600"}>
                    {isReached && <Sparkles size={13} />} {progress}% Tercapai
                  </span>
                  <span className="text-slate-400">{progress}% dari 100%</span>
                </div>
                <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                      isReached 
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-sm shadow-emerald-200' 
                        : 'bg-gradient-to-r from-orange-400 via-amber-500 to-rose-500 shadow-sm shadow-orange-200'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 relative z-10">
                <button 
                  onClick={() => handleContributeClick(goal)}
                  className="flex-1 py-3.5 bg-slate-900 text-white font-bold rounded-2xl text-xs hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-slate-200"
                >
                  <Wallet size={15} /> Ikut Patungan
                </button>
                {profile?.role === "super_admin" && (
                  <button 
                    onClick={() => handleOpenCairkan(goal)}
                    className="flex-1 py-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-2xl text-xs hover:bg-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    Cairkan Dana <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target size={32} />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Belum Ada Target Patungan</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6">
              {profile?.role === "super_admin" 
                ? "Mulai buat target impian keluarga seperti liburan, barang idaman, atau tabungan bersama." 
                : "Super Admin belum membuat target patungan saat ini."}
            </p>
            {profile?.role === "super_admin" && (
              <button 
                onClick={handleOpenCreateGoal}
                className="text-xs font-bold text-white bg-orange-500 px-5 py-2.5 rounded-2xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all inline-flex items-center gap-1.5"
              >
                <Plus size={16} /> Buat Target Sekarang
              </button>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: Buat / Edit Target Patungan */}
      {/* ======================================================== */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 pb-safe">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Target className="text-orange-500" size={20} />
                {editingGoal ? "Edit Target Patungan" : "Buat Target Patungan Baru"}
              </h2>
              <button 
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              {/* Judul Target */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Target / Impian
                </label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Contoh: Liburan ke Bali, Beli Kulkas Baru"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                />
              </div>

              {/* Target Nominal */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nominal Target (Rp)
                </label>
                <input
                  type="text"
                  required
                  value={goalTarget}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setGoalTarget(val ? Number(val).toLocaleString("id-ID") : "");
                  }}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                />
              </div>

              {/* Pilihan Icon */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Pilih Ikon Target
                </label>
                <div className="grid grid-cols-6 gap-2 pt-1">
                  {PRESET_ICONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setGoalIcon(ic)}
                      className={`text-2xl p-2 rounded-2xl border transition-all flex items-center justify-center ${
                        goalIcon === ic 
                          ? 'bg-orange-50 border-orange-500 shadow-sm scale-105' 
                          : 'bg-slate-50 border-slate-200 hover:bg-white'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSavingGoal}
                  className="flex-1 py-3.5 text-white font-bold bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-xs flex items-center justify-center shadow-lg shadow-orange-200 disabled:opacity-50"
                >
                  {isSavingGoal ? <Loader2 className="animate-spin" size={18} /> : (editingGoal ? "Simpan Perubahan" : "Buat Target")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Ikut Patungan */}
      {/* ======================================================== */}
      {showContributeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 pb-safe">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>
            
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-black text-slate-800">Ikut Patungan</h2>
              <button 
                type="button"
                onClick={() => setShowContributeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Patungan bersama untuk impian: <span className="font-bold text-orange-600">{selectedGoal?.title}</span>
            </p>

            <form onSubmit={submitContribution} className="space-y-4">
              {/* Input Nominal */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nominal Patungan
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    required
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setAmount(val ? Number(val).toLocaleString("id-ID") : "");
                    }}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Pilihan Sumber Dana */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Sumber Dana Patungan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSourceType("account")}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      sourceType === "account" 
                        ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Wallet size={15} /> Potong Kas/Dompet
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType("cash")}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      sourceType === "cash" 
                        ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Banknote size={15} /> Setor Tunai/Luar Kas
                  </button>
                </div>
              </div>

              {/* Jika Potong Kas, Pilih Kasnya */}
              {sourceType === "account" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Pilih Kas Asal
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Info Bonus Poin */}
              {profile?.role === "member" && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2 text-xs text-amber-800 font-semibold">
                  <Sparkles className="text-amber-500 shrink-0" size={18} />
                  <span>Setiap patungan Rp 1.000 kamu akan mendapatkan 1 Poin Reward Toko Keluarga!</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowContributeModal(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 text-white font-bold bg-orange-500 rounded-2xl text-xs flex items-center justify-center shadow-lg shadow-orange-200 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Transfer Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: Cairkan Dana Patungan */}
      {/* ======================================================== */}
      {showCairkanModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 pb-safe">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>
            
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-black text-slate-800">Cairkan Dana Patungan</h2>
              <button 
                type="button"
                onClick={() => setShowCairkanModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Cairkan dana terkumpul sebesar <span className="font-black text-emerald-600">Rp {cairkanGoal?.current_amount.toLocaleString("id-ID")}</span> dari target <span className="font-bold text-slate-800">{cairkanGoal?.title}</span>.
            </p>

            <form onSubmit={submitPencairan} className="space-y-4">
              {/* Pilihan Tujuan Penyetoran */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tujuan Penyetoran Dana
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCairkanDestination("account")}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      cairkanDestination === "account" 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Wallet size={15} /> Setor ke Kas/Dompet
                  </button>
                  <button
                    type="button"
                    onClick={() => setCairkanDestination("cash")}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      cairkanDestination === "cash" 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Banknote size={15} /> Tarik Tunai
                  </button>
                </div>
              </div>

              {cairkanDestination === "account" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Pilih Kas Tujuan Pemasukan
                  </label>
                  <select
                    value={cairkanAccountId}
                    onChange={(e) => setCairkanAccountId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowCairkanModal(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isCairkanLoading}
                  className="flex-1 py-3.5 text-white font-bold bg-emerald-600 rounded-2xl text-xs flex items-center justify-center shadow-lg shadow-emerald-200 disabled:opacity-50"
                >
                  {isCairkanLoading ? <Loader2 className="animate-spin" size={18} /> : 'Konfirmasi Pencairan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
