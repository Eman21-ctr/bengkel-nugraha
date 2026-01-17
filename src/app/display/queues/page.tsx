'use client'

import { useState, useEffect } from 'react'
import { getQueues, type Queue } from '../../(dashboard)/queues/actions'
import clsx from 'clsx'

export default function QueueDisplayPage() {
    const [queues, setQueues] = useState<Queue[]>([])
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const fetchQueues = async () => {
            const data = await getQueues()
            setQueues(data as Queue[])
        }
        fetchQueues()
        const interval = setInterval(fetchQueues, 5000) // Fast refresh for TV
        const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000)

        return () => {
            clearInterval(interval)
            clearInterval(clockInterval)
        }
    }, [])

    const waiting = queues.filter(q => q.status === 'Menunggu')
    const processing = queues.filter(q => q.status === 'Sedang Dilayani')

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans overflow-hidden flex flex-col">
            {/* Header Display */}
            <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-8">
                <div>
                    <h1 className="text-5xl font-black italic tracking-tighter text-blue-400">NUGRAHA BENGKEL & KAFE</h1>
                    <p className="text-xl font-bold text-gray-400 mt-2 tracking-[0.3em] uppercase">Status Antrean Pelanggan</p>
                </div>
                <div className="text-right">
                    <div className="text-6xl font-black tabular-nums tracking-tight">
                        {currentTime.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xl font-bold text-blue-500 uppercase tracking-widest mt-1">
                        {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Main Board */}
            <div className="flex-1 grid grid-cols-2 gap-12">
                {/* Right Panel - Processing (Now Working) */}
                <div className="space-y-8">
                    <div className="bg-blue-600 p-6 rounded-[40px] shadow-2xl shadow-blue-900/20 flex items-center justify-between">
                        <h2 className="text-3xl font-black uppercase tracking-tight">SEDANG DIKERJAKAN</h2>
                        <span className="bg-white/20 px-6 py-2 rounded-full text-xl font-black tabular-nums animate-pulse">
                            {processing.length}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {processing.map((queue, idx) => (
                            <div key={queue.id} className={clsx(
                                "p-8 rounded-[48px] bg-white/5 border-2 border-white/10 flex items-center justify-between",
                                idx === 0 && "ring-4 ring-blue-500 bg-blue-500/10 border-transparent shadow-2xl shadow-blue-500/10"
                            )}>
                                <div className="flex items-center gap-10">
                                    <div className="text-9xl font-black italic tracking-tighter text-blue-400">
                                        {queue.queue_number.slice(-3)}
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-black uppercase max-w-sm truncate text-white">
                                            {queue.member?.name || 'UMUM'}
                                        </h3>
                                        <p className="text-2xl font-bold text-gray-400 mt-2 tracking-widest font-mono">
                                            {queue.member?.vehicle_plate || '---'}
                                        </p>
                                    </div>
                                </div>
                                {idx === 0 && (
                                    <div className="bg-blue-600 px-8 py-4 rounded-3xl text-2xl font-black animate-bounce shadow-xl">
                                        WORKING...
                                    </div>
                                )}
                            </div>
                        ))}
                        {processing.length === 0 && (
                            <div className="h-64 flex items-center justify-center border-4 border-dashed border-white/5 rounded-[48px]">
                                <p className="text-3xl font-black text-white/10 uppercase tracking-[0.5em]">Belum Ada Pengerjaan</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Left Panel - Waiting List */}
                <div className="space-y-8">
                    <div className="bg-orange-600 p-6 rounded-[40px] shadow-2xl shadow-orange-900/20 flex items-center justify-between">
                        <h2 className="text-3xl font-black uppercase tracking-tight">DAFTAR TUNGGU</h2>
                        <span className="bg-white/20 px-6 py-2 rounded-full text-xl font-black tabular-nums">
                            {waiting.length}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {waiting.slice(0, 5).map(queue => (
                            <div key={queue.id} className="p-6 rounded-[32px] bg-white/5 border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-8">
                                    <div className="text-6xl font-black italic tracking-tighter text-orange-400">
                                        {queue.queue_number.slice(-3)}
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black uppercase truncate max-w-[250px]">
                                            {queue.member?.name || 'UMUM'}
                                        </h4>
                                        <p className="text-lg font-bold text-gray-500 tracking-widest font-mono uppercase">
                                            {queue.member?.vehicle_plate || '---'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-orange-500/50 text-xl font-black italic">WAITING</div>
                            </div>
                        ))}
                        {waiting.length > 5 && (
                            <div className="text-center py-4">
                                <p className="text-xl font-black text-gray-500 uppercase tracking-widest animate-pulse">
                                    + {waiting.length - 5} Antrean Lainnya
                                </p>
                            </div>
                        )}
                        {waiting.length === 0 && (
                            <div className="h-64 flex items-center justify-center border-4 border-dashed border-white/5 rounded-[48px]">
                                <p className="text-3xl font-black text-white/10 uppercase tracking-[0.5em]">Antrean Kosong</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer / Scrolling Text */}
            <div className="mt-12 bg-white/5 p-4 rounded-2xl border border-white/5 overflow-hidden whitespace-nowrap">
                <div className="inline-block animate-marquee text-xl font-black tracking-widest uppercase text-blue-400/80">
                    SELAMAT DATANG DI NUGRAHA BENGKEL & KAFE • NIKMATI KOPI KAMI SAMBIL MENUNGGU KENDARAAN ANDA DISERVIS • KEPUASAN ANDA ADALAH PRIORITAS KAMI • HARAP MENUNGGU NOMOR ANTREAN ANDA DIPANGGIL • TERIMA KASIH TELAH MEMILIH KAMI •
                </div>
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            `}</style>
        </div>
    )
}
