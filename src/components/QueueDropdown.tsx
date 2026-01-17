'use client'

import { useState, useEffect } from 'react'
import { Queue, getActiveQueues } from '../app/(dashboard)/queues/actions'
import { PlusIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

type QueueDropdownProps = {
    onSelectQueue: (queue: Queue | null) => void
    onCreateQueue: () => void
    selectedQueueId?: string
}

export default function QueueDropdown({ onSelectQueue, onCreateQueue, selectedQueueId }: QueueDropdownProps) {
    const [queues, setQueues] = useState<Queue[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadQueues()
        const interval = setInterval(loadQueues, 5000)
        return () => clearInterval(interval)
    }, [])

    async function loadQueues() {
        const data = await getActiveQueues()
        setQueues(data)
        setLoading(false)
    }

    const selectedQueue = queues.find(q => q.id === selectedQueueId)

    return (
        <div className="relative">
            <div className="flex gap-2">
                {/* Dropdown Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-1 bg-white border-2 border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-primary transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-700">
                            {selectedQueue ? selectedQueue.queue_number : 'Pilih Antrian'}
                        </span>
                        {selectedQueue && (
                            <span className="text-xs text-gray-500">
                                ({selectedQueue.member?.name || 'Umum'})
                            </span>
                        )}
                    </div>
                    <ChevronDownIcon className={clsx(
                        "w-5 h-5 text-gray-400 transition-transform",
                        isOpen && "rotate-180"
                    )} />
                </button>

                {/* New Queue Button */}
                <button
                    onClick={onCreateQueue}
                    className="bg-primary hover:bg-blue-700 text-white p-3 rounded-lg transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-400 text-sm">Memuat...</div>
                        ) : queues.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-sm">
                                Belum ada antrian
                            </div>
                        ) : (
                            <>
                                {/* Clear Selection */}
                                <button
                                    onClick={() => {
                                        onSelectQueue(null)
                                        setIsOpen(false)
                                    }}
                                    className="w-full p-3 text-left text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-100"
                                >
                                    Transaksi Baru (Tanpa Antrian)
                                </button>

                                {/* Queue List */}
                                {queues.map((queue) => (
                                    <button
                                        key={queue.id}
                                        onClick={() => {
                                            onSelectQueue(queue)
                                            setIsOpen(false)
                                        }}
                                        className={clsx(
                                            "w-full p-3 text-left border-b border-gray-100 hover:bg-blue-50 transition-colors",
                                            selectedQueueId === queue.id && "bg-blue-50"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-black text-primary">
                                                {queue.queue_number}
                                            </span>
                                            <span className={clsx(
                                                "text-xs font-bold px-2 py-0.5 rounded-full",
                                                queue.status === 'Menunggu' && "bg-blue-100 text-blue-700",
                                                queue.status === 'Sedang Dilayani' && "bg-yellow-100 text-yellow-700"
                                            )}>
                                                {queue.status}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">
                                            {queue.member?.name || 'Umum'}
                                        </p>
                                        {queue.member?.vehicle_plate && (
                                            <p className="text-xs text-gray-500 font-mono">
                                                {queue.member.vehicle_plate}
                                            </p>
                                        )}
                                        {queue.notes && (
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                                {queue.notes}
                                            </p>
                                        )}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
