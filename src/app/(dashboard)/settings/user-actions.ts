'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type UserData = {
    id: string
    email: string
    full_name: string
    role_id: string | null
    role_name: string
    is_active: boolean
    last_sign_in_at: string
}

export async function getUsers() {
    const supabase = await createClient()

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            role_id,
            is_active,
            role:roles (name)
        `)
        .order('full_name')

    if (error) {
        console.error('Error fetching profiles:', error)
        return []
    }

    return profiles.map(p => ({
        id: p.id,
        full_name: p.full_name || 'Tanpa Nama',
        role_id: p.role_id,
        role_name: (p.role as any)?.name || 'Belum diatur',
        is_active: p.is_active !== false // default true
    }))
}

import { createAdminClient } from '@/utils/supabase/admin'

export async function toggleUserStatus(userId: string, isActive: boolean) {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', userId)

    // Optional: Also ban in Auth if inactive? 
    // For now, simple profile flag is enough if we check it during login.

    if (error) return { error: 'Gagal update status (DB)' }

    // Also update auth user ban status if we want to force logout immediately?
    // Let's stick to profile check for simplicity first.

    revalidatePath('/settings')
    return { success: true }
}

export async function updateUserRole(userId: string, roleId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .update({ role_id: roleId })
        .eq('id', userId)

    if (error) {
        console.error('Error updating user role:', error)
        return { error: 'Gagal update role user' }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function createUser(prevState: any, formData: FormData) {
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const password = formData.get('password') as string
    const roleId = formData.get('roleId') as string

    if (!name || !phone || !password || !roleId) {
        return { error: 'Semua kolom wajib diisi' }
    }

    // Basic phone validation
    if (!/^[0-9]+$/.test(phone)) {
        return { error: 'Nomor HP harus berupa angka' }
    }

    // Auto-generate email from phone
    const email = `${phone}@nugraha.local`

    // 1. Check permission of current user (must be Owner or Admin)
    // For now, let's allow it if they can access this server action, implying they passed middleware/page checks.
    // Ideally we check DB role here.

    const supabaseAdmin = createAdminClient()

    // 2. Create Auth User
    const { data: user, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, phone: phone }
    })

    if (authError) {
        console.error('Error creating user:', authError)
        return { error: `Gagal membuat user: ${authError.message}` }
    }

    if (!user.user) return { error: 'Gagal membuat user' }

    // 3. Update Profile with Role
    // The profile might be created by trigger, but we need to set the role.
    // Wait a bit for trigger? Or just upsert.
    // Better to upsert to be safe.
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: user.user.id,
            full_name: name,
            role_id: roleId,
            updated_at: new Date().toISOString()
            // Note: If profiles has specific phone column, we could add it here too, but auth metadata is good for login lookup if needed.
        })

    if (profileError) {
        console.error('Error updating profile:', profileError)
        // clean up auth user if profile fails? 
        // fallback mainly.
        return { error: 'User dibuat tapi gagal set role. Silakan edit manual.' }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function ensureAdminIsOwner() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Check if this user has a role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role:roles(name)')
        .eq('id', user.id)
        .single()

    // If no role or not Owner, and they are the ONLY user or specifically requested?
    // Let's safe-guard: If we find a role named 'Owner', assign it to this user IF they don't have a role yet.
    if (!profile?.role) {
        const { data: ownerRole } = await supabase.from('roles').select('id').eq('name', 'Owner').single()
        if (ownerRole) {
            console.log('Auto-assigning Owner role to current user:', user.email)
            await supabase.from('profiles').update({ role_id: ownerRole.id }).eq('id', user.id)
            revalidatePath('/settings')
        }
    }
}
