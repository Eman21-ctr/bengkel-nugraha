'use client'

import { useState, useEffect, useTransition } from 'react'
import { Cog6ToothIcon, BuildingStorefrontIcon, GiftIcon, UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { getStoreProfile, updateStoreProfile, getPointConfig, updatePointConfig, getCurrentUser, logout } from './actions'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

type Tab = 'profile' | 'points' | 'account'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('profile')
    const [storeProfile, setStoreProfile] = useState({ name: '', address: '', phone: '', owner: '' })
    const [pointConfig, setPointConfig] = useState({ earn_per: 10000, earn_point: 1, redeem_value: 100 })
    const [user, setUser] = useState<any>(null)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    useEffect(() => {
        startTransition(async () => {
            const [profile, points, userData] = await Promise.all([
                getStoreProfile(),
                getPointConfig(),
                getCurrentUser()
            ])
            setStoreProfile(profile)
            setPointConfig(points)
            setUser(userData)
        })
    }, [])

    const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
        { id: 'profile', label: 'Profil Toko', icon: BuildingStorefrontIcon },
        { id: 'points', label: 'Konfigurasi Poin', icon: GiftIcon },
        { id: 'account', label: 'Akun', icon: UserCircleIcon }
    ]

    async function handleLogout() {
        if (confirm('Yakin ingin logout?')) {
            await logout()
            router.push('/login')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                    <Cog6ToothIcon className="w-8 h-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
                        <p className="text-sm text-gray-500">Konfigurasi aplikasi dan toko</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer',
                            activeTab === tab.id
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100'
                        )}
                    >
                        <tab.icon className="w-5 h-5" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {activeTab === 'profile' && (
                    <StoreProfileForm initialData={storeProfile} onUpdate={setStoreProfile} />
                )}
                {activeTab === 'points' && (
                    <PointConfigForm initialData={pointConfig} onUpdate={setPointConfig} />
                )}
                {activeTab === 'account' && (
                    <AccountSection user={user} onLogout={handleLogout} />
                )}
            </div>
        </div>
    )
}

// Store Profile Form
function StoreProfileForm({ initialData, onUpdate }: { initialData: any; onUpdate: (data: any) => void }) {
    const [state, formAction] = useActionState(updateStoreProfile, null)

    useEffect(() => {
        if (state?.success) {
            // Optionally reload data
        }
    }, [state])

    return (
        <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Profil Toko</h3>
            <form action={formAction} className="space-y-4 max-w-lg">
                {state?.error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{state.error}</p>}
                {state?.success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">✅ Tersimpan!</p>}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Toko</label>
                    <input type="text" name="name" defaultValue={initialData.name} required className="input-std" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Alamat</label>
                    <textarea name="address" defaultValue={initialData.address} rows={2} className="input-std"></textarea>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">No. Telepon</label>
                    <input type="text" name="phone" defaultValue={initialData.phone} className="input-std" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Pemilik</label>
                    <input type="text" name="owner" defaultValue={initialData.owner} className="input-std" />
                </div>

                <SubmitButton label="Simpan Profil" />
            </form>
        </div>
    )
}

// Point Config Form
function PointConfigForm({ initialData, onUpdate }: { initialData: any; onUpdate: (data: any) => void }) {
    const [state, formAction] = useActionState(updatePointConfig, null)

    return (
        <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Konfigurasi Poin</h3>
            <p className="text-sm text-gray-500 mb-6">Atur sistem reward poin untuk member.</p>

            <form action={formAction} className="space-y-4 max-w-lg">
                {state?.error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{state.error}</p>}
                {state?.success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">✅ Tersimpan!</p>}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 font-medium mb-3">📝 Rumus Poin:</p>
                    <p className="text-sm text-blue-700">
                        Setiap belanja <strong>Rp {initialData.earn_per?.toLocaleString('id-ID')}</strong> dapat{' '}
                        <strong>{initialData.earn_point} poin</strong>
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                        1 poin = <strong>Rp {initialData.redeem_value?.toLocaleString('id-ID')}</strong> untuk diskon
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Belanja (Rp)</label>
                        <input type="number" name="earn_per" defaultValue={initialData.earn_per} required className="input-std" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Dapat Poin</label>
                        <input type="number" name="earn_point" defaultValue={initialData.earn_point} required className="input-std" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nilai Tukar (Rp)</label>
                        <input type="number" name="redeem_value" defaultValue={initialData.redeem_value} required className="input-std" />
                    </div>
                </div>

                <SubmitButton label="Simpan Konfigurasi" />
            </form>
        </div>
    )
}

// Account Section
function AccountSection({ user, onLogout }: { user: any; onLogout: () => void }) {
    return (
        <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Akun Saya</h3>

            {user ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCircleIcon className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">{user.full_name || 'Admin'}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <p className="text-xs text-gray-400 mt-1">Role: {user.role || 'admin'}</p>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            ) : (
                <p className="text-gray-500">Memuat data akun...</p>
            )}
        </div>
    )
}

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
        >
            {pending ? 'Menyimpan...' : label}
        </button>
    )
}
