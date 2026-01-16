'use client'

import React from 'react'

type ReceiptProps = {
    storeInfo: {
        name: string
        address: string
        phone: string
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
        } | null
    }
}

export function Receipt({ storeInfo, transaction }: ReceiptProps) {
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

    return (
        <div id="receipt-print" className="hidden print:block w-[80mm] p-4 text-black font-mono text-sm leading-tight bg-white">
            <div className="text-center border-b border-dashed border-black pb-2 mb-2">
                <h2 className="text-lg font-bold uppercase">{storeInfo.name}</h2>
                <p className="text-xs">{storeInfo.address}</p>
                <p className="text-xs">Telp: {storeInfo.phone}</p>
            </div>

            <div className="mb-2 text-xs">
                <div className="flex justify-between">
                    <span>No: {transaction.invoice}</span>
                    <span>{new Date(transaction.date).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tipe: {transaction.type.toUpperCase()}</span>
                    <span>{new Date(transaction.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>

            <div className="border-b border-dashed border-black mb-2">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-dashed border-black">
                            <th className="text-left font-normal py-1">Item</th>
                            <th className="text-right font-normal py-1">Qty</th>
                            <th className="text-right font-normal py-1">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transaction.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-1">
                                    {item.name}
                                    <div className="text-[10px] text-gray-600">@ {formatCurrency(item.price)}</div>
                                </td>
                                <td className="text-right py-1">{item.qty}</td>
                                <td className="text-right py-1">{formatCurrency(item.subtotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="space-y-1 text-xs mb-2">
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
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-black">
                    <span>TOTAL</span>
                    <span>{formatCurrency(transaction.total)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Bayar ({transaction.paymentMethod === 'qris' ? 'QRIS' : transaction.paymentMethod.toUpperCase()})</span>
                    <span>{formatCurrency(transaction.paymentAmount)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Kembali</span>
                    <span>{formatCurrency(transaction.change)}</span>
                </div>
            </div>

            {transaction.member && (
                <div className="text-[10px] border-t border-b border-dashed border-black py-1 mb-2">
                    <p>Member: {transaction.member.name}</p>
                    <p>Poin Baru: {transaction.member.points}</p>
                </div>
            )}

            <div className="text-center text-[10px] mt-4">
                <p>Terima Kasih Atas Kunjungan Anda</p>
                <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
            </div>
        </div>
    )
}
