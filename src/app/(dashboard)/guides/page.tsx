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
    ClipboardDocumentCheckIcon
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
                <p>Aplikasi ini memiliki optimasi tampilan khusus untuk HP (BCA Style) dan Desktop.</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li><b>HP:</b> Gunakan Bottom Nav (Home, Kasir, Stok, Setting) untuk akses cepat. Menu tambahan ada di Dashboard.</li>
                    <li><b>Desktop:</b> Sidebar di kiri memberikan akses ke semua fitur secara lengkap.</li>
                    <li><b>Header Biru:</b> Di HP, bagian atas menunjukkan Ringkasan Pemasukan hari ini secara real-time.</li>
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
                    <li><b>Cari Member/Nopol:</b> Masukkan Nama atau Nomor Polisi di bagian pencarian. Ini penting untuk mencatat riwayat servis kendaraan.</li>
                    <li><b>Pilih Layanan:</b> Klik icon <b>Servis</b> (Hijau) untuk memilih jasa servis yang dilakukan.</li>
                    <li><b>Pilih Sparepart:</b> Klik item barang dari daftar <b>Gudang</b>. Stok akan otomatis berkurang saat transaksi selesai.</li>
                    <li><b>Gunakan Poin:</b> Jika member punya poin, Anda bisa memasukkan jumlah poin yang ingin digunakan sebagai diskon.</li>
                    <li><b>Proses Bayar:</b> Klik <b>Bayar</b>, input nominal uang, dan simpan. Sistem akan mencatat riwayat ke <b>Stock Movement</b>.</li>
                </ol>
            </div>
        )
    },
    {
        id: 'kafe',
        title: 'Alur Kasir Kafe',
        icon: ShoppingCartIcon,
        content: (
            <div className="space-y-3 text-sm text-gray-600">
                <p>Kasir Kafe didesain untuk transaksi cepat produk makanan/minuman.</p>
                <ol className="list-decimal ml-5 space-y-2">
                    <li>Pindah ke Tab <b>Kafe</b> di menu Kasir.</li>
                    <li>Pilih produk Kafe dari daftar yang muncul. Anda bisa menggunakan <b>Barcode Scanner</b> jika tersedia.</li>
                    <li>Klik item untuk menambah jumlah pesanan (QTY).</li>
                    <li>Selesaikan dengan pembayaran (Tunai atau QRIS).</li>
                </ol>
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
                    <li><b>Stok Menipis:</b> Barang dengan stok di bawah <b>Min. Stok</b> akan otomatis muncul di Dashboard sebagai peringatan.</li>
                    <li><b>Restock:</b> Klik icon <b>Gudang/Plus</b> pada barang untuk menambah stok saat ada barang masuk dari supplier.</li>
                    <li><b>History:</b> Setiap penjualan dan restock terekam di riwayat pergerakan stok.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'reports',
        title: 'Membaca Laporan',
        icon: DocumentChartBarIcon,
        content: (
            <div className="space-y-3 text-sm text-gray-600">
                <p>Analisis performa bisnis Nugraha Bengkel & Kafe.</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li><b>Sales Summary:</b> Melihat total pemasukan kotor dari Bengkel vs Kafe.</li>
                    <li><b>Top Items:</b> Mengetahui sparepart atau menu kafe mana yang paling laku (Best Seller).</li>
                    <li><b>Filter Waktu:</b> Anda bisa melihat laporan Hari Ini, Bulan Ini, atau rentang waktu kustom (Custom Date).</li>
                    <li><b>Poin Member:</b> Memantau penggunaan poin dan loyalitas pelanggan.</li>
                </ul>
            </div>
        )
    },
    {
        id: 'settings',
        title: 'Pengaturan Profil Usaha',
        icon: Cog6ToothIcon,
        content: (
            <div className="space-y-3 text-sm text-gray-600">
                <p>Hub pusat identitas usaha Anda.</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li><b>Profil Usaha:</b> Ubah Nama Usaha, Alamat, dan No. Telepon yang akan tercetak di Struk (Nota).</li>
                    <li><b>Sistem Poin:</b> Atur berapa belanja minimum untuk mendapatkan 1 poin, dan nilai tukar 1 poin rupiahnya.</li>
                    <li><b>Daftar Layanan:</b> Kelola biaya jasa servis motor di menu <b>Services/Layanan</b> (Tambah/Edit Jasa).</li>
                </ul>
            </div>
        )
    },
    {
        id: 'troubleshoot',
        title: 'Masalah & Sinkronisasi',
        icon: ClipboardDocumentCheckIcon,
        content: (
            <div className="space-y-3 text-sm text-gray-600">
                <p>Tips jika aplikasi terasa lambat atau ada kendala.</p>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Aplikasi ini menggunakan teknologi <b>Real-time Sync</b>. Pastikan internet aktif saat menekan tombol Simpan.</li>
                    <li>Jika data tidak muncul setelah diedit, coba <b>Refresh</b> halaman atau Logout dan Login kembali.</li>
                    <li><b>Keamanan:</b> Gunakan password yang kuat dan lakukan Logout jika perangkat digunakan bersama.</li>
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
