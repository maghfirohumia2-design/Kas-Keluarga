"use client";

import { useState, useEffect } from "react";
import { Users, X, Loader2, Edit2, Trash2, Check, Shield, User } from "lucide-react";
import { getUsersAction, deleteUserAction, updateUserAction, updateUserRoleAction } from "@/app/actions/admin";
import { supabase } from "@/lib/supabase";
import { AdminUser, UserRole } from "@/types/database";

interface MemberListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemberListModal({ isOpen, onClose }: MemberListModalProps) {
  const [members, setMembers] = useState<AdminUser[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Edit State
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [editMemberName, setEditMemberName] = useState("");
  const [editMemberPhone, setEditMemberPhone] = useState("");
  const [editMemberPin, setEditMemberPin] = useState("");
  const [editMemberRole, setEditMemberRole] = useState<UserRole>("member");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);
    const token = await getAccessToken();
    const res = await getUsersAction(token);
    if (res.success && res.users) {
      setMembers(res.users);
    } else {
      alert(res.error || "Gagal memuat daftar anggota");
    }
    setLoadingMembers(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    async function loadMembers() {
      setLoadingMembers(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await getUsersAction(token);
      if (res.success && res.users) {
        setMembers(res.users);
      }
      setLoadingMembers(false);
    }

    loadMembers();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartEdit = (m: AdminUser) => {
    setEditMemberId(m.id);
    setEditMemberName(m.fullName);
    setEditMemberPhone(m.phone);
    setEditMemberPin("");
    setEditMemberRole(m.role);
  };

  const handleSaveEdit = async (userId: string) => {
    setIsSavingEdit(true);
    const token = await getAccessToken();
    const res = await updateUserAction(token, userId, editMemberPhone, editMemberName, editMemberPin);
    if (res.error) {
      alert(res.error);
    } else {
      if (editMemberRole) {
        await updateUserRoleAction(token, userId, editMemberRole);
      }
      setEditMemberId(null);
      await fetchMembers();
    }
    setIsSavingEdit(false);
  };

  const handleDeleteMember = async (userId: string, memberName: string) => {
    if (confirm(`Yakin ingin menghapus anggota "${memberName}" dari sistem?\n(Catatan transaksi yang pernah dibuat akan tetap aman)`)) {
      setLoadingMembers(true);
      const token = await getAccessToken();
      const res = await deleteUserAction(token, userId);
      if (res.error) {
        alert(res.error);
      } else {
        await fetchMembers();
      }
      setLoadingMembers(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 pb-safe max-h-[90vh] flex flex-col">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>

        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Users className="text-blue-500" size={20} />
            Daftar Anggota Keluarga ({members.length})
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Kelola hak akses, perbarui nama/nomor HP/PIN, atau hapus akses anggota.
        </p>

        {/* Member List Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loadingMembers ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-500 mb-2" size={28} />
              <p className="text-xs font-bold text-slate-400">Memuat anggota...</p>
            </div>
          ) : (
            members.map(m => {
              const isEditingThis = editMemberId === m.id;

              return (
                <div 
                  key={m.id} 
                  className={`p-4 rounded-2xl border transition-all ${
                    isEditingThis ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  {isEditingThis ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          value={editMemberName}
                          onChange={(e) => setEditMemberName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Nomor HP
                          </label>
                          <input
                            type="tel"
                            value={editMemberPhone}
                            onChange={(e) => setEditMemberPhone(e.target.value.replace(/\D/g, ""))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Role Akses
                          </label>
                          <select
                            value={editMemberRole}
                            onChange={(e) => setEditMemberRole(e.target.value as UserRole)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="member">Anggota Biasa</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Reset PIN Baru (Kosongkan jika tidak diubah)
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          value={editMemberPin}
                          onChange={(e) => setEditMemberPin(e.target.value.replace(/\D/g, ""))}
                          placeholder="6 Digit PIN Baru"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-wider"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditMemberId(null)}
                          className="flex-1 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={isSavingEdit || !editMemberName || !editMemberPhone}
                          onClick={() => handleSaveEdit(m.id)}
                          className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-blue-200"
                        >
                          {isSavingEdit ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Simpan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          m.role === 'super_admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {m.role === 'super_admin' ? <Shield size={18} /> : <User size={18} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-slate-800">{m.fullName}</h4>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              m.role === 'super_admin' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {m.role === 'super_admin' ? 'Super Admin' : 'Anggota'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium">{m.phone} • 🎁 {m.points || 0} Poin</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(m)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-colors"
                          title="Edit Anggota"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(m.id, m.fullName)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition-colors"
                          title="Hapus Anggota"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 mt-2">
          <button 
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
