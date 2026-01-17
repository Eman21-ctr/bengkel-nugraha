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
        dbQuery = dbQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%,vehicle_plate.ilike.%${query}%,member_code.ilike.%${query}%`)
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
    const vehicle_type = formData.get('vehicle_type') as string
    const vehicle_size = formData.get('vehicle_size') as string
    const vehicle_model = formData.get('vehicle_model') as string
    const stnk_photo_url = formData.get('stnk_photo_url') as string

    if (!name || !phone) {
        return { error: 'Nama dan No HP wajib diisi' }
    }

    // Generate Member Code: MBR + Year + Count
    const { count } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })

    const member_code = `MBR${(count || 0) + 1}`.padStart(6, '0').replace('000MBR', 'MBR')
    // Simpler format as per spec: MBR001, MBR002
    const formattedCode = `MBR${String((count || 0) + 1).padStart(3, '0')}`

    const { error } = await supabase
        .from('members')
        .insert({
            name,
            phone,
            vehicle_plate,
            member_code: formattedCode,
            vehicle_type,
            vehicle_size,
            vehicle_model,
            stnk_photo_url,
            points: 0,
            visit_count: 0,
            join_date: new Date().toISOString()
        })

    if (error) {
        console.error('Error creating member:', error)
        if (error.code === '23505') { // Unique violation
            return { error: 'No HP atau Kode Member sudah terdaftar.' }
        }
        return { error: 'Gagal menambahkan member.' }
    }

    revalidatePath('/members')
    return { success: true }
}

export async function updateMember(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string

    const updates = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        vehicle_plate: formData.get('vehicle_plate') as string,
        vehicle_type: formData.get('vehicle_type') as string,
        vehicle_size: formData.get('vehicle_size') as string,
        vehicle_model: formData.get('vehicle_model') as string,
        stnk_photo_url: formData.get('stnk_photo_url') as string,
    }

    const { error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', id)

    if (error) {
        console.error('Error updating member:', error)
        return { error: 'Gagal memperbarui data member' }
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
