'use client'

import { useState, useEffect } from 'react'
import { Queue, getActiveQueues, updateQueueStatus } from '../app/(dashboard)/queues/actions'
import { PlusIcon, ClockIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

type QueueSidebarProps = {
    onSelectQueue: (queue: Queue) => void
    onCreateQueue: () => void
    selectedQueueId?: string
}

export default function QueueSidebar({ onSelectQueue, onCreateQueue, selectedQueueId }: QueueSidebarProps) {
    const [queues, setQueues] = useState<Queue[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadQueues()
        // Refresh every 5 seconds
        const interval = setInterval(loadQueues, 5000)
        return () => clearInterval(interval)
    }, [])

    async function loadQueues() {
        const data = await getActiveQueues()
        setQueues(data)
        setLoading(false)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Menunggu': return 'bg-blue-500'
            case 'Sedang Dilayani': return 'bg-yellow-500'
            default: return 'bg-gray-500'
        }
    }

    const getStatusEmoji = (status: string) => {
        switch (status) {
            case 'Menunggu': return '🔵'
            case 'Sedang Dilayani': return '🟡'
            default: return '⚪'
        }
    }

    return (
        <div className="h-full flex flex-col bg-white border-r border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Antrian Aktif</h3>
                    <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                        {queues.length}
                    </span>
                </div>
                <button
                    onClick={onCreateQueue}
                    className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span className="text-sm">Antrian Baru</span>
                </button>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center text-gray-400 text-sm">Memuat...</div>
                ) : queues.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">
                        Belum ada antrian
                    </div>
                ) : (
                    <div className="p-2 space-y-2">
                        {queues.map((queue) => (
                            <div
                                key={queue.id}
                                className={clsx(
                                    "p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md",
                                    selectedQueueId === queue.id
                                        ? "border-primary bg-blue-50"
                                        : "border-gray-200 bg-white hover:border-gray-300"
                                )}
                                onClick={() => onSelectQueue(queue)}
                            >
                                {/* Queue Number & Status */}
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-lg font-black text-primary">
                                        {queue.queue_number}
                                    </span>
                                    <span className="text-xs">
                                        {getStatusEmoji(queue.status)}
                                    </span>
                                </div>

                                {/* Member Info */}
                                <div className="mb-2">
                                    <p className="text-sm font-bold text-gray-900 truncate">
                                        {queue.member?.name || 'Umum'}
                                    </p>
                                    {queue.member?.vehicle_plate && (
                                        <p className="text-xs text-gray-500 font-mono">
                                            {queue.member.vehicle_plate}
                                        </p>
                                    )}
                                </div>

                                {/* Notes */}
                                {queue.notes && (
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                        {queue.notes}
                                    </p>
                                )}

                                {/* Status Badge */}
                                <div className="flex items-center justify-between">
                                    <span className={clsx(
                                        "text-xs font-bold px-2 py-1 rounded-full",
                                        queue.status === 'Menunggu' && "bg-blue-100 text-blue-700",
                                        queue.status === 'Sedang Dilayani' && "bg-yellow-100 text-yellow-700"
                                    )}>
                                        {queue.status}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onSelectQueue(queue)
                                        }}
                                        className="text-xs font-bold text-primary hover:text-blue-700 transition-colors"
                                    >
                                        Proses →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
