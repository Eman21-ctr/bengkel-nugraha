'use client'

import { useState, useEffect, useTransition } from 'react'
import {
    ChartBarIcon,
    BanknotesIcon,
    ShoppingCartIcon,
    WrenchScrewdriverIcon,
    ExclamationTriangleIcon,
    CubeIcon,
    UserIcon,
    EyeIcon,
    PrinterIcon,
    XMarkIcon,
    CheckCircleIcon,
    PlusIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'
import { Receipt } from '@/components/Receipt'
import { PaymentReceipt } from '@/components/PaymentReceipt'
import {
    getSalesSummary,
    getTopProducts,
    getTopServices,
    getLowStockProducts,
    getCategorySalesDetail,
    getStockMovements,
    getMemberReport,
    getDetailedTransactions,
    getTechnicianReport,
    type ReportPeriod
} from './actions'
import { getPaymentHistory, addPaymentRecord } from '../transactions/actions'
import { getStoreProfile } from '../settings/actions'
import clsx from 'clsx'

type ReportType = 'sales' | 'items' | 'stock' | 'member' | 'transactions' | 'technician'

export default function ReportsPage() {
    const [reportType, setReportType] = useState<ReportType>('sales')
    const [period, setPeriod] = useState<ReportPeriod>('today')
    const [customStart, setCustomStart] = useState('')
    const [customEnd, setCustomEnd] = useState('')

    const [summary, setSummary] = useState({
        totalSales: 0,
        totalTransactions: 0,
        bengkelSales: 0,
        kafeSales: 0,
        bengkelCount: 0,
        kafeCount: 0
    })
    const [categoryDetail, setCategoryDetail] = useState<{ bengkel: any[], kafe: any[] }>({ bengkel: [], kafe: [] })
    const [topProducts, setTopProducts] = useState<{ name: string; qty: number; revenue: number }[]>([])
    const [topServices, setTopServices] = useState<{ name: string; qty: number; revenue: number }[]>([])
    const [lowStock, setLowStock] = useState<{ id: string; name: string; stock: number; min_stock: number; unit: string }[]>([])
    const [stockMovements, setStockMovements] = useState<any[]>([])
    const [memberData, setMemberData] = useState<any>(null)
    const [transactions, setTransactions] = useState<any[]>([])
    const [technicianData, setTechnicianData] = useState<any[]>([])
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [selectedPaymentTx, setSelectedPaymentTx] = useState<any>(null)
    const [printingPayment, setPrintingPayment] = useState<any>(null)
    const [storeProfile, setStoreProfile] = useState({ name: '', address: '', phone: '' })

    const [isPending, startTransition] = useTransition()

    const loadData = () => {
        startTransition(async () => {
            if (reportType === 'sales') {
                const [summ, detail] = await Promise.all([
                    getSalesSummary(period, customStart, customEnd),
                    getCategorySalesDetail(period, customStart, customEnd)
                ])
                setSummary(summ)
                setCategoryDetail(detail)
            } else if (reportType === 'items') {
                const [prods, svcs] = await Promise.all([
                    getTopProducts(period, customStart, customEnd, 10),
                    getTopServices(period, customStart, customEnd, 10)
                ])
                setTopProducts(prods)
                setTopServices(svcs)
            } else if (reportType === 'stock') {
                const [movements, low] = await Promise.all([
                    getStockMovements(period, customStart, customEnd),
                    getLowStockProducts()
                ])
                setStockMovements(movements)
                setLowStock(low)
            } else if (reportType === 'member') {
                const data = await getMemberReport()
                setMemberData(data)
            } else if (reportType === 'transactions') {
                const data = await getDetailedTransactions(period, customStart, customEnd)
                setTransactions(data)
            } else if (reportType === 'technician') {
                const data = await getTechnicianReport(period, customStart, customEnd)
                setTechnicianData(data)
            }
        })
    }

    useEffect(() => {
        async function init() {
            const profile = await getStoreProfile()
            if (profile) setStoreProfile(profile)
        }
        init()
        loadData()
    }, [reportType, period, customStart, customEnd]) // Added period/dates for reactivity

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

    const handleExportExcel = () => {
        let data: any[] = []
        let filename = `Laporan_${reportType}_${period}`

        if (reportType === 'sales') {
            data = [
                ['RINGKASAN PENJUALAN'],
                ['Total Penjualan', summary.totalSales],
                ['Total Transaksi', summary.totalTransactions],
                ['Bengkel', summary.bengkelSales],
                ['Kafe', summary.kafeSales],
                [''],
                ['DETAIL BENGKEL'],
                ['Item', 'Qty', 'Total'],
                ...categoryDetail.bengkel.map(i => [i.name, i.qty, i.total]),
                [''],
                ['DETAIL KAFE'],
                ['Item', 'Qty', 'Total'],
                ...categoryDetail.kafe.map(i => [i.name, i.qty, i.total])
            ]
        } else if (reportType === 'transactions') {
            data = [
                ['No. Invoice', 'Tanggal', 'Tipe', 'Pelanggan', 'Kasir', 'Total', 'Metode'],
                ...transactions.map(t => [
                    t.invoice_number,
                    new Date(t.created_at).toLocaleString(),
                    t.type,
                    t.member?.name || 'Umum',
                    t.profiles?.full_name || 'Admin',
                    t.final_amount,
                    t.payment_method
                ])
            ]
        } else if (reportType === 'items') {
            data = [
                ['TOP 10 BARANG'],
                ['Nama', 'Qty Terjual', 'Revenue'],
                ...topProducts.map(p => [p.name, p.qty, p.revenue]),
                [''],
                ['TOP 10 JASA'],
                ['Nama', 'Qty', 'Revenue'],
                ...topServices.map(s => [s.name, s.qty, s.revenue])
            ]
        } else if (reportType === 'stock') {
            data = [
                ['RIWAYAT PERGERAKAN STOK'],
                ['Waktu', 'Item', 'Tipe', 'Qty', 'Awal', 'Akhir', 'Ket'],
                ...stockMovements.map(m => [
                    new Date(m.created_at).toLocaleString(),
                    m.product?.name,
                    m.type,
                    m.qty,
                    m.stock_before,
                    m.stock_after,
                    m.description
                ]),
                [''],
                ['STOK MENIPIS'],
                ['Nama', 'Stok', 'Min. Stok', 'Unit'],
                ...lowStock.map(l => [l.name, l.stock, l.min_stock, l.unit])
            ]
        } else if (reportType === 'member') {
            data = [
                ['STATISTIK MEMBER'],
                ['Total Member', memberData?.totalMembers],
                ['Aktif Bulan Ini', memberData?.activeCount],
                ['Poin Beredar', memberData?.totalPoints]
            ]
        }

        const ws = XLSX.utils.aoa_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Laporan")
        XLSX.writeFile(wb, `${filename}.xlsx`)
    }

    // Handle printing specific payment
    const handlePrintPayment = (payment: any, tx: any) => {
        setPrintingPayment({
            invoice: tx.invoice_number,
            date: new Date(payment.created_at),
            method: payment.payment_method,
            amount: Number(payment.amount),
            note: payment.note,
            totalBill: Number(tx.final_amount),
            paidSoFar: tx.payments.filter((p: any) => new Date(p.created_at) <= new Date(payment.created_at)).reduce((sum: number, p: any) => sum + Number(p.amount), 0),
            remaining: Number(tx.final_amount) - tx.payments.filter((p: any) => new Date(p.created_at) <= new Date(payment.created_at)).reduce((sum: number, p: any) => sum + Number(p.amount), 0),
            member: tx.member
        })
        setTimeout(() => {
            document.body.classList.add('is-printing-payment')
            window.print()
            setTimeout(() => {
                document.body.classList.remove('is-printing-payment')
                setPrintingPayment(null)
            }, 500)
        }, 300)
    }

    const handlePrintReceipt = () => {
        document.body.classList.add('is-printing-receipt')
        window.print()
        setTimeout(() => {
            document.body.classList.remove('is-printing-receipt')
        }, 500)
    }

    const periodOptions: { value: ReportPeriod; label: string }[] = [
        { value: 'today', label: 'Hari Ini' },
        { value: 'month', label: 'Bulan Ini' },
        { value: 'year', label: 'Tahun Ini' },
        { value: 'custom', label: 'Kustom' }
    ]

    const reportOptions: { value: ReportType; label: string }[] = [
        { value: 'sales', label: 'Laporan Penjualan' },
        { value: 'transactions', label: 'Laporan Transaksi' },
        { value: 'items', label: 'Laporan Per Item' },
        { value: 'stock', label: 'Laporan Stok' },
        { value: 'member', label: 'Laporan Member' },
        { value: 'technician', label: 'Laporan Teknisi' }
    ]

    return (
        <div className="space-y-6 pb-20 md:pb-8">
            {/* Header - Hidden on Print */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 space-y-4 print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
                        <p className="text-sm text-gray-500">Analisis data usaha Anda</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={loadData}
                            disabled={isPending}
                            className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            {isPending ? 'Memuat...' : 'Tampilkan'}
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center gap-2"
                        >
                            Export Excel
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t pt-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Jenis Laporan</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value as ReportType)}
                            className="w-full input-std text-black"
                        >
                            {reportOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Periode</label>
                        <div className="flex gap-2">
                            {periodOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPeriod(opt.value)}
                                    className={clsx(
                                        'flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer',
                                        period === opt.value
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {period === 'custom' && (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Dari</label>
                                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full input-std text-black text-xs" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Sampai</label>
                                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full input-std text-black text-xs" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Report Content */}
            <div className="printable-area">
                <div className="hidden print:block text-center mb-8">
                    <h1 className="text-2xl font-bold uppercase">{reportOptions.find(o => o.value === reportType)?.label}</h1>
                    <p className="text-gray-500">Filter: {periodOptions.find(o => o.value === period)?.label} ({customStart || '-'} s/d {customEnd || '-'})</p>
                    <hr className="my-4" />
                </div>

                {reportType === 'sales' && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <SummaryCard title="Total Penjualan" value={formatCurrency(summary.totalSales)} icon={BanknotesIcon} color="green" />
                            <SummaryCard title="Total Transaksi" value={summary.totalTransactions.toString()} icon={ShoppingCartIcon} color="blue" />
                            <SummaryCard title="Bengkel" value={formatCurrency(summary.bengkelSales)} subtitle={`${summary.bengkelCount} transaksi`} icon={WrenchScrewdriverIcon} color="orange" />
                            <SummaryCard title="Kafe" value={formatCurrency(summary.kafeSales)} subtitle={`${summary.kafeCount} transaksi`} icon={CubeIcon} color="purple" />
                        </div>

                        {/* Category Detail */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 bg-orange-50 border-b border-orange-100">
                                    <h3 className="font-bold text-orange-800 flex items-center gap-2">
                                        <WrenchScrewdriverIcon className="w-5 h-5" /> BENGKEL
                                    </h3>
                                </div>
                                <div className="p-4">
                                    <table className="w-full text-sm">
                                        <tbody className="divide-y divide-gray-100">
                                            {categoryDetail.bengkel.map(item => (
                                                <tr key={item.name} className="hover:bg-gray-50">
                                                    <td className="py-2 text-gray-600">{item.name}</td>
                                                    <td className="py-2 text-right font-medium text-gray-400">{item.qty}x</td>
                                                    <td className="py-2 text-right font-bold text-gray-900">{formatCurrency(item.total)}</td>
                                                </tr>
                                            ))}
                                            {categoryDetail.bengkel.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-gray-400">Belum ada data</td></tr>}
                                        </tbody>
                                        {categoryDetail.bengkel.length > 0 && (
                                            <tfoot>
                                                <tr className="border-t-2 border-orange-100">
                                                    <td colSpan={2} className="py-3 font-bold text-gray-900">Total Bengkel</td>
                                                    <td className="py-3 text-right font-bold text-orange-600 text-lg">{formatCurrency(summary.bengkelSales)}</td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 bg-purple-50 border-b border-purple-100">
                                    <h3 className="font-bold text-purple-800 flex items-center gap-2">
                                        <CubeIcon className="w-5 h-5" /> KAFE
                                    </h3>
                                </div>
                                <div className="p-4">
                                    <table className="w-full text-sm">
                                        <tbody className="divide-y divide-gray-100">
                                            {categoryDetail.kafe.map(item => (
                                                <tr key={item.name} className="hover:bg-gray-50">
                                                    <td className="py-2 text-gray-600">{item.name}</td>
                                                    <td className="py-2 text-right font-medium text-gray-400">{item.qty} item</td>
                                                    <td className="py-2 text-right font-bold text-gray-900">{formatCurrency(item.total)}</td>
                                                </tr>
                                            ))}
                                            {categoryDetail.kafe.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-gray-400">Belum ada data</td></tr>}
                                        </tbody>
                                        {categoryDetail.kafe.length > 0 && (
                                            <tfoot>
                                                <tr className="border-t-2 border-purple-100">
                                                    <td colSpan={2} className="py-3 font-bold text-gray-900">Total Kafe</td>
                                                    <td className="py-3 text-right font-bold text-purple-600 text-lg">{formatCurrency(summary.kafeSales)}</td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {reportType === 'items' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <ChartBarIcon className="w-6 h-6 text-yellow-500" /> TOP 10 BARANG TERLARIS
                            </h3>
                            <div className="space-y-4">
                                {topProducts.map((p, idx) => (
                                    <div key={p.name} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <span className={clsx("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs", idx < 3 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500")}>
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <p className="font-bold text-gray-800 group-hover:text-primary transition-colors">{p.name}</p>
                                                <p className="text-xs text-gray-400">{p.qty} terjual</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-gray-900">{formatCurrency(p.revenue)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <ChartBarIcon className="w-6 h-6 text-blue-500" /> TOP 10 JASA TERLARIS
                            </h3>
                            <div className="space-y-4">
                                {topServices.map((s, idx) => (
                                    <div key={s.name} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <span className={clsx("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs", idx < 3 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500")}>
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <p className="font-bold text-gray-800 group-hover:text-primary transition-colors">{s.name}</p>
                                                <p className="text-xs text-gray-400">{s.qty} kali</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-gray-900">{formatCurrency(s.revenue)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {reportType === 'stock' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800">Riwayat Pergerakan Stok</h3>
                                <span className="text-xs text-gray-500">{stockMovements.length} record</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Waktu</th>
                                            <th className="px-4 py-3 text-left">Item</th>
                                            <th className="px-4 py-3 text-center">Tipe</th>
                                            <th className="px-4 py-3 text-center">Qty</th>
                                            <th className="px-4 py-3 text-center">Sisa Stok</th>
                                            <th className="px-4 py-3 text-left">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-medium">
                                        {stockMovements.map(m => (
                                            <tr key={m.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                                                    {new Date(m.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-4 py-3 text-gray-900">{m.product?.name || 'Item Dihapus'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={clsx("px-2 py-0.5 rounded text-[10px] uppercase font-bold", m.type === 'in' ? 'bg-green-100 text-green-700' : m.type === 'out' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700')}>
                                                        {m.type === 'in' ? 'Masuk' : m.type === 'out' ? 'Keluar' : 'Adj'}
                                                    </span>
                                                </td>
                                                <td className={clsx("px-4 py-3 text-center font-bold", m.type === 'in' ? 'text-green-600' : 'text-red-600')}>
                                                    {m.type === 'in' ? '+' : '-'}{m.qty}
                                                </td>
                                                <td className="px-4 py-3 text-center text-gray-500">{m.stock_before} → {m.stock_after}</td>
                                                <td className="px-4 py-3 text-xs text-gray-500">{m.description || '-'}</td>
                                            </tr>
                                        ))}
                                        {stockMovements.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-gray-400">Belum ada pergerakan stok di periode ini</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {lowStock.length > 0 && (
                            <div className="bg-accent/5 border border-accent/20 rounded-xl p-6">
                                <h3 className="font-bold text-accent mb-4 flex items-center gap-2">
                                    <ExclamationTriangleIcon className="w-6 h-6" /> PERINGATAN STOK MENIPIS
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {lowStock.map(p => (
                                        <div key={p.id} className="bg-white p-3 rounded-lg border border-accent/10">
                                            <p className="text-xs font-bold text-gray-700 truncate">{p.name}</p>
                                            <p className="text-lg font-black text-accent">{p.stock} <span className="text-[10px] font-medium">{p.unit}</span></p>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-accent" style={{ width: `${(p.stock / p.min_stock) * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {reportType === 'member' && memberData && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <SummaryCard title="Total Member" value={memberData.totalMembers} icon={UserIcon} color="blue" />
                            <SummaryCard title="Aktif Bulan Ini" value={memberData.activeCount} icon={ShoppingCartIcon} color="green" />
                            <SummaryCard title="Poin Beredar" value={memberData.totalPoints.toLocaleString()} subtitle={`Setara ${formatCurrency(memberData.totalPoints * 100)}`} icon={BanknotesIcon} color="orange" />
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                                <ChartBarIcon className="w-5 h-5 text-primary" />
                                <h3 className="font-bold text-gray-800">Ranking Member Teraktif</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                                        <tr>
                                            <th className="px-4 py-3 text-center w-16">Rank</th>
                                            <th className="px-4 py-3 text-left">Nama Member</th>
                                            <th className="px-4 py-3 text-center">Poin</th>
                                            <th className="px-4 py-3 text-center">Kunjungan</th>
                                            <th className="px-4 py-3 text-left">No. HP</th>
                                            <th className="px-4 py-3 text-left">Bergabung</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {memberData.members.map((m: any, idx: number) => (
                                            <tr key={m.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4 text-center">
                                                    <span className={clsx(
                                                        "inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs",
                                                        idx === 0 ? "bg-yellow-100 text-yellow-700" :
                                                            idx === 1 ? "bg-gray-100 text-gray-600" :
                                                                idx === 2 ? "bg-orange-100 text-orange-700" : "text-gray-400"
                                                    )}>
                                                        {idx + 1}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="font-bold text-gray-900">{m.name}</p>
                                                    <p className="text-[10px] text-gray-400">ID: {m.id.substring(0, 8)}</p>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="font-black text-primary text-lg">{m.points}</span>
                                                    <p className="text-[10px] text-gray-400">pts</p>
                                                </td>
                                                <td className="px-4 py-4 text-center font-black text-gray-700">{m.visit_count || 0}x</td>
                                                <td className="px-4 py-4 font-mono text-gray-600">{m.phone}</td>
                                                <td className="px-4 py-4 text-gray-500 text-xs">
                                                    {new Date(m.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </td>
                                            </tr>
                                        ))}
                                        {memberData.members.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-gray-400">Belum ada data member</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {reportType === 'transactions' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800">Riwayat Transaksi Lengkap</h3>
                            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{transactions.length} Transaksi</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Waktu</th>
                                        <th className="px-6 py-4 text-left">No. Struk</th>
                                        <th className="px-6 py-4 text-left">Pelanggan</th>
                                        <th className="px-6 py-4 text-left">Kasir</th>
                                        <th className="px-6 py-4 text-center">Tipe</th>
                                        <th className="px-6 py-4 text-right">Total</th>
                                        <th className="px-6 py-4 text-center">Status Bayar</th>
                                        <th className="px-6 py-4 text-right text-red-500">Sisa</th>
                                        <th className="px-6 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {transactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4 text-gray-400 text-xs">
                                                {new Date(tx.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4 font-mono font-black text-gray-900">{tx.invoice_number}</td>
                                            <td className="px-6 py-4">
                                                <p className="text-gray-900">{tx.member?.name || '-'}</p>
                                                {tx.member?.vehicle_plate && <p className="text-[10px] text-gray-400 font-bold uppercase">{tx.member.vehicle_plate}</p>}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 italic">{tx.cashier?.full_name || '-'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={clsx("px-2 py-1 rounded text-[10px] uppercase font-black", tx.type === 'bengkel' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600')}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-gray-900">{formatCurrency(tx.final_amount)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={clsx(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter",
                                                    tx.payment_status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                )}>
                                                    {tx.payment_status || 'Lunas'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-red-500 text-xs">
                                                {tx.payment_status === 'Belum Lunas' ? formatCurrency(tx.final_amount - (tx.payment_amount || 0)) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => setSelectedTransaction(tx)}
                                                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                        title="Lihat Detail & Cetak"
                                                    >
                                                        <EyeIcon className="w-5 h-5" />
                                                    </button>
                                                    {tx.payment_status === 'Belum Lunas' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPaymentTx(tx)
                                                                setIsPaymentModalOpen(true)
                                                            }}
                                                            className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                                            title="Manajemen Pembayaran / Termin"
                                                        >
                                                            <BanknotesIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {transactions.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest bg-gray-50/30">
                                                Tidak Ada Data Transaksi
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Technician Report */}
                {reportType === 'technician' && (
                    <div className="space-y-6 animate-fade-in relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SummaryCard
                                title="Total Teknisi"
                                value={String(technicianData.length)}
                                icon={UserIcon}
                                color="blue"
                            />
                            <SummaryCard
                                title="Total Komisi"
                                value={formatCurrency(technicianData.reduce((sum, t) => sum + (Number(t.totalCommission) || 0), 0))}
                                icon={BanknotesIcon}
                                color="green"
                            />
                            <SummaryCard
                                title="Rata-rata Pekerjaan"
                                value={technicianData.length ? (technicianData.reduce((sum, t) => sum + t.totalJobs, 0) / technicianData.length).toFixed(1) : '0'}
                                icon={WrenchScrewdriverIcon}
                                color="orange"
                            />
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Teknisi</th>
                                        <th className="px-6 py-4 text-center">Posisi</th>
                                        <th className="px-6 py-4 text-center">Jml Pekerjaan</th>
                                        <th className="px-6 py-4 text-right">Total Komisi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {technicianData.map(tech => (
                                        <tr key={tech.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs uppercase">
                                                        {tech.name?.substring(0, 2) || '??'}
                                                    </div>
                                                    <span className="text-gray-900 font-black">{tech.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase">
                                                    {tech.position}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-black text-gray-900">{tech.totalJobs} Servis</td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-blue-600 font-black">{formatCurrency(tech.totalCommission)}</p>
                                            </td>
                                        </tr>
                                    ))}
                                    {technicianData.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest bg-gray-50/30">
                                                Belum ada data pekerjaan teknisi
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Detailed Audit Trail */}
                        {technicianData.length > 0 && (
                            <div className="mt-8 space-y-4">
                                <h3 className="text-sm font-black text-gray-900 uppercase italic tracking-tighter ml-2 flex items-center gap-2">
                                    <EyeIcon className="w-4 h-4 text-primary" /> Detail Audit Pekerjaan
                                </h3>
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                                    <table className="w-full text-xs">
                                        <thead className="bg-gray-50 text-gray-400 uppercase text-[9px] font-black">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Waktu</th>
                                                <th className="px-6 py-3 text-left">Teknisi</th>
                                                <th className="px-6 py-3 text-left">Jasa</th>
                                                <th className="px-6 py-3 text-left">Invoice</th>
                                                <th className="px-6 py-3 text-right">Nilai Jasa</th>
                                                <th className="px-6 py-3 text-right">Komisi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {technicianData.flatMap(t => t.history).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(item => (
                                                <tr key={item.id} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-3 text-gray-400">
                                                        {new Date(item.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="px-6 py-3 font-bold text-gray-700">{item.employee?.name}</td>
                                                    <td className="px-6 py-3 text-gray-900">{item.item_name}</td>
                                                    <td className="px-6 py-3 font-mono text-gray-500">{item.transaction?.invoice_number}</td>
                                                    <td className="px-6 py-3 text-right text-gray-600 font-bold">{formatCurrency(item.subtotal)}</td>
                                                    <td className="px-6 py-3 text-right font-black text-blue-600">{formatCurrency(item.commission_amount || 0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Receipt Modal */}
            {selectedTransaction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2rem] p-6 max-w-lg w-full animate-bounce-in shadow-2xl my-auto relative">
                        <button
                            onClick={() => setSelectedTransaction(null)}
                            className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-all"
                        >
                            <XMarkIcon className="w-6 h-6 text-gray-400" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <ShoppingCartIcon className="w-6 h-6 text-primary" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-xl font-black text-gray-900 leading-none italic uppercase tracking-tighter">DETAIL TRANSAKSI</h2>
                                <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest">{selectedTransaction.invoice_number}</p>
                            </div>
                        </div>

                        <div className="mb-6 bg-gray-50 p-2 rounded-2xl border-2 border-dashed border-gray-200">
                            <Receipt
                                showOnScreen={true}
                                storeInfo={storeProfile}
                                transaction={{
                                    invoice: selectedTransaction.invoice_number,
                                    date: new Date(selectedTransaction.created_at),
                                    type: selectedTransaction.type,
                                    items: selectedTransaction.items.map((it: any) => ({
                                        ...it,
                                        name: it.item_name,
                                        price: Number(it.price),
                                        qty: it.qty,
                                        subtotal: Number(it.subtotal)
                                    })),
                                    subtotal: Number(selectedTransaction.final_amount) + Number(selectedTransaction.discount_amount),
                                    discount: Number(selectedTransaction.discount_amount),
                                    total: Number(selectedTransaction.final_amount),
                                    paymentMethod: selectedTransaction.payment_method,
                                    paymentAmount: Number(selectedTransaction.final_amount), // Simplified for re-print
                                    change: 0,
                                    member: selectedTransaction.member,
                                    cashier: selectedTransaction.cashier?.full_name,
                                    paymentHistory: selectedTransaction.payments
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={handlePrintReceipt}
                                className="flex items-center justify-center gap-2 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-primary/90 transition-all cursor-pointer shadow-lg shadow-primary/20"
                            >
                                <PrinterIcon className="w-5 h-5" /> CETAK ULANG STRUK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Receipt for Printing History */}
            {selectedTransaction && (
                <Receipt
                    storeInfo={storeProfile}
                    transaction={{
                        invoice: selectedTransaction.invoice_number,
                        date: new Date(selectedTransaction.created_at),
                        type: selectedTransaction.type,
                        items: selectedTransaction.items.map((it: any) => ({
                            ...it,
                            name: it.item_name,
                            price: Number(it.price),
                            qty: it.qty,
                            subtotal: Number(it.subtotal)
                        })),
                        subtotal: Number(selectedTransaction.final_amount) + Number(selectedTransaction.discount_amount),
                        discount: Number(selectedTransaction.discount_amount),
                        total: Number(selectedTransaction.final_amount),
                        paymentMethod: selectedTransaction.payment_method,
                        paymentAmount: Number(selectedTransaction.final_amount),
                        change: 0,
                        member: selectedTransaction.member,
                        cashier: selectedTransaction.cashier?.full_name,
                        paymentHistory: selectedTransaction.payments
                    }}
                />
            )}

            {/* Print Only Footer */}
            <div className="hidden print:block fixed bottom-0 left-0 right-0 text-[10px] text-gray-400 text-center pb-4">
                Dicetak pada {new Date().toLocaleString('id-ID')} | Nugraha Bengkel & Kios
            </div>

            {/* Payment History Modal */}
            {isPaymentModalOpen && selectedPaymentTx && (
                <PaymentHistoryModal
                    transaction={selectedPaymentTx}
                    onClose={() => {
                        setIsPaymentModalOpen(false)
                        setSelectedPaymentTx(null)
                        loadData() // Refresh data using the existing function
                    }}
                    onPrint={(p) => handlePrintPayment(p, selectedPaymentTx)}
                />
            )}

            {/* Hidden Payment Receipt for Printing */}
            {printingPayment && (
                <div className="hidden print:block">
                    <PaymentReceipt storeInfo={storeProfile} payment={printingPayment} />
                </div>
            )}
        </div>
    )
}

function SummaryCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color
}: {
    title: string
    value: string
    subtitle?: string
    icon: React.ComponentType<{ className?: string }>
    color: 'green' | 'blue' | 'orange' | 'purple'
}) {
    const colorClasses = {
        green: 'bg-green-50 text-green-600 border-green-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100'
    }

    return (
        <div className={clsx("bg-white rounded-xl shadow-sm border p-4", colorClasses[color].split(' ')[2])}>
            <div className="flex items-center gap-3 mb-2">
                <span className={clsx('p-2 rounded-lg', colorClasses[color].split(' ').slice(0, 2).join(' '))}>
                    <Icon className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold text-gray-500 uppercase">{title}</span>
            </div>
            <p className="text-xl font-black text-gray-900">{value}</p>
            {subtitle && <p className="text-[10px] font-medium text-gray-400 mt-1">{subtitle}</p>}
        </div>
    )
}

function PaymentHistoryModal({ transaction, onClose, onPrint }: { transaction: any, onClose: () => void, onPrint: (payment: any) => void }) {
    const [history, setHistory] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [amount, setAmount] = useState(0)
    const [method, setMethod] = useState('cash')
    const [note, setNote] = useState('')

    useEffect(() => {
        async function load() {
            const data = await getPaymentHistory(transaction.id)
            setHistory(data)
            setIsLoading(false)

            // Set default amount to remaining balance
            const paid = data.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
            const remainingAmt = Number(transaction.final_amount) - paid
            setAmount(remainingAmt > 0 ? remainingAmt : 0)
            setNote(paid === 0 ? 'DP / Pembayaran Awal' : 'Pelunasan')
        }
        load()
    }, [transaction])

    const handleAddPayment = async () => {
        if (amount <= 0) return
        setIsSaving(true)
        try {
            await addPaymentRecord({
                transaction_id: transaction.id,
                amount,
                payment_method: method,
                note
            })
            onClose()
        } catch (err) {
            alert('Gagal menyimpan pembayaran')
            console.error(err)
        }
        setIsSaving(false)
    }

    const totalPaid = history.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
    const remaining = Number(transaction.final_amount) - totalPaid

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-xl w-full animate-bounce-in shadow-2xl my-auto relative border border-gray-100">
                <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full transition-all">
                    <XMarkIcon className="w-6 h-6 text-gray-400" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                        <BanknotesIcon className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="text-left">
                        <h2 className="text-2xl font-black text-gray-900 leading-none italic uppercase tracking-tighter">Ringkasan Pembayaran</h2>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{transaction.invoice_number}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">TOTAL TAGIHAN</p>
                        <p className="text-xl font-black text-gray-900">{formatCurrency(transaction.final_amount)}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100">
                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">SISA PEMBAYARAN</p>
                        <p className="text-xl font-black text-orange-600">{remaining > 0 ? formatCurrency(remaining) : 'LUNAS'}</p>
                    </div>
                </div>

                <div className="space-y-6 mb-8">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Riwayat Pembayaran</h3>
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="text-center py-6 text-gray-400 italic text-xs">Memuat riwayat...</div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-6 text-gray-400 italic text-xs bg-gray-50 rounded-2xl">Belum ada riwayat pembayaran tercatat</div>
                        ) : (
                            history.map((p, idx) => (
                                <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl group hover:bg-white hover:shadow-md hover:border-gray-100 border border-transparent transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                        <div>
                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{p.note || `Termin ${idx + 1}`}</p>
                                            <p className="text-[9px] text-gray-400 font-bold">{new Date(p.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} • {p.payment_method.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-gray-900 text-sm">+{formatCurrency(p.amount)}</p>
                                        <button
                                            onClick={() => onPrint(p)}
                                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Cetak Kwitansi Pembayaran"
                                        >
                                            <PrinterIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {remaining > 0 && (
                    <div className="bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100">
                        <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 text-center">Input Pembayaran Baru</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">NOMINAL (RP)</label>
                                    <input
                                        type="number"
                                        value={amount || ''}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        className="w-full bg-white border-2 border-blue-100 rounded-2xl py-2.5 px-4 text-sm font-black text-blue-600 focus:border-blue-400 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">METODE</label>
                                    <select
                                        value={method}
                                        onChange={(e) => setMethod(e.target.value)}
                                        className="w-full bg-white border-2 border-blue-100 rounded-2xl py-2.5 px-4 text-sm font-bold text-gray-700 focus:border-blue-400 outline-none transition-all"
                                    >
                                        <option value="cash">TUNAI</option>
                                        <option value="qris">QRIS</option>
                                        <option value="transfer">TRANSFER</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">KETERANGAN (OPSIONAL)</label>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="DP / Pelunasan / Termin..."
                                    className="w-full bg-white border-2 border-blue-100 rounded-2xl py-2.5 px-4 text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:border-blue-400 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={handleAddPayment}
                                disabled={isSaving || amount <= 0}
                                className="w-full py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                            >
                                {isSaving ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <PlusIcon className="w-5 h-5" />}
                                SIMPAN PEMBAYARAN
                            </button>
                        </div>
                    </div>
                )}

                {remaining <= 0 && (
                    <div className="bg-green-50 p-6 rounded-[2.5rem] border border-green-100 text-center">
                        <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <h4 className="font-black text-green-700 uppercase tracking-widest">Transaksi Lunas</h4>
                        <p className="text-[10px] text-green-600 font-bold uppercase mt-1">Semua tagihan telah terbayar penuh</p>
                    </div>
                )}
            </div>
        </div>
    )
}
