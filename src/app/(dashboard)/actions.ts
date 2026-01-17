'use server'

import { createClient } from '@/utils/supabase/server'
export async function getDashboardStats() {
    const supabase = await createClient()
    // Force calculation to Asia/Jakarta (WIB)
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', { // yyyy-mm-dd
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
    const [{ value: year }, , { value: month }, , { value: day }] = formatter.formatToParts(now)

    // Start of day in WIB: yyyy-mm-dd 00:00:00+07
    const start = `${year}-${month}-${day}T00:00:00+07:00`
    // End of day in WIB: yyyy-mm-dd 23:59:59+07
    const end = `${year}-${month}-${day}T23:59:59+07:00`

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

    // 3. Get queue counts today
    const { data: queueData } = await supabase
        .from('queues')
        .select('status')
        .gte('created_at', start)
        .lte('created_at', end)

    const waitingQueues = queueData?.filter(q => q.status === 'waiting').length || 0
    const processingQueues = queueData?.filter(q => q.status === 'processing').length || 0

    return {
        totalTransactions,
        totalRevenue,
        bengkelSales,
        kafeSales,
        lowStockCount,
        lowStockItems: lowStockItems.slice(0, 5),
        waitingQueues,
        processingQueues
    }
}
