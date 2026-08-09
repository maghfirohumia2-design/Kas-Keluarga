"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, HelpCircle, LogOut, Heart, UserCircle, Bell, KeyRound, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ProfilPage() {
  const [phone, setPhone] = useState<string | null>("Memuat...");
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [pinMessage, setPinMessage] = useState<{text: string, type: "success" | "error"} | null>(null);
  const [loadingPin, setLoadingPin] = useState(false);
  const router = useRouter();

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handlePinChange = (index: number, value: string) => {
    const val = value.replace(/\D/g, "").slice(-1);
    
    if (val) {
      const newPin = [...pin];
      newPin[index] = val;
      setPin(newPin);

      // Pindah ke kotak berikutnya
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // Jika kotak terakhir terisi, langsung eksekusi simpan PIN
        const fullPin = newPin.join("");
        if (fullPin.length === 6) {
          executeChangePin(fullPin);
        }
      }
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const newPin = [...pin];
      
      if (pin[index] === "") {
        if (index > 0) {
          newPin[index - 1] = "";
          setPin(newPin);
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        newPin[index] = "";
        setPin(newPin);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length > 0) {
      const newPin = [...pin];
      for (let i = 0; i < pastedData.length; i++) {
        newPin[i] = pastedData[i];
      }
      setPin(newPin);
      
      if (pastedData.length === 6) {
        inputRefs.current[5]?.focus();
        executeChangePin(pastedData);
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const executeChangePin = async (fullPin: string) => {
    setLoadingPin(true);
    setPinMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: fullPin });
      if (error) throw error;

      setPinMessage({ text: "PIN berhasil diubah!", type: "success" });
      setTimeout(() => {
        setIsChangingPin(false);
        setPin(["", "", "", "", "", ""]);
        setPinMessage(null);
      }, 2000);
    } catch (error: any) {
      setPin(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
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
        {!isChangingPin ? (
          <button 
            onClick={() => {
              setIsChangingPin(true);
              setTimeout(() => inputRefs.current[0]?.focus(), 100);
            }}
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
        ) : (
          <div className="p-4 bg-purple-50/50 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="font-bold text-slate-800 text-sm">Masukkan PIN Baru</p>
                <p className="text-[10px] text-slate-500">Ketik 6 digit PIN pengganti</p>
              </div>
              <button 
                onClick={() => {
                  setIsChangingPin(false);
                  setPin(["", "", "", "", "", ""]);
                  setPinMessage(null);
                }}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
              >
                <X size={16} />
              </button>
            </div>

            {pinMessage && (
              <div className={`p-3 rounded-xl text-xs font-medium mb-4 ${pinMessage.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                {pinMessage.text}
              </div>
            )}
            
            <div 
              className="flex justify-between gap-1.5 mb-2"
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
                  disabled={loadingPin}
                  className="w-full aspect-square text-center text-xl font-bold bg-white border border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-slate-800"
                />
              ))}
            </div>

            {loadingPin && (
              <div className="flex items-center justify-center text-purple-600 gap-2 mt-4 mb-2 animate-pulse">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-xs font-semibold">Menyimpan...</span>
              </div>
            )}
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
            <p className="text-xs text-slate-500">v1.2.0 (Login UI ala WA)</p>
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
