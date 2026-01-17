# PENAMBAHAN FITUR APLIKASI NUGRAHA BENGKEL

## FITUR BARU YANG PERLU DITAMBAHKAN

### 1. MEMBER - TAMBAHAN FIELD & FITUR

Tambahkan field baru pada data member:

**a. Barcode/Code Member**
- Setiap member memiliki kode unik (format: MBR001, MBR002, dst)
- Generate otomatis saat registrasi member baru
- Bisa di-scan barcode atau diketik manual untuk pencarian cepat
- Tampilkan di kartu member dan form pencarian

**b. Data Kendaraan**
- **Jenis Kendaraan**: Dropdown pilihan R2 (Roda 2/Motor), R3 (Roda 3/Bajaj), R4 (Roda 4/Mobil)
- **Ukuran Kendaraan**: Dropdown pilihan Kecil, Sedang, Besar, Jumbo
  - Contoh untuk motor: Kecil (Beat, Scoopy), Sedang (Vario, PCX), Besar (Ninja, CBR), Jumbo (Harley, Moge)
  - Contoh untuk mobil: Kecil (Agya), Sedang (Avanza), Besar (Fortuner), Jumbo (Alphard)
- **Merk/Tipe Kendaraan**: Input text bebas (contoh: Honda Beat, Yamaha Mio, Toyota Avanza)
- **Foto STNK/Kendaraan**: Upload foto untuk dokumentasi (file jpg/png, max 2MB)

**c. Counter Kunjungan**
- Tambahkan field `visit_count` (jumlah kunjungan member)
- Otomatis bertambah +1 setiap kali member melakukan transaksi
- Tampilkan di detail member dan digunakan untuk sistem loyalty

**Lokasi Perubahan:**
- Form Tambah/Edit Member: tambahkan semua field di atas
- Tabel Daftar Member: tampilkan code, jenis kendaraan, dan visit count
- Detail Member: tampilkan semua informasi termasuk foto kendaraan
- Pencarian Member: bisa search by code/barcode

---

### 2. JASA - HARGA DINAMIS PER JENIS & UKURAN KENDARAAN

Ubah struktur data jasa agar satu jasa bisa memiliki harga berbeda berdasarkan jenis dan ukuran kendaraan.

**Struktur Harga:**
```
Contoh: Jasa "Cuci Kendaraan"
├─ R2 (Motor)
│  ├─ Kecil: Rp 15.000
│  ├─ Sedang: Rp 20.000
│  ├─ Besar: Rp 25.000
│  └─ Jumbo: Rp 30.000
├─ R3 (Bajaj)
│  └─ Standar: Rp 25.000
└─ R4 (Mobil)
   ├─ Kecil: Rp 40.000
   ├─ Sedang: Rp 50.000
   ├─ Besar: Rp 70.000
   └─ Jumbo: Rp 100.000
```

**Implementasi:**
- Saat tambah/edit jasa, user bisa set harga untuk setiap kombinasi jenis & ukuran kendaraan
- Tidak semua kombinasi harus diisi (bisa kosongkan jika tidak applicable)
- Saat input transaksi:
  - Jika member dipilih → sistem otomatis ambil harga sesuai jenis & ukuran kendaraan member
  - Jika non-member → user pilih jenis & ukuran kendaraan secara manual untuk tentukan harga
  - Harga tetap bisa di-override manual jika ada kasus khusus

**Lokasi Perubahan:**
- Form Tambah/Edit Jasa: ubah menjadi input harga multi-level (tabel jenis x ukuran)
- Form Transaksi: otomatis detect harga dari data member, atau manual pilih jenis/ukuran jika non-member
- Daftar Jasa: tampilkan rentang harga (misal: "Rp 15.000 - Rp 100.000")

---

### 3. SISTEM ANTRIAN (QUEUE MANAGEMENT)

Tambahkan fitur nomor antrian untuk menghindari konflik urutan layanan.

**Fitur:**
- Generate nomor antrian otomatis dengan format: A001, A002, A003, dst
- Reset nomor antrian otomatis setiap hari (mulai dari A001 lagi)
- Status antrian: Menunggu, Sedang Dilayani, Selesai
- Display dashboard antrian:
  - Nomor yang sedang dilayani
  - Daftar nomor yang menunggu
  - Total antrian hari ini

**Flow:**
1. Pelanggan datang → Kasir klik "Ambil Nomor Antrian" → Generate nomor baru (status: Menunggu)
2. Kasir panggil antrian berikutnya → Klik nomor antrian → Status berubah jadi "Sedang Dilayani"
3. Saat buat transaksi → Bisa link ke nomor antrian (opsional)
4. Setelah selesai → Status jadi "Selesai"

**Lokasi Implementasi:**
- Menu baru: "Antrian" (bisa di navbar atau dashboard)
- Tombol "Ambil Nomor Antrian" di halaman antrian atau dashboard
- Display antrian aktif di dashboard utama
- Opsional: Link nomor antrian ke transaksi untuk tracking

---

### 4. SISTEM LOYALTY PROGRAM

Tambahkan program loyalty berdasarkan jumlah kunjungan (berbeda dari sistem poin yang berdasarkan rupiah).

**Konsep:**
- Admin bisa buat program loyalty dengan syarat kunjungan tertentu
- Contoh program:
  - 5x kunjungan → Gratis tisu
  - 10x kunjungan → Gratis cuci motor
  - 20x kunjungan → Diskon 20% servis berikutnya
  - 50x kunjungan → Gratis ganti oli

**Fitur:**
- CRUD Program Loyalty:
  - Nama program
  - Target kunjungan (angka)
  - Deskripsi reward
  - Status aktif/nonaktif

- Saat Input Transaksi Member:
  - Sistem otomatis cek apakah member sudah mencapai target loyalty
  - Jika ya, tampilkan notifikasi: "Member ini berhak reward: [nama reward]"
  - Kasir bisa klik "Klaim Reward" atau "Nanti Saja"
  - Jika diklaim, catat di history dan bisa reset counter atau lanjut ke program berikutnya

- Tracking:
  - History loyalty yang sudah diklaim member
  - Member bisa dapat reward yang sama berulang kali (setiap kelipatan target tercapai)

**Kombinasi Poin & Loyalty:**
- Member tetap dapat poin dari belanja (sistem lama)
- Member juga dapat reward loyalty dari jumlah kunjungan (sistem baru)
- Keduanya berjalan paralel dan independen

**Lokasi Implementasi:**
- Menu Pengaturan → Tambah submenu "Program Loyalty" (CRUD)
- Form Transaksi → Notifikasi loyalty popup/banner saat member eligible
- Detail Member → Tampilkan progress loyalty (contoh: "7/10 kunjungan untuk reward Gratis Cuci")
- Laporan → Tambah laporan loyalty claims

---

### 5. SISTEM ROLE & PERMISSION (IMPLEMENTASI TERAKHIR)

**CATATAN:** Fitur ini diimplementasikan paling akhir setelah semua fitur di atas selesai.

Tambahkan sistem permission yang fleksibel dimana setiap user bisa diatur akses menu-nya secara custom (bukan role fixed seperti Kasir/Operator/Manager).

**Konsep:**
- Admin bisa set per user (berdasarkan No HP): bisa akses menu apa saja
- Per menu bisa diatur: Lihat (View), Tambah (Create), Edit (Update), Hapus (Delete)
- Contoh setting:
  ```
  User: 0812-xxxx-xxxx
  ├─ Dashboard: ✓ View
  ├─ Transaksi: ✓ View, ✓ Create, ✓ Edit, ✗ Delete
  ├─ Inventory: ✓ View, ✗ Create, ✗ Edit, ✗ Delete
  ├─ Member: ✓ View, ✓ Create, ✓ Edit, ✗ Delete
  ├─ Jasa: ✓ View, ✗ Create, ✗ Edit, ✗ Delete
  ├─ Laporan: ✓ View
  └─ Pengaturan: ✗ (Semua ditutup)
  ```

**Implementasi:**
- Menu Pengaturan → Submenu "Kelola Permission User"
- Pilih user → Checklist permission per menu (View/Create/Update/Delete)
- Di aplikasi:
  - Menu yang tidak ada akses View → hide dari navbar
  - Tombol Create/Edit/Delete yang tidak ada akses → disable atau hide
  - Validasi juga di backend untuk keamanan

**Template Permission (Opsional - untuk cepat setup):**
- Bisa sediakan template: "Kasir", "Operator", "Manager" 
- User bisa pilih template lalu customize lagi jika perlu
- Tapi tetap sistem dasarnya custom per user, bukan role-based fixed

---

