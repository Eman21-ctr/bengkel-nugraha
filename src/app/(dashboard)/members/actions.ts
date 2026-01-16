'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMembers(query: string = '') {
    const supabase = await createClient()

    let dbQuery = supabase
        .from('members')
        .select('*')
        .order('name', { ascending: true })

    if (query) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%,vehicle_plate.ilike.%${query}%`)
    }

    const { data, error } = await dbQuery

    if (error) {
        console.error('Error fetching members:', error)
        return []
    }

    return data
}

export async function createMember(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const vehicle_plate = formData.get('vehicle_plate') as string

    if (!name || !phone) {
        return { error: 'Nama dan No HP wajib diisi' }
    }

    const { error } = await supabase
        .from('members')
        .insert({
            name,
            phone,
            vehicle_plate,
            points: 0,
            join_date: new Date().toISOString()
        })

    if (error) {
        console.error('Error creating member:', error)
        if (error.code === '23505') { // Unique violation
            return { error: 'No HP sudah terdaftar.' }
        }
        return { error: 'Gagal menambahkan member.' }
    }

    revalidatePath('/members')
    return { success: true }
}

export async function deleteMember(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('members').delete().eq('id', id)

    if (error) {
        return { error: 'Gagal menghapus member' }
    }
    revalidatePath('/members')
    return { success: true }
}
