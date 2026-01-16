'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { getProducts } from '../../inventory/actions'
import { getServices } from '../../services/actions'
import { PrinterIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function MasterListBarcode() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            const [prods, svcs] = await Promise.all([
                getProducts(),
                getServices()
            ])

            const combined = [
                ...prods.map(p => ({ ...p, type: 'Product' })),
                ...svcs.map(s => ({ ...s, type: 'Service' }))
            ].filter(i => i.barcode) // Only show items with barcodes

            setItems(combined)
            setLoading(false)
        }
        loadData()
    }, [])

    if (loading) return <div className="p-8 text-center">Loading Master List...</div>

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header - Hidden on print */}
                <div className="flex items-center justify-between border-b pb-4 print:hidden">
                    <div className="flex items-center gap-4">
                        <Link href="/reports" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Master List Barcode</h1>
                            <p className="text-sm text-gray-500">Cetak lembar ini untuk discan di kasir</p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover shadow-sm transition-all"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        Cetak Sekarang
                    </button>
                </div>

                {/* Grid Barcode */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200 printable-area">
                    {items.map((item) => (
                        <div key={item.id} className="flex flex-col items-center p-4 border rounded-lg hover:border-primary transition-colors text-center break-inside-avoid">
                            <QRCodeSVG
                                value={item.barcode}
                                size={120}
                                level="H"
                                includeMargin={true}
                            />
                            <p className="mt-3 font-bold text-gray-900 text-sm line-clamp-2">{item.name}</p>
                            <p className="text-[10px] font-mono text-gray-500 mt-1 uppercase tracking-wider">{item.barcode}</p>
                            <span className="mt-2 px-2 py-0.5 bg-gray-100 text-[10px] text-gray-600 rounded-full uppercase font-medium">
                                {item.type}
                            </span>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            Belum ada item yang memiliki barcode. <br />
                            <span className="text-sm">Isi kolom barcode di menu Gudang atau Jasa terlebih dahulu.</span>
                        </div>
                    )}
                </div>

                {/* Instructions - Hidden on print */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 print:hidden">
                    <h4 className="text-blue-800 font-bold text-sm mb-1">Tips Cetak:</h4>
                    <ul className="text-blue-700 text-xs list-disc list-inside space-y-1">
                        <li>Gunakan kertas A4 untuk hasil terbaik.</li>
                        <li>Laminasi lembaran ini agar awet dan mudah dibersihkan dari noda kopi.</li>
                        <li>Pastikan printer dalam kondisi baik agar garis QR Code terbaca sempurna.</li>
                    </ul>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 10mm; }
                    body { background: white !important; }
                    .printable-area { 
                        box-shadow: none !important; 
                        border: none !important; 
                        padding: 0 !important;
                        grid-template-columns: repeat(4, 1fr) !important;
                    }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    )
}
