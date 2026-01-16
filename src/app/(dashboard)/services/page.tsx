'use client'

import { useState, useEffect, useTransition } from 'react'
import { PlusIcon, TrashIcon, WrenchScrewdriverIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { getServices, createService, deleteService, toggleServiceStatus, updateService, type Service } from './actions'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import clsx from 'clsx'

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingService, setEditingService] = useState<Service | null>(null)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        startTransition(async () => {
            const data = await getServices()
            setServices(data)
        })
    }, [])

    function refreshData() {
        startTransition(async () => {
            const data = await getServices()
            setServices(data)
        })
    }

    async function handleDelete(id: string) {
        if (confirm('Hapus jasa ini?')) {
            await deleteService(id)
            refreshData()
        }
    }

    async function handleToggle(id: string, is_active: boolean) {
        await toggleServiceStatus(id, is_active)
        refreshData()
    }

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Jasa Servis</h1>
                    <p className="text-sm text-gray-500">Kelola daftar jasa bengkel</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover cursor-pointer"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Jasa Baru
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {services.map((service) => (
                        <li key={service.id} className="hover:bg-gray-50 transition-colors">
                            <div className="flex items-center px-4 py-4 sm:px-6">
                                <div className="flex-shrink-0">
                                    <span className="h-12 w-12 rounded-lg bg-orange-50 flex items-center justify-center">
                                        <WrenchScrewdriverIcon className="h-6 w-6 text-orange-600" />
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1 px-4">
                                    <p className="text-sm font-medium text-gray-900">{service.name}</p>
                                    <p className="text-sm text-primary font-bold">{formatCurrency(service.price)}</p>
                                    {service.description && (
                                        <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleToggle(service.id, service.is_active)}
                                        className={clsx(
                                            'px-3 py-1 rounded-full text-xs font-medium cursor-pointer',
                                            service.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'
                                        )}
                                    >
                                        {service.is_active ? 'Aktif' : 'Nonaktif'}
                                    </button>
                                    <button
                                        onClick={() => setEditingService(service)}
                                        className="p-2 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(service.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                    {services.length === 0 && !isPending && (
                        <li className="px-4 py-12 text-center text-gray-500">
                            <WrenchScrewdriverIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                            <p>Belum ada data jasa.</p>
                        </li>
                    )}
                </ul>
            </div>

            {isModalOpen && (
                <AddServiceModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false)
                        refreshData()
                    }}
                />
            )}

            {editingService && (
                <EditServiceModal
                    service={editingService}
                    onClose={() => setEditingService(null)}
                    onSuccess={() => {
                        setEditingService(null)
                        refreshData()
                    }}
                />
            )}
        </div>
    )
}

function AddServiceModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [state, formAction] = useActionState(createService, null)

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl sm:my-8 sm:w-full sm:max-w-md p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tambah Jasa Baru</h3>

                    <form action={async (formData) => { await formAction(formData) }} className="space-y-4">
                        {state?.error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{state.error}</p>}
                        {state?.success && (
                            <div className="text-green-600 text-sm bg-green-50 p-2 rounded">
                                Berhasil! {setTimeout(onSuccess, 500) && ""}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Jasa</label>
                            <input type="text" name="name" required className="input-std" placeholder="Ganti Oli, Servis Ringan, dll" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Harga (Rp)</label>
                            <input type="number" name="price" required className="input-std" placeholder="50000" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Barcode / Kode (Opsional)</label>
                            <input type="text" name="barcode" className="input-std" placeholder="Contoh: SER-01" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Keterangan (Opsional)</label>
                            <textarea name="description" rows={2} className="input-std" placeholder="Deskripsi singkat..."></textarea>
                        </div>

                        <div className="mt-6 flex gap-3 justify-end">
                            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
                            <SubmitButton />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

function EditServiceModal({ service, onClose, onSuccess }: { service: Service; onClose: () => void; onSuccess: () => void }) {
    const [state, formAction] = useActionState(updateService, null)

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl sm:my-8 sm:w-full sm:max-w-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Edit Jasa</h3>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                            <XMarkIcon className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <form action={async (formData) => { await formAction(formData) }} className="space-y-4">
                        <input type="hidden" name="id" value={service.id} />
                        {state?.error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{state.error}</p>}
                        {state?.success && (
                            <div className="text-green-600 text-sm bg-green-50 p-2 rounded">
                                Berhasil! {setTimeout(onSuccess, 500) && ""}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Jasa</label>
                            <input type="text" name="name" defaultValue={service.name} required className="input-std" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Harga (Rp)</label>
                            <input type="number" name="price" defaultValue={service.price} required className="input-std" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Barcode / Kode (Opsional)</label>
                            <input type="text" name="barcode" defaultValue={service.barcode || ''} className="input-std" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Keterangan (Opsional)</label>
                            <textarea name="description" defaultValue={service.description || ''} rows={2} className="input-std"></textarea>
                        </div>

                        <div className="mt-6 flex gap-3 justify-end">
                            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
                            <SubmitButton />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
        >
            {pending ? 'Menyimpan...' : 'Simpan'}
        </button>
    )
}
