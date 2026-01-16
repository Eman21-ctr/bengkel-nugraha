'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type Service = {
    id: string
    name: string
    price: number
    description: string | null
    barcode: string | null
    is_active: boolean
    created_at: string
}

export async function getServices() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching services:', error)
        return []
    }
    return data
}

export async function createService(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const price = Number(formData.get('price'))
    const description = formData.get('description') as string
    const barcode = formData.get('barcode') as string || null

    if (!name || isNaN(price)) {
        return { error: 'Nama dan Harga wajib diisi' }
    }

    const { error } = await supabase
        .from('services')
        .insert({ name, price, description, barcode, is_active: true })

    if (error) {
        console.error('Error creating service:', error)
        return { error: 'Gagal menambahkan jasa' }
    }

    revalidatePath('/services')
    return { success: true }
}

export async function toggleServiceStatus(id: string, is_active: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('services')
        .update({ is_active: !is_active })
        .eq('id', id)

    if (error) {
        return { error: 'Gagal mengubah status' }
    }

    revalidatePath('/services')
    return { success: true }
}

export async function deleteService(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('services').delete().eq('id', id)

    if (error) {
        return { error: 'Gagal menghapus jasa' }
    }

    revalidatePath('/services')
    return { success: true }
}

export async function updateService(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const price = Number(formData.get('price'))
    const description = formData.get('description') as string
    const barcode = formData.get('barcode') as string || null

    if (!id || !name || isNaN(price)) {
        return { error: 'ID, Nama dan Harga wajib diisi' }
    }

    const { error } = await supabase
        .from('services')
        .update({ name, price, description, barcode })
        .eq('id', id)

    if (error) {
        console.error('Error updating service:', error)
        return { error: 'Gagal memperbarui jasa' }
    }

    revalidatePath('/services')
    revalidatePath('/transactions')
    return { success: true }
}
