import { Settings, HelpCircle, LogOut, Heart, UserCircle, Bell } from "lucide-react";
import Link from "next/link";

export default function ProfilPage() {
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
        <p className="text-sm text-slate-500 mb-6">Akun Bersama Suami & Istri</p>

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

      {/* Menu List */}
      <h3 className="font-semibold text-slate-800 mb-4 ml-2">Pengaturan Umum</h3>
      <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 space-y-1 mb-8">
        
        <button className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors rounded-2xl text-left">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bell size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm">Notifikasi</p>
            <p className="text-xs text-slate-500">Atur pemberitahuan transaksi</p>
          </div>
        </button>

        <button className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors rounded-2xl text-left">
          <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center">
            <Settings size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm">Pengaturan Aplikasi</p>
            <p className="text-xs text-slate-500">Ubah tema & bahasa</p>
          </div>
        </button>

      </div>

      <h3 className="font-semibold text-slate-800 mb-4 ml-2">Lainnya</h3>
      <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 space-y-1">
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
            <p className="text-xs text-slate-500">v1.0.0 (Dibuat dengan ❤️)</p>
          </div>
        </div>
      </div>
      
    </main>
  );
}
