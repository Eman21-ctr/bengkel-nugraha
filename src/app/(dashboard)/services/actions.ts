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
    prices?: ServicePrice[]
}

export type ServicePrice = {
    vehicle_type: 'R2' | 'R3' | 'R4'
    vehicle_size: 'Kecil' | 'Sedang' | 'Besar' | 'Jumbo'
    price: number
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
    const services = data || []

    // Fetch prices for each service
    const { data: prices, error: priceError } = await supabase
        .from('service_prices')
        .select('*')

    if (priceError) {
        console.error('Error fetching service prices:', priceError)
        return services
    }

    return services.map(s => ({
        ...s,
        prices: (prices || []).filter(p => p.service_id === s.id)
    }))
}

export async function getServicePrices(serviceId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('service_prices')
        .select('vehicle_type, vehicle_size, price')
        .eq('service_id', serviceId)

    if (error) {
        console.error('Error fetching service prices:', error)
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

export async function updateServicePrices(serviceId: string, prices: ServicePrice[]) {
    const supabase = await createClient()

    // Delete existing prices for this service
    await supabase.from('service_prices').delete().eq('service_id', serviceId)

    if (prices.length === 0) return { success: true }

    // Insert new prices
    const toInsert = prices.map(p => ({
        service_id: serviceId,
        vehicle_type: p.vehicle_type,
        vehicle_size: p.vehicle_size,
        price: p.price
    }))

    const { error } = await supabase.from('service_prices').insert(toInsert)

    if (error) {
        console.error('Error updating service prices:', error)
        return { error: 'Gagal memperbarui daftar harga' }
    }

    revalidatePath('/services')
    revalidatePath('/transactions')
    return { success: true }
}
