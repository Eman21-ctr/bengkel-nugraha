'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, PrinterIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { createQuickQueue } from '../app/(dashboard)/queues/actions'
import { getMembers } from '../app/(dashboard)/members/actions'
import { getStoreProfile } from '../app/(dashboard)/settings/actions'
import { QueueTicket } from './QueueTicket'

type QuickQueueModalProps = {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function QuickQueueModal({ isOpen, onClose, onSuccess }: QuickQueueModalProps) {
    const [members, setMembers] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedMemberId, setSelectedMemberId] = useState<string>('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [successData, setSuccessData] = useState<any>(null)
    const [storeInfo, setStoreInfo] = useState({ name: 'Nugraha Bengkel' })

    useEffect(() => {
        if (isOpen) {
            loadMembers()
            loadStoreInfo()
        } else {
            setSuccessData(null) // Reset on close
        }
    }, [isOpen])

    async function loadMembers() {
        const data = await getMembers()
        setMembers(data)
    }

    async function loadStoreInfo() {
        const data = await getStoreProfile()
        if (data) setStoreInfo({ name: data.name })
    }

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.vehicle_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone?.includes(searchTerm)
    )

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const result = await createQuickQueue(
            selectedMemberId || undefined,
            notes || undefined
        )

        setLoading(false)

        if (result.success) {
            setSuccessData(result.queue)
            onSuccess()
            // Reset fields for next time
            setSelectedMemberId('')
            setNotes('')
            setSearchTerm('')
        } else {
            alert(result.error || 'Gagal membuat antrian')
        }
    }

    const handlePrint = () => {
        document.body.classList.add('is-printing-ticket')
        window.print()
        setTimeout(() => {
            document.body.classList.remove('is-printing-ticket')
        }, 500)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col relative">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-black text-gray-900">{successData ? 'Nomor Antrean' : 'Antrian Baru'}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {!successData ? (
                    <>
                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Member Selection (Optional) */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Member (Opsional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Cari nama, plat nomor, atau HP..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                                />

                                {/* Member List */}
                                {searchTerm && (
                                    <div className="mt-2 max-h-48 overflow-y-auto border-2 border-gray-200 rounded-lg">
                                        {filteredMembers.length === 0 ? (
                                            <div className="p-3 text-sm text-gray-400 text-center">
                                                Tidak ada hasil
                                            </div>
                                        ) : (
                                            filteredMembers.slice(0, 5).map((member) => (
                                                <button
                                                    key={member.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedMemberId(member.id)
                                                        setSearchTerm(member.name)
                                                    }}
                                                    className="w-full p-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors cursor-pointer"
                                                >
                                                    <p className="text-sm font-bold text-gray-900">{member.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {member.vehicle_plate} • {member.phone}
                                                    </p>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Notes (Optional) */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Catatan / Keluhan (Opsional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Contoh: Ganti oli, tune up, rem bunyi..."
                                    rows={3}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none resize-none"
                                />
                            </div>

                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-700 font-bold">
                                    💡 Tip: Antrian bisa dibuat kosong. Detail bisa diisi saat pelanggan bayar.
                                </p>
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-200 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-primary hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? 'Membuat...' : 'Buat Antrian'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="p-8 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircleIcon className="w-12 h-12 text-green-500" />
                        </div>
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Berhasil Dibuat!</p>
                        <h1 className="text-6xl font-black text-primary mb-8 tracking-tighter">{successData.queue_number}</h1>

                        <div className="w-full grid grid-cols-2 gap-3">
                            <button
                                onClick={handlePrint}
                                className="flex flex-col items-center gap-2 py-4 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-3xl hover:bg-primary/90 transition-all cursor-pointer shadow-lg shadow-primary/20"
                            >
                                <PrinterIcon className="w-6 h-6" /> CETAK NOMOR
                            </button>
                            <button
                                onClick={onClose}
                                className="flex flex-col items-center gap-2 py-4 bg-gray-100 text-gray-600 font-black text-[10px] uppercase tracking-widest rounded-3xl hover:bg-gray-200 transition-all cursor-pointer"
                            >
                                <CheckCircleIcon className="w-6 h-6" /> SELESAI
                            </button>
                        </div>

                        {/* Printable Ticket */}
                        <QueueTicket
                            storeInfo={storeInfo}
                            queueNumber={successData.queue_number}
                            notes={successData.notes}
                            customerName={successData.member?.name}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
