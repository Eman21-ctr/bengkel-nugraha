---
description: Steps to deploy the Next.js application to Vercel
---

# Panduan Deploy ke Vercel 🚀

Ikuti langkah-langkah di bawah ini untuk mengonlinekan aplikasi **Nugraha Bengkel & Kafe** menggunakan Vercel.

## 1. Persiapan GitHub
Pastikan kode terbaru sudah ter-push ke repository GitHub Anda.
```bash
git add .
git commit -m "Siap deploy ke Vercel"
git push origin main
```

## 2. Hubungkan ke Vercel
1. Buka [Vercel Dashboard](https://vercel.com/dashboard).
2. Klik tombol **"Add New"** lalu pilih **"Project"**.
3. Hubungkan akun GitHub Anda (jika belum).
4. Cari repository `bengkel-nugraha` dan klik **"Import"**.

## 3. Konfigurasi Environment Variables (PENTING) 🔑
Sebelum klik Deploy, buka bagian **Environment Variables** di Vercel dan masukkan nilai dari file `.env.local` Anda:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | (Ambil dari `.env.local`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Ambil dari `.env.local`) |

> [!IMPORTANT]
> Tanpa variabel ini, aplikasi tidak akan bisa terhubung ke database Supabase saat sudah online.

## 4. Deploy!
1. Klik tombol **"Deploy"**.
2. Tunggu proses build sekitar 2-3 menit.
3. Setelah selesai, Vercel akan memberikan domain gratis (misal: `bengkel-nugraha.vercel.app`).

## 5. Sinkronisasi Redirect URL (Opsional)
Jika fitur Login bermasalah di versi online, Anda perlu menambahkan URL Vercel ke daftar **Authentication Redirect URL** di dashboard Supabase:
1. Buka [Supabase Dashboard](https://supabase.com/dashboard).
2. Masuk ke **Authentication** > **URL Configuration**.
3. Tambahkan `https://link-aplikasi-anda.vercel.app/auth/callback` ke dalam daftar Site URL atau Redirect URLs.

Selamat! Aplikasi Anda sudah online dan bisa diakses dari mana saja. 🏆
