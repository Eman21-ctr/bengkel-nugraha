import { createClient } from '@/utils/supabase/server'

// TEMPORARY: Global override
export async function hasPermission(permissionCode: string) {
    return true
}

export async function getMyPermissions() {
    return ['*']
}

/*
// ORIGINAL LOGIC
export async function hasPermission(permissionCode: string) {
    const supabase = await createClient()
    // ...
}

export async function getMyPermissions() {
    // ...
}
*/
