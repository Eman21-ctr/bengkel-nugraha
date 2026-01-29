'use client'

/**
 * RawBT Integration Utility
 * Untuk print ke printer thermal via RawBT di Android
 */

// Deteksi apakah device Android
export function isAndroid(): boolean {
    if (typeof navigator === 'undefined') return false
    return /android/i.test(navigator.userAgent)
}

// Deteksi apakah mobile (Android/iOS)
export function isMobile(): boolean {
    if (typeof navigator === 'undefined') return false
    return /android|iphone|ipad|ipod/i.test(navigator.userAgent)
}

// Encode text ke format RawBT
function encodeForRawBT(text: string): string {
    // Base64 encode dengan support Unicode
    return btoa(unescape(encodeURIComponent(text)))
}

// Print via RawBT URL scheme
export function printViaRawBT(text: string): boolean {
    try {
        const encoded = encodeForRawBT(text)
        const rawbtUrl = `rawbt:base64,${encoded}`

        // Gunakan window.location untuk trigger RawBT
        window.location.href = rawbtUrl
        return true
    } catch (error) {
        console.error('RawBT print error:', error)
        return false
    }
}

// Format angka ke Rupiah - ASCII only, no special chars
function formatRupiah(amount: number): string {
    // Format manual tanpa karakter khusus
    const num = Math.round(amount)
    const str = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `Rp${str}`
}

// Pad string ke kiri
function padLeft(str: string, length: number): string {
    return str.padStart(length, ' ')
}

// Pad string ke kanan
function padRight(str: string, length: number): string {
    return str.padEnd(length, ' ')
}

// Center text - dengan word wrap untuk text panjang
function centerText(text: string, width: number): string {
    if (text.length <= width) {
        const padding = Math.max(0, Math.floor((width - text.length) / 2))
        return ' '.repeat(padding) + text
    }
    return text.substring(0, width) // Potong jika terlalu panjang
}

// Word wrap untuk text panjang, return array of centered lines
function wrapAndCenterText(text: string, width: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= width) {
            currentLine = (currentLine + ' ' + word).trim()
        } else {
            if (currentLine) lines.push(centerText(currentLine, width))
            currentLine = word
        }
    }
    if (currentLine) lines.push(centerText(currentLine, width))

    return lines
}

// Potong text jika terlalu panjang
function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 2) + '..'
}

type ReceiptData = {
    storeName: string
    storeAddress: string
    storePhone: string
    invoice: string
    date: Date
    member?: { name: string; vehicle_plate?: string | null } | null
    cashier?: string
    kilometer?: number
    items: Array<{
        name: string
        qty: number
        price: number
        subtotal: number
        employee_name?: string
    }>
    subtotal: number
    discount: number
    total: number
    paymentMethod: string
    paymentAmount: number
    change: number
    note?: string
}

// Generate struk dalam format plain text untuk thermal printer
export function generateReceiptText(data: ReceiptData): string {
    const W = 48 // Lebar karakter untuk thermal 80mm 
    const LINE = '='.repeat(W)
    const DASH = '-'.repeat(W)

    const lines: string[] = []

    // Header
    lines.push(LINE)
    lines.push(centerText(data.storeName.toUpperCase(), W))

    // Address - split jika panjang
    const addressLines = wrapAndCenterText(data.storeAddress, W)
    lines.push(...addressLines)

    lines.push(centerText(`Telp: ${data.storePhone}`, W))
    lines.push(LINE)

    // Info transaksi
    const dateStr = new Date(data.date).toLocaleDateString('id-ID', {
        day: '2-digit', month: '2-digit', year: '2-digit'
    })
    const timeStr = new Date(data.date).toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit'
    })

    lines.push(`No: ${data.invoice}`)
    lines.push(`Tgl: ${dateStr} ${timeStr}`)

    if (data.member) {
        const pelanggan = data.member.vehicle_plate || data.member.name
        lines.push(`Plg: ${truncate(pelanggan, W - 5)}`)
    }

    if (data.cashier) {
        lines.push(`Kasir: ${truncate(data.cashier, W - 7)}`)
    }

    if (data.kilometer) {
        lines.push(`KM: ${data.kilometer.toLocaleString('id-ID')}`)
    }

    lines.push(DASH)

    // Items
    for (const item of data.items) {
        // Nama item
        lines.push(truncate(item.name, W))

        // Teknisi (jika ada)
        if (item.employee_name) {
            lines.push(`  [${truncate(item.employee_name, W - 4)}]`)
        }

        // Qty x Harga = Subtotal
        const priceStr = formatRupiah(item.price).replace('Rp', '')
        const qtyPrice = `${item.qty}x${priceStr}`
        const subtotalStr = formatRupiah(item.subtotal)
        const spacing = W - qtyPrice.length - subtotalStr.length - 2
        lines.push(`  ${qtyPrice}${' '.repeat(Math.max(1, spacing))}${subtotalStr}`)
    }

    lines.push(DASH)

    // Totals - format dengan spacing yang cukup
    const subtotalLabel = 'Subtotal:'
    const subtotalValue = formatRupiah(data.subtotal)
    lines.push(`${subtotalLabel.padEnd(W - subtotalValue.length)}${subtotalValue}`)

    if (data.discount > 0) {
        const discLabel = 'Diskon:'
        const discValue = `-${formatRupiah(data.discount)}`
        lines.push(`${discLabel.padEnd(W - discValue.length)}${discValue}`)
    }

    const totalLabel = 'TOTAL:'
    const totalValue = formatRupiah(data.total)
    lines.push(`${totalLabel.padEnd(W - totalValue.length)}${totalValue}`)

    lines.push(DASH)

    // Payment
    const payMethod = data.paymentMethod === 'qris' ? 'QRIS' : 'TUNAI'
    const bayarLabel = `Bayar (${payMethod}):`
    const bayarValue = formatRupiah(data.paymentAmount)
    lines.push(`${bayarLabel.padEnd(W - bayarValue.length)}${bayarValue}`)

    if (data.paymentAmount < data.total) {
        const sisaLabel = 'SISA:'
        const sisaValue = formatRupiah(data.total - data.paymentAmount)
        lines.push(`${sisaLabel.padEnd(W - sisaValue.length)}${sisaValue}`)
    } else if (data.change > 0) {
        const kembaliLabel = 'Kembali:'
        const kembaliValue = formatRupiah(data.change)
        lines.push(`${kembaliLabel.padEnd(W - kembaliValue.length)}${kembaliValue}`)
    }

    lines.push(LINE)

    // Footer - gunakan catatan nota, atau default jika tidak ada
    if (data.note) {
        // Wrap dan center catatan nota
        const noteLines = wrapAndCenterText(data.note, W)
        lines.push(...noteLines)
    } else {
        // Default jika tidak ada catatan
        lines.push(centerText('Terima Kasih!', W))
    }

    lines.push(LINE)

    // Beberapa baris kosong di akhir untuk paper feed
    lines.push('')
    lines.push('')
    lines.push('')

    return lines.join('\n')
}

type PaymentReceiptData = {
    storeName: string
    storeAddress: string
    storePhone: string
    invoice: string
    date: Date
    member?: { name: string } | null
    method: string
    amount: number
    note?: string
    totalBill: number
    paidSoFar: number
    remaining: number
}

// Generate kwitansi pembayaran dalam format plain text
export function generatePaymentReceiptText(data: PaymentReceiptData): string {
    const W = 48 // Lebar karakter untuk thermal 80mm
    const LINE = '='.repeat(W)
    const DASH = '-'.repeat(W)

    const lines: string[] = []

    // Header
    lines.push(LINE)
    lines.push(centerText(data.storeName.toUpperCase(), W))
    const addressLines = wrapAndCenterText(data.storeAddress, W)
    lines.push(...addressLines)
    lines.push(centerText(`Telp: ${data.storePhone}`, W))
    lines.push(LINE)

    lines.push(centerText('KWITANSI PEMBAYARAN', W))
    lines.push(DASH)

    // Info
    const dateStr = new Date(data.date).toLocaleDateString('id-ID')
    const timeStr = new Date(data.date).toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit'
    })

    lines.push(`Ref: ${data.invoice}`)
    lines.push(`Tgl: ${dateStr} ${timeStr}`)

    if (data.member) {
        lines.push(`Plg: ${truncate(data.member.name, W - 5)}`)
    }

    lines.push(DASH)

    // Detail
    const method = data.method === 'qris' ? 'QRIS' : 'TUNAI'
    lines.push(`Metode: ${method}`)
    lines.push(`Ket: ${data.note || 'Angsuran'}`)

    lines.push(DASH)

    // Amount
    const dibayarLabel = 'DIBAYAR:'
    const dibayarValue = formatRupiah(data.amount)
    lines.push(`${dibayarLabel.padEnd(W - dibayarValue.length)}${dibayarValue}`)

    lines.push(DASH)

    // Summary
    const totalLabel = 'Total Tagihan:'
    const totalValue = formatRupiah(data.totalBill)
    lines.push(`${totalLabel.padEnd(W - totalValue.length)}${totalValue}`)

    const paidLabel = 'Sudah Bayar:'
    const paidValue = formatRupiah(data.paidSoFar)
    lines.push(`${paidLabel.padEnd(W - paidValue.length)}${paidValue}`)

    const remainLabel = 'SISA:'
    const remainValue = data.remaining <= 0 ? 'LUNAS' : formatRupiah(data.remaining)
    lines.push(`${remainLabel.padEnd(W - remainValue.length)}${remainValue}`)

    lines.push(LINE)
    lines.push(centerText('Simpan sebagai bukti', W))
    lines.push(centerText('pembayaran yang sah', W))
    lines.push(LINE)

    // Paper feed
    lines.push('')
    lines.push('')
    lines.push('')

    return lines.join('\n')
}
