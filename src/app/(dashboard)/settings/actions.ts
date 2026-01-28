'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Get store profile
export async function getStoreProfile() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'store_profile')
        .single()

    return data?.value || {
        name: 'Nugraha Bengkel & Kafe',
        address: '',
        phone: '',
        owner: '',
        logo_bengkel: '',
        logo_kafe: ''
    }
}

// Upload logo to storage
export async function uploadLogo(formData: FormData) {
    const supabase = await createClient()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'bengkel' or 'kafe'

    if (!file || file.size === 0) {
        return { error: 'No file provided' }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `logo_${type}_${Date.now()}.${fileExt}`

    // Upload to logos bucket
    const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true })

    if (uploadError) {
        console.error('Error uploading logo:', uploadError)
        return { error: 'Gagal mengupload logo' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)

    // Update store profile with new logo URL
    const currentProfile = await getStoreProfile()
    const updatedProfile = {
        ...currentProfile,
        [`logo_${type}`]: publicUrl
    }

    const { error: updateError } = await supabase
        .from('settings')
        .update({ value: updatedProfile })
        .eq('key', 'store_profile')

    if (updateError) {
        return { error: 'Gagal menyimpan URL logo' }
    }

    revalidatePath('/settings')
    return { success: true, url: publicUrl }
}

// Update store profile
export async function updateStoreProfile(prevState: any, formData: FormData) {
    const supabase = await createClient()

    // Get current profile to preserve logos
    const currentProfile = await getStoreProfile()

    const profile = {
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        phone: formData.get('phone') as string,
        owner: formData.get('owner') as string,
        logo_bengkel: currentProfile.logo_bengkel || '',
        logo_kafe: currentProfile.logo_kafe || ''
    }

    const { error } = await supabase
        .from('settings')
        .update({ value: profile })
        .eq('key', 'store_profile')

    if (error) {
        console.error('Error updating profile:', error)
        return { error: 'Gagal menyimpan profil' }
    }

    revalidatePath('/settings')
    return { success: true }
}


// Get point config
export async function getPointConfig() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'point_config')
        .single()

    return data?.value || {
        earn_per: 10000,
        earn_point: 1,
        redeem_value: 100
    }
}

// Update point config
export async function updatePointConfig(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const config = {
        earn_per: Number(formData.get('earn_per')),
        earn_point: Number(formData.get('earn_point')),
        redeem_value: Number(formData.get('redeem_value'))
    }

    const { error } = await supabase
        .from('settings')
        .update({ value: config })
        .eq('key', 'point_config')

    if (error) {
        console.error('Error updating point config:', error)
        return { error: 'Gagal menyimpan pengaturan poin' }
    }

    revalidatePath('/settings')
    return { success: true }
}

// Get current user
export async function getCurrentUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            *,
            role:roles (name)
        `)
        .eq('id', user.id)
        .single()

    return {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name,
        role: profile?.role?.name || 'Belum diatur'
    }
}

// Logout
export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/')
}
