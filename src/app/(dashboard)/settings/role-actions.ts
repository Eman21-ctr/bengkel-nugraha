'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { getMyPermissions } from '@/utils/permissions'

export type Role = {
    id: string
    name: string
    description: string | null
    permissions?: { permission: { code: string } }[]
}

const DEFAULT_ROLES = [
    { name: 'Owner', description: 'Pemilik usaha, akses penuh ke semua fitur' },
    { name: 'Admin', description: 'Administrator, akses manajemen user dan laporan' },
    { name: 'Kasir', description: 'Petugas kasir, akses transaksi dan member' },
    { name: 'Teknisi', description: 'Mengerjakan servis dan antrean' }
]

export async function getRoles() {
    const supabase = await createClient()
    let { data, error } = await supabase
        .from('roles')
        .select(`
            *,
            permissions:role_permissions (
                permission:permissions (code)
            )
        `)
        .order('name')

    if (error) {
        console.error('Error fetching roles:', error)
        return []
    }

    // Auto-seed if empty
    if (!data || data.length === 0) {
        console.log('Seeding default roles...')
        const { error: insertError } = await supabase.from('roles').insert(DEFAULT_ROLES)
        if (insertError) {
            console.error('Error seeding roles:', insertError)
        } else {
            // Refetch after seed
            const { data: newData } = await supabase
                .from('roles')
                .select(`
                    *,
                    permissions:role_permissions (
                        permission:permissions (code)
                    )
                `)
                .order('name')
            return newData || []
        }
    }

    return data
}

export async function getPermissions() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('code')

    if (error) {
        console.error('Error fetching permissions:', error)
        return []
    }
    return data
}

export async function updateRolePermissions(roleId: string, permissionCodes: string[]) {
    const supabase = await createClient()

    // 1. Get permission IDs for the codes
    const { data: perms } = await supabase
        .from('permissions')
        .select('id, code')
        .in('code', permissionCodes)

    if (!perms) return { error: 'Permissions not found' }

    // 2. Delete existing
    await supabase.from('role_permissions').delete().eq('role_id', roleId)

    // 3. Insert new
    const toInsert = perms.map(p => ({
        role_id: roleId,
        permission_id: p.id
    }))

    const { error } = await supabase.from('role_permissions').insert(toInsert)

    if (error) {
        console.error('Error updating role permissions:', error)
        return { error: 'Gagal memperbarui hak akses' }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function createRole(name: string, description: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('roles')
        .insert({ name, description })
        .select()
        .single()

    if (error) {
        console.error('Error creating role:', error)
        return { error: 'Gagal membuat role' }
    }

    revalidatePath('/settings')
    return { success: true, role: data }
}

export async function getMyPermissionsAction() {
    // TEMPORARY: Enable everything for everyone as requested for setup
    return ['*']
}
