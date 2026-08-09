"use client";

import { useState, useEffect } from "react";
import { Settings, HelpCircle, LogOut, Heart, UserCircle, Bell, KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
  const [phone, setPhone] = useState<string | null>("Memuat...");
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinMessage, setPinMessage] = useState<{text: string, type: "success" | "error"} | null>(null);
  const [loadingPin, setLoadingPin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && user.email) {
        // Tampilkan hanya nomor HP, buang bagian hp_ dan @kaskeluarga.com
        const phoneOnly = user.email.replace("hp_", "").replace("@kaskeluarga.com", "");
        setPhone(phoneOnly);
      } else {
        setPhone("Tidak ada nomor");
      }
    });
  }, []);

  const handleLogout = async () => {
    if (!window.confirm("Apakah Anda yakin ingin keluar dari aplikasi?")) return;
    
    await supabase.auth.signOut();
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 6) {
      setPinMessage({ text: "PIN harus 6 digit angka.", type: "error" });
      return;
    }

    setLoadingPin(true);
    setPinMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPin });
      if (error) throw error;

      setPinMessage({ text: "PIN berhasil diubah!", type: "success" });
      setTimeout(() => {
        setIsChangingPin(false);
        setNewPin("");
        setPinMessage(null);
      }, 2000);
    } catch (error: any) {
      setPinMessage({ text: error.message || "Gagal mengubah PIN.", type: "error" });
    } finally {
      setLoadingPin(false);
    }
  };

  return (
    <main className="p-6 bg-slate-50 min-h-screen pb-24">
      <header className="mb-8 pt-4">
        <h1 className="text-2xl font-bold text-slate-800">Profil Akun</h1>
      </header>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center mb-8 relative overflow-hidden">
        <div className="absolute top-0 w-full h-24 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-3xl" />
        
        <div className="relative mt-8 mb-4">
          <div className="w-24 h-24 bg-white p-1 rounded-full shadow-lg relative z-10">
            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <UserCircle size={80} strokeWidth={1} />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800">Keluarga Basmalah</h2>
        <p className="text-sm font-medium text-slate-500 mb-6 bg-slate-50 px-4 py-1 rounded-full border border-slate-100">
          {phone}
        </p>

        <div className="flex gap-4 w-full">
          <div className="flex-1 bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</p>
            <p className="font-bold text-emerald-600">Aktif</p>
          </div>
          <div className="flex-1 bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipe</p>
            <p className="font-bold text-emerald-600">Premium</p>
          </div>
        </div>
      </div>

      {/* Ganti PIN Section */}
      <h3 className="font-semibold text-slate-800 mb-4 ml-2">Keamanan</h3>
      <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 mb-8 overflow-hidden transition-all">
        <button 
          onClick={() => setIsChangingPin(!isChangingPin)}
          className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors rounded-2xl text-left"
        >
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <KeyRound size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm">Ubah PIN Rahasia</p>
            <p className="text-xs text-slate-500">Ganti PIN login Anda</p>
          </div>
        </button>

        {isChangingPin && (
          <div className="p-4 pt-2 border-t border-slate-50 mt-2">
            {pinMessage && (
              <div className={`p-3 rounded-xl text-xs font-medium mb-4 ${pinMessage.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                {pinMessage.text}
              </div>
            )}
            <form onSubmit={handleChangePin} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">PIN Baru (6 Digit)</label>
                <input
                  type="password"
                  maxLength={6}
                  inputMode="numeric"
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="------"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 tracking-widest font-bold text-slate-800"
                />
              </div>
              <button 
                type="submit"
                disabled={loadingPin || newPin.length < 6}
                className="h-[46px] px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center shrink-0"
              >
                {loadingPin ? <Loader2 size={18} className="animate-spin" /> : "Simpan"}
              </button>
            </form>
          </div>
        )}
      </div>

      <h3 className="font-semibold text-slate-800 mb-4 ml-2">Lainnya</h3>
      <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 space-y-1 mb-8">
        <button className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors rounded-2xl text-left">
          <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
            <HelpCircle size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm">Pusat Bantuan</p>
            <p className="text-xs text-slate-500">Panduan penggunaan aplikasi</p>
          </div>
        </button>
        <div className="p-4 flex items-center gap-4 bg-slate-50 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
            <Heart size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm">Versi Aplikasi</p>
            <p className="text-xs text-slate-500">v1.1.0 (Login HP & PIN)</p>
          </div>
        </div>
      </div>

      {/* Tombol Logout */}
      <button 
        onClick={handleLogout}
        className="w-full p-4 flex items-center justify-center gap-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl transition-colors"
      >
        <LogOut size={20} />
        Keluar Akun (Logout)
      </button>
    </main>
  );
}
