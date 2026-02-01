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

export async function deleteEmployee(id: string) {
    const supabase = await createClient()

    // Try hard delete first
    const { error: hardDeleteError } = await supabase.from('employees').delete().eq('id', id)

    if (hardDeleteError) {
        // If it fails (likely due to FK constraints), fallback to soft delete
        console.log('Hard delete failed, falling back to soft delete for employee:', id)
        const { error: softDeleteError } = await supabase
            .from('employees')
            .update({ is_active: false })
            .eq('id', id)

        if (softDeleteError) {
            console.error('Error soft deleting employee:', softDeleteError)
            return { error: 'Gagal menghapus karyawan' }
        }

        revalidatePath('/settings')
        return { success: true, message: 'Karyawan dinonaktifkan karena memiliki riwayat pekerjaan' }
    }

    revalidatePath('/settings')
    return { success: true }
}
