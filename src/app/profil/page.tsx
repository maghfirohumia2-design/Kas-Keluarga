"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, HelpCircle, LogOut, Heart, UserCircle, Bell, KeyRound, Loader2, X, Camera, Edit2, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createUserAction } from "@/app/actions/admin";

export default function ProfilPage() {
  const [phone, setPhone] = useState<string | null>("Memuat...");
  const [fullName, setFullName] = useState<string>("My Profile");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [pinMessage, setPinMessage] = useState<{text: string, type: "success" | "error"} | null>(null);
  const [loadingPin, setLoadingPin] = useState(false);
  
  // State Admin: Tambah Pengguna
  const [showAddUser, setShowAddUser] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserMessage, setAddUserMessage] = useState<{text: string, type: "success" | "error"} | null>(null);

  const router = useRouter();

  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        if (user.email) {
          const phoneOnly = user.email.replace("hp_", "").replace("@kaskeluarga.com", "");
          setPhone(phoneOnly);
        }
        if (user.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name);
        }
        if (user.user_metadata?.avatar_url) {
          setAvatarUrl(user.user_metadata.avatar_url);
        }
      }
    });
  }, []);

  const handleLogout = async () => {
    if (!window.confirm("Apakah Anda yakin ingin keluar dari aplikasi?")) return;
    await supabase.auth.signOut();
  };

  // --- Profile Edit Logic ---
  const handleSaveProfile = async () => {
    setUploadingImage(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: tempName }
      });
      if (error) throw error;

      // Update transaksi lama yang menggunakan nama lama agar ikut berubah
      if (fullName && fullName !== tempName) {
        await supabase.from("transactions").update({ user_name: tempName }).eq("user_name", fullName);
      }

      setFullName(tempName);
      setIsEditingProfile(false);
    } catch (error) {
      alert("Gagal menyimpan nama.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingImage(true);
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Save to user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
    } catch (error: any) {
      alert("Gagal mengunggah foto: " + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // --- Change PIN Logic ---
  const handlePinChange = (index: number, value: string) => {
    const val = value.replace(/\D/g, "").slice(-1);
    
    if (val) {
      const newPin = [...pin];
      newPin[index] = val;
      setPin(newPin);

      if (index < 5) {
        pinInputRefs.current[index + 1]?.focus();
      } else {
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
          pinInputRefs.current[index - 1]?.focus();
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
        pinInputRefs.current[5]?.focus();
        executeChangePin(pastedData);
      } else {
        pinInputRefs.current[pastedData.length]?.focus();
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
      pinInputRefs.current[0]?.focus();
      setPinMessage({ text: error.message || "Gagal mengubah PIN.", type: "error" });
    } finally {
      setLoadingPin(false);
    }
  };

  // --- Admin: Create User Logic ---
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserLoading(true);
    setAddUserMessage(null);
    try {
      const res = await createUserAction(newPhone, newPin, newFullName);
      if (res.error) {
        setAddUserMessage({ text: res.error, type: "error" });
      } else {
        setAddUserMessage({ text: "Pengguna berhasil ditambahkan!", type: "success" });
        setTimeout(() => {
          setShowAddUser(false);
          setNewPhone("");
          setNewFullName("");
          setNewPin("");
          setAddUserMessage(null);
        }, 2000);
      }
    } catch (err: any) {
      setAddUserMessage({ text: "Terjadi kesalahan sistem, silahkan coba lagi.", type: "error" });
    } finally {
      setAddUserLoading(false);
    }
  };

  return (
    <main className="p-6 bg-slate-50 min-h-screen pb-24 relative overflow-x-hidden">
      <header className="mb-8 pt-4">
        <h1 className="text-2xl font-bold text-slate-800">Profil Akun</h1>
      </header>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center mb-8 relative overflow-hidden">
        <div className="absolute top-0 w-full h-24 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-3xl" />
        
        <div className="relative mt-8 mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-24 h-24 bg-white p-1 rounded-full shadow-lg relative z-10 overflow-hidden">
            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden relative">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <UserCircle size={80} strokeWidth={1} />
              )}
              {/* Overlay saat upload atau hover */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingImage ? <Loader2 className="animate-spin text-white" size={24} /> : <Camera className="text-white" size={24} />}
              </div>
            </div>
          </div>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageUpload}
          />
        </div>

        {isEditingProfile ? (
          <div className="flex flex-col items-center gap-2 mb-4 w-full">
            <input 
              type="text" 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="text-center text-xl font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="Nama Profil"
            />
            <div className="flex gap-2 w-full">
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveProfile}
                disabled={uploadingImage}
                className="flex-1 py-2 bg-emerald-500 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center"
              >
                {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : "Simpan"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-slate-800">{fullName}</h2>
            <button onClick={() => { setTempName(fullName); setIsEditingProfile(true); }} className="text-slate-400 hover:text-emerald-500">
              <Edit2 size={16} />
            </button>
          </div>
        )}
        
        {!isEditingProfile && (
          <p className="text-sm font-medium text-slate-500 mb-6 bg-slate-50 px-4 py-1 rounded-full border border-slate-100">
            {phone}
          </p>
        )}


      </div>

      {/* Admin Section */}
      <h3 className="font-semibold text-slate-800 mb-4 ml-2 flex items-center gap-2">
        Admin Panel
        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full">Pro</span>
      </h3>
      <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 mb-8 overflow-hidden">
        <button 
          onClick={() => setShowAddUser(true)}
          className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors rounded-2xl text-left"
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm">Tambah Anggota</p>
            <p className="text-xs text-slate-500">Buat akun untuk staf atau keluarga</p>
          </div>
        </button>
      </div>

      {/* Ganti PIN Section */}
      <h3 className="font-semibold text-slate-800 mb-4 ml-2">Keamanan</h3>
      <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 mb-8 overflow-hidden transition-all">
        {!isChangingPin ? (
          <button 
            onClick={() => {
              setIsChangingPin(true);
              setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
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
                  ref={(el) => { pinInputRefs.current[idx] = el; }}
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
            <p className="text-xs text-slate-500">v1.4.0 (Admin Panel)</p>
          </div>
        </div>
      </div>

      {/* Tombol Logout */}
      <button 
        onClick={handleLogout}
        className="w-full p-4 flex items-center justify-center gap-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl transition-colors mb-4"
      >
        <LogOut size={20} />
        Keluar Akun (Logout)
      </button>

      {/* Modal Tambah Pengguna Baru */}
      {showAddUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Tambah Anggota</h2>
            <p className="text-xs text-slate-500 mb-6">Buat akun untuk keluarga atau staf Anda.</p>
            
            {addUserMessage && (
              <div className={`p-3 rounded-xl text-xs font-medium mb-4 ${addUserMessage.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                {addUserMessage.text}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Misal: Budi Santoso"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nomor HP</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-medium tracking-wide"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">PIN Login (6 Digit)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Contoh: 123456"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-bold tracking-[0.3em] text-center"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddUser(false); setAddUserMessage(null); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading || newPhone.length < 10 || newPin.length !== 6 || !newFullName}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 flex justify-center items-center"
                >
                  {addUserLoading ? <Loader2 className="animate-spin" size={20} /> : "Buat Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
