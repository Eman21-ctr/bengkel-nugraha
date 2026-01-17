'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type QueueStatus = 'Menunggu' | 'Sedang Dilayani' | 'Selesai'

export type Queue = {
    id: string
    queue_number: string
    status: QueueStatus
    member_id: string | null
    notes: string | null
    transaction_id: string | null
    created_at: string
    member?: {
        name: string
        vehicle_plate: string
        vehicle_model: string
    }
}

export async function getQueues() {
    const supabase = await createClient()

    // Get start of today (WIB)
    const now = new Date()
    const startOfDay = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
    startOfDay.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
        .from('queues')
        .select(`
            *,
            member:members(name, vehicle_plate, vehicle_model)
        `)
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching queues:', error)
        return []
    }
    return data
}

export async function createQueue(memberId?: string, notes?: string) {
    const supabase = await createClient()

    // 1. Get current count for today to generate queue number
    const now = new Date()
    const startOfDay = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
    startOfDay.setHours(0, 0, 0, 0)

    const { count } = await supabase
        .from('queues')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString())

    const queueNumber = `Q${String((count || 0) + 1).padStart(3, '0')}`

    // 2. Insert queue
    const { data, error } = await supabase
        .from('queues')
        .insert({
            queue_number: queueNumber,
            member_id: memberId || null,
            notes: notes || null,
            status: 'Menunggu'
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating queue:', error)
        return { error: 'Gagal membuat antrean' }
    }

    revalidatePath('/queues')
    revalidatePath('/transactions')
    revalidatePath('/')
    return { success: true, queue: data }
}

// Quick queue creation from cashier (can be empty)
export async function createQuickQueue(memberId?: string, notes?: string) {
    return createQueue(memberId, notes)
}

// Get active queues (not completed) for cashier sidebar
export async function getActiveQueues() {
    const supabase = await createClient()

    const now = new Date()
    const startOfDay = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
    startOfDay.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
        .from('queues')
        .select(`
            *,
            member:members(name, vehicle_plate, vehicle_model)
        `)
        .gte('created_at', startOfDay.toISOString())
        .neq('status', 'Selesai')
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching active queues:', error)
        return []
    }
    return data
}

// Link queue to transaction after payment
export async function linkQueueToTransaction(queueId: string, transactionId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('queues')
        .update({
            status: 'Selesai',
            transaction_id: transactionId
        })
        .eq('id', queueId)

    if (error) {
        console.error('Error linking queue to transaction:', error)
        return { error: 'Gagal link antrean ke transaksi' }
    }

    revalidatePath('/queues')
    revalidatePath('/transactions')
    revalidatePath('/')
    return { success: true }
}

export async function updateQueueStatus(id: string, status: QueueStatus) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('queues')
        .update({ status })
        .eq('id', id)

    if (error) {
        console.error('Error updating queue status:', error)
        return { error: 'Gagal mengubah status antrean' }
    }

    revalidatePath('/queues')
    revalidatePath('/')
    return { success: true }
}

export async function deleteQueue(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('queues').delete().eq('id', id)

    if (error) {
        return { error: 'Gagal menghapus antrean' }
    }

    revalidatePath('/queues')
    return { success: true }
}
