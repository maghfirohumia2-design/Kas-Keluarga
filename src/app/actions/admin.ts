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
