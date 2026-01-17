'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateMyProfile(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string

    if (!name) return { error: 'Nama tidak boleh kosong' }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sesi habis, silakan login ulang' }

    // Update Auth Metadata
    await supabase.auth.updateUser({
        data: { full_name: name }
    })

    // Update Profile Table
    const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', user.id)

    if (error) return { error: 'Gagal update profil' }

    revalidatePath('/settings')
    return { success: true }
}

export async function updateMyPassword(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (!password) return { error: 'Password wajib diisi' }
    if (password.length < 6) return { error: 'Password minimal 6 karakter' }
    if (password !== confirm) return { error: 'Konfirmasi password tidak cocok' }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) return { error: `Gagal ubah password: ${error.message}` }

    return { success: true }
}
