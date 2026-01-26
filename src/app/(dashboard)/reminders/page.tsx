'use client'

import { useState, useEffect, useTransition } from 'react'
import {
    BellIcon,
    PaperAirplaneIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
    MagnifyingGlassIcon,
    FunnelIcon
} from '@heroicons/react/24/outline'
import { getReminders, updateReminderStatus, getReminderStats, type Reminder } from './actions'
import clsx from 'clsx'

export default function RemindersPage() {
    const [reminders, setReminders] = useState<Reminder[]>([])
    const [stats, setStats] = useState({ pending: 0, today: 0, overdue: 0, sent: 0 })
    const [filter, setFilter] = useState<'all' | 'pending' | 'sent'>('pending')
    const [search, setSearch] = useState('')
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        refreshData()
    }, [])

    const refreshData = () => {
        startTransition(async () => {
            const [data, s] = await Promise.all([getReminders(), getReminderStats()])
            setReminders(data)
            setStats(s)
        })
    }

    const filteredReminders = reminders.filter(r => {
        const matchesFilter = filter === 'all' || r.status === filter
        const matchesSearch =
            (r.member?.name || r.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.transaction?.invoice_number || '').toLowerCase().includes(search.toLowerCase())
        return matchesFilter && matchesSearch
    })

    const handleSendWhatsApp = (reminder: Reminder) => {
        const phone = reminder.member?.phone || reminder.customer_phone
        if (!phone) return alert('Nomor HP tidak ditemukan')

        const name = reminder.member?.name || reminder.customer_name || 'Pelanggan'
        const invoice = reminder.transaction?.invoice_number || ''

        let message = ''
        if (reminder.type === 'follow_up_3d') {
            message = `Halo Kak ${name}, kami dari Nugraha Bengkel. Menanyakan kabar kendaraannya setelah servis kemarin (Inv: ${invoice}), apakah sudah aman dan nyaman digunakan? Terima kasih.`
        } else {
            message = `Halo Kak ${name}, sekedar mengingatkan jadwal servis berkala/ganti oli untuk kendaraan Kakak sudah masuk waktunya (Unit terakhir Inv: ${invoice}). Silakan mampir ke Nugraha Bengkel ya Kak. Terima kasih.`
        }

        const encodedMsg = encodeURIComponent(message)
        const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodedMsg}`

        window.open(whatsappUrl, '_blank')

        // Mark as sent
        startTransition(async () => {
            await updateReminderStatus(reminder.id, 'sent')
            refreshData()
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 italic uppercase tracking-tighter">PENGINGAT LAYANAN</h1>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Kelola follow-up dan jadwal servis pelanggan</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard color="blue" label="Menunggu" value={stats.pending} icon={ClockIcon} />
                <StatCard color="orange" label="Hari Ini" value={stats.today} icon={BellIcon} />
                <StatCard color="red" label="Terlambat" value={stats.overdue} icon={ExclamationCircleIcon} />
                <StatCard color="green" label="Terkirim" value={stats.sent} icon={CheckCircleIcon} />
            </div>

            {/* Filters & Actions */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('pending')}
                        className={clsx(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            filter === 'pending' ? "bg-primary text-white shadow-lg shadow-blue-100" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        )}
                    >
                        Akan Dikirim <span className="ml-1 opacity-60">({stats.pending})</span>
                    </button>
                    <button
                        onClick={() => setFilter('sent')}
                        className={clsx(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            filter === 'sent' ? "bg-primary text-white shadow-lg shadow-blue-100" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        )}
                    >
                        Sudah Terkirim <span className="ml-1 opacity-60">({stats.sent})</span>
                    </button>
                </div>

                <div className="relative w-full md:w-72">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari pelanggan / invoice..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-[11px] font-bold text-gray-900 focus:ring-2 focus:ring-primary transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Reminder List */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                {isPending && reminders.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : filteredReminders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-300">
                        <BellIcon className="w-16 h-16 opacity-10 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada pengingat</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pelanggan</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Layanan</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Jadwal Kirim</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredReminders.map((reminder) => {
                                    const isOverdue = new Date(reminder.scheduled_date) < new Date() && reminder.status === 'pending'
                                    const scheduledDate = new Date(reminder.scheduled_date)
                                    const dateString = scheduledDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

                                    return (
                                        <tr key={reminder.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-black text-gray-900 uppercase">{reminder.member?.name || reminder.customer_name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 mt-0.5">{reminder.member?.phone || reminder.customer_phone}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={clsx(
                                                    "px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest",
                                                    reminder.type === 'follow_up_3d' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                                                )}>
                                                    {reminder.type === 'follow_up_3d' ? 'Follow Up' : 'Servis Berkala'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[10px] font-black text-primary uppercase">{reminder.transaction?.invoice_number}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className={clsx(
                                                    "text-[10px] font-black uppercase tracking-tight",
                                                    isOverdue ? "text-red-500" : "text-gray-600"
                                                )}>
                                                    {isOverdue ? `Terlambat (${dateString})` : dateString}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={clsx(
                                                    "inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em]",
                                                    reminder.status === 'sent' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                                )}>
                                                    {reminder.status === 'sent' ? 'Terkirim' : 'Menunggu'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {reminder.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleSendWhatsApp(reminder)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-900 shadow-xl shadow-blue-100 transition-all"
                                                    >
                                                        <PaperAirplaneIcon className="w-4 h-4 -rotate-45" /> Kirim WA
                                                    </button>
                                                )}
                                                {reminder.status === 'sent' && (
                                                    <div className="flex justify-end gap-2">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase italic">Sudah dipalu bos!</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

function StatCard({ color, label, value, icon: Icon }: { color: 'blue' | 'orange' | 'red' | 'green', label: string, value: number, icon: any }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100",
        red: "bg-red-50 text-red-600 border-red-100",
        green: "bg-green-50 text-green-600 border-green-100"
    }

    return (
        <div className={clsx("p-4 rounded-[2rem] border transition-all hover:scale-105", colors[color])}>
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-white/50 rounded-xl">
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
            <p className="text-3xl font-black italic tracking-tighter">{value}</p>
        </div>
    )
}
