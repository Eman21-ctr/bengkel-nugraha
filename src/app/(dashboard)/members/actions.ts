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

async function uploadSTNK(supabase: any, file: File, memberCode: string) {
    if (!file || file.size === 0 || typeof file === 'string') return null

    const fileExt = file.name.split('.').pop()
    const fileName = `${memberCode}_${Date.now()}.${fileExt}`
    const filePath = `stnk/${fileName}`

    const { error: uploadError } = await supabase.storage
        .from('members')
        .upload(filePath, file)

    if (uploadError) {
        console.error('Error uploading STNK:', uploadError)
        return null
    }

    const { data: { publicUrl } } = supabase.storage
        .from('members')
        .getPublicUrl(filePath)

    return publicUrl
}

export async function createMember(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const vehicle_plate = formData.get('vehicle_plate') as string
    const vehicle_type = formData.get('vehicle_type') as string
    const vehicle_size = formData.get('vehicle_size') as string
    const vehicle_model = formData.get('vehicle_model') as string
    const stnk_file = formData.get('stnk_photo') as File

    if (!name || !phone) {
        return { error: 'Nama dan No HP wajib diisi' }
    }

    let member_code = formData.get('member_code') as string

    // If no manual code provided, generate one
    if (!member_code) {
        // Generate Member Code: MBR + Year + Count
        const { count } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })

        member_code = `MBR${String((count || 0) + 1).padStart(3, '0')}`
    } else {
        // Check if manual code is already taken
        const { data: existing } = await supabase
            .from('members')
            .select('id')
            .eq('member_code', member_code)
            .single()

        if (existing) {
            return { error: 'Kode Member / Barcode ini sudah terdaftar oleh member lain.' }
        }
    }

    // Upload STNK if exists
    const stnk_photo_url = await uploadSTNK(supabase, stnk_file, member_code)

    const { error } = await supabase
        .from('members')
        .insert({
            name,
            phone,
            vehicle_plate,
            member_code: member_code,
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
        if (error.code === '23505') {
            return { error: 'No HP atau Kode Member sudah terdaftar.' }
        }
        return { error: 'Gagal menambahkan member.' }
    }

    revalidatePath('/members')
    return { success: true, member_code: member_code }
}

export async function updateMember(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string
    const member_code = formData.get('member_code') as string
    const stnk_file = formData.get('stnk_photo') as File

    const updates: any = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        vehicle_plate: formData.get('vehicle_plate') as string,
        vehicle_type: formData.get('vehicle_type') as string,
        vehicle_size: formData.get('vehicle_size') as string,
        vehicle_model: formData.get('vehicle_model') as string,
    }

    // Only upload if new file provided
    if (stnk_file && stnk_file.size > 0) {
        const stnk_photo_url = await uploadSTNK(supabase, stnk_file, member_code || 'MBR')
        if (stnk_photo_url) {
            updates.stnk_photo_url = stnk_photo_url
        }
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
