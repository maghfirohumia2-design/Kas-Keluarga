"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, HelpCircle, LogOut, Heart, UserCircle, Bell, KeyRound, Loader2, X, Camera, Edit2, Users, Plus, Wallet, Trash2, Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createUserAction, getUsersAction, deleteUserAction, updateUserAction, updateUserRoleAction } from "@/app/actions/admin";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilPage() {
  const { profile } = useAuth();
  const [phone, setPhone] = useState<string | null>("Memuat...");
  const [fullName, setFullName] = useState<string>("My Profile");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  
  // State untuk modal tambah Kas
  const [showAddKas, setShowAddKas] = useState(false);
  const [newKasName, setNewKasName] = useState("");
  const [newKasDesc, setNewKasDesc] = useState("");
  const [isSubmittingKas, setIsSubmittingKas] = useState(false);

  // State untuk modal hapus Kas
  const [showEditKasModal, setShowEditKasModal] = useState(false);
  const [selectedKasToEdit, setSelectedKasToEdit] = useState("");
  const [editKasName, setEditKasName] = useState("");
  const [isEditingKasLoading, setIsEditingKasLoading] = useState(false);
  const [editKasMessage, setEditKasMessage] = useState<{text: string, type: "error"|"success"}|null>(null);

  // State untuk modal hapus Kas
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedKasToDelete, setSelectedKasToDelete] = useState<string>("");
  const [deletePin, setDeletePin] = useState("");
  const [isDeletingKasLoading, setIsDeletingKasLoading] = useState(false);
  const [deleteKasMessage, setDeleteKasMessage] = useState<{text: string, type: "error"|"success"}|null>(null);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinStep, setPinStep] = useState<"old" | "new">("old");
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [oldPin, setOldPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [pinMessage, setPinMessage] = useState<{text: string, type: "success" | "error"} | null>(null);
  const [loadingPin, setLoadingPin] = useState(false);
  
  // State Admin: Tambah Pengguna
  const [showAddUser, setShowAddUser] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserMessage, setAddUserMessage] = useState<{text: string, type: "success" | "error"} | null>(null);

  // State Admin: Lihat Anggota
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [editMemberName, setEditMemberName] = useState("");
  const [editMemberPhone, setEditMemberPhone] = useState("");
  const [editMemberPin, setEditMemberPin] = useState("");
  const [editMemberRole, setEditMemberRole] = useState("member");

  const router = useRouter();

  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data } = await supabase.from('accounts').select('*').order('created_at', { ascending: true });
      if (data) setAccounts(data);
    };
    fetchAccounts();

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
      if (pinStep === "old") {
        const newPin = [...oldPin];
        newPin[index] = val;
        setOldPin(newPin);
        if (index < 5) pinInputRefs.current[index + 1]?.focus();
        else if (newPin.join("").length === 6) verifyOldPin(newPin.join(""));
      } else {
        const newPin = [...pin];
        newPin[index] = val;
        setPin(newPin);
        if (index < 5) pinInputRefs.current[index + 1]?.focus();
        else if (newPin.join("").length === 6) executeChangePin(newPin.join(""));
      }
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const activeArr = pinStep === "old" ? oldPin : pin;
      const setter = pinStep === "old" ? setOldPin : setPin;
      
      const newPin = [...activeArr];
      if (activeArr[index] === "") {
        if (index > 0) {
          newPin[index - 1] = "";
          setter(newPin);
          pinInputRefs.current[index - 1]?.focus();
        }
      } else {
        newPin[index] = "";
        setter(newPin);
      }
    }
  };

  const verifyOldPin = async (fullPin: string) => {
    setLoadingPin(true);
    setPinMessage(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: `hp_${phone}@kaskeluarga.com`,
        password: fullPin,
      });
      if (error) throw error;
      
      setPinStep("new");
      setPinMessage(null);
      setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
    } catch (error: any) {
      setOldPin(["", "", "", "", "", ""]);
      pinInputRefs.current[0]?.focus();
      setPinMessage({ text: "PIN lama tidak sesuai.", type: "error" });
    } finally {
      setLoadingPin(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length > 0) {
      const setter = pinStep === "old" ? setOldPin : setPin;
      const newPin = ["", "", "", "", "", ""];
      for (let i = 0; i < pastedData.length; i++) {
        newPin[i] = pastedData[i];
      }
      setter(newPin);
      
      if (pastedData.length === 6) {
        pinInputRefs.current[5]?.focus();
        if (pinStep === "old") verifyOldPin(pastedData);
        else executeChangePin(pastedData);
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
        setOldPin(["", "", "", "", "", ""]);
        setPinStep("old");
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

  const handleOpenMembers = async () => {
    setShowMembersModal(true);
    setLoadingMembers(true);
    const res = await getUsersAction();
    if (res.success) {
      setMembers(res.users);
    } else {
      alert(res.error || "Gagal memuat daftar anggota");
    }
    setLoadingMembers(false);
  };

  const handleDeleteMember = async (userId: string, memberName: string) => {
    if (confirm(`Yakin ingin menghapus anggota "${memberName}" dari sistem?\n(Transaksi yang pernah dibuat akan tetap aman)`)) {
      setLoadingMembers(true);
      const res = await deleteUserAction(userId);
      if (res.error) alert(res.error);
      else {
        const refresh = await getUsersAction();
        if (refresh.success) setMembers(refresh.users);
      }
      setLoadingMembers(false);
    }
  };

  const handleSaveEditMember = async (userId: string) => {
    setLoadingMembers(true);
    const res = await updateUserAction(userId, editMemberPhone, editMemberName, editMemberPin);
    if (res.error) {
      alert(res.error);
    } else {
      // Perbarui juga rolenya
      if (editMemberRole) {
        await updateUserRoleAction(userId, editMemberRole);
      }
      setEditMemberId(null);
      const refresh = await getUsersAction();
      if (refresh.success) setMembers(refresh.users);
    }
    setLoadingMembers(false);
  };

  const fetchAccountsList = async () => {
    const { data } = await supabase.from('accounts').select('*').order('created_at', { ascending: true });
    if (data) setAccounts(data);
  };

  const handleAddKas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKasName.trim()) return;
    
    setIsSubmittingKas(true);
    const { error } = await supabase.from('accounts').insert({
      name: newKasName,
      description: newKasDesc
    });

    if (error) {
      alert("Gagal menambahkan Kas. Coba lagi.");
    } else {
      setNewKasName("");
      setNewKasDesc("");
      setShowAddKas(false);
      fetchAccountsList();
    }
    setIsSubmittingKas(false);
  };

  const handleEditKas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKasToEdit || !editKasName.trim()) return;
    
    setIsEditingKasLoading(true);
    setEditKasMessage(null);
    try {
      const { error } = await supabase.from('accounts').update({
        name: editKasName
      }).eq('id', selectedKasToEdit);

      if (error) throw error;

      setEditKasMessage({ text: "Nama Kas berhasil diubah!", type: "success" });
      setTimeout(() => {
        setShowEditKasModal(false);
        setEditKasMessage(null);
        fetchAccountsList();
      }, 1500);
    } catch (err: any) {
      setEditKasMessage({ text: "Gagal mengubah nama Kas.", type: "error" });
    } finally {
      setIsEditingKasLoading(false);
    }
  };

  const handleSecureDeleteKas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKasToDelete || deletePin.length !== 6) return;
    
    setIsDeletingKasLoading(true);
    setDeleteKasMessage(null);
    
    try {
      // Verifikasi PIN
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: `hp_${phone}@kaskeluarga.com`,
        password: deletePin,
      });

      if (authError) {
        throw new Error("PIN yang Anda masukkan salah.");
      }

      // PIN benar, eksekusi hapus
      const kasToDel = accounts.find(a => a.id === selectedKasToDelete);
      
      // Cari dan hapus semua transaksi transfer terkait di kas lain
      const { data: linkedTxs } = await supabase
        .from('transactions')
        .select('linked_tx_id')
        .eq('account_id', selectedKasToDelete)
        .not('linked_tx_id', 'is', null);

      if (linkedTxs && linkedTxs.length > 0) {
        const linkedIds = linkedTxs.map(t => t.linked_tx_id).filter(id => id);
        if (linkedIds.length > 0) {
          await supabase.from('transactions').delete().in('id', linkedIds);
        }
      }

      // Hapus transaksi di kas ini
      await supabase.from('transactions').delete().eq('account_id', selectedKasToDelete);
      // Hapus kas
      const { error: delError } = await supabase.from('accounts').delete().eq('id', selectedKasToDelete);
      
      if (delError) throw delError;

      setDeleteKasMessage({ text: `Kas ${kasToDel?.name} berhasil dihapus!`, type: "success" });
      
      setTimeout(() => {
        setShowDeleteModal(false);
        setSelectedKasToDelete("");
        setDeletePin("");
        setDeleteKasMessage(null);
        fetchAccountsList();
      }, 1500);

    } catch (err: any) {
      setDeleteKasMessage({ text: err.message || "Gagal menghapus Kas.", type: "error" });
    } finally {
      setIsDeletingKasLoading(false);
    }
  };

  return (
    <main className="p-6 bg-slate-50 min-h-screen pb-24 relative overflow-x-hidden">
      <header className="mb-8 pt-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Profil Akun</h1>
        <button 
          onClick={() => {
            setIsChangingPin(true);
            setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
          }}
          className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-purple-100 transition-colors border border-purple-100 shadow-sm"
        >
          <KeyRound size={14} />
          Ubah PIN
        </button>
      </header>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center mb-8 relative overflow-hidden">
        <div className="absolute top-0 w-full h-24 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-3xl flex justify-between items-start p-4">
          <button 
            onClick={handleOpenMembers}
            className="text-white/90 hover:text-white bg-black/10 hover:bg-black/20 px-3 py-1.5 rounded-xl backdrop-blur-sm transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
          >
            <Users size={16} />
            Lihat Anggota
          </button>
          <button 
            onClick={() => setShowAddUser(true)}
            className="text-white/90 hover:text-white bg-black/10 hover:bg-black/20 px-3 py-1.5 rounded-xl backdrop-blur-sm transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
          >
            <Plus size={16} />
            Tambah Anggota
          </button>
        </div>
        
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
          <div className="flex flex-col items-center gap-1.5 mb-2">
            <p className="text-sm font-medium text-slate-500 bg-slate-50 px-4 py-1 rounded-full border border-slate-100">
              {phone}
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${profile?.role === 'super_admin' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                {profile?.role === 'super_admin' ? 'Panglima (Admin)' : 'Prajurit (Member)'}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-pink-100 text-pink-600">
                {profile?.points || 0} Poin
              </span>
            </div>
          </div>
        )}

        <div className="w-full flex gap-3 mt-4 pt-6 border-t border-slate-100">
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="flex-1 py-2.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white font-bold rounded-xl transition-all flex justify-center items-center gap-1.5 border border-red-100 hover:border-red-500 shadow-sm"
          >
            <Trash2 size={16} />
            <span className="text-xs">Hapus</span>
          </button>

          <button 
            onClick={() => setShowEditKasModal(true)}
            className="flex-1 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white font-bold rounded-xl transition-all flex justify-center items-center gap-1.5 border border-blue-100 hover:border-blue-500 shadow-sm"
          >
            <Edit2 size={16} />
            <span className="text-xs">Ubah</span>
          </button>
          
          <button 
            onClick={() => setShowAddKas(true)}
            className="flex-1 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex justify-center items-center gap-1.5 shadow-sm shadow-emerald-200"
          >
            <Plus size={16} />
            <span className="text-xs">Tambah</span>
          </button>
        </div>
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
        <Link href="/profil/kategori" className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors rounded-2xl text-left border-b border-slate-50">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Tag size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm">Kategori Transaksi</p>
            <p className="text-xs text-slate-500">Atur kategori pemasukan & pengeluaran</p>
          </div>
        </Link>
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

      {/* Modal Tambah Kas */}
      {showAddKas && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Tambah Kas Baru</h2>
            <form onSubmit={handleAddKas} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nama Kas</label>
                <input
                  type="text"
                  required
                  value={newKasName}
                  onChange={(e) => setNewKasName(e.target.value)}
                  placeholder="Misal: Kas Tabungan"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Deskripsi (Opsional)</label>
                <input
                  type="text"
                  value={newKasDesc}
                  onChange={(e) => setNewKasDesc(e.target.value)}
                  placeholder="Misal: Tabungan masa depan..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-medium"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddKas(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingKas || !newKasName.trim()}
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50 flex justify-center items-center"
                >
                  {isSubmittingKas ? <Loader2 className="animate-spin" size={20} /> : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Kas */}
      {showEditKasModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Ubah Nama Kas</h2>
            
            {editKasMessage && (
              <div className={`p-3 rounded-xl text-xs font-medium mb-4 ${editKasMessage.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                {editKasMessage.text}
              </div>
            )}

            <form onSubmit={handleEditKas} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pilih Kas</label>
                <select
                  value={selectedKasToEdit}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedKasToEdit(id);
                    const kas = accounts.find(a => a.id === id);
                    if (kas) setEditKasName(kas.name);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-medium"
                  required
                >
                  <option value="" disabled>-- Pilih Kas --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              {selectedKasToEdit && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nama Baru</label>
                  <input
                    type="text"
                    required
                    value={editKasName}
                    onChange={(e) => setEditKasName(e.target.value)}
                    placeholder="Masukkan nama kas baru"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-medium"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowEditKasModal(false); setEditKasMessage(null); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isEditingKasLoading || !selectedKasToEdit || !editKasName}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 flex justify-center items-center"
                >
                  {isEditingKasLoading ? <Loader2 className="animate-spin" size={20} /> : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Kas (Secure Delete) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-red-600 mb-2">Hapus Kas</h2>
            <p className="text-xs text-slate-500 mb-4">
              <span className="font-bold">PERINGATAN:</span> Menghapus Kas akan menghilangkan <span className="font-bold text-red-500">SEMUA</span> riwayat transaksinya secara permanen.
            </p>
            
            {deleteKasMessage && (
              <div className={`p-3 rounded-xl text-xs font-medium mb-4 ${deleteKasMessage.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                {deleteKasMessage.text}
              </div>
            )}

            <form onSubmit={handleSecureDeleteKas} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pilih Kas yang Dihapus</label>
                <select 
                  required
                  value={selectedKasToDelete}
                  onChange={(e) => setSelectedKasToDelete(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 font-medium text-slate-800"
                >
                  <option value="" disabled>-- Pilih Kas --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">PIN Login (6 Digit)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={deletePin}
                  onChange={(e) => setDeletePin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Masukkan PIN"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 font-bold tracking-[0.3em] text-center"
                />
                <p className="text-[10px] text-slate-400 mt-1 text-center">Diperlukan otorisasi untuk menghapus data</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowDeleteModal(false); setDeleteKasMessage(null); setDeletePin(""); setSelectedKasToDelete(""); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isDeletingKasLoading || !selectedKasToDelete || deletePin.length !== 6}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200 disabled:opacity-50 flex justify-center items-center"
                >
                  {isDeletingKasLoading ? <Loader2 className="animate-spin" size={20} /> : "Hapus Permanen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ubah PIN */}
      {isChangingPin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {pinStep === "old" ? "Masukkan PIN Lama" : "Buat PIN Baru"}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {pinStep === "old" ? "Verifikasi keamanan sebelum mengubah PIN" : "Ketik 6 digit PIN pengganti yang baru"}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsChangingPin(false);
                  setPin(["", "", "", "", "", ""]);
                  setOldPin(["", "", "", "", "", ""]);
                  setPinStep("old");
                  setPinMessage(null);
                }}
                className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm shrink-0"
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
              className="flex justify-between gap-2 mb-4"
              onPaste={handlePaste}
            >
              {(pinStep === "old" ? oldPin : pin).map((digit, idx) => (
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
                  className="w-full aspect-square text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:bg-white transition-all text-slate-800"
                />
              ))}
            </div>

            {loadingPin && (
              <div className="flex items-center justify-center text-purple-600 gap-2 mt-4 animate-pulse">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-xs font-semibold">Memverifikasi...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Manajemen Anggota */}
      {showMembersModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-3xl p-6 shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Users size={24} className="text-blue-500" />
                  Daftar Anggota
                </h2>
                <p className="text-xs text-slate-500 mt-1">Kelola data anggota yang terdaftar</p>
              </div>
              <button 
                onClick={() => setShowMembersModal(false)}
                className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-4 custom-scrollbar">
              {loadingMembers && members.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="animate-spin text-blue-500" size={24} />
                </div>
              ) : (
                members.map((m) => (
                  <div key={m.id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl transition-all">
                    {editMemberId === m.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editMemberName}
                          onChange={(e) => setEditMemberName(e.target.value)}
                          placeholder="Nama Lengkap"
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        <div className="flex gap-2">
                          <input
                            type="tel"
                            value={editMemberPhone}
                            onChange={(e) => setEditMemberPhone(e.target.value.replace(/\D/g, ""))}
                            placeholder="Nomor HP"
                            className="w-1/2 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                          <input
                            type="text"
                            maxLength={6}
                            value={editMemberPin}
                            onChange={(e) => setEditMemberPin(e.target.value.replace(/\D/g, ""))}
                            placeholder="PIN Baru (opsional)"
                            className="w-1/2 px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditMemberRole('super_admin')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${editMemberRole === 'super_admin' ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-white text-slate-500 border-slate-200'}`}
                          >
                            Jadikan Admin
                          </button>
                          <button
                            onClick={() => setEditMemberRole('member')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${editMemberRole === 'member' ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-white text-slate-500 border-slate-200'}`}
                          >
                            Jadikan Member
                          </button>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button onClick={() => setEditMemberId(null)} className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-200 rounded-lg hover:bg-slate-300">Batal</button>
                          <button onClick={() => handleSaveEditMember(m.id)} disabled={loadingMembers} className="px-4 py-2 text-xs font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 flex items-center gap-1">
                            {loadingMembers ? <Loader2 size={12} className="animate-spin" /> : "Simpan"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 flex items-center gap-2">
                              {m.fullName}
                            </span>
                            <span className={`text-[10px] font-bold w-fit mt-1 px-1.5 py-0.5 rounded ${m.role === 'super_admin' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                              {m.role === 'super_admin' ? 'Panglima (Admin)' : 'Prajurit (Member)'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm">
                            {m.phone}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-200/60 pt-3 mt-3">
                          <button 
                            onClick={() => {
                              setEditMemberId(m.id);
                              setEditMemberName(m.fullName);
                              setEditMemberPhone(m.phone);
                              setEditMemberPin("");
                              setEditMemberRole(m.role || 'member');
                            }}
                            className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"
                          >
                            <Edit2 size={12} /> Ubah Profil & Role
                          </button>
                          <button 
                            onClick={() => handleDeleteMember(m.id, m.fullName)}
                            className="w-8 h-8 rounded-full bg-white border border-slate-200 text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors shadow-sm"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <button
              onClick={() => setShowMembersModal(false)}
              className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors mt-auto"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
