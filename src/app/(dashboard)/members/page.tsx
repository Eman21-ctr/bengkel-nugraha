'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useFormStatus } from 'react-dom'
import {
    PlusIcon,
    MagnifyingGlassIcon,
    TrashIcon,
    UserIcon,
    PencilIcon,
    IdentificationIcon,
    PrinterIcon,
    XMarkIcon
} from '@heroicons/react/24/outline'
import { createMember, deleteMember, getMembers, updateMember } from './actions'
import { getStoreProfile } from '../settings/actions'
import { useActionState } from 'react'
import clsx from 'clsx'
import { MemberCard } from '@/components/MemberCard'

type Member = {
    id: string
    member_code: string
    name: string
    phone: string
    vehicle_plate: string | null
    vehicle_type: 'R2' | 'R3' | 'R4' | null
    vehicle_size: 'Kecil' | 'Sedang' | 'Besar' | 'Jumbo' | null
    vehicle_model: string | null
    stnk_photo_url: string | null
    visit_count: number
    points: number
    join_date: string
}

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingMember, setEditingMember] = useState<Member | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [isPending, startTransition] = useTransition()
    const [storeInfo, setStoreInfo] = useState({ name: '', address: '', phone: '' })
    const [selectedMemberForCard, setSelectedMemberForCard] = useState<Member | null>(null)

    // Initial load
    useEffect(() => {
        startTransition(async () => {
            const [data, profile] = await Promise.all([
                getMembers(),
                getStoreProfile()
            ])
            setMembers(data as Member[])
            setStoreInfo(profile)
        })
    }, [])

    // Search handler
    function handleSearch(term: string) {
        setSearchQuery(term)
        startTransition(async () => {
            const data = await getMembers(term)
            setMembers(data as Member[])
        })
    }

    // Delete handler
    async function handleDelete(id: string) {
        if (confirm('Yakin ingin menghapus member ini?')) {
            await deleteMember(id)
            const data = await getMembers(searchQuery)
            setMembers(data as Member[])
        }
    }

    const handlePrintCard = (member: Member) => {
        setSelectedMemberForCard(member)
        // Give time for state to update and component to render
        setTimeout(() => {
            document.body.classList.add('is-printing-member-card')
            window.print()
            document.body.classList.remove('is-printing-member-card')
        }, 300)
    }

    return (
        <div className="space-y-6">
            {/* Hidden printable cards */}
            {selectedMemberForCard && (
                <div className="hidden">
                    <MemberCard storeInfo={storeInfo} member={selectedMemberForCard} />
                </div>
            )}

            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Membership</h1>
                    <p className="text-sm text-gray-500">Kelola database pelanggan, kendaraan & loyalitas</p>
                </div>
                <button
                    onClick={() => {
                        setEditingMember(null)
                        setIsModalOpen(true)
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer transition-all"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Member Baru
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex gap-4 bg-gray-50/50">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                            placeholder="Scan Barcode atau Cari (Nama / HP / Nopol / Kode)..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Member</th>
                                <th scope="col" className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Kendaraan</th>
                                <th scope="col" className="px-6 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Visit</th>
                                <th scope="col" className="px-6 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Poin</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Aksi</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {members.map((member) => (
                                <tr key={member.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                    <span className="text-primary font-black text-xs">{member.member_code?.slice(-3) || '??'}</span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-black text-gray-900">{member.name}</div>
                                                <div className="text-xs font-bold text-primary tracking-tight">{member.member_code} • {member.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-bold">{member.vehicle_model || '-'}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-gray-100 text-gray-600 uppercase tabular-nums border border-gray-200">
                                                {member.vehicle_plate || '-'}
                                            </span>
                                            {member.vehicle_type && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-700 uppercase">
                                                    {member.vehicle_type} - {member.vehicle_size}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-800 tabular-nums">
                                            {member.visit_count || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-black text-green-600 tabular-nums">
                                        {member.points}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handlePrintCard(member)}
                                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                                                title="Cetak Kartu Member"
                                            >
                                                <IdentificationIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingMember(member)
                                                    setIsModalOpen(true)
                                                }}
                                                className="p-1 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                                                title="Edit Member"
                                            >
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(member.id)}
                                                className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                                title="Hapus Member"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden divide-y divide-gray-100">
                    {members.map((member) => (
                        <div key={member.id} className="p-4 active:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-primary font-black text-xs">{member.member_code?.slice(-3) || '??'}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 leading-tight">{member.name}</h3>
                                        <p className="text-[11px] font-bold text-primary mt-0.5">{member.member_code} • {member.phone}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handlePrintCard(member)}
                                        className="p-2 text-gray-300 hover:text-blue-600"
                                        title="Cetak Kartu"
                                    >
                                        <IdentificationIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingMember(member)
                                            setIsModalOpen(true)
                                        }}
                                        className="p-2 text-gray-300 hover:text-primary"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(member.id)}
                                        className="p-2 text-gray-300 hover:text-red-600"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-gray-100 text-gray-600 uppercase border border-gray-200">
                                    {member.vehicle_plate || '-'}
                                </span>
                                {member.vehicle_type && (
                                    <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-blue-50 text-blue-700 uppercase border border-blue-100">
                                        {member.vehicle_type} - {member.vehicle_size}
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <div className="bg-slate-50 p-2 rounded-xl border border-gray-100">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kunjungan</p>
                                    <p className="text-sm font-black text-orange-600">{member.visit_count || 0}x</p>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-xl border border-gray-100">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Poin Saya</p>
                                    <p className="text-sm font-black text-green-600">{member.points} Pts</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {members.length === 0 && !isPending && (
                    <div className="py-12 text-center">
                        <UserIcon className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-2 text-sm font-bold text-gray-900">Belum ada member</h3>
                        <p className="mt-1 text-sm text-gray-500">Mulai dengan menambahkan member baru.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <MemberModal
                    member={editingMember}
                    storeInfo={storeInfo}
                    onClose={() => {
                        setIsModalOpen(false)
                        setEditingMember(null)
                    }}
                    onSuccess={async () => {
                        setIsModalOpen(false)
                        setEditingMember(null)
                        const data = await getMembers(searchQuery)
                        setMembers(data as Member[])
                    }}
                />
            )}
        </div>
    )
}

function MemberModal({ member, storeInfo, onClose, onSuccess }: { member: Member | null, storeInfo: any, onClose: () => void, onSuccess: () => void }) {
    const [state, formAction] = useActionState(member ? updateMember : createMember, null)
    const { pending } = useFormStatus()
    const [vehicleType, setVehicleType] = useState(member?.vehicle_type || 'R2')
    const [showSuccessCard, setShowSuccessCard] = useState(false)
    const [newMemberCode, setNewMemberCode] = useState('')

    useEffect(() => {
        if (state?.success) {
            if (!member && state.member_code) {
                setNewMemberCode(state.member_code)
                setShowSuccessCard(true)
            } else {
                onSuccess()
            }
        }
    }, [state, onSuccess, member])

    const handlePrintNewCard = () => {
        const memberData = {
            name: (document.querySelector('input[name="name"]') as HTMLInputElement)?.value || '',
            member_code: newMemberCode,
            phone: (document.querySelector('input[name="phone"]') as HTMLInputElement)?.value || '',
            join_date: new Date().toISOString()
        }

        // This is a bit hacky but works for the success modal
        document.body.classList.add('is-printing-member-card')
        window.print()
        document.body.classList.remove('is-printing-member-card')
    }

    if (showSuccessCard) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onSuccess}></div>
                <div className="relative transform overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl transition-all w-full max-w-md text-center">
                    <div className="mb-6">
                        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <PlusIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">MEMBER TERDAFTAR!</h3>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-1">Kartu member siap dicetak</p>
                    </div>

                    <div className="flex justify-center mb-8 scale-90 sm:scale-100">
                        <MemberCard
                            storeInfo={storeInfo}
                            member={{
                                name: (document.querySelector('input[name="name"]') as HTMLInputElement)?.value || 'Member',
                                member_code: newMemberCode,
                                phone: (document.querySelector('input[name="phone"]') as HTMLInputElement)?.value || '-',
                                join_date: new Date().toISOString()
                            }}
                        />
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handlePrintNewCard}
                            className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                            <PrinterIcon className="w-5 h-5" /> CETAK KARTU MEMBER
                        </button>
                        <button
                            onClick={onSuccess}
                            className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all cursor-pointer"
                        >
                            SELESAI
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-[32px] bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div className="bg-primary px-6 py-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,1),transparent)]" />
                        <div className="mx-auto h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30">
                            {member ? <PencilIcon className="h-8 w-8 text-white" /> : <PlusIcon className="h-8 w-8 text-white" />}
                        </div>
                        <h3 className="mt-4 text-xl font-black text-white italic tracking-tight" id="modal-title">
                            {member ? 'EDIT DATA MEMBER' : 'PENDAFTARAN MEMBER'}
                        </h3>
                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">
                            {member ? 'Perbarui informasi pelanggan' : 'Lengkapi data kendaraan pelanggan'}
                        </p>
                    </div>

                    <form action={formAction} className="p-8 space-y-6">
                        {member && <input type="hidden" name="id" value={member.id} />}
                        {state?.error && (
                            <div className="text-red-600 text-xs font-bold text-center bg-red-50 p-3 rounded-xl border border-red-100 animate-shake">
                                ⚠️ {state.error}
                            </div>
                        )}
                        {/* Success state is handled by showSuccessCard effect now */}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nama Member</label>
                                <input type="text" name="name" defaultValue={member?.name} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary transition-all" placeholder="Nama Lengkap" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">No HP / WhatsApp</label>
                                <input type="tel" name="phone" defaultValue={member?.phone} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary transition-all" placeholder="0812..." />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Plat Nomor</label>
                                <input type="text" name="vehicle_plate" defaultValue={member?.vehicle_plate || ''} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary transition-all uppercase" placeholder="B 1234 XYZ" />
                            </div>
                        </div>

                        <div className="space-y-4 pt-2 border-t border-gray-100">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Foto STNK</label>
                                    <div className="flex items-center gap-4">
                                        <input type="file" name="stnk_photo" accept="image/*" className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" />
                                        {member?.stnk_photo_url && (
                                            <a href={member.stnk_photo_url} target="_blank" rel="noreferrer" className="text-[10px] font-black text-primary underline uppercase tracking-widest whitespace-nowrap">Lihat Foto</a>
                                        )}
                                    </div>
                                    <input type="hidden" name="member_code" value={member?.member_code || ''} />
                                </div>
                                <div className="col-span-2 grid grid-cols-3 gap-2">
                                    <label className="col-span-3 block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0 ml-1">Jenis Kendaraan</label>
                                    {['R2', 'R3', 'R4'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setVehicleType(type as any)}
                                            className={clsx(
                                                "py-2.5 rounded-xl text-xs font-black transition-all border-2",
                                                vehicleType === type
                                                    ? "bg-primary border-primary text-white shadow-lg shadow-blue-200"
                                                    : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                                            )}
                                        >
                                            {type === 'R2' ? '🏍️ R2' : type === 'R3' ? '🛺 R3' : '🚗 R4'}
                                        </button>
                                    ))}
                                    <input type="hidden" name="vehicle_type" value={vehicleType} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Ukuran</label>
                                    <select name="vehicle_size" defaultValue={member?.vehicle_size || 'Kecil'} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary transition-all">
                                        <option value="Kecil">Kecil</option>
                                        <option value="Sedang">Sedang</option>
                                        <option value="Besar">Besar</option>
                                        <option value="Jumbo">Jumbo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Merk / Tipe</label>
                                    <input type="text" name="vehicle_model" defaultValue={member?.vehicle_model || ''} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary transition-all" placeholder="Vario 150, dll" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-4 bg-gray-100 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={pending}
                                className="flex-[2] px-4 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 disabled:opacity-50 transition-all cursor-pointer"
                            >
                                {pending ? 'MEMPROSES...' : member ? 'SIMPAN PERUBAHAN' : 'DAFTAR SEKARANG'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
