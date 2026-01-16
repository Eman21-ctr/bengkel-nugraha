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
        owner: ''
    }
}

// Update store profile
export async function updateStoreProfile(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const profile = {
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        phone: formData.get('phone') as string,
        owner: formData.get('owner') as string
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
        .select('*')
        .eq('id', user.id)
        .single()

    return {
        id: user.id,
        email: user.email,
        ...profile
    }
}

// Logout
export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/')
}
