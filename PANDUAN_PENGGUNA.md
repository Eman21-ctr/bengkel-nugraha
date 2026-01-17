# PANDUAN PENGGUNAAN APLIKASI BENGKEL NUGRAHA

Dokumen ini berisi panduan langkah demi langkah untuk menggunakan fitur-fitur utama aplikasi Bengkel Nugraha.

---

## 1. SISTEM KASIR (POS)

Halaman Kasir (`/transactions`) adalah pusat operasional harian. Berikut adalah alur penggunaannya:

### A. Persiapan Transaksi
1. **Pilih Mode Transaksi**:
   - Klik tombol **BENGKEL** (Default) jika transaksi melibatkan jasa servis.
   - Klik tombol **TOKO** jika hanya penjualan barang (sparepart/oli) tanpa servis.

### B. Identifikasi Pelanggan (Member)
*Langkah ini sangat penting agar fitur **Harga Pintar** dan **Poin Loyalitas** bekerja.*

1. **Cari Member**: Ketik Nama, Plat Nomor, atau No HP di kolom "Cari Nama / No HP...".
2. **Pilih Member**: Klik hasil pencarian yang sesuai.
3. **Cek Data**:
   - Kartu member akan muncul dengan latar hijau.
   - Perhatikan **POIN** dan **VISIT** (kunjungan) member tersebut.
   - Sistem membaca **Jenis Kendaraan** (Motor/Mobil) member untuk menentukan harga jasa.
   - Jika member berhak dapat hadiah, notifikasi **KLAIM HADIAH** akan muncul berkedip.

### C. Memilih Produk & Jasa
1. **Cari Item**: Gunakan kolom pencarian di sebelah kanan (atau klik tombol **LIHAT KATALOG** pada tampilan HP).
2. **Scan Barcode**: Jika menggunakan scanner, pastikan kursor aktif di kolom pencarian item.
3. **Tambah ke Keranjang**:
   - Klik tombol **(+)** pada item.
   - **Logika Harga Cerdas**: Jika Anda memilih jasa (misal: Cuci), sistem otomatis mengecek kendaraan member. Jika member membawa Mobil (R4), harga jasa Cuci Mobil yang akan dipakai, bukan Cuci Motor.

### D. Manajemen Keranjang (Cart)
1. **Ubah Jumlah**: Ketik langsung angka di kolom "Qty" (kotak input putih) untuk mempercepat input jumlah banyak.
2. **Hapus Item**: Klik ikon sampah merah di sebelah kanan item.
3. **Diskon Poin**: (Otomatis) Jika member menukarkan poin, potongan harga akan muncul di ringkasan bayar.

### E. Pembayaran (Checkout)
1. **Pilih Metode**: Klik Tunai (Cash), QRIS, atau Transfer.
2. **Input Bayar**:
   - Untuk Tunai: Ketik nominal uang yang diterima pelanggan.
   - Sistem otomatis menghitung **KEMBALIAN**.
3. **Proses**: Pastikan semua data benar, lalu klik tombol besar **PROSES TRANSAKSI**.

### F. Selesai
1. **Cetak Struk**: Klik tombol **CETAK STRUK** untuk print nota ke printer thermal.
2. **Transaksi Baru**: Klik tombol **DATA BARU** untuk mereset kasir dan melayani pelanggan berikutnya.

---

## 2. MANAJEMEN JASA (SERVICE)

Menu untuk mengatur daftar layanan dan harga dinamis.

1. **Harga Standar**: Harga dasar jasa jika tipe kendaraan tidak spesifik.
2. **Harga Khusus (Dynamic Pricing)**:
   - Edit Jasa -> Tab **HARGA PER KENDARAAN**.
   - Input harga berbeda untuk **Motor (R2)**, **Roda Tiga (R3)**, dan **Mobil (R4)**.
   - Kasir akan otomatis mengambil harga ini sesuai data kendaraan member.

---

## 3. MANAJEMEN PENGGUNA (USERS)

Menu **Pengaturan -> Pengguna** digunakan oleh Pemilik (Owner) untuk mengelola karyawan yang memiliki akses ke aplikasi.

### A. Menambah Karyawan Baru
1. Masuk ke halaman **Pengaturan** -> Tab **Pengguna**.
2. Klik tombol **TAMBAH USER**.
3. Isi form pendaftaran:
   - **Nama Lengkap**: Nama karyawan (akan muncul di struk dan dashboard).
   - **Nomor HP**: Masukkan nomor HP aktif (cth: 08123456789). **Nomor ini akan menjadi username untuk login**.
   - **Password**: Buat password yang aman (minimal 6 karakter).
   - **Peran (Role)**: Tentukan jabatan karyawan (misal: Kasir).
4. Klik **Buat Akun Karyawan**.

### B. Mengelola Hak Akses
1. Di daftar pengguna, kolom **Peran** menunjukkan jabatan saat ini.
2. Untuk mengubah jabatan, klik dropdown dan pilih peran baru (misal: dari Teknisi menjadi Admin), lalu konfirmasi.

### C. Nonaktifkan Karyawan (Resign)
Jika ada karyawan yang berhenti bekerja, **JANGAN hapus akunnya** (agar riwayat transaksi tetap aman), melainkan:
1. Cari nama karyawan di daftar.
2. Klik tombol status **AKTIF** (warna hijau).
3. Konfirmasi untuk **Nonaktifkan**.
4. Tombol akan berubah menjadi **NONAKTIF** (merah). Karyawan tersebut tidak akan bisa login lagi.

---

## 4. AKUN SAYA & PROFIL

Setiap pengguna (Owner maupun Karyawan) dapat mengatur profil pribadinya di menu **Pengaturan -> Akun Saya**.

1. **Ubah Nama Tampilan**:
   - Klik ikon **Pensil**.
   - Ganti nama sesuai keinginan.
   - Nama ini yang akan muncul di sapaan Dashboard ("Selamat Pagi, [Nama]") dan di Struk transaksi.
   
2. **Ganti Password**:
   - Klik ikon **Kunci**.
   - Masukkan password baru dan konfirmasi.
   - Disarankan mengganti password secara berkala untuk keamanan.
