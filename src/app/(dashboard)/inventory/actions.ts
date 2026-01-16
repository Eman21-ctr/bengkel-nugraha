'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type Product = {
    id: string
    name: string
    category_id: string
    price: number
    cost_price: number // Harga Beli
    stock: number
    min_stock: number
    unit: string
    barcode: string | null
    category?: {
        name: string
    }
}

export type Category = {
    id: string
    name: string
}

export async function getProducts(query: string = '', filter: string = 'all') {
    const supabase = await createClient()

    let dbQuery = supabase
        .from('products')
        .select(`
      *,
      category:categories(name)
    `)
        .order('name', { ascending: true })

    if (query) {
        dbQuery = dbQuery.ilike('name', `%${query}%`)
    }

    // Filter logic
    if (filter === 'low_stock') {
        // This is tricky in Supabase basic filter without raw SQL if comparing two columns
        // We might filter on client or userpc if needed. 
        // But for now, let's just fetch all and filter in JS if the dataset is small (MVP) 
        // or use a specific RPC if performance matters.
        // For MVP/small shop, client side filter of the page valid is acceptable or post-query filter.
    }

    const { data, error } = await dbQuery

    if (error) {
        console.error('Error fetching products:', error)
        return []
    }

    // Refine filter in JS for "low_stock" (stock <= min_stock)
    if (filter === 'low_stock') {
        return data.filter((p: any) => p.stock <= p.min_stock)
    }

    return data
}

export async function getCategories() {
    const supabase = await createClient()
    const { data } = await supabase.from('categories').select('*').eq('type', 'product').order('name')
    return data || []
}

export async function createProduct(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const category_id = formData.get('category_id') as string
    const price = Number(formData.get('price'))
    const cost_price = Number(formData.get('cost_price'))
    const stock = Number(formData.get('stock'))
    const min_stock = Number(formData.get('min_stock'))
    const unit = formData.get('unit') as string || 'pcs'
    const barcode = formData.get('barcode') as string || null

    if (!name || !category_id || isNaN(price)) {
        return { error: 'Data wajib diisi (Nama, Kategori, Harga)' }
    }

    const { error } = await supabase
        .from('products')
        .insert({
            name,
            category_id,
            price,
            cost_price,
            stock,
            min_stock,
            unit,
            barcode
        })

    if (error) {
        console.error('Error creating product:', error)
        return { error: 'Gagal menambahkan barang.' }
    }

    revalidatePath('/inventory')
    return { success: true }
}

export async function deleteProduct(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) {
        return { error: 'Gagal menghapus barang' }
    }
    revalidatePath('/inventory')
    return { success: true }
}

export async function addStock(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const product_id = formData.get('product_id') as string
    const qty = Number(formData.get('qty'))
    const description = formData.get('description') as string

    if (!product_id || qty <= 0) {
        return { error: 'Jumlah stok harus lebih dari 0' }
    }

    // 1. Get current stock
    const { data: product } = await supabase.from('products').select('stock').eq('id', product_id).single()
    if (!product) return { error: 'Produk tidak ditemukan' }

    const stock_before = product.stock
    const stock_after = stock_before + qty

    // 2. Insert movement
    const { error: moveError } = await supabase.from('stock_movements').insert({
        product_id,
        type: 'in',
        qty,
        stock_before,
        stock_after,
        description
    })

    if (moveError) {
        return { error: 'Gagal mencatat stok masuk' }
    }

    // 3. Update product
    const { error: updateError } = await supabase.from('products').update({ stock: stock_after }).eq('id', product_id)

    if (updateError) {
        return { error: 'Gagal update stok produk' }
    }

    revalidatePath('/inventory')
    return { success: true }
}

export async function updateProduct(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const category_id = formData.get('category_id') as string
    const price = Number(formData.get('price'))
    const cost_price = Number(formData.get('cost_price'))
    const min_stock = Number(formData.get('min_stock'))
    const unit = formData.get('unit') as string
    const barcode = formData.get('barcode') as string || null

    if (!id || !name || !category_id || isNaN(price)) {
        return { error: 'Data wajib diisi (ID, Nama, Kategori, Harga)' }
    }

    const { error } = await supabase
        .from('products')
        .update({
            name,
            category_id,
            price,
            cost_price,
            min_stock,
            unit,
            barcode
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating product:', error)
        return { error: 'Gagal memperbarui barang' }
    }

    revalidatePath('/inventory')
    revalidatePath('/transactions')
    return { success: true }
}
