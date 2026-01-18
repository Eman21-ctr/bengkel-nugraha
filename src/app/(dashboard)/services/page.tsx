'use client'

import { useState, useEffect, useTransition } from 'react'
import { PlusIcon, TrashIcon, WrenchScrewdriverIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { getServices, createService, deleteService, toggleServiceStatus, updateService, getServicePrices, updateServicePrices, type Service, type ServicePrice } from './actions'
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
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{service.name}</p>
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
    const [activeTab, setActiveTab] = useState<'basic' | 'pricing'>('basic')
    const [customPrices, setCustomPrices] = useState<ServicePrice[]>(service.prices || [])
    const [isSavingPrices, setIsSavingPrices] = useState(false)

    const vehicleTypes = ['R2', 'R3', 'R4'] as const
    const vehicleSizes = ['Kecil', 'Sedang', 'Besar', 'Jumbo'] as const

    const handlePriceChange = (type: any, size: any, value: number) => {
        setCustomPrices(prev => {
            const existing = prev.find(p => p.vehicle_type === type && p.vehicle_size === size)
            if (existing) {
                return prev.map(p => p.vehicle_type === type && p.vehicle_size === size ? { ...p, price: value } : p)
            }
            return [...prev, { service_id: service.id, vehicle_type: type, vehicle_size: size, price: value }]
        })
    }

    const saveCustomPrices = async () => {
        setIsSavingPrices(true)
        const res = await updateServicePrices(service.id, customPrices)
        setIsSavingPrices(false)
        if (res.success) {
            alert('Harga khusus berhasil disimpan!')
            onSuccess() // Refresh data in parent
        } else {
            alert(`Gagal menyimpan harga khusus: ${res.error}`)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative transform overflow-hidden rounded-[32px] bg-white text-left shadow-2xl sm:my-8 sm:w-full sm:max-w-2xl">
                    {/* Header */}
                    <div className="bg-primary px-6 py-6 flex justify-between items-center text-white">
                        <div>
                            <h3 className="text-xl font-black italic tracking-tight uppercase">Edit Jasa Servis</h3>
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-0.5">{service.name}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 bg-gray-50/50">
                        <button
                            onClick={() => setActiveTab('basic')}
                            className={clsx(
                                "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === 'basic' ? "text-primary border-b-2 border-primary bg-white" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            Informasi Dasar
                        </button>
                        <button
                            onClick={() => setActiveTab('pricing')}
                            className={clsx(
                                "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === 'pricing' ? "text-primary border-b-2 border-primary bg-white" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            Harga Per Kendaraan
                        </button>
                    </div>

                    <div className="p-8">
                        {activeTab === 'basic' ? (
                            <form action={async (formData) => { await formAction(formData); onSuccess(); }} className="space-y-6">
                                <input type="hidden" name="id" value={service.id} />
                                {state?.error && <p className="text-red-600 text-xs font-bold bg-red-100 p-3 rounded-xl border border-red-200">{state.error}</p>}

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nama Jasa</label>
                                        <input type="text" name="name" defaultValue={service.name} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary transition-all" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Keterangan</label>
                                        <textarea name="description" defaultValue={service.description || ''} rows={2} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary transition-all"></textarea>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={onClose} className="flex-1 px-4 py-4 bg-gray-100 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Batal</button>
                                    <SubmitButton />
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">

                                <div className="overflow-hidden border border-gray-100 rounded-2xl shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Tipe & Ukuran</th>
                                                <th className="px-4 py-3 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest w-40">Harga (Rp)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-50">
                                            {vehicleTypes.map(type => (
                                                <>
                                                    <tr key={type} className="bg-gray-50/50">
                                                        <td colSpan={2} className="px-4 py-2 text-[10px] font-black text-primary uppercase bg-blue-50/30">
                                                            {type === 'R2' ? '🏍️ Motor (R2)' : type === 'R4' ? '🚗 Mobil (R4)' : '🛺 Roda Tiga (R3)'}
                                                        </td>
                                                    </tr>
                                                    {vehicleSizes.map(size => {
                                                        const p = customPrices.find(cp => cp.vehicle_type === type && cp.vehicle_size === size)
                                                        return (
                                                            <tr key={`${type}-${size}`}>
                                                                <td className="px-4 py-3 text-xs font-bold text-gray-600 pl-8">{size}</td>
                                                                <td className="px-4 py-3">
                                                                    <input
                                                                        type="number"
                                                                        placeholder={String(service.price)}
                                                                        value={p?.price || ''}
                                                                        onChange={(e) => handlePriceChange(type, size, Number(e.target.value))}
                                                                        className="w-full px-3 py-1.5 bg-gray-50 border-none rounded-lg text-xs font-black text-right focus:ring-2 focus:ring-primary"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={onClose} className="flex-1 px-4 py-4 bg-gray-100 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Selesai</button>
                                    <button
                                        type="button"
                                        onClick={saveCustomPrices}
                                        disabled={isSavingPrices}
                                        className="flex-[2] px-4 py-4 bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 shadow-xl shadow-orange-100 disabled:opacity-50 transition-all cursor-pointer"
                                    >
                                        {isSavingPrices ? 'MENYIMPAN...' : 'SIMPAN HARGA KHUSUS'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
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
