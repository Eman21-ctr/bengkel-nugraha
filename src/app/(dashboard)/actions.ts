'use server'

import { createClient } from '@/utils/supabase/server'
export async function getDashboardStats() {
    const supabase = await createClient()
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

    // 1. Get transactions count and total revenue today
    const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('total_amount, type')
        .gte('created_at', start)
        .lte('created_at', end)

    const totalTransactions = transData?.length || 0
    const totalRevenue = transData?.reduce((acc, curr) => acc + curr.total_amount, 0) || 0
    const bengkelSales = transData?.filter(t => t.type === 'bengkel').reduce((acc, curr) => acc + curr.total_amount, 0) || 0
    const kafeSales = transData?.filter(t => t.type === 'kafe').reduce((acc, curr) => acc + curr.total_amount, 0) || 0

    // 2. Get low stock products count
    // Since we need to compare stock and min_stock, and Supabase doesn't easily do it in a query without RPC
    // we fetch all and filter, or use an RPC if available. 
    // For now we'll fetch all simple fields to minimize data.
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, stock, min_stock, unit')

    const lowStockItems = products?.filter(p => p.stock <= p.min_stock) || []
    const lowStockCount = lowStockItems.length

    return {
        totalTransactions,
        totalRevenue,
        bengkelSales,
        kafeSales,
        lowStockCount,
        lowStockItems: lowStockItems.slice(0, 5)
    }
}
