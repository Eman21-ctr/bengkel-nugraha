'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { Cog6ToothIcon, BuildingStorefrontIcon, GiftIcon, UserCircleIcon, ArrowRightOnRectangleIcon, UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline'
import { getStoreProfile, updateStoreProfile, getPointConfig, updatePointConfig, getCurrentUser, logout } from './actions'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

import { getLoyaltyConfig, updateLoyaltyConfig } from './loyalty-actions'
import { getRoles, getPermissions, updateRolePermissions, type Role } from './role-actions'
import { getUsers, updateUserRole, createUser, toggleUserStatus, ensureAdminIsOwner, type UserData } from './user-actions'
import { ShieldCheckIcon, CheckIcon, UserPlusIcon, XMarkIcon, PencilSquareIcon, KeyIcon } from '@heroicons/react/24/outline'
import { updateMyProfile, updateMyPassword } from './my-account-actions'

type Tab = 'profile' | 'loyalty' | 'roles' | 'users' | 'employees' | 'account'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('profile')
    const [storeProfile, setStoreProfile] = useState({ name: '', address: '', phone: '', owner: '' })
    const [pointConfig, setPointConfig] = useState({ earn_per: 10000, earn_point: 1, redeem_value: 100 })
    const [loyaltyConfig, setLoyaltyConfig] = useState({ visits_required: 10, reward_name: '' })
    const [roles, setRoles] = useState<Role[]>([])
    const [allPermissions, setAllPermissions] = useState<any[]>([])
    const [user, setUser] = useState<any>(null)
    const [usersList, setUsersList] = useState<UserData[]>([])
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const fetchData = useCallback(() => {
        startTransition(async () => {
            const [profile, points, loyalty, roleData, permData, userData, usersData] = await Promise.all([
                getStoreProfile(),
                getPointConfig(),
                getLoyaltyConfig(),
                getRoles(),
                getPermissions(),
                getCurrentUser(),
                getUsers(),
                ensureAdminIsOwner() // Auto-promote current user if needed
            ])
            setStoreProfile(profile)
            setPointConfig(points)
            setLoyaltyConfig(loyalty || { visits_required: 10, reward_name: '' })
            setRoles(roleData || [])
            setAllPermissions(permData || [])
            setUser(userData)
            setUsersList(usersData as UserData[])
        })
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
        { id: 'profile', label: 'Profil Usaha', icon: BuildingStorefrontIcon },
        { id: 'loyalty', label: 'Loyalitas & Poin', icon: GiftIcon },
        { id: 'users', label: 'Pengguna (Login)', icon: UserGroupIcon },
        { id: 'employees', label: 'Karyawan', icon: UserGroupIcon }, // Use same or different icon
        { id: 'roles', label: 'Peran & Akses', icon: ShieldCheckIcon },
        { id: 'account', label: 'Akun Saya', icon: UserCircleIcon }
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
                        <p className="text-sm text-gray-500">Konfigurasi aplikasi dan profil usaha</p>
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
                    <StoreProfileForm initialData={storeProfile} onUpdate={fetchData} />
                )}
                {activeTab === 'loyalty' && (
                    <div className="space-y-12">
                        <PointConfigForm initialData={pointConfig} onUpdate={fetchData} />
                        <hr className="border-gray-100" />
                        <LoyaltyConfigForm initialData={loyaltyConfig} onUpdate={fetchData} />
                    </div>
                )}
                {activeTab === 'users' && (
                    <UserManagement users={usersList} roles={roles} onUpdate={fetchData} />
                )}
                {activeTab === 'employees' && (
                    <EmployeeManagement onUpdate={fetchData} />
                )}
                {activeTab === 'roles' && (
                    <RoleManagement roles={roles} allPermissions={allPermissions} onUpdate={fetchData} />
                )}
                {activeTab === 'account' && (
                    <AccountSection user={user} onLogout={handleLogout} />
                )}
            </div>
        </div>
    )
}

// Store Profile Form
function StoreProfileForm({ initialData, onUpdate }: { initialData: any; onUpdate: () => void }) {
    const [state, formAction] = useActionState(updateStoreProfile, null)

    useEffect(() => {
        if (state?.success) {
            onUpdate()
        }
    }, [state, onUpdate])

    return (
        <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Profil Usaha</h3>
            <form action={formAction} className="space-y-4 max-w-lg">
                {state?.error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{state.error}</p>}
                {state?.success && <p className="text-green-600 text-sm bg-green-50 p-2 rounded">✅ Tersimpan!</p>}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Usaha</label>
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
function PointConfigForm({ initialData, onUpdate }: { initialData: any; onUpdate: () => void }) {
    const [state, formAction] = useActionState(updatePointConfig, null)

    useEffect(() => {
        if (state?.success) {
            onUpdate()
        }
    }, [state, onUpdate])

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

// Loyalty Config Form
function LoyaltyConfigForm({ initialData, onUpdate }: { initialData: any; onUpdate: () => void }) {
    const [state, formAction] = useActionState(updateLoyaltyConfig, null)

    useEffect(() => {
        if (state?.success) {
            onUpdate()
        }
    }, [state, onUpdate])

    return (
        <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Program Loyalitas (Kunjungan)</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">Beri hadiah kepada pelanggan setia berdasarkan jumlah kunjungan mereka.</p>

            <form action={formAction} className="space-y-6 max-w-lg">
                {state?.error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100 font-bold">{state.error}</p>}
                {state?.success && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-xl border border-green-100 font-bold">✅ Program Loyalitas Diperbarui!</p>}

                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Simulasi Program:</p>
                    <p className="text-sm text-orange-900 font-bold leading-relaxed">
                        Member yang sudah berkunjung sebanyak <span className="text-orange-600 underline underline-offset-4 decoration-2">{initialData.visits_required} kali</span> (dan kelipatannya) akan mendapatkan <span className="text-orange-600">"{initialData.reward_name || 'Hadiah'}"</span> secara gratis.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Target Kunjungan</label>
                        <input type="number" name="visits_required" defaultValue={initialData.visits_required} placeholder="Contoh: 10" required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary transition-all" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nama Hadiah</label>
                        <input type="text" name="reward_name" defaultValue={initialData.reward_name} placeholder="Contoh: Gratis Ganti Oli" required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary transition-all" />
                    </div>
                </div>

                <SubmitButton label="Simpan Program" />
            </form>
        </div>
    )
}

// Role Management
function RoleManagement({ roles, allPermissions, onUpdate }: { roles: Role[]; allPermissions: any[]; onUpdate: () => void }) {
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (!selectedRole && roles.length > 0) {
            setSelectedRole(roles.find(r => r.name === 'Staff') || roles[0])
        }
    }, [roles, selectedRole])

    const handleTogglePermission = async (permCode: string) => {
        if (!selectedRole) return

        const currentPerms = selectedRole.permissions?.map(p => p.permission.code) || []
        let newPerms: string[]
        if (currentPerms.includes(permCode)) {
            newPerms = currentPerms.filter(c => c !== permCode)
        } else {
            newPerms = [...currentPerms, permCode]
        }

        setIsSaving(true)
        const res = await updateRolePermissions(selectedRole.id, newPerms)
        setIsSaving(false)

        if (res.success) {
            onUpdate()
            // Update local state for immediate feedback
            setSelectedRole({
                ...selectedRole,
                permissions: newPerms.map(code => ({ permission: { code } }))
            })
        }
    }

    if (!selectedRole) return <div className="p-12 text-center text-gray-500 font-bold italic">Memuat data peran...</div>

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Manajemen Hak Akses</h3>
            <p className="text-sm text-gray-500 mb-6">Atur menu dan fitur yang dapat diakses oleh setiap peran.</p>

            <div className="flex gap-4">
                <div className="w-48 space-y-2">
                    {roles.map(role => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role)}
                            className={clsx(
                                "w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-left",
                                selectedRole.id === role.id ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"
                            )}
                        >
                            {role.name}
                        </button>
                    ))}
                </div>

                <div className="flex-1 bg-gray-50/50 rounded-2xl border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="font-black text-primary text-sm uppercase tracking-wider italic">Hak Akses: {selectedRole.name}</h4>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{selectedRole.description || 'Tidak ada deskripsi'}</p>
                        </div>
                        {isSaving && <span className="text-[10px] font-black text-orange-500 animate-pulse uppercase tracking-widest">Menyimpan...</span>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {allPermissions.map(perm => {
                            const isGranted = selectedRole.permissions?.some(p => p.permission.code === perm.code)
                            return (
                                <button
                                    key={perm.id}
                                    onClick={() => handleTogglePermission(perm.code)}
                                    className={clsx(
                                        "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left group",
                                        isGranted
                                            ? "bg-white border-primary shadow-sm"
                                            : "bg-white border-transparent hover:border-gray-200 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-5 h-5 rounded-md flex items-center justify-center transition-colors",
                                        isGranted ? "bg-primary text-white" : "bg-gray-100 text-gray-300"
                                    )}>
                                        {isGranted && <CheckIcon className="w-4 h-4 stroke-[4]" />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight leading-none">{perm.name}</p>
                                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{perm.code}</p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

// Account Section
function AccountSection({ user, onLogout }: { user: any; onLogout: () => void }) {
    const [mode, setMode] = useState<'view' | 'edit-profile' | 'change-password'>('view')

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Akun Saya</h3>
                {mode === 'view' && (
                    <div className="flex gap-2">
                        <button onClick={() => setMode('edit-profile')} className="p-2 text-gray-500 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors" title="Edit Profil">
                            <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setMode('change-password')} className="p-2 text-gray-500 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors" title="Ganti Password">
                            <KeyIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
                {mode !== 'view' && (
                    <button onClick={() => setMode('view')} className="text-sm text-gray-500 hover:text-gray-700">
                        Batal
                    </button>
                )}
            </div>

            {mode === 'edit-profile' && (
                <EditProfileForm user={user} onSuccess={() => setMode('view')} />
            )}

            {mode === 'change-password' && (
                <ChangePasswordForm onSuccess={() => setMode('view')} />
            )}

            {mode === 'view' && user ? (
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCircleIcon className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-lg">{user.full_name || 'Admin'}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">
                                {user.role || 'admin'}
                            </span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer w-full justify-center sm:justify-start"
                        >
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                            <span className="font-medium">Keluar Aplikasi</span>
                        </button>
                    </div>
                </div>
            ) : mode === 'view' && (
                <p className="text-gray-500">Memuat data akun...</p>
            )}
        </div>
    )
}

function EditProfileForm({ user, onSuccess }: { user: any; onSuccess: () => void }) {
    const [state, formAction] = useActionState(updateMyProfile, null)
    useEffect(() => { if (state?.success) { alert('Profil berhasil diupdate!'); onSuccess() } }, [state, onSuccess])

    return (
        <form action={formAction} className="space-y-4 max-w-md">
            {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
                <input type="text" name="name" defaultValue={user?.full_name} className="input-std" required />
            </div>
            <SubmitButton label="Simpan Perubahan" />
        </form>
    )
}

function ChangePasswordForm({ onSuccess }: { onSuccess: () => void }) {
    const [state, formAction] = useActionState(updateMyPassword, null)
    useEffect(() => { if (state?.success) { alert('Password berhasil diganti!'); onSuccess() } }, [state, onSuccess])

    return (
        <form action={formAction} className="space-y-4 max-w-md">
            {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password Baru</label>
                <input type="password" name="password" className="input-std" required minLength={6} />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Konfirmasi Password</label>
                <input type="password" name="confirm" className="input-std" required minLength={6} />
            </div>
            <SubmitButton label="Ganti Password" />
        </form>
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

function UserManagement({ users, roles, onUpdate }: { users: UserData[]; roles: Role[]; onUpdate: () => void }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    const handleRoleChange = async (userId: string, roleId: string) => {
        if (!confirm('Ubah peran pengguna ini?')) return
        await updateUserRole(userId, roleId)
        onUpdate()
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Daftar Pengguna</h3>
                    <p className="text-sm text-gray-500">Kelola siapa saja yang bisa mengakses aplikasi ini.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-primary-hover shadow-sm transition-all"
                >
                    <UserPlusIcon className="w-4 h-4" />
                    Tambah User
                </button>
            </div>

            {isAddModalOpen && (
                <AddUserModal roles={roles} onClose={() => setIsAddModalOpen(false)} onSuccess={() => { setIsAddModalOpen(false); onUpdate(); }} />
            )}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Nama Lengkap</th>
                            <th className="px-6 py-3 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Peran (Role)</th>
                            <th className="px-6 py-3 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(u => (
                            <tr key={u.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-bold text-gray-900">{u.full_name}</div>
                                    <div className="text-xs text-gray-400">{u.id.substring(0, 8)}...</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        className="text-sm border-gray-200 rounded-lg focus:ring-primary focus:border-primary cursor-pointer"
                                        value={u.role_id || ''}
                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                        disabled={u.role_name === 'Owner'} // Prevent changing Owner role freely if needed, or check logic
                                    >
                                        <option value="" disabled>Pilih Role</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                    <div className="mt-1">
                                        {u.role_name === 'Owner' ? (
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[10px] font-bold uppercase">Pemilik</span>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Staf</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {u.role_name !== 'Owner' && (
                                        <button
                                            onClick={async () => {
                                                if (confirm(u.is_active ? 'Nonaktifkan user ini?' : 'Aktifkan user ini?')) {
                                                    await toggleUserStatus(u.id, !u.is_active)
                                                    onUpdate()
                                                }
                                            }}
                                            className={clsx(
                                                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors",
                                                u.is_active
                                                    ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                                                    : "bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700"
                                            )}
                                        >
                                            {u.is_active ? 'Aktif' : 'Nonaktif'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function AddUserModal({ roles, onClose, onSuccess }: { roles: Role[]; onClose: () => void; onSuccess: () => void }) {
    const [state, formAction] = useActionState(createUser, null)

    useEffect(() => {
        if (state?.success) {
            alert('User berhasil dibuat!')
            onSuccess()
        }
    }, [state, onSuccess])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Tambah Karyawan Baru</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form action={formAction} className="p-6 space-y-4">
                    {state?.error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium">{state.error}</div>}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
                        <input type="text" name="name" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" placeholder="Contoh: Budi Santoso" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nomor HP</label>
                        <input type="tel" name="phone" required pattern="[0-9]+" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" placeholder="Contoh: 08123456789" />
                        <p className="text-xs text-gray-500 mt-1">Karyawan akan login menggunakan nomor ini.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                        <input type="password" name="password" required minLength={6} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" placeholder="Minimal 6 karakter" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Peran (Role)</label>
                        <select name="roleId" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary">
                            <option value="">Pilih Role...</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-4">
                        <SubmitButton label="Buat Akun Karyawan" />
                    </div>
                </form>
            </div>
        </div>
    )
}

// --- NEW COMPONENT: EMPLOYEE MANAGEMENT ---
import { createEmployee, updateEmployee as updateEmployeeDB, toggleEmployeeStatus, getEmployees as getAllEmployeesDB } from './employee-actions'

function EmployeeManagement({ onUpdate }: { onUpdate: () => void }) {
    const [employees, setEmployees] = useState<any[]>([])
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingEmployee, setEditingEmployee] = useState<any | null>(null)
    const [isPending, setIsPending] = useState(false)

    useEffect(() => {
        const fetchEmployees = async () => {
            const data = await getAllEmployeesDB()
            setEmployees(data)
        }
        fetchEmployees()
    }, [])

    const handleToggle = async (id: string, current: boolean) => {
        if (!confirm(current ? 'Nonaktifkan karyawan ini?' : 'Aktifkan kembali?')) return
        await toggleEmployeeStatus(id, current)
        const data = await getAllEmployeesDB()
        setEmployees(data)
        onUpdate()
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Daftar Karyawan</h3>
                    <p className="text-sm text-gray-500">Data Mekanik, Operator, dan Kasir untuk pelacakan transaksi.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-primary-hover shadow-sm transition-all cursor-pointer"
                >
                    <PlusIcon className="w-4 h-4" />
                    Tambah Karyawan
                </button>
            </div>

            {isAddModalOpen && (
                <AddEmployeeModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={async () => {
                        setIsAddModalOpen(false);
                        const data = await getAllEmployeesDB();
                        setEmployees(data);
                        onUpdate();
                    }}
                />
            )}

            {editingEmployee && (
                <EditEmployeeModal
                    employee={editingEmployee}
                    onClose={() => setEditingEmployee(null)}
                    onSuccess={async () => {
                        setEditingEmployee(null);
                        const data = await getAllEmployeesDB();
                        setEmployees(data);
                        onUpdate();
                    }}
                />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map(emp => (
                    <div key={emp.id} className={clsx(
                        "p-5 rounded-2xl border transition-all flex items-center justify-between",
                        emp.is_active ? "bg-white border-gray-100 shadow-sm" : "bg-gray-50 border-gray-100 opacity-60"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className={clsx(
                                "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                                emp.position === 'Mekanik' ? "bg-orange-100" :
                                    emp.position === 'Operator' ? "bg-blue-100" : "bg-green-100"
                            )}>
                                {emp.position === 'Mekanik' ? '🔧' : emp.position === 'Operator' ? '🧽' : '💰'}
                            </div>
                            <div>
                                <p className="font-black text-gray-900 uppercase tracking-tight leading-none">{emp.name}</p>
                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{emp.position}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setEditingEmployee(emp)}
                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all cursor-pointer"
                                title="Edit Karyawan"
                            >
                                <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleToggle(emp.id, emp.is_active)}
                                className={clsx(
                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer",
                                    emp.is_active ? "border-green-200 text-green-600 bg-green-50" : "border-gray-200 text-gray-400 bg-gray-100"
                                )}
                            >
                                {emp.is_active ? 'Aktif' : 'Off'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function AddEmployeeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [state, formAction] = useActionState(createEmployee, null)

    useEffect(() => {
        if (state?.success) {
            alert('Karyawan berhasil ditambahkan!')
            onSuccess()
        }
    }, [state, onSuccess])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 uppercase italic">Tambah Karyawan Baru</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form action={formAction} className="p-6 space-y-5">
                    {state?.error && <div className="p-3 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-xl border border-red-100">{state.error}</div>}

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nama Lengkap</label>
                        <input type="text" name="name" required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary transition-all" placeholder="Nama karyawan..." />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Posisi / Jabatan</label>
                        <select name="position" required className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary transition-all">
                            <option value="Mekanik">Mekanik</option>
                            <option value="Operator">Operator</option>
                            <option value="Kasir">Kasir</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    <div className="pt-2">
                        <SubmitButton label="Simpan Karyawan" />
                    </div>
                </form>
            </div>
        </div>
    )
}

function EditEmployeeModal({ employee, onClose, onSuccess }: { employee: any; onClose: () => void; onSuccess: () => void }) {
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsPending(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        const position = formData.get('position') as string

        try {
            const result = await updateEmployeeDB(employee.id, name, position)
            if (result.success) {
                alert('Data karyawan berhasil diupdate!')
                onSuccess()
            } else {
                setError(result.error || 'Terjadi kesalahan')
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 uppercase italic">Edit Data Karyawan</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-xl border border-red-100">{error}</div>}

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nama Lengkap</label>
                        <input
                            type="text"
                            name="name"
                            required
                            defaultValue={employee.name}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary transition-all"
                            placeholder="Nama karyawan..."
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Posisi / Jabatan</label>
                        <select
                            name="position"
                            required
                            defaultValue={employee.position}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary transition-all"
                        >
                            <option value="Mekanik">Mekanik</option>
                            <option value="Operator">Operator</option>
                            <option value="Kasir">Kasir</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-4 bg-primary text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:shadow-none"
                        >
                            {isPending ? 'MENYIMPAN...' : 'UPDATE DATA KARYAWAN'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
