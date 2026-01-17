'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type LoyaltyReward = {
    id: string
    visits_required: number
    reward_name: string
    is_active: boolean
}

export async function getLoyaltyConfig() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching loyalty config:', error)
        return null
    }
    return data
}

export async function updateLoyaltyConfig(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const visits_required = Number(formData.get('visits_required'))
    const reward_name = formData.get('reward_name') as string

    if (!reward_name || isNaN(visits_required)) {
        return { error: 'Nama Hadiah dan Jumlah Kunjungan wajib diisi' }
    }

    // Set all existing to inactive
    await supabase.from('loyalty_rewards').update({ is_active: false }).eq('is_active', true)

    // Insert new config
    const { error } = await supabase
        .from('loyalty_rewards')
        .insert({
            visits_required,
            reward_name,
            is_active: true
        })

    if (error) {
        console.error('Error updating loyalty config:', error)
        return { error: 'Gagal memperbarui program loyalitas' }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function getEligibleReward(memberId: string) {
    const supabase = await createClient()

    // 1. Get member visit count
    const { data: member } = await supabase
        .from('members')
        .select('visit_count')
        .eq('id', memberId)
        .single()

    if (!member) return null

    // 2. Get active loyalty config
    const config = await getLoyaltyConfig()
    if (!config) return null

    // 3. Check if visit count has hit a milestone (e.g. 10, 20, 30)
    const currentMilestone = Math.floor(member.visit_count / config.visits_required) * config.visits_required

    if (currentMilestone === 0) return null

    // 4. Check if this milestone has already been claimed
    const { data: claim } = await supabase
        .from('loyalty_claims')
        .select('*')
        .eq('member_id', memberId)
        .eq('milestone_visit', currentMilestone)
        .single()

    if (claim) return null // Already claimed

    return {
        milestone: currentMilestone,
        reward_name: config.reward_name
    }
}

export async function claimReward(memberId: string, milestone: number) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('loyalty_claims')
        .insert({
            member_id: memberId,
            milestone_visit: milestone
        })

    if (error) {
        console.error('Error claiming loyalty reward:', error)
        return { error: 'Gagal mencatat klaim hadiah' }
    }

    revalidatePath('/transactions')
    return { success: true }
}
