"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Phone, Lock, Wallet } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Trik: Mengubah Nomor HP menjadi format email fiktif agar bisa menggunakan fitur bawaan Supabase
    const dummyEmail = `${phone}@kaskeluarga.com`;

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: dummyEmail, password: pin });
        if (error) throw error;
        // AuthProvider akan otomatis mendeteksi perubahan sesi dan mengarahkan ke halaman Beranda
      } else {
        const { error } = await supabase.auth.signUp({ email: dummyEmail, password: pin });
        if (error) throw error;
        setMessage({
          text: "Pendaftaran berhasil! Silakan langsung login.",
          type: "success"
        });
        setIsLogin(true); // Langsung pindahkan ke mode login
      }
    } catch (error: any) {
      if (error.message.includes("Invalid login credentials")) {
        setMessage({ text: "Nomor HP atau PIN salah.", type: "error" });
      } else if (error.message.includes("Password should be at least")) {
        setMessage({ text: "PIN minimal harus 6 karakter.", type: "error" });
      } else {
        setMessage({ text: error.message || "Terjadi kesalahan", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-emerald-500 rounded-b-[40px] -z-10" />

      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-sm w-full mx-auto relative z-10">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <Wallet size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {isLogin ? "Selamat Datang" : "Buat Akun Baru"}
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          Aplikasi Manajemen Kas Keluarga & Lembaga
        </p>

        {message && (
          <div className={`p-3 rounded-xl text-sm font-medium mb-6 ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nomor HP</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="Contoh: 081929991445"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-all text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">PIN Rahasia</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                maxLength={6}
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="6 Digit Angka Rahasia"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold tracking-widest transition-all text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? "Masuk Aplikasi" : "Daftar Akun")}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-slate-500">
          {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setMessage(null); }}
            className="text-emerald-600 hover:underline"
          >
            {isLogin ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </div>
      </div>
    </main>
  );
}
