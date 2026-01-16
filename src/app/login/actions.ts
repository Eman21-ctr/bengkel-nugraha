'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const phone = formData.get('phone') as string
    const password = formData.get('password') as string

    // Use phone as email for Supabase Auth (since standard auth is email/pass)
    // Workaround: Append a dummy domain if phone login is desired but backend expects email.
    // OR: If the project is configured for Phone Auth, use signInWithOtp (but spec says Password).
    // Assuming "No HP" is used as the identifier. 
    // If Supabase allows email-only login, we might map phone to email: `phone@example.com`.
    // Or check if user setup expects real phone auth. 
    // Given "Anon Key" and standard setup, Email is most common.
    // I will assume for now we use a convention `[phone]@bengkel.local` so we can use password.
    // If the user hasn't set up the users yet, they might fail.
    // But wait, the spec says "No HP".
    // For simplicity MVP, I will convert phone to email: `${phone}@nugraha.local`.

    const email = `${phone}@nugraha.local`

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: 'Login gagal. Periksa No HP dan Password.' }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
