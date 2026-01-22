-- UPGRADE PERMISSIONS MIGRATION
-- Adds granular levels: manage, create, view for each module

INSERT INTO permissions (code, name, description) VALUES
-- Kasir
('kasir.view', 'Lihat Kasir', 'Hanya melihat menu kasir'),
('kasir.create', 'Buat Transaksi', 'Bisa melakukan transaksi baru'),
('kasir.manage', 'Kelola Kasir', 'Akses penuh menu kasir'),

-- Stok (Products)
('stock.view', 'Lihat Stok', 'Hanya melihat daftar barang/stok'),
('stock.create', 'Tambah Stok', 'Bisa menambah barang/stok baru'),
('stock.manage', 'Kelola Stok', 'Akses penuh inventory (Edit/Hapus)'),

-- Servis (Services)
('service.view', 'Lihat Servis', 'Hanya melihat daftar jasa'),
('service.create', 'Tambah Servis', 'Bisa menambah jasa baru'),
('service.manage', 'Kelola Servis', 'Akses penuh menu jasa (Edit/Hapus)'),

-- Member
('member.view', 'Lihat Member', 'Hanya melihat daftar member'),
('member.create', 'Daftar Member', 'Bisa mendaftarkan member baru'),
('member.manage', 'Kelola Member', 'Akses penuh menu member (Edit/Hapus)'),

-- Laporan
('report.view', 'Lihat Laporan', 'Hanya melihat laporan'),
('report.manage', 'Kelola Laporan', 'Akses penuh laporan dan export'),

-- Setting
('settings.view', 'Lihat Setting', 'Hanya melihat pengaturan dasar'),
('settings.manage', 'Kelola Setting', 'Akses penuh pengaturan sistem'),

-- Panduan
('guide.view', 'Lihat Panduan', 'Membuka panduan pengguna')
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description;
