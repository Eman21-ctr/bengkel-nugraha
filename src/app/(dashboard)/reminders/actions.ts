'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type ReminderType = 'follow_up_3d' | 'service_3m'
export type ReminderStatus = 'pending' | 'sent' | 'failed'

export type Reminder = {
    id: string
    member_id: string | null
    customer_name: string | null
    customer_phone: string | null
    invoice_id: string
    type: ReminderType
    scheduled_date: string
    sent_date: string | null
    status: ReminderStatus
    notes: string | null
    created_at: string
    member?: {
        name: string
        phone: string
    }
    transaction?: {
        invoice_number: string
    }
}

export async function getReminders() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('service_reminders')
        .select(`
            *,
            member:members(name, phone),
            transaction:transactions(invoice_number)
        `)
        .order('scheduled_date', { ascending: true })

    if (error) {
        console.error('SERVER: getReminders error:', error)
        return []
    }
    return data as Reminder[]
}

export async function updateReminderStatus(id: string, status: ReminderStatus) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('service_reminders')
        .update({
            status,
            sent_date: status === 'sent' ? new Date().toISOString() : null
        })
        .eq('id', id)

    if (!error) {
        revalidatePath('/reminders')
    }
    return { error }
}

export async function getReminderStats() {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data: allData, error } = await supabase
        .from('service_reminders')
        .select('status, scheduled_date')

    if (error) {
        console.error('SERVER: getReminderStats error:', error)
    }

    if (!allData) return { pending: 0, today: 0, overdue: 0, sent: 0 }

    const stats = {
        pending: allData.filter(r => r.status === 'pending').length,
        today: allData.filter(r => r.status === 'pending' && r.scheduled_date.split('T')[0] === now.split('T')[0]).length,
        overdue: allData.filter(r => r.status === 'pending' && r.scheduled_date < now).length,
        sent: allData.filter(r => r.status === 'sent').length
    }

    return stats
}
