'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEmployee(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const position = formData.get('position') as string

    const { error } = await supabase
        .from('employees')
        .insert({ name, position })

    if (error) return { error: error.message }

    revalidatePath('/settings')
    return { success: true }
}

export async function updateEmployee(id: string, name: string, position: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('employees')
        .update({ name, position })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/settings')
    return { success: true }
}

export async function toggleEmployeeStatus(id: string, currentStatus: boolean) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('employees')
        .update({ is_active: !currentStatus })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/settings')
    return { success: true }
}

export async function getEmployees() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name')

    if (error) return []
    return data
}
