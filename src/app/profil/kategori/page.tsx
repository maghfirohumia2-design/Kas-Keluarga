"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus, Trash2, Edit2, Loader2, Save, X, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Category } from "@/types/database";

const COLOR_PRESETS = [
  { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", name: "Emerald" },
  { bg: "bg-teal-50 border-teal-200", text: "text-teal-700", name: "Teal" },
  { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", name: "Blue" },
  { bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", name: "Indigo" },
  { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", name: "Purple" },
  { bg: "bg-pink-50 border-pink-200", text: "text-pink-700", name: "Pink" },
  { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", name: "Rose" },
  { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", name: "Orange" },
  { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", name: "Amber" },
  { bg: "bg-slate-100 border-slate-200", text: "text-slate-700", name: "Slate" },
];

export default function KategoriPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("🏷️");
  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [formColorIndex, setFormColorIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const refreshCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("type", { ascending: true })
      .order("name", { ascending: true });
      
    if (data) {
      setCategories(data as Category[]);
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("type", { ascending: true })
        .order("name", { ascending: true });
        
      if (data) {
        setCategories(data as Category[]);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleOpenModal = (cat?: Category) => {
    if (cat) {
      setEditingId(cat.id);
      setFormName(cat.name.replace(cat.icon + " ", "")); // Strip icon if exists in name
      setFormIcon(cat.icon);
      setFormType(cat.type);
      const colorIdx = COLOR_PRESETS.findIndex(c => c.bg === cat.bg_class);
      setFormColorIndex(colorIdx !== -1 ? colorIdx : 0);
    } else {
      setEditingId(null);
      setFormName("");
      setFormIcon("🏷️");
      setFormType("expense");
      setFormColorIndex(0);
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formIcon.trim()) return;
    
    setIsSaving(true);
    const selectedColor = COLOR_PRESETS[formColorIndex];
    const finalName = formName.includes(formIcon) ? formName : `${formIcon} ${formName}`;

    const payload = {
      name: finalName,
      icon: formIcon,
      type: formType,
      bg_class: selectedColor.bg,
      text_class: selectedColor.text,
    };

    try {
      if (editingId) {
        await supabase.from("categories").update(payload).eq("id", editingId);
      } else {
        await supabase.from("categories").insert([payload]);
      }
      await refreshCategories();
      setShowModal(false);
    } catch {
      alert("Gagal menyimpan kategori");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus kategori "${name}"?\n(Transaksi yang sudah menggunakan kategori ini tidak akan terhapus)`)) {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (!error) {
        setCategories(categories.filter(c => c.id !== id));
      } else {
        alert("Gagal menghapus kategori");
      }
    }
  };

  const expenses = categories.filter(c => c.type === "expense");
  const incomes = categories.filter(c => c.type === "income");

  const renderCategoryList = (list: Category[], title: string) => (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
      <h2 className="text-sm font-bold text-slate-800 mb-4">{title}</h2>
      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Belum ada kategori</p>
        ) : (
          list.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${cat.bg_class} ${cat.text_class}`}>
                  {cat.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{cat.name}</p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                    {cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleOpenModal(cat)}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="w-8 h-8 rounded-full bg-white border border-red-100 text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <main className="p-6 pb-24 bg-slate-50 min-h-screen">
      <header className="mb-6 pt-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/profil" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-slate-800">Kategori Transaksi</h1>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors"
        >
          <Plus size={20} />
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      ) : (
        <>
          {renderCategoryList(expenses, "Kategori Pengeluaran")}
          {renderCategoryList(incomes, "Kategori Pemasukan")}
        </>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 pb-safe">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">{editingId ? "Edit Kategori" : "Kategori Baru"}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Jenis</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFormType('expense')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${formType === 'expense' ? 'bg-red-500 text-white border-red-500' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>Pengeluaran</button>
                  <button type="button" onClick={() => setFormType('income')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${formType === 'income' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>Pemasukan</button>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-20">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Ikon</label>
                  <input type="text" value={formIcon} onChange={e => setFormIcon(e.target.value)} maxLength={2} className="w-full px-0 text-center py-3 bg-slate-50 border border-slate-200 rounded-xl text-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nama Kategori</label>
                  <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Contoh: Belanja" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Warna Tema</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormColorIndex(idx)}
                      className={`w-10 h-10 rounded-full border-2 transition-transform flex items-center justify-center ${color.bg} ${color.text} ${formColorIndex === idx ? 'scale-110 shadow-md ring-2 ring-emerald-500 ring-offset-2' : 'hover:scale-105 opacity-80'}`}
                    >
                      {formColorIndex === idx && <CheckCircle size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100">
                <button type="submit" disabled={isSaving} className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
