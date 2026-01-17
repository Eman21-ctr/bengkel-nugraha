-- SCHEMA MIGRATION: ROLES & PERMISSIONS
-- Run this in Supabase SQL Editor to enable the new Role Management features.

-- 1. Create Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- 'Owner', 'Admin', 'Kasir', 'Teknisi'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE, -- 'transaction.create', 'settings.view', etc.
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Role Permissions (Many-to-Many)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- 4. Update Profiles to have Role ID
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id) ON DELETE SET NULL;

-- 5. Seed Default Roles
INSERT INTO roles (name, description) VALUES 
('Owner', 'Pemilik usaha, akses penuh ke semua fitur'),
('Admin', 'Administrator, manajemen user dan laporan'),
('Kasir', 'Petugas kasir, akses transaksi dan member'),
('Teknisi', 'Mengerjakan servis dan antrean')
ON CONFLICT (name) DO NOTHING;

-- 6. Seed Default Permissions
INSERT INTO permissions (code, name, description) VALUES
('*', 'Akses Penuh', 'Dapat mengakses semua fitur aplikasi'),
('transaction.view', 'Lihat Transaksi', 'Melihat riwayat transaksi'),
('transaction.create', 'Buat Transaksi', 'Melakukan transaksi baru (Kasir)'),
('member.view', 'Lihat Member', 'Melihat daftar member'),
('member.edit', 'Kelola Member', 'Tambah/Edit/Hapus member'),
('inventory.view', 'Lihat Stok', 'Melihat stok barang'),
('inventory.edit', 'Kelola Stok', 'Tambah/Edit/Hapus barang'),
('report.view', 'Lihat Laporan', 'Melihat laporan keuangan'),
('settings.view', 'Akses Pengaturan', 'Membuka menu pengaturan')
ON CONFLICT (code) DO NOTHING;

-- 7. Assign '*' Permission to Owner
DO $$
DECLARE
    v_owner_role_id UUID;
    v_full_perm_id UUID;
BEGIN
    SELECT id INTO v_owner_role_id FROM roles WHERE name = 'Owner';
    SELECT id INTO v_full_perm_id FROM permissions WHERE code = '*';
    
    IF v_owner_role_id IS NOT NULL AND v_full_perm_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id) 
        VALUES (v_owner_role_id, v_full_perm_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
