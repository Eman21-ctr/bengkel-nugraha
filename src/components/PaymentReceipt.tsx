'use client'

import React from 'react'

type PaymentReceiptProps = {
    storeInfo: {
        name: string
        address: string
        phone: string
    }
    payment: {
        invoice: string
        date: Date
        method: string
        amount: number
        note?: string
        totalBill: number
        paidSoFar: number
        remaining: number
        member?: {
            name: string
        } | null
    }
    showOnScreen?: boolean
}

export function PaymentReceipt({ storeInfo, payment, showOnScreen = false }: PaymentReceiptProps) {
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

    const containerClasses = showOnScreen
        ? "w-full max-w-[80mm] mx-auto p-4 text-black font-mono text-sm leading-tight bg-white border border-gray-100 shadow-inner rounded-xl"
        : "hidden print:block w-[80mm] p-4 text-black font-mono text-sm leading-tight bg-white"

    return (
        <div id={showOnScreen ? undefined : "payment-receipt-print"} className={containerClasses}>
            <div className="text-center border-b border-dashed border-black pb-2 mb-2">
                <h2 className="text-lg font-bold uppercase tracking-tighter">{storeInfo.name}</h2>
                <p className="text-[10px] leading-tight">{storeInfo.address}</p>
                <p className="text-[10px]">Telp: {storeInfo.phone}</p>
            </div>

            <div className="text-center mb-2">
                <h3 className="text-xs font-black uppercase border-b border-black inline-block pb-0.5">Kwitansi Pembayaran</h3>
            </div>

            <div className="mb-2 text-[10px]">
                <div className="flex justify-between">
                    <span>No. Ref: {payment.invoice}</span>
                    <span>{new Date(payment.date).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                    <span>{payment.member ? `Pelanggan: ${payment.member.name}` : ''}</span>
                    <span>{new Date(payment.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>

            <div className="border-b border-dashed border-black mb-2 pb-2">
                <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                        <span>Keterangan:</span>
                        <span className="font-bold">{payment.note || 'Angsuran / Pelunasan'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Metode:</span>
                        <span className="uppercase">{payment.method}</span>
                    </div>
                    <div className="flex justify-between text-base font-black border-t border-dashed border-black pt-1 mt-1">
                        <span>DIBAYAR:</span>
                        <span>{formatCurrency(payment.amount)}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-1 text-[10px] mb-2 text-gray-600">
                <div className="flex justify-between">
                    <span>Total Tagihan:</span>
                    <span>{formatCurrency(payment.totalBill)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Total Sudah Bayar:</span>
                    <span>{formatCurrency(payment.paidSoFar)}</span>
                </div>
                <div className="flex justify-between font-bold text-black border-t border-gray-200 pt-1">
                    <span>SISA HUTANG:</span>
                    <span className={payment.remaining <= 0 ? "text-green-600" : "text-red-600"}>
                        {payment.remaining <= 0 ? "LUNAS" : formatCurrency(payment.remaining)}
                    </span>
                </div>
            </div>

            <div className="text-[8px] text-center mt-4 italic border-t border-dashed border-black pt-2">
                <p>Simpan kwitansi ini sebagai bukti pembayaran yang sah.</p>
                <p>Terima kasih atas kepercayaan Anda!</p>
            </div>
        </div>
    )
}
