'use server'

import { createClient } from '@/utils/supabase/server'

// Types
export type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'custom'

type DateRange = { start: Date; end: Date }

function getDateRange(period: ReportPeriod, customStart?: string, customEnd?: string): DateRange {
    const now = new Date()
    const start = new Date()

    switch (period) {
        case 'today':
            start.setHours(0, 0, 0, 0)
            break
        case 'week':
            start.setDate(now.getDate() - 7)
            start.setHours(0, 0, 0, 0)
            break
        case 'month':
            start.setMonth(now.getMonth() - 1)
            start.setHours(0, 0, 0, 0)
            break
        case 'year':
            start.setFullYear(now.getFullYear() - 1)
            start.setHours(0, 0, 0, 0)
            break
        case 'custom':
            if (customStart) {
                const s = new Date(customStart)
                s.setHours(0, 0, 0, 0)
                const e = customEnd ? new Date(customEnd) : new Date()
                e.setHours(23, 59, 59, 999)
                return { start: s, end: e }
            }
            break
    }

    return { start, end: now }
}

// Sales Summary
export async function getSalesSummary(period: ReportPeriod, customStart?: string, customEnd?: string) {
    const supabase = await createClient()
    const { start, end } = getDateRange(period, customStart, customEnd)

    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('final_amount, type, created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())

    if (error || !transactions) {
        console.error('Error fetching sales:', error)
        return {
            totalSales: 0,
            totalTransactions: 0,
            bengkelSales: 0,
            kafeSales: 0,
            bengkelCount: 0,
            kafeCount: 0
        }
    }

    const bengkel = transactions.filter(t => t.type === 'bengkel')
    const kafe = transactions.filter(t => t.type === 'kafe')

    return {
        totalSales: transactions.reduce((sum, t) => sum + (Number(t.final_amount) || 0), 0),
        totalTransactions: transactions.length,
        bengkelSales: bengkel.reduce((sum, t) => sum + (Number(t.final_amount) || 0), 0),
        kafeSales: kafe.reduce((sum, t) => sum + (Number(t.final_amount) || 0), 0),
        bengkelCount: bengkel.length,
        kafeCount: kafe.length
    }
}

// Top Products
export async function getTopProducts(period: ReportPeriod, customStart?: string, customEnd?: string, limit = 5) {
    const supabase = await createClient()
    const { start, end } = getDateRange(period, customStart, customEnd)

    const { data, error } = await supabase
        .from('transaction_items')
        .select(`
      item_name,
      qty,
      subtotal,
      transaction:transactions!inner(created_at)
    `)
        .eq('item_type', 'product')
        .gte('transaction.created_at', start.toISOString())
        .lte('transaction.created_at', end.toISOString())

    if (error || !data) {
        console.error('Error fetching top products:', error)
        return []
    }

    // Aggregate by item_name
    const aggregated: Record<string, { name: string; qty: number; revenue: number }> = {}

    for (const item of data) {
        if (!aggregated[item.item_name]) {
            aggregated[item.item_name] = { name: item.item_name, qty: 0, revenue: 0 }
        }
        aggregated[item.item_name].qty += item.qty
        aggregated[item.item_name].revenue += item.subtotal
    }

    return Object.values(aggregated)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit)
}

// Top Services
export async function getTopServices(period: ReportPeriod, customStart?: string, customEnd?: string, limit = 5) {
    const supabase = await createClient()
    const { start, end } = getDateRange(period, customStart, customEnd)

    const { data, error } = await supabase
        .from('transaction_items')
        .select(`
      item_name,
      qty,
      subtotal,
      transaction:transactions!inner(created_at)
    `)
        .eq('item_type', 'service')
        .gte('transaction.created_at', start.toISOString())
        .lte('transaction.created_at', end.toISOString())

    if (error || !data) {
        console.error('Error fetching top services:', error)
        return []
    }

    const aggregated: Record<string, { name: string; qty: number; revenue: number }> = {}

    for (const item of data) {
        if (!aggregated[item.item_name]) {
            aggregated[item.item_name] = { name: item.item_name, qty: 0, revenue: 0 }
        }
        aggregated[item.item_name].qty += item.qty
        aggregated[item.item_name].revenue += item.subtotal
    }

    return Object.values(aggregated)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit)
}

// Low Stock Products
export async function getLowStockProducts() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('products')
        .select('id, name, stock, min_stock, unit')
        .order('stock', { ascending: true })

    if (error || !data) {
        console.error('Error fetching low stock:', error)
        return []
    }

    return data.filter(p => p.stock <= p.min_stock)
}

// Category Sales Detail
export async function getCategorySalesDetail(period: ReportPeriod, customStart?: string, customEnd?: string) {
    const supabase = await createClient()
    const { start, end } = getDateRange(period, customStart, customEnd)

    const { data: items, error } = await supabase
        .from('transaction_items')
        .select(`
            item_name,
            item_type,
            qty,
            subtotal,
            transaction:transactions!inner(type, created_at)
        `)
        .gte('transaction.created_at', start.toISOString())
        .lte('transaction.created_at', end.toISOString())

    if (error || !items) return { bengkel: [], kafe: [] }

    const bengkel: Record<string, { name: string; qty: number; total: number }> = {}
    const kafe: Record<string, { name: string; qty: number; total: number }> = {}

    items.forEach((item: any) => {
        const target = item.transaction.type === 'bengkel' ? bengkel : kafe
        if (!target[item.item_name]) {
            target[item.item_name] = { name: item.item_name, qty: 0, total: 0 }
        }
        target[item.item_name].qty += item.qty
        target[item.item_name].total += Number(item.subtotal)
    })

    return {
        bengkel: Object.values(bengkel).sort((a, b) => b.total - a.total),
        kafe: Object.values(kafe).sort((a, b) => b.total - a.total)
    }
}

// Stock Movements Report
export async function getStockMovements(period: ReportPeriod, customStart?: string, customEnd?: string) {
    const supabase = await createClient()
    const { start, end } = getDateRange(period, customStart, customEnd)

    const { data, error } = await supabase
        .from('stock_movements')
        .select(`
            *,
            product:products(name)
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching stock movements:', error)
        return []
    }
    return data
}

// Member Report
export async function getMemberReport() {
    const supabase = await createClient()

    // 1. Ranking by Points
    const { data: members, error } = await supabase
        .from('members')
        .select(`
            id,
            name,
            phone,
            points,
            visit_count,
            join_date,
            created_at
        `)
        .order('points', { ascending: false })

    if (error) return { members: [], totalPoints: 0, activeCount: 0 }

    // 2. Count active this month (had transactions)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: activeCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .not('member_id', 'is', null)
        .gte('created_at', startOfMonth.toISOString())

    const totalPoints = members.reduce((sum, m) => sum + (m.points || 0), 0)

    return {
        members: members.map(m => ({
            ...m,
            // Mock transaction count for now as we don't have a direct count in member table
            // In a real app we'd join or use a view
            txCount: 0
        })),
        totalPoints,
        activeCount: activeCount || 0,
        totalMembers: members.length
    }
}

// Recent Transactions
export async function getRecentTransactions(limit = 10) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('transactions')
        .select(`
            id,
            invoice_number,
            type,
            final_amount,
            payment_method,
            created_at,
            member:members(name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching transactions:', error)
        return []
    }

    return data
}

// Detailed Transactions for History Report
export async function getDetailedTransactions(period: ReportPeriod, customStart?: string, customEnd?: string) {
    const supabase = await createClient()
    const { start, end } = getDateRange(period, customStart, customEnd)

    const { data, error } = await supabase
        .from('transactions')
        .select(`
            *,
            member:members(id, name, phone, vehicle_plate),
            cashier:profiles!transactions_user_id_fkey(full_name),
            items:transaction_items(*),
            payments:transaction_payments(*)
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching detailed transactions:', error)
        return []
    }

    return data
}

// Technician Report
export async function getTechnicianReport(period: ReportPeriod, customStart?: string, customEnd?: string) {
    const supabase = await createClient()
    const { start, end } = getDateRange(period, customStart, customEnd)

    const { data, error } = await supabase
        .from('transaction_items')
        .select(`
            id,
            item_name,
            qty,
            subtotal,
            commission_amount,
            created_at,
            performed_by,
            employee:employees(id, name, position),
            transaction:transactions!inner(invoice_number)
        `)
        .not('performed_by', 'is', null)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false })

    if (error || !data) {
        console.error('Error fetching technician report:', error)
        return []
    }

    // Aggregate by technician
    const aggregated: Record<string, {
        id: string;
        name: string;
        position: string;
        totalJobs: number;
        totalCommission: number;
        history: any[]
    }> = {}

    for (const item of data) {
        const emp = (item as any).employee
        if (!emp) continue

        if (!aggregated[emp.id]) {
            aggregated[emp.id] = {
                id: emp.id,
                name: emp.name,
                position: emp.position,
                totalJobs: 0,
                totalCommission: 0,
                history: []
            }
        }

        aggregated[emp.id].totalJobs += 1
        aggregated[emp.id].totalCommission += Number(item.commission_amount || 0)
        aggregated[emp.id].history.push(item)
    }

    return Object.values(aggregated).sort((a, b) => b.totalCommission - a.totalCommission)
}
