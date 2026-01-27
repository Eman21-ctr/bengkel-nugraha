# PANDUAN PENGGUNAAN APLIKASI BENGKEL NUGRAHA (v2026)

Dokumen ini berisi panduan terbaru untuk mengelola Bengkel Nugraha dengan fitur-fitur canggih yang telah disempurnakan.

---

## 1. SISTEM KASIR PINTAR (POS)

Halaman Kasir (`/transactions`) adalah jantung Bengkel Nugraha.

### A. Memulai Transaksi
1. **Identitas Kasir & Nota**: Sistem sekarang otomatis mengingat Nama Kasir dan Catatan Nota terakhir (**Sticky Defaults**). Tidak perlu pilih ulang tiap kali transaksi baru.
2. **Pilih Member**: Cari berdasarkan Nama/Plat/HP. 
   - Jika member dipilih, sistem otomatis melihat **Jenis Kendaraan** member.
   - Jika member tidak lengkap datanya, akan muncul tulisan merah **(DATA TIDAK LENGKAP)**. Segera lengkapi data member di menu Membership.
3. **Pelanggan Umum**: Jika bukan member, saat memilih jasa akan muncul tombol **Pilih Kendaraan** (R2/R3/R4) agar harga akurat.

### B. Menentukan Teknisi & Komisi
Saat menambahkan **Jasa** ke keranjang, klik dropdown **"Petugas: Pilih..."** pada item tersebut untuk memilih siapa teknisi yang mengerjakan. Ini akan mencatat komisi teknisi secara otomatis.

### C. Pembayaran & Poin
- **Tukar Poin**: Jika member punya poin, sistem akan menawarkan potongan harga otomatis.
- **Termin (Cicilan)**: Bos bisa menerima pembayaran 0 (piutang) atau cicilan. Sisa saldo akan tercatat di laporan.

---

## 2. MANAJEMEN JASA & HARGA 12-TIER

Sistem harga sekarang murni berdasarkan jenis dan ukuran kendaraan.

1. **Input Harga Massal**: Saat mendaftarkan jasa baru, isi 12 kotak harga yang tersedia (Matriks R2, R3, R4 dikalikan 4 ukuran: Kecil, Sedang, Besar, Jumbo).
2. **Komisi**: Atur nominal atau persentase komisi tepat di bawah form harga jasa.
3. **Update Jasa Lama**: Jika harga jasa lama muncul Rp 0 di kasir, edit jasa tersebut > Tab **Harga Per Kendaraan** > Klik tombol **SIMPAN HARGA KHUSUS**.

---

## 3. PENGINGAT LAYANAN (AUTOMATIC CRM)

Menu baru **Pengingat** (ikon Lonceng) membantu bos menjaga pelanggan agar tetap setia.

1. **Jadwal Otomatis**: Setiap transaksi selesai, sistem membuat 2 jadwal:
   - **Follow-up (3 Hari)**: Tanya kondisi kendaraan.
   - **Servis Berkala (3 Bulan)**: Ingatkan ganti oli/servis.
2. **Kirim via WhatsApp**: Klik tombol **Kirim WA** di dashboard Pengingat. Pesan manis sudah tersedia otomatis, tinggal klik 'Send' di WhatsApp.

---

## 4. INVENTORY & STOK OPNAME

Kelola stok barang (Oli, Sparepart, dll) dengan lebih akurat.

1. **Satuan Lengkap**: Tersedia satuan baru: **Jerigen, Cup, Drum**.
2. **Penyesuaian Stok (Opname)**: 
   - Klik ikon **Slider (Penyesuaian)** di daftar inventory.
   - Masukkan **Stok Akhir** (jumlah barang yang benar-benar ada di rak saat ini). 
   - Sistem akan menghitung selisihnya secara otomatis dan mencatatnya sebagai 'Adjustment' di riwayat.

---

## 5. LAPORAN & EXCEL

Pantau kesehatan bisnis melalui menu **Laporan**.

- **Export Excel**: Semua laporan (Penjualan, Stok, Piutang, Komisi Teknisi) dapat diunduh ke file Excel untuk pembukuan lebih lanjut.
- **Laporan Teknisi**: Pantau kinerja tiap teknisi dan total komisi yang harus dibayarkan.

---
**Bengkel Nugraha - Solusi Profesional, Pelayanan Maksimal!** 🏎️💨💰🤝
