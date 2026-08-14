"use server";

import { createClient } from "@supabase/supabase-js";

// Menggunakan Service Role Key agar punya akses Admin untuk membuat user
// dan mem-bypass Row Level Security (RLS) jika ada.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function createUserAction(phone: string, pin: string, fullName: string) {
  try {
    // Validasi sederhana
    if (!phone || phone.length < 10) return { error: "Nomor HP tidak valid." };
    if (!pin || pin.length !== 6) return { error: "PIN harus 6 digit angka." };
    if (!fullName) return { error: "Nama pengguna harus diisi." };

    const email = `hp_${phone}@kaskeluarga.com`;

    // Cek apakah service key ada
    if (!supabaseServiceKey) {
      return { error: "SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment." };
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: pin,
      email_confirm: true, // Auto confirm
      user_metadata: {
        full_name: fullName,
        role: "user"
      }
    });

    if (error) {
      console.error("Create user error:", error);
      if (error.message.includes("already registered")) {
        return { error: "Nomor HP ini sudah terdaftar." };
      }
      return { error: error.message };
    }

    return { success: true, userId: data.user.id };
  } catch (err: any) {
    console.error("Create user exception:", err);
    return { error: err.message || "Terjadi kesalahan sistem." };
  }
}

export async function getUsersAction() {
  try {
    if (!supabaseServiceKey) return { error: "SUPABASE_SERVICE_ROLE_KEY tidak ditemukan." };
    
    // Auth admin returns users sorted by default
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) return { error: error.message };

    const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
    
    // Format the response nicely
    const users = (data?.users || []).map(u => {
      const phoneOnly = u.email ? u.email.replace("hp_", "").replace("@kaskeluarga.com", "") : "";
      const p = profiles?.find(p => p.id === u.id) || {};
      
      return {
        id: u.id,
        phone: phoneOnly,
        fullName: p.full_name || u.user_metadata?.full_name || "Tanpa Nama",
        role: p.role || 'member',
        points: p.points || 0,
        createdAt: u.created_at
      }
    });

    return { success: true, users };
  } catch (err: any) {
    console.error("Get users exception:", err);
    return { error: err.message || "Terjadi kesalahan sistem saat mengambil data." };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    if (!supabaseServiceKey) return { error: "Service Role Key tidak ditemukan." };
    
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return { error: error.message };
    
    return { success: true };
  } catch (err: any) {
    console.error("Delete user exception:", err);
    return { error: err.message || "Gagal menghapus user." };
  }
}

export async function updateUserAction(userId: string, phone: string, fullName: string, pin?: string) {
  try {
    if (!supabaseServiceKey) return { error: "Service Role Key tidak ditemukan." };
    if (!phone || phone.length < 10) return { error: "Nomor HP tidak valid." };
    if (!fullName) return { error: "Nama pengguna harus diisi." };
    
    const updatePayload: any = {
      email: `hp_${phone}@kaskeluarga.com`,
      user_metadata: { full_name: fullName }
    };
    
    if (pin && pin.length === 6) {
      updatePayload.password = pin;
    }
    
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, updatePayload);
    
    if (error) {
      if (error.message.includes("already registered")) {
        return { error: "Nomor HP ini sudah digunakan anggota lain." };
      }
      return { error: error.message };
    }
    
    return { success: true };
  } catch (err: any) {
    console.error("Update user exception:", err);
    return { error: err.message || "Gagal memperbarui user." };
  }
}

export async function updateUserRoleAction(userId: string, newRole: string) {
  try {
    if (!supabaseServiceKey) return { error: "Service Role Key tidak ditemukan." };
    
    const { error } = await supabaseAdmin.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) return { error: error.message };
    
    return { success: true };
  } catch (err: any) {
    console.error("Update role exception:", err);
    return { error: err.message || "Gagal memperbarui role." };
  }
}
