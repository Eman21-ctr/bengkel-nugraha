'use client'

import { useState, useEffect, useTransition } from 'react'
import {
    UserIcon,
    PlayIcon,
    CheckIcon,
    XMarkIcon,
    ClockIcon,
    PlusIcon,
    TrashIcon,
    TruckIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { getQueues, createQueue, updateQueueStatus, deleteQueue, type Queue, type QueueStatus } from './actions'
import { searchMembers } from '../transactions/actions'
import clsx from 'clsx'

export default function QueuesPage() {
    const [queues, setQueues] = useState<Queue[]>([])
    const [isPending, startTransition] = useTransition()
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [memberSearch, setMemberSearch] = useState('')
    const [memberResults, setMemberResults] = useState<any[]>([])

    // Load queues
    useEffect(() => {
        const fetchQueues = async () => {
            const data = await getQueues()
            setQueues(data as Queue[])
        }
        fetchQueues()

        // Auto refresh every 30 seconds
        const interval = setInterval(fetchQueues, 30000)
        return () => clearInterval(interval)
    }, [])

    function refreshData() {
        startTransition(async () => {
            const data = await getQueues()
            setQueues(data as Queue[])
        })
    }

    async function handleAddQueue(memberId?: string) {
        const res = await createQueue(memberId)
        if (res.success) {
            setIsAddModalOpen(false)
            setMemberSearch('')
            setMemberResults([])
            refreshData()
        } else {
            alert(res.error)
        }
    }

    async function handleUpdateStatus(id: string, status: QueueStatus) {
        const res = await updateQueueStatus(id, status)
        if (res.success) {
            refreshData()
        }
    }

    async function handleDelete(id: string) {
        if (confirm('Hapus antrean ini?')) {
            await deleteQueue(id)
            refreshData()
        }
    }

    // Member search for queue
    useEffect(() => {
        if (memberSearch.length >= 2) {
            const timer = setTimeout(async () => {
                const results = await searchMembers(memberSearch)
                setMemberResults(results)
            }, 300)
            return () => clearTimeout(timer)
        } else {
            setMemberResults([])
        }
    }, [memberSearch])

    const waiting = queues.filter(q => q.status === 'Menunggu')
    const processing = queues.filter(q => q.status === 'Sedang Dilayani')
    const done = queues.filter(q => q.status === 'Selesai')

    return (
        <div className="space-y-6 pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Antrean Bengkel</h1>
                    <p className="text-sm text-gray-500">Monitor & kelola antrean pelanggan hari ini</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg shadow-sm font-bold text-sm hover:bg-primary-hover transition-all"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Tambah Antrean
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Menunggu</span>
                    <span className="text-2xl font-black text-orange-600 tabular-nums">{waiting.length}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dikerjakan</span>
                    <span className="text-2xl font-black text-blue-600 tabular-nums">{processing.length}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Selesai</span>
                    <span className="text-2xl font-black text-green-600 tabular-nums">{done.length}</span>
                </div>
            </div>

            {/* Queue Board */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Processing Column */}
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                        Sedang Dikerjakan ({processing.length})
                    </h3>
                    <div className="space-y-3">
                        {processing.map(queue => (
                            <QueueCard key={queue.id} queue={queue} onUpdateStatus={handleUpdateStatus} onDelete={handleDelete} />
                        ))}
                        {processing.length === 0 && (
                            <div className="py-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <p className="text-xs font-bold text-gray-400 italic font-mono">--- BELUM ADA PENGERJAAN ---</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Waiting Column */}
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                        Daftar Tunggu ({waiting.length})
                    </h3>
                    <div className="space-y-3">
                        {waiting.map(queue => (
                            <QueueCard key={queue.id} queue={queue} onUpdateStatus={handleUpdateStatus} onDelete={handleDelete} />
                        ))}
                        {waiting.length === 0 && (
                            <div className="py-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <p className="text-xs font-bold text-gray-400 italic font-mono">--- TIDAK ADA ANTREAN ---</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Queue Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsAddModalOpen(false)}></div>
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative transform overflow-hidden rounded-[32px] bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                            <div className="bg-primary px-6 py-6 text-center text-white">
                                <h3 className="text-xl font-black italic tracking-tight uppercase">Tambah Antrean</h3>
                                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-0.5">Masukkan pelanggan ke barisan</p>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <button
                                        onClick={() => handleAddQueue()}
                                        className="w-full flex items-center justify-between p-4 bg-orange-50 border-2 border-orange-100 rounded-2xl text-left hover:bg-orange-100 transition-all group"
                                    >
                                        <div>
                                            <p className="text-sm font-black text-orange-700">Pelanggan Umum</p>
                                            <p className="text-[10px] font-bold text-orange-600 mt-0.5 uppercase tracking-wider">Tanpa Data Member</p>
                                        </div>
                                        <PlusIcon className="w-6 h-6 text-orange-400 group-hover:scale-110 transition-transform" />
                                    </button>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                            <div className="w-full border-t border-gray-100"></div>
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-white px-3 text-[10px] font-black text-gray-300 uppercase tracking-widest underline underline-offset-4">ATAU</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Cari Member (Nama/TP/Plat)..."
                                                className="w-full pl-9 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary transition-all"
                                                value={memberSearch}
                                                onChange={(e) => setMemberSearch(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                            {memberResults.map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => handleAddQueue(m.id)}
                                                    className="w-full flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-xl hover:bg-blue-50 transition-all text-left"
                                                >
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{m.name}</p>
                                                        <p className="text-[10px] font-bold text-primary italic uppercase tracking-wider">{m.vehicle_plate || m.phone}</p>
                                                    </div>
                                                    <PlusIcon className="w-5 h-5 text-primary" />
                                                </button>
                                            ))}
                                            {memberSearch.length >= 2 && memberResults.length === 0 && (
                                                <p className="text-center py-4 text-xs font-bold text-gray-400 italic">Member tidak ditemukan</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function QueueCard({ queue, onUpdateStatus, onDelete }: { queue: Queue, onUpdateStatus: (id: string, status: QueueStatus) => void, onDelete: (id: string) => void }) {
    return (
        <div className={clsx(
            "p-5 rounded-[24px] border transition-all",
            queue.status === 'Sedang Dilayani'
                ? "bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-100 ring-2 ring-blue-50 ring-offset-2"
                : "bg-white border-gray-100 text-gray-900 shadow-sm hover:border-gray-300"
        )}>
            <div className="flex justify-between items-start">
                <div className="flex gap-4">
                    <div className={clsx(
                        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-xl italic tracking-tighter",
                        queue.status === 'Sedang Dilayani' ? "bg-white/20 text-white" : "bg-orange-100 text-orange-600"
                    )}>
                        {queue.queue_number.slice(-3)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black uppercase tracking-tight leading-none overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px]">
                                {queue.member?.name || 'Pelanggan Umum'}
                            </h4>
                            {queue.member && (
                                <span className={clsx(
                                    "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                                    queue.status === 'Sedang Dilayani' ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                                )}>MEMBER</span>
                            )}
                        </div>
                        <p className={clsx(
                            "text-[10px] font-bold mt-1 uppercase tracking-wider",
                            queue.status === 'Sedang Dilayani' ? "text-white/80" : "text-gray-400"
                        )}>
                            {queue.member?.vehicle_plate || 'No Plat -'} • {queue.member?.vehicle_model || '-'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-1">
                    {queue.status === 'Menunggu' && (
                        <button
                            onClick={() => onUpdateStatus(queue.id, 'Sedang Dilayani')}
                            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 cursor-pointer"
                            title="Mulai Pengerjaan"
                        >
                            <PlayIcon className="w-5 h-5 fill-current" />
                        </button>
                    )}
                    {queue.status === 'Sedang Dilayani' && (
                        <button
                            onClick={() => onUpdateStatus(queue.id, 'Selesai')}
                            className="p-2 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors shadow-lg cursor-pointer"
                            title="Selesai"
                        >
                            <CheckIcon className="w-5 h-5 stroke-[4]" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(queue.id)}
                        className={clsx(
                            "p-2 rounded-xl transition-colors cursor-pointer",
                            queue.status === 'Sedang Dilayani' ? "text-white/40 hover:text-white" : "text-gray-300 hover:text-red-500"
                        )}
                        title="Hapus"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {queue.status === 'Sedang Dilayani' && (
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Teknisi sedang bekerja</span>
                    </div>
                    <ClockIcon className="w-4 h-4 text-white/40" />
                </div>
            )}
        </div>
    )
}
