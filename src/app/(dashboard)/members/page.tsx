'use client'

import { useState, useTransition, useEffect } from 'react'
import { PlusIcon, MagnifyingGlassIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline'
import { createMember, deleteMember, getMembers } from './actions'
import { useActionState } from 'react'
import clsx from 'clsx'

type Member = {
    id: string
    name: string
    phone: string
    vehicle_plate: string | null
    points: number
    join_date: string
}

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isPending, startTransition] = useTransition()

    // Initial load
    useEffect(() => {
        startTransition(async () => {
            const data = await getMembers()
            setMembers(data)
        })
    }, [])

    // Search handler
    function handleSearch(term: string) {
        setSearchQuery(term)
        startTransition(async () => {
            const data = await getMembers(term)
            setMembers(data)
        })
    }

    // Delete handler
    async function handleDelete(id: string) {
        if (confirm('Yakin ingin menghapus member ini?')) {
            await deleteMember(id)
            // Refresh local list
            const data = await getMembers(searchQuery)
            setMembers(data)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Membership</h1>
                    <p className="text-sm text-gray-500">Kelola data pelanggan dan poin</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Member Baru
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex gap-4">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="Cari member (Nama / HP / Nopol)..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                </div>

                <ul className="divide-y divide-gray-200">
                    {members.map((member) => (
                        <li key={member.id} className="hover:bg-gray-50 transition-colors">
                            <div className="flex items-center px-4 py-4 sm:px-6">
                                <div className="min-w-0 flex-1 flex items-center">
                                    <div className="flex-shrink-0">
                                        <span className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <UserIcon className="h-6 w-6 text-primary" />
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-primary truncate">{member.name}</p>
                                            <p className="mt-1 flex items-center text-sm text-gray-500">
                                                <span className="truncate">{member.phone}</span>
                                                {member.vehicle_plate && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                        {member.vehicle_plate}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="hidden md:block">
                                            <div>
                                                <p className="text-sm text-gray-900">
                                                    Poin: <span className="font-bold text-green-600">{member.points}</span>
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Gabung: {new Date(member.join_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <button
                                        onClick={() => handleDelete(member.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                        title="Hapus Member"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            {/* Mobile Only Details */}
                            <div className="md:hidden px-4 pb-4">
                                <div className="text-sm text-gray-900">
                                    Poin: <span className="font-bold text-green-600">{member.points}</span>
                                </div>
                            </div>
                        </li>
                    ))}
                    {members.length === 0 && !isPending && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            Tidak ada member ditemukan.
                        </li>
                    )}
                </ul>
            </div>

            {/* Add Member Modal */}
            {isModalOpen && (
                <AddMemberModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={async () => {
                        setIsModalOpen(false)
                        const data = await getMembers(searchQuery)
                        setMembers(data)
                    }}
                />
            )}
        </div>
    )
}

function AddMemberModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [state, formAction] = useActionState(createMember, null)
    const { pending } = useFormStatusWrapper()

    // Effect to handle success inside component if needed, 
    // but standard useActionState pattern usually returns status.
    // For simplicity, we check state.success in render or useEffect.

    // Better pattern: Wrap form content
    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

            {/* Modal Panel - Centered */}
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg p-6">
                    <div>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <PlusIcon className="h-6 w-6 text-primary" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-5">
                            <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">Tambah Member Baru</h3>
                        </div>
                    </div>

                    <form action={async (formData) => {
                        await formAction(formData)
                        // Note: useActionState doesn't provide easy imperative success callback here easily without useEffect
                        // A workaround for this simple modal:
                        // We will check the result in a wrapped component or just simple handling
                    }} className="mt-5 sm:mt-6 space-y-4">
                        {state?.error && (
                            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                                {state.error}
                            </div>
                        )}
                        {state?.success && (
                            <div className="text-green-600 text-sm text-center bg-green-50 p-2 rounded">
                                Berhasil menambahkan member!
                                {setTimeout(() => onSuccess(), 500) && ""}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                            <input type="text" name="name" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-black" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">No HP</label>
                            <input type="tel" name="phone" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-black" placeholder="08..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Plat Nomor (Opsional)</label>
                            <input type="text" name="vehicle_plate" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-black" placeholder="B 1234 XYZ" />
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <SubmitButton />
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:col-start-1 sm:text-sm cursor-pointer"
                                onClick={onClose}
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

import { useFormStatus } from 'react-dom'

// Helper to access status
function useFormStatusWrapper() {
    return useFormStatus()
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:col-start-2 sm:text-sm disabled:opacity-50 cursor-pointer"
        >
            {pending ? 'Menyimpan...' : 'Simpan'}
        </button>
    )
}
