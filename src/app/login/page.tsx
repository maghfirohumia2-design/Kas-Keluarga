"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Phone, Wallet, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus kotak pertama saat masuk ke langkah 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setMessage({ text: "Nomor HP tidak valid.", type: "error" });
      return;
    }
    setMessage(null);
    setStep(2);
  };

  const handlePinChange = (index: number, value: string) => {
    // Hanya ambil angka terakhir yang diketik (mencegah paste lebih dari 1 jika bukan event paste)
    const val = value.replace(/\D/g, "").slice(-1);
    
    if (val) {
      const newPin = [...pin];
      newPin[index] = val;
      setPin(newPin);

      // Pindah ke kotak berikutnya
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // Jika kotak terakhir terisi, langsung eksekusi login
        const fullPin = newPin.join("");
        if (fullPin.length === 6) {
          executeAuth(fullPin);
        }
      }
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const newPin = [...pin];
      
      if (pin[index] === "") {
        // Jika kosong dan ditekan backspace, pindah ke kiri dan hapus
        if (index > 0) {
          newPin[index - 1] = "";
          setPin(newPin);
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        // Jika ada isinya, hapus isinya saja
        newPin[index] = "";
        setPin(newPin);
      }
    }
  };

  // Support paste 6 digit langsung
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length > 0) {
      const newPin = [...pin];
      for (let i = 0; i < pastedData.length; i++) {
        newPin[i] = pastedData[i];
      }
      setPin(newPin);
      
      // Fokus ke kotak yang tepat atau otomatis login
      if (pastedData.length === 6) {
        inputRefs.current[5]?.focus();
        executeAuth(pastedData);
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const executeAuth = async (fullPin: string) => {
    setLoading(true);
    setMessage(null);

    const dummyEmail = `hp_${phone}@kaskeluarga.com`;

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: dummyEmail, password: fullPin });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email: dummyEmail, password: fullPin });
        if (error) throw error;
        setMessage({ text: "Pendaftaran berhasil! Mengalihkan...", type: "success" });
        // Karena auto-login (session tercipta jika email confirm mati), dia akan ter-redirect oleh AuthProvider.
        // Jika gagal auto-login, ubah state ke mode login
        setIsLogin(true);
        setStep(1);
        setPin(["", "", "", "", "", ""]);
      }
    } catch (error: any) {
      // Bersihkan kotak agar user bisa coba lagi
      setPin(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      if (error.message.includes("Invalid login credentials")) {
        setMessage({ text: "PIN salah atau nomor belum terdaftar.", type: "error" });
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

      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-sm w-full mx-auto relative z-10 transition-all duration-300">
        
        {step === 1 ? (
          // ================= STEP 1: NOMOR HP =================
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
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

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nomor WhatsApp / HP</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-all text-slate-800 text-lg tracking-wide"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={phone.length < 10}
                className="w-full py-4 mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lanjut
              </button>
            </form>

            <div className="mt-8 text-center text-sm font-medium text-slate-500">
              {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setMessage(null); }}
                className="text-emerald-600 hover:underline font-bold"
              >
                {isLogin ? "Daftar di sini" : "Masuk di sini"}
              </button>
            </div>
          </div>

        ) : (
          
          // ================= STEP 2: MASUKKAN PIN =================
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button 
              onClick={() => { setStep(1); setMessage(null); setPin(["", "", "", "", "", ""]); }}
              className="w-10 h-10 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center mb-6 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Masukkan PIN
            </h1>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Ketik 6 digit PIN rahasia Anda untuk nomor <br/>
              <strong className="text-slate-800 tracking-wider">
                {phone.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3")}
              </strong>
            </p>

            {message && (
              <div className={`p-3 rounded-xl text-sm font-medium mb-6 ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                {message.text}
              </div>
            )}

            <div 
              className="flex justify-between gap-2 mb-8"
              onPaste={handlePaste}
            >
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(idx, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-slate-800"
                />
              ))}
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center text-emerald-600 gap-2 mb-4 animate-pulse">
                <Loader2 className="animate-spin" size={24} />
                <span className="text-sm font-semibold">Memproses...</span>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
