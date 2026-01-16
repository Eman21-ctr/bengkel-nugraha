import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkData() {
    const { data: services, error: sErr } = await supabase.from('services').select('*')
    console.log('Services count:', services?.length)
    console.log('Services sample:', services?.slice(0, 2))

    const { data: settings, error: stErr } = await supabase.from('settings').select('*')
    console.log('Settings:', settings)

    const { data: products, error: pErr } = await supabase.from('products').select('*')
    console.log('Products count:', products?.length)
}

checkData()
