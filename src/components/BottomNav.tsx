"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListOrdered, User } from "lucide-react";

import Image from "next/image";

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <div className="fixed bottom-0 w-full max-w-[480px] bg-white border-t border-slate-100 px-12 py-3 pb-safe flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-50 print:hidden">
      <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-emerald-600' : 'text-slate-400 opacity-70 hover:opacity-100 transition-opacity'}`}>
        <div className={`relative w-7 h-7 overflow-hidden rounded-lg ${pathname === '/' ? 'shadow-md shadow-emerald-200 ring-2 ring-emerald-500 ring-offset-2' : ''}`}>
          <Image src="/icons/icon_nav_home.jpg" alt="Beranda" fill className="object-cover" />
        </div>
        <span className="text-[10px] font-bold mt-1">Beranda</span>
      </Link>
      
      <Link href="/profil" className={`flex flex-col items-center gap-1 ${pathname === '/profil' ? 'text-emerald-600' : 'text-slate-400 opacity-70 hover:opacity-100 transition-opacity'}`}>
        <div className={`relative w-7 h-7 overflow-hidden rounded-lg ${pathname === '/profil' ? 'shadow-md shadow-blue-200 ring-2 ring-blue-500 ring-offset-2' : ''}`}>
          <Image src="/icons/icon_nav_profile.jpg" alt="Profil" fill className="object-cover" />
        </div>
        <span className="text-[10px] font-bold mt-1">Profil</span>
      </Link>
    </div>
  );
}
