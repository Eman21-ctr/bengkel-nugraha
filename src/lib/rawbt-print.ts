'use client'

/**
 * RawBT Integration Utility
 * Untuk print ke printer thermal via RawBT di Android
 * Optimized untuk printer 58mm (32 karakter per baris)
 */

// Lebar printer thermal 58mm = 32 karakter
const PRINTER_WIDTH = 32

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
    return btoa(unescape(encodeURIComponent(text)))
}

// Print via RawBT URL scheme
export function printViaRawBT(text: string): boolean {
    try {
        const encoded = encodeForRawBT(text)
        const rawbtUrl = `rawbt:base64,${encoded}`
        window.location.href = rawbtUrl
        return true
    } catch (error) {
        console.error('RawBT print error:', error)
        return false
    }
}

// Format angka ke Rupiah - ASCII only
function formatRp(amount: number): string {
    const num = Math.round(amount)
    const str = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `Rp${str}`
}

// Center text dalam lebar tertentu
function center(text: string, width: number = PRINTER_WIDTH): string {
    if (text.length >= width) return text.substring(0, width)
    const pad = Math.floor((width - text.length) / 2)
    return ' '.repeat(pad) + text
}

// Format baris dengan label kiri dan value kanan
function row(label: string, value: string, width: number = PRINTER_WIDTH): string {
    const space = width - label.length - value.length
    if (space < 1) return label + ' ' + value
    return label + ' '.repeat(space) + value
}

// Potong text jika terlalu panjang
function cut(text: string, max: number): string {
    if (text.length <= max) return text
    return text.substring(0, max - 2) + '..'
}

// Word wrap dan center untuk text panjang
function wrapCenter(text: string, width: number = PRINTER_WIDTH): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let line = ''

    for (const word of words) {
        if ((line + ' ' + word).trim().length <= width) {
            line = (line + ' ' + word).trim()
        } else {
            if (line) lines.push(center(line, width))
            line = word
        }
    }
    if (line) lines.push(center(line, width))
    return lines
}

type ReceiptData = {
    storeName: string
    storeAddress: string
    storePhone: string
    invoice: string
    date: Date
    member?: { name: string; vehicle_plate?: string | null } | null
    vehiclePlate?: string | null
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

// Generate struk untuk thermal printer 58mm
export function generateReceiptText(data: ReceiptData): string {
    const W = PRINTER_WIDTH
    const LINE = '='.repeat(W)
    const DASH = '-'.repeat(W)
    const out: string[] = []

    // === HEADER ===
    out.push(LINE)
    out.push(center(data.storeName.toUpperCase()))
    wrapCenter(data.storeAddress).forEach(l => out.push(l))
    out.push(center(`Telp: ${data.storePhone}`))
    out.push(LINE)

    // === INFO TRANSAKSI ===
    const tgl = new Date(data.date).toLocaleDateString('id-ID', {
        day: '2-digit', month: '2-digit', year: '2-digit'
    })
    const jam = new Date(data.date).toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit'
    })

    out.push(`No: ${data.invoice}`)
    out.push(`Tgl: ${tgl} ${jam}`)

    if (data.member) {
        out.push(`Plg: ${cut(data.member.name, W - 5)}`)
    }
    const plate = data.vehiclePlate || data.member?.vehicle_plate || '-'
    out.push(`No.Pol: ${cut(plate, W - 8)}`)
    if (data.cashier) {
        out.push(`Kasir: ${cut(data.cashier, W - 7)}`)
    }
    if (data.kilometer) {
        out.push(`KM: ${data.kilometer.toLocaleString('id-ID')}`)
    }

    out.push(DASH)

    // === ITEMS ===
    for (const item of data.items) {
        out.push(cut(item.name, W))

        if (item.employee_name) {
            out.push(`  [${cut(item.employee_name, W - 4)}]`)
        }

        // Qty x Harga      Subtotal
        const priceStr = formatRp(item.price).replace('Rp', '')
        const qty = `${item.qty}x${priceStr}`
        const sub = formatRp(item.subtotal)
        out.push(row('  ' + qty, sub))
    }

    out.push(DASH)

    // === TOTALS ===
    out.push(row('Subtotal:', formatRp(data.subtotal)))

    if (data.discount > 0) {
        out.push(row('Diskon:', `-${formatRp(data.discount)}`))
    }

    out.push(row('TOTAL:', formatRp(data.total)))

    out.push(DASH)

    // === PEMBAYARAN ===
    const metode = data.paymentMethod === 'qris' ? 'QRIS' : 'TUNAI'
    out.push(row(`Bayar(${metode}):`, formatRp(data.paymentAmount)))

    if (data.paymentAmount < data.total) {
        out.push(row('SISA:', formatRp(data.total - data.paymentAmount)))
    } else if (data.change > 0) {
        out.push(row('Kembali:', formatRp(data.change)))
    }

    out.push(LINE)

    // === FOOTER ===
    if (data.note) {
        wrapCenter(data.note).forEach(l => out.push(l))
    } else {
        out.push(center('Terima Kasih!'))
    }

    out.push(LINE)

    // Paper feed
    out.push('')
    out.push('')
    out.push('')

    return out.join('\n')
}

type QueueTicketData = {
    storeName: string
    queueNumber: string
    date: Date
    customerName?: string | null
    notes?: string | null
}

// Generate tiket antrean
export function generateQueueTicketText(data: QueueTicketData): string {
    const W = PRINTER_WIDTH
    const LINE = '='.repeat(W)
    const DASH = '-'.repeat(W)
    const out: string[] = []

    out.push(LINE)
    out.push(center(data.storeName.toUpperCase()))
    out.push(LINE)
    out.push('')
    out.push(center('NOMOR ANTREAN'))
    out.push('')
    // Big number effect using dashes
    out.push(center('--- ' + data.queueNumber + ' ---'))
    out.push('')
    out.push(DASH)

    const tgl = new Date(data.date).toLocaleDateString('id-ID', {
        day: '2-digit', month: '2-digit', year: '2-digit'
    })
    const jam = new Date(data.date).toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit'
    })

    out.push(center(`${tgl} ${jam}`))

    if (data.customerName) {
        out.push(center(cut(data.customerName, W)))
    }

    if (data.notes) {
        out.push('')
        wrapCenter(data.notes).forEach(l => out.push(l))
    }

    out.push('')
    out.push(center('Harap tunggu panggilan'))
    out.push(LINE)

    out.push('')
    out.push('')
    out.push('')

    return out.join('\n')
}

type MemberCardData = {
    storeName: string
    memberCode: string
    name: string
    phone: string
    vehiclePlate?: string | null
}

// Generate layout kartu member
export function generateMemberCardText(data: MemberCardData): string {
    const W = PRINTER_WIDTH
    const LINE = '='.repeat(W)
    const DASH = '-'.repeat(W)
    const out: string[] = []

    out.push(LINE)
    out.push(center('KARTU MEMBER'))
    out.push(center(data.storeName.toUpperCase()))
    out.push(LINE)
    out.push('')
    out.push(center(data.name.toUpperCase()))
    out.push(center(data.phone))
    if (data.vehiclePlate) {
        out.push(center('PLAT: ' + data.vehiclePlate.toUpperCase()))
    }
    out.push('')
    out.push(DASH)
    out.push(center('KODE MEMBER:'))
    out.push(center(data.memberCode))
    out.push(DASH)
    out.push('')
    out.push(center('Tunjukkan kartu ini saat'))
    out.push(center('berkunjung untuk poin'))
    out.push(LINE)

    out.push('')
    out.push('')
    out.push('')

    return out.join('\n')
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

// Generate kwitansi pembayaran
export function generatePaymentReceiptText(data: PaymentReceiptData): string {
    const W = PRINTER_WIDTH
    const LINE = '='.repeat(W)
    const DASH = '-'.repeat(W)
    const out: string[] = []

    // === HEADER ===
    out.push(LINE)
    out.push(center(data.storeName.toUpperCase()))
    wrapCenter(data.storeAddress).forEach(l => out.push(l))
    out.push(center(`Telp: ${data.storePhone}`))
    out.push(LINE)

    out.push(center('KWITANSI PEMBAYARAN'))
    out.push(DASH)

    // === INFO ===
    const tgl = new Date(data.date).toLocaleDateString('id-ID')
    const jam = new Date(data.date).toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit'
    })

    out.push(`Ref: ${data.invoice}`)
    out.push(`Tgl: ${tgl} ${jam}`)

    if (data.member) {
        out.push(`Plg: ${cut(data.member.name, W - 5)}`)
    }

    out.push(DASH)

    // === DETAIL ===
    const metode = data.method === 'qris' ? 'QRIS' : 'TUNAI'
    out.push(`Metode: ${metode}`)
    out.push(`Ket: ${data.note || 'Angsuran'}`)

    out.push(DASH)

    // === JUMLAH ===
    out.push(row('DIBAYAR:', formatRp(data.amount)))

    out.push(DASH)

    // === SUMMARY ===
    out.push(row('Total Tagihan:', formatRp(data.totalBill)))
    out.push(row('Sudah Bayar:', formatRp(data.paidSoFar)))

    const sisaVal = data.remaining <= 0 ? 'LUNAS' : formatRp(data.remaining)
    out.push(row('SISA:', sisaVal))

    out.push(LINE)
    out.push(center('Simpan sebagai bukti'))
    out.push(center('pembayaran yang sah'))
    out.push(LINE)

    // Paper feed
    out.push('')
    out.push('')
    out.push('')

    return out.join('\n')
}
