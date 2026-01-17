'use client'

import { useState } from 'react'
import {
    ChevronDownIcon,
    BookOpenIcon,
    WrenchScrewdriverIcon,
    ShoppingCartIcon,
    CubeIcon,
    UserGroupIcon,
    DocumentChartBarIcon,
    Cog6ToothIcon,
    ArrowLeftIcon,
    DevicePhoneMobileIcon,
    ClipboardDocumentCheckIcon,
    ShieldCheckIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import clsx from 'clsx'

const guides = [
    {
        id: 'intro',
        title: 'Navigasi & Tampilan',
        icon: DevicePhoneMobileIcon,
        content: (
            <div className="space-y-3 text-sm text-gray-600">
                <p>Aplikasi ini memiliki optimasi tampilan khusus untuk HP dan Desktop.</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li><b>HP:</b> Gunakan Bottom Nav (Home, Kasir, Stok, Setting) untuk akses cepat. Menu tambahan ada di Dashboard.</li>
                    <li><b>Desktop:</b> Sidebar di kiri memberikan akses ke semua fitur secara lengkap.</li>
                    <li><b>Sapaan Personal:</b> Dashboard akan menampilkan nama Anda ("Selamat Pagi, [Nama]") setelah diatur di menu Akun Saya.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'bengkel',
        title: 'Alur Kasir Bengkel',
        icon: WrenchScrewdriverIcon,
        content: (
            <div className="space-y-3 text-sm text-gray-600">
                <p>Kasir Bengkel terintegrasi dengan data Member dan Nopol kendaraan.</p>
                <ol className="list-decimal ml-5 space-y-2">
                    <li>Buka menu <b>Kasir</b>, pastikan Tab aktif adalah <b>Bengkel</b> (Warna Biru).</li>
                    <li><b>Cari Member/Nopol:</b> Masukkan Nama atau Nomor Polisi. Sistem akan menampilkan poin dan jenis kendaraan.</li>
                    <li><b>Layanan & Harga Pintar:</b> Saat memilih Jasa (misal: Cuci), sistem otomatis menggunakan harga sesuai kendaraan member (Motor/Mobil).</li>
                    <li><b>Bayar:</b> Pilih metode bayar (Tunai/QRIS) dan cetak struk.</li>
                </ol>
            </div>
        )
    },
    {
        id: 'users',
        title: 'Manajemen Pengguna (Pegawai)',
        icon: ShieldCheckIcon,
        content: (
            <div className="space-y-3 text-sm text-gray-600">
                <p>Khusus Owner/Admin untuk mengelola akses karyawan.</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li><b>Tambah User:</b> Masuk ke Pengaturan - Pengguna. Input <b>Nama</b> dan <b>No HP</b>. No HP ini digunakan untuk login.</li>
                    <li><b>Peran (Role):</b> Tentukan apakah user sebagai Kasir, Teknisi, atau Admin.</li>
                    <li><b>Nonaktifkan:</b> Jika karyawan resign, ubah statusnya menjadi <b>NONAKTIF</b> agar tidak bisa login lagi. Data riwayat tetap aman.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'account',
        title: 'Akun Saya & Profil',
        icon: UserCircleIcon,
        content: (
            <div className="space-y-3 text-sm text-gray-600">
                <p>Setiap pengguna wajib menjaga keamanan akunnya.</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li><b>Edit Nama:</b> Di menu Akun Saya, klik ikon Pensil untuk ubah nama tampilan (muncul di struk).</li>
                    <li><b>Ganti Password:</b> Klik ikon Kunci untuk mengganti password secara berkala.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'services',
        title: 'Pengaturan Jasa (Harga Dinamis)',
        icon: ShoppingCartIcon,
        content: (
            <div className="space-y-3 text-sm text-gray-600">
                <p>Mengatur harga jasa beda kendaraan.</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Edit Jasa di menu Services.</li>
                    <li>Masuk Tab <b>Harga Per Kendaraan</b>.</li>
                    <li>Input harga khusus untuk R2 (Motor), R3, dan R4 (Mobil).</li>
                </ul>
            </div>
        )
    },
    {
        id: 'inventory',
        title: 'Gudang & Stok Barang',
        icon: CubeIcon,
        content: (
            <div className="space-y-3 text-sm text-gray-600">
                <p>Pusat kontrol logistik bengkel dan kafe.</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li><b>Tambah Barang:</b> Masukkan nama, kategori, harga beli (HPP), harga jual, dan stok awal.</li>
                    <li><b>Stok Menipis:</b> Barang dengan stok di bawah <b>Min. Stok</b> akan otomatis muncul di Dashboard.</li>
                </ul>
            </div>
        )
    }
]

export default function GuidePage() {
    const [openId, setOpenId] = useState<string | null>('intro')

    const toggle = (id: string) => {
        setOpenId(openId === id ? null : id)
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <div className="bg-white border-b border-gray-100 p-6 flex items-center gap-4 sticky top-0 z-20">
                <Link href="/" className="bg-gray-50 p-2 rounded-xl text-gray-400 hover:text-primary transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-black text-gray-900 leading-none">Buku Panduan</h1>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Manual Operasional Aplikasi</p>
                </div>
            </div>

            <div className="p-6 space-y-4 max-w-2xl mx-auto">
                {guides.map((guide) => {
                    const isOpen = openId === guide.id
                    return (
                        <div
                            key={guide.id}
                            className={clsx(
                                "bg-white rounded-[24px] border transition-all duration-300 overflow-hidden",
                                isOpen ? "border-primary shadow-lg shadow-blue-100/50" : "border-gray-100 shadow-sm"
                            )}
                        >
                            <button
                                onClick={() => toggle(guide.id)}
                                className="w-full flex items-center justify-between p-5 text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                        isOpen ? "bg-primary text-white" : "bg-blue-50 text-primary"
                                    )}>
                                        <guide.icon className="w-5 h-5" />
                                    </div>
                                    <span className={clsx(
                                        "font-extrabold uppercase tracking-tight text-sm",
                                        isOpen ? "text-primary" : "text-gray-700"
                                    )}>{guide.title}</span>
                                </div>
                                <ChevronDownIcon className={clsx(
                                    "w-5 h-5 text-gray-400 transition-transform duration-300",
                                    isOpen && "rotate-180 text-primary"
                                )} />
                            </button>

                            <div className={clsx(
                                "transition-all duration-300 ease-in-out",
                                isOpen ? "max-h-[800px] opacity-100 border-t border-gray-50 bg-slate-50/30" : "max-h-0 opacity-0 pointer-events-none"
                            )}>
                                <div className="p-6">
                                    {guide.content}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="px-6 text-center text-gray-400 mt-8 mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest">Nugraha Bengkel & Kafe v1.0</p>
                <p className="text-[9px] font-medium mt-1">Didesain khusus untuk operasional harian terpadu</p>
            </div>
        </div>
    )
}
