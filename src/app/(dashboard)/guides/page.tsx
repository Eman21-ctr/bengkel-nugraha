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
    ArrowLeftIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import clsx from 'clsx'

const guides = [
    {
        id: 'intro',
        title: 'Memulai Aplikasi',
        icon: BookOpenIcon,
        content: (
            <ul className="list-disc ml-5 space-y-2 text-sm text-gray-600">
                <li>Login menggunakan email dan password yang telah didaftarkan.</li>
                <li>Pastikan koneksi internet stabil untuk sinkronisasi data real-time dengan Supabase.</li>
                <li>Pada dashboard utama, Anda akan melihat ringkasan pemasukan hari ini.</li>
            </ul>
        )
    },
    {
        id: 'bengkel',
        title: 'Transaksi Bengkel',
        icon: WrenchScrewdriverIcon,
        content: (
            <ul className="list-disc ml-5 space-y-2 text-sm text-gray-600">
                <li>Buka menu <b>Kasir</b> dan pilih tab <b>Bengkel</b>.</li>
                <li>Input <b>Nomor Polisi</b> kendaraan untuk melacak riwayat servis motor tersebut.</li>
                <li>Pilih <b>Layanan Servis</b> (misal: Ganti Oli, Servis Rutin) dan <b>Sparepart</b> yang digunakan.</li>
                <li>Klik <b>Bayar</b>, pilih metode pembayaran, dan simpan transaksi. Anda bisa mencetak struk jika diperlukan.</li>
            </ul>
        )
    },
    {
        id: 'kafe',
        title: 'Transaksi Kafe',
        icon: ShoppingCartIcon,
        content: (
            <ul className="list-disc ml-5 space-y-2 text-sm text-gray-600">
                <li>Buka menu <b>Kasir</b> dan pilih tab <b>Kafe</b>.</li>
                <li>Pilih item menu (Makanan/Minuman) yang dipesan pelanggan.</li>
                <li>Anda bisa menambah jumlah (QTY) untuk setiap item.</li>
                <li>Selesaikan transaksi dengan menekan tombol <b>Bayar</b> di bagian bawah.</li>
            </ul>
        )
    },
    {
        id: 'inventory',
        title: 'Manajemen Stok (Gudang)',
        icon: CubeIcon,
        content: (
            <ul className="list-disc ml-5 space-y-2 text-sm text-gray-600">
                <li>Menu <b>Gudang/Stok</b> digunakan untuk mengelola data barang.</li>
                <li>Setiap barang memiliki <b>Stok Minimal</b>. Jika stok di bawah angka ini, akan muncul notifikasi "Stok Menipis" di dashboard.</li>
                <li>Gunakan fitur <b>Edit</b> untuk menambah stok barang yang baru masuk (restock).</li>
                <li>Anda bisa mencari barang berdasarkan nama atau kategori.</li>
            </ul>
        )
    },
    {
        id: 'members',
        title: 'Manajemen Member',
        icon: UserGroupIcon,
        content: (
            <ul className="list-disc ml-5 space-y-2 text-sm text-gray-600">
                <li>Daftarkan pelanggan setia sebagai <b>Member</b>.</li>
                <li>Member memudahkan pencarian nama saat transaksi sehingga riwayat belanja mereka terekam dengan baik.</li>
                <li>Cukup input Nama dan Nomor Telepon pelanggan di menu Member.</li>
            </ul>
        )
    },
    {
        id: 'reports',
        title: 'Laporan Keuangan',
        icon: DocumentChartBarIcon,
        content: (
            <ul className="list-disc ml-5 space-y-2 text-sm text-gray-600">
                <li>Buka menu <b>Laporan</b> untuk melihat analisis bisnis Anda.</li>
                <li>Laporan terbagi menjadi <b>Pemasukan Total</b>, <b>Bengkel</b>, dan <b>Kafe</b>.</li>
                <li>Anda bisa memfilter laporan berdasarkan jangka waktu (Hari Ini, Minggu Ini, Bulan Ini).</li>
                <li>Lihat rincian penjualan per item untuk mengetahui menu atau layanan mana yang paling banyak diminati.</li>
            </ul>
        )
    },
    {
        id: 'settings',
        title: 'Pengaturan & Profil',
        icon: Cog6ToothIcon,
        content: (
            <ul className="list-disc ml-5 space-y-2 text-sm text-gray-600">
                <li>Buka menu <b>Setting</b> untuk mengubah nama toko, alamat, dan nomor telepon yang akan muncul di struk.</li>
                <li>Anda juga bisa mengelola daftar <b>Layanan Servis</b> (menambah jasa baru atau mengubah harga jasa).</li>
                <li>Tombol <b>Logout</b> tersedia di bagian atas dashboard untuk keluar dari akun.</li>
            </ul>
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
                    <h1 className="text-xl font-black text-gray-900 leading-none">Panduan Aplikasi</h1>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Manual Penggunaan Fitur</p>
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
                                isOpen ? "max-h-[500px] opacity-100 border-t border-gray-50 bg-slate-50/30" : "max-h-0 opacity-0 pointer-events-none"
                            )}>
                                <div className="p-6">
                                    {guide.content}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Footer Info */}
            <div className="px-6 text-center text-gray-400 mt-8 mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest">Nugraha Bengkel & Kafe v1.0</p>
                <p className="text-[9px] font-medium mt-1">Sistem Manajemen Bisnis Terintegrasi</p>
            </div>
        </div>
    )
}
