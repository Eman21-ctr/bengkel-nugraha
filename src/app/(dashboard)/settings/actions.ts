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

// Upload logo to storage (supports PNG, JPEG, JPG, WEBP)
export async function uploadLogo(formData: FormData) {
    const supabase = await createClient()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'bengkel' or 'kafe'

    if (!file || file.size === 0) {
        return { error: 'Tidak ada file gambar yang dipilih' }
    }

    // Check mime type or extension
    const fileType = file.type || ''
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    const isImage = allowedTypes.includes(fileType.toLowerCase()) || file.name.match(/\.(png|jpe?g|webp)$/i)

    if (!isImage) {
        return { error: 'Format file tidak didukung. Harap gunakan PNG atau JPEG/JPG.' }
    }

    try {
        const fileExt = file.name.split('.').pop() || 'png'
        const fileName = `logo_${type}_${Date.now()}.${fileExt}`
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        let logoUrl = ''

        // Try upload to Supabase storage 'logos' bucket
        const { error: uploadError } = await supabase.storage
            .from('logos')
            .upload(fileName, buffer, {
                contentType: file.type || 'image/png',
                upsert: true
            })

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(fileName)
            logoUrl = publicUrl
        } else {
            console.warn('Storage upload notice (using fallback base64 Data URL):', uploadError)
            // Fallback to base64 Data URL if storage bucket fails or not configured
            const base64 = buffer.toString('base64')
            logoUrl = `data:${file.type || 'image/png'};base64,${base64}`
        }

        // Update store profile with new logo URL
        const currentProfile = await getStoreProfile()
        const updatedProfile = {
            ...currentProfile,
            [`logo_${type}`]: logoUrl
        }

        const { error: updateError } = await supabase
            .from('settings')
            .upsert({ key: 'store_profile', value: updatedProfile }, { onConflict: 'key' })

        if (updateError) {
            console.error('Error saving logo to settings table:', updateError)
            return { error: 'Gagal menyimpan URL logo ke database' }
        }

        revalidatePath('/settings')
        return { success: true, url: logoUrl }
    } catch (err: any) {
        console.error('Error processing logo upload:', err)
        return { error: err.message || 'Gagal mengupload logo' }
    }
}

// Remove logo
export async function removeLogo(type: 'bengkel' | 'kafe') {
    const supabase = await createClient()
    try {
        const currentProfile = await getStoreProfile()
        const updatedProfile = {
            ...currentProfile,
            [`logo_${type}`]: ''
        }

        const { error: updateError } = await supabase
            .from('settings')
            .upsert({ key: 'store_profile', value: updatedProfile }, { onConflict: 'key' })

        if (updateError) {
            return { error: 'Gagal menghapus logo' }
        }

        revalidatePath('/settings')
        return { success: true }
    } catch (err: any) {
        return { error: err.message || 'Gagal menghapus logo' }
    }
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
        .upsert({ key: 'store_profile', value: profile }, { onConflict: 'key' })

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
