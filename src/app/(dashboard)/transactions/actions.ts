'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Types
export type TransactionType = 'bengkel' | 'kafe'

export type CartItem = {
    id: string
    name: string
    type: 'product' | 'service'
    price: number
    cost_price: number
    qty: number
    subtotal: number
    employee_id?: string // New: for mechanic/operator tracking
}

export type TransactionPayload = {
    type: TransactionType
    member_id?: string
    items: CartItem[]
    subtotal: number
    discount: number
    points_used: number
    total: number
    payment_method: 'cash' | 'qris'
    payment_amount: number
    queue_id?: string
    note?: string
    cashier_name?: string // New: manual cashier name
}

// Fetch products for POS
export async function getProductsForPOS() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('products')
        .select('id, name, category_id, price, cost_price, stock, min_stock, unit')
        .order('name')

    if (error) {
        console.error('Error fetching products:', error)
        return []
    }
    return data
}

// Fetch services for POS - Now with dynamic prices!
export async function getServicesForPOS() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('services')
        .select(`
            *,
            prices:service_prices(vehicle_type, vehicle_size, price)
        `)
        .eq('is_active', true) // Filter active services only
        .order('name')

    if (error) {
        console.error('SERVER: Error services:', error)
        return []
    }

    return (data || []).map(s => ({
        id: s.id,
        name: s.name,
        price: Number(s.price) || 0,
        description: s.description,
        prices: s.prices // Pass the nested prices to frontend
    }))
}

// Search members
export async function searchMembers(query: string) {
    if (!query || query.length < 2) return []

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('members')
        .select('id, name, phone, vehicle_plate, points, member_code, vehicle_type, vehicle_size, visit_count')
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%,vehicle_plate.ilike.%${query}%,member_code.ilike.%${query}%`)
        .limit(10)

    if (error) {
        console.error('Error searching members:', error)
        return []
    }
    return data
}

// Get member by ID
export async function getMemberById(id: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('members')
        .select('id, name, phone, vehicle_plate, points, member_code, vehicle_type, vehicle_size, visit_count')
        .eq('id', id)
        .single()

    return data
}

// Get point config from settings
export async function getPointConfig() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'point_config')
        .single()

    const val = data?.value || {}
    // Robust mapping for any field name variations
    const config = {
        earn_per: Number(val.earn_per || val.earn_rate || val.belanja || 10000) || 10000,
        earn_point: Number(val.earn_point || val.poin || 1) || 1,
        redeem_value: Number(val.redeem_value || val.redeem_rate || val.nilai_poin || 100) || 100
    }

    return config
}

// Process Transaction
export async function processTransaction(payload: TransactionPayload) {
    const supabase = await createClient()

    try {
        // 0. Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        // 1. Create transaction record
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                type: payload.type,
                member_id: payload.member_id || null,
                subtotal: payload.subtotal,
                discount_amount: payload.discount,
                points_used: payload.points_used,
                total_amount: payload.subtotal,
                final_amount: payload.total,
                payment_method: payload.payment_method,
                payment_amount: payload.payment_amount,
                change: payload.payment_amount > payload.total ? payload.payment_amount - payload.total : 0,
                note: payload.note || null,
                cashier_name: payload.cashier_name || null,
                payment_status: payload.payment_amount >= payload.total ? 'Lunas' : 'Belum Lunas'
            })
            .select('id, invoice_number')
            .single()

        if (txError) throw txError

        // 1.1 Create initial payment record if amount > 0
        if (payload.payment_amount > 0) {
            const actualPayment = Math.min(payload.payment_amount, payload.total)
            await supabase.from('transaction_payments').insert({
                transaction_id: transaction.id,
                amount: actualPayment,
                payment_method: payload.payment_method,
                note: payload.payment_amount >= payload.total ? 'Lunas' : 'DP / Cicilan 1'
            })
        }

        // 2. Create transaction items
        const itemsToInsert = payload.items.map(item => ({
            transaction_id: transaction.id,
            item_type: item.type,
            product_id: item.type === 'product' ? item.id : null,
            service_id: item.type === 'service' ? item.id : null,
            item_name: item.name,
            qty: item.qty,
            price: item.price,
            subtotal: item.subtotal,
            performed_by: item.employee_id || null // Link the employee
        }))

        const { error: itemsError } = await supabase
            .from('transaction_items')
            .insert(itemsToInsert)

        if (itemsError) throw itemsError

        // 3. Update stock for products
        for (const item of payload.items) {
            if (item.type === 'product') {
                // Get current stock
                const { data: product } = await supabase
                    .from('products')
                    .select('stock')
                    .eq('id', item.id)
                    .single()

                if (product) {
                    const stock_before = product.stock
                    const stock_after = stock_before - item.qty

                    // Record stock movement
                    await supabase.from('stock_movements').insert({
                        product_id: item.id,
                        type: 'out',
                        qty: item.qty,
                        stock_before,
                        stock_after,
                        description: `Penjualan - ${transaction.invoice_number}`
                    })

                    // Update product stock
                    await supabase
                        .from('products')
                        .update({ stock: stock_after })
                        .eq('id', item.id)
                }
            }
        }

        // 4. Update member points if applicable
        if (payload.member_id) {
            const pointConfig = await getPointConfig()
            const { data: member } = await supabase
                .from('members')
                .select('points, visit_count')
                .eq('id', payload.member_id)
                .single()

            if (member) {
                // Calculate earned points
                const earnedPoints = Math.floor(payload.total / pointConfig.earn_per) * pointConfig.earn_point
                const newPoints = member.points - payload.points_used + earnedPoints

                await supabase
                    .from('members')
                    .update({
                        points: newPoints,
                        visit_count: (member.visit_count || 0) + 1
                    })
                    .eq('id', payload.member_id)

            }
        }

        // 5. Link Queue if provided
        if (payload.queue_id) {
            await supabase
                .from('queues')
                .update({
                    status: 'Selesai',
                    transaction_id: transaction.id
                })
                .eq('id', payload.queue_id)
        }

        revalidatePath('/transactions')
        revalidatePath('/inventory')
        revalidatePath('/')

        return { success: true, invoice: transaction.invoice_number }
    } catch (error: any) {
        console.error('Transaction error:', error)
        return { error: `Gagal memproses transaksi: ${error.message || 'Error unknown'}` }
    }
}

// Get recent transactions
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
      cashier_name,
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

export async function getItemByBarcode(barcode: string) {
    if (!barcode) return null
    const supabase = await createClient()

    // 1. Try products
    const { data: product } = await supabase
        .from('products')
        .select('id, name, price, cost_price, stock, unit')
        .eq('barcode', barcode)
        .single()

    if (product) {
        return {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            cost_price: Number(product.cost_price),
            qty: 1,
            type: 'product' as const,
            stock: product.stock,
            unit: product.unit
        }
    }

    // 2. Try services
    const { data: service } = await supabase
        .from('services')
        .select('id, name, price')
        .eq('barcode', barcode)
        .eq('is_active', true)
        .single()

    if (service) {
        return {
            id: service.id,
            name: service.name,
            price: Number(service.price),
            cost_price: 0,
            qty: 1,
            type: 'service' as const,
            stock: 999,
            unit: 'x'
        }
    }

    return null
}

// Fetch employees for dropdowns
export async function getEmployees() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .order('name')

    if (error) {
        console.error('Error fetching employees:', error)
        return []
    }
    return data
}

export async function getPaymentHistory(transactionId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('transaction_payments')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching payment history:', error)
        return []
    }
    return data
}

export async function addPaymentRecord(payload: {
    transaction_id: string,
    amount: number,
    payment_method: string,
    note: string
}) {
    const supabase = await createClient()

    // 1. Insert payment record
    const { error: pError } = await supabase
        .from('transaction_payments')
        .insert({
            transaction_id: payload.transaction_id,
            amount: payload.amount,
            payment_method: payload.payment_method,
            note: payload.note
        })

    if (pError) throw pError

    // 2. Update transaction aggregate (payment_amount)
    // We need to sum all payments for this transaction
    const { data: payments } = await supabase
        .from('transaction_payments')
        .select('amount')
        .eq('transaction_id', payload.transaction_id)

    const totalPaid = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0)

    // 3. Get transaction total to check status
    const { data: tx } = await supabase
        .from('transactions')
        .select('final_amount')
        .eq('id', payload.transaction_id)
        .single()

    const newStatus = totalPaid >= Number(tx?.final_amount || 0) ? 'Lunas' : 'Belum Lunas'

    await supabase.from('transactions')
        .update({
            payment_amount: totalPaid,
            payment_status: newStatus
        })
        .eq('id', payload.transaction_id)

    revalidatePath('/reports')
    return { success: true }
}
