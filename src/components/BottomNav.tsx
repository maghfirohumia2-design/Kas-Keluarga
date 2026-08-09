"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListOrdered, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <div className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-slate-100 px-6 py-3 pb-safe flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-50">
      <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-emerald-600' : 'text-slate-400'}`}>
        <Home size={24} className={pathname === '/' ? 'fill-emerald-100' : ''} />
        <span className="text-[10px] font-medium">Beranda</span>
      </Link>
      
      <Link href="/transaksi" className={`flex flex-col items-center gap-1 ${pathname === '/transaksi' ? 'text-emerald-600' : 'text-slate-400'}`}>
        <ListOrdered size={24} className={pathname === '/transaksi' ? 'fill-emerald-100' : ''} />
        <span className="text-[10px] font-medium">Transaksi</span>
      </Link>
      
      <Link href="/profil" className={`flex flex-col items-center gap-1 ${pathname === '/profil' ? 'text-emerald-600' : 'text-slate-400'}`}>
        <User size={24} className={pathname === '/profil' ? 'fill-emerald-100' : ''} />
        <span className="text-[10px] font-medium">Profil</span>
      </Link>
    </div>
  );
}
