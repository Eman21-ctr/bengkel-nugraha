'use client'

import React from 'react'

type ReceiptProps = {
    storeInfo: {
        name: string
        address: string
        phone: string
        logo_bengkel?: string
        logo_kafe?: string
    }
    transaction: {
        invoice: string
        date: Date
        type: string
        items: any[]
        subtotal: number
        discount: number
        total: number
        paymentMethod: string
        paymentAmount: number
        change: number
        member?: {
            name: string
            points: number
            vehicle_plate?: string | null // Added vehicle_plate
        } | null
        cashier?: string // New: Cashier name
        note?: string // New: Custom footer note
        paymentHistory?: any[] // New: List of all payments for audit
    }
    showOnScreen?: boolean
}

export function Receipt({ storeInfo, transaction, showOnScreen = false }: ReceiptProps) {
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

    const containerClasses = showOnScreen
        ? "w-full max-w-[80mm] mx-auto p-4 text-black font-mono text-sm leading-tight bg-white border border-gray-100 shadow-inner rounded-xl"
        : "hidden print:block w-[80mm] p-4 text-black font-mono text-sm leading-tight bg-white"

    return (
        <div id={showOnScreen ? undefined : "receipt-print"} className={containerClasses}>
            <div className="text-center border-b border-dashed border-black pb-2 mb-2">
                {/* Logo Header */}
                {(storeInfo.logo_bengkel || storeInfo.logo_kafe) && (
                    <div className="flex justify-between items-center mb-2">
                        <div className="w-12 h-12">
                            {storeInfo.logo_bengkel && (
                                <img src={storeInfo.logo_bengkel} alt="Logo Bengkel" className="w-full h-full object-contain" />
                            )}
                        </div>
                        <div className="w-12 h-12">
                            {storeInfo.logo_kafe && (
                                <img src={storeInfo.logo_kafe} alt="Logo Kafe" className="w-full h-full object-contain" />
                            )}
                        </div>
                    </div>
                )}
                <h2 className="text-lg font-bold uppercase tracking-tighter">{storeInfo.name}</h2>
                <p className="text-[10px] leading-tight">{storeInfo.address}</p>
                <p className="text-[10px]">Telp: {storeInfo.phone}</p>
            </div>

            <div className="mb-2 text-[10px]">
                <div className="flex justify-between">
                    <span>No: {transaction.invoice || 'DRAFT'}</span>
                    <span>{new Date(transaction.date).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                    <span>{new Date(transaction.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {transaction.member && (
                    <div className="mt-1 border-t border-gray-100 pt-1">
                        <span>Pelanggan: {transaction.type === 'bengkel' && transaction.member.vehicle_plate ? transaction.member.vehicle_plate : transaction.member.name}</span>
                    </div>
                )}
                {transaction.cashier && (
                    <div className="mt-1">
                        <span>Kasir: {transaction.cashier}</span>
                    </div>
                )}
            </div>

            <div className="border-b border-dashed border-black mb-2">
                <table className="w-full text-[10px]">
                    <thead>
                        <tr className="border-b border-dashed border-black font-bold">
                            <th className="text-left py-1">Item</th>
                            <th className="text-right py-1">Qty</th>
                            <th className="text-right py-1">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transaction.items.map((item, idx) => (
                            <tr key={idx} className="align-top">
                                <td className="py-1 pr-2">
                                    <span className="block">{item.name}</span>
                                    {item.employee_id && (
                                        <span className="block text-[7px] font-bold text-gray-500 italic mt-0.5 uppercase">Petugas: {item.employee_name || '...'}</span>
                                    )}
                                    <span className="text-[8px] text-gray-500">@ {formatCurrency(item.price)}</span>
                                </td>
                                <td className="text-right py-1">{item.qty}</td>
                                <td className="text-right py-1">{formatCurrency(item.subtotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="space-y-1 text-[10px] mb-2">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(transaction.subtotal)}</span>
                </div>
                {transaction.discount > 0 && (
                    <div className="flex justify-between">
                        <span>Diskon</span>
                        <span>- {formatCurrency(transaction.discount)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-dashed border-black">
                    <span>TOTAL</span>
                    <span>{formatCurrency(transaction.total)}</span>
                </div>
                <div className="flex justify-between mt-2">
                    <span>Bayar ({transaction.paymentMethod === 'qris' ? 'QRIS' : 'TUNAI'})</span>
                    <span>{formatCurrency(transaction.paymentAmount)}</span>
                </div>
                {transaction.paymentAmount < transaction.total && (
                    <div className="flex justify-between font-bold text-red-600">
                        <span>Sisa Pembayaran</span>
                        <span>{formatCurrency(transaction.total - transaction.paymentAmount)}</span>
                    </div>
                )}
                {transaction.change > 0 && (
                    <div className="flex justify-between">
                        <span>Kembali</span>
                        <span>{formatCurrency(transaction.change)}</span>
                    </div>
                )}
            </div>

            {transaction.paymentHistory && transaction.paymentHistory.length > 1 && (
                <div className="text-[8px] border-t border-dashed border-black pt-2 mb-2">
                    <p className="font-bold mb-1 uppercase text-center">Riwayat Pembayaran:</p>
                    <div className="space-y-0.5">
                        {transaction.paymentHistory.map((p, idx) => (
                            <div key={idx} className="flex justify-between italic">
                                <span>- {new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })} ({p.note || 'Bayar'})</span>
                                <span>+ {formatCurrency(p.amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Total Poin Removed */}

            {transaction.note && (
                <div className="text-[9px] border-t border-dashed border-black pt-2 mb-2 italic text-center leading-tight">
                    <p>"{transaction.note}"</p>
                </div>
            )}
        </div>
    )
}
