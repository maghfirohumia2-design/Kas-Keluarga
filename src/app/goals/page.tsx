"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { Target, Plus, Loader2, ArrowRight, Wallet } from "lucide-react";

export default function GoalsPage() {
  const { profile } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    const { data } = await supabase.from("family_goals").select("*").order("created_at", { ascending: false });
    if (data) setGoals(data);
    setLoading(false);
  };

  const handleContributeClick = (goal: any) => {
    setSelectedGoal(goal);
    setAmount("");
    setShowContributeModal(true);
  };

  const submitContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    
    setIsSubmitting(true);
    try {
      const numAmount = Number(amount);
      const newTotal = selectedGoal.current_amount + numAmount;
      
      // Update goal
      await supabase.from("family_goals").update({ current_amount: newTotal }).eq("id", selectedGoal.id);
      
      // Bonus poin untuk member yang nyumbang
      if (profile?.role === "member") {
        // Misal nyumbang Rp 10.000 dapat 10 poin
        const bonusPoints = Math.floor(numAmount / 1000);
        await supabase.from("profiles").update({ points: profile.points + bonusPoints }).eq("id", profile.id);
        alert(`Terima kasih sudah patungan! Kamu dapat bonus ${bonusPoints} Poin!`);
      } else {
        alert("Berhasil menambahkan dana patungan!");
      }
      
      setShowContributeModal(false);
      fetchGoals();
    } catch (e) {
      alert("Gagal memproses patungan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCairkan = async (goal: any) => {
    if (goal.current_amount <= 0) {
      alert("Dana patungan masih kosong.");
      return;
    }
    const confirm = window.confirm(`Cairkan dana Rp ${goal.current_amount.toLocaleString('id-ID')} dari patungan ${goal.title}?`);
    if (!confirm) return;

    try {
      await supabase.from("family_goals").update({ current_amount: 0 }).eq("id", goal.id);
      alert("Dana berhasil dicairkan (ditarik) oleh Super Admin.");
      fetchGoals();
    } catch (e) {
      alert("Gagal mencairkan dana.");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-orange-500" /></div>;
  }

  return (
    <main className="p-6 pb-24 min-h-screen bg-slate-50">
      <header className="mb-6 pt-4 flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Target className="text-orange-500" />
          Patungan Impian
        </h1>
        {profile?.role === "super_admin" && (
          <button className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-orange-100 transition-colors">
            <Plus size={14} /> Buat
          </button>
        )}
      </header>

      <div className="space-y-5">
        {goals.map(goal => {
          const progress = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
          return (
            <div key={goal.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-50 text-2xl flex items-center justify-center rounded-2xl shadow-inner border border-orange-100">
                    {goal.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{goal.title}</h3>
                    <p className="text-xs font-medium text-slate-400">Terkumpul Rp {goal.current_amount.toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Target</p>
                  <p className="text-sm font-black text-slate-800">Rp {goal.target_amount.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-5 relative z-10">
                <div className="flex justify-between text-[11px] font-bold mb-1.5">
                  <span className="text-orange-600">{progress}% Tercapai</span>
                  <span className="text-slate-400">Sisa Rp {(goal.target_amount - goal.current_amount).toLocaleString('id-ID')}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] opacity-30"></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 relative z-10">
                <button 
                  onClick={() => handleContributeClick(goal)}
                  className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Wallet size={14} /> Ikut Patungan
                </button>
                {profile?.role === "super_admin" && (
                  <button 
                    onClick={() => handleCairkan(goal)}
                    className="flex-1 py-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    Cairkan Dana <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <Target size={48} className="mx-auto mb-3 opacity-20" />
            <p>Belum ada target patungan.</p>
          </div>
        )}
      </div>

      {/* Modal Patungan */}
      {showContributeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 pb-safe">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            
            <h2 className="text-xl font-bold text-slate-800 mb-2">Ikut Patungan</h2>
            <p className="text-sm text-slate-500 mb-6">Pindahkan sisa uang jajanmu ke <span className="font-bold text-orange-600">{selectedGoal?.title}</span></p>

            <form onSubmit={submitContribution}>
              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowContributeModal(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 text-white font-bold bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Transfer Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
