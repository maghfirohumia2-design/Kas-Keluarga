"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { Gift, Coins, Plus, Loader2 } from "lucide-react";
import { Reward, RewardClaim } from "@/types/database";

export default function RewardsPage() {
  const { profile } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<RewardClaim[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    // Fetch Rewards
    const { data: rData } = await supabase.from("rewards").select("*").order("points_cost", { ascending: true });
    if (rData) setRewards(rData as Reward[]);

    // Fetch Claims
    if (profile?.role === "super_admin") {
      const { data: cData } = await supabase
        .from("reward_claims")
        .select("*, profiles(full_name), rewards(title, points_cost)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (cData) setClaims(cData as RewardClaim[]);
    } else if (profile?.id) {
      const { data: cData } = await supabase
        .from("reward_claims")
        .select("*, rewards(title, icon)")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });
      if (cData) setClaims(cData as RewardClaim[]);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: rData } = await supabase.from("rewards").select("*").order("points_cost", { ascending: true });
      if (rData) setRewards(rData as Reward[]);

      if (profile?.role === "super_admin") {
        const { data: cData } = await supabase
          .from("reward_claims")
          .select("*, profiles(full_name), rewards(title, points_cost)")
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        if (cData) setClaims(cData as RewardClaim[]);
      } else if (profile?.id) {
        const { data: cData } = await supabase
          .from("reward_claims")
          .select("*, rewards(title, icon)")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });
        if (cData) setClaims(cData as RewardClaim[]);
      }
      setLoading(false);
    }
    loadData();
  }, [profile]);

  const handleClaim = async (reward: Reward) => {
    if (!profile) return;
    if (profile.points < reward.points_cost) {
      alert("Poin kamu tidak cukup!");
      return;
    }

    const confirm = window.confirm(`Tukar ${reward.points_cost} poin untuk ${reward.title}?`);
    if (!confirm) return;

    try {
      await supabase.from("reward_claims").insert({
        user_id: profile.id,
        reward_id: reward.id,
        status: "pending"
      });
      alert("Permintaan penukaran terkirim! Tunggu ACC ya.");
      refreshData();
    } catch {
      alert("Gagal menukar poin.");
    }
  };

  const handleApprove = async (claim: RewardClaim) => {
    try {
      const cost = claim.rewards?.points_cost || 0;
      // Potong poin user
      const { data: uData } = await supabase.from("profiles").select("points").eq("id", claim.user_id).single();
      if (uData && uData.points >= cost) {
        await supabase.from("profiles").update({ points: uData.points - cost }).eq("id", claim.user_id);
        await supabase.from("reward_claims").update({ status: "approved" }).eq("id", claim.id);
        refreshData();
      } else {
        alert("Poin user tidak cukup saat ini.");
      }
    } catch (e) {
      console.error("Gagal menyetujui klaim:", e);
    }
  };

  const handleReject = async (claimId: string) => {
    await supabase.from("reward_claims").update({ status: "rejected" }).eq("id", claimId);
    refreshData();
  };

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-pink-500" /></div>;
  }

  return (
    <main className="p-6 pb-24 min-h-screen bg-slate-50">
      <header className="mb-6 pt-4">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-2">
          <Gift className="text-pink-500" />
          Toko Keluarga
        </h1>
        {profile?.role === "member" && (
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white p-4 rounded-2xl shadow-lg shadow-pink-200 mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-pink-100 uppercase tracking-widest">Koin Kamu</p>
              <h2 className="text-3xl font-black">{profile?.points || 0} Poin</h2>
            </div>
            <Coins size={40} className="text-pink-200 opacity-80" />
          </div>
        )}
      </header>

      {profile?.role === "super_admin" && claims.length > 0 && (
        <section className="mb-8">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Permintaan Penukaran Poin
          </h3>
          <div className="space-y-3">
            {claims.map(claim => (
              <div key={claim.id} className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">{claim.profiles?.full_name} minta tukar poin</p>
                  <p className="text-xs text-slate-500 font-bold text-pink-600 mt-1">{claim.rewards?.title} ({claim.rewards?.points_cost} Poin)</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(claim)} className="flex-1 bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs hover:bg-emerald-600 transition-colors">Setujui</button>
                  <button onClick={() => handleReject(claim.id)} className="flex-1 bg-red-50 text-red-600 font-bold py-2 rounded-xl text-xs hover:bg-red-100 transition-colors">Tolak</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {profile?.role === "member" && claims.length > 0 && (
        <section className="mb-8">
          <h3 className="font-bold text-slate-800 mb-3">Status Klaim Saya</h3>
          <div className="space-y-2">
            {claims.map(claim => (
              <div key={claim.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{claim.rewards?.icon}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{claim.rewards?.title}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{new Date(claim.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <div>
                  {claim.status === 'pending' && <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md">Menunggu</span>}
                  {claim.status === 'approved' && <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">Disetujui</span>}
                  {claim.status === 'rejected' && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">Ditolak</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Daftar Hadiah</h3>
          {profile?.role === "super_admin" && (
            <button className="text-xs font-bold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-pink-100 transition-colors">
              <Plus size={14} /> Tambah Hadiah
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {rewards.map(reward => (
            <div key={reward.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:border-pink-200 transition-colors">
              <div className="text-4xl mb-2">{reward.icon}</div>
              <h4 className="text-sm font-bold text-slate-800 line-clamp-2 min-h-[40px]">{reward.title}</h4>
              <div className="bg-pink-50 text-pink-600 text-xs font-black px-3 py-1 rounded-full mt-2 mb-3">
                {reward.points_cost} Poin
              </div>
              {profile?.role === "member" && (
                <button 
                  onClick={() => handleClaim(reward)}
                  className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-pink-600 transition-colors"
                >
                  Tukar
                </button>
              )}
            </div>
          ))}
        </div>
        {rewards.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <Gift size={48} className="mx-auto mb-3 opacity-20" />
            <p>Belum ada hadiah yang ditambahkan.</p>
          </div>
        )}
      </section>

    </main>
  );
}
