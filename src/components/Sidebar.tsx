'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    HomeIcon,
    ShoppingCartIcon,
    CubeIcon,
    WrenchScrewdriverIcon,
    UserGroupIcon,
    DocumentChartBarIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    ClockIcon,
    BellIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

import { useState, useEffect } from 'react'
import { getMyPermissionsAction } from '@/app/(dashboard)/settings/role-actions'

const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, permission: '*' }, // Dashboard allowed for all or specific code
    { name: 'Transaksi', href: '/transactions', icon: ShoppingCartIcon, permission: 'menu:transactions' },
    { name: 'Inventory', href: '/inventory', icon: CubeIcon, permission: 'menu:inventory' },
    { name: 'Jasa', href: '/services', icon: WrenchScrewdriverIcon, permission: 'menu:services' },
    { name: 'Membership', href: '/members', icon: UserGroupIcon, permission: 'menu:members' },
    { name: 'Pengingat', href: '/reminders', icon: BellIcon, permission: 'menu:reports' }, // Using reports permission for now or *
    { name: 'Laporan', href: '/reports', icon: DocumentChartBarIcon, permission: 'menu:reports' },
    { name: 'Pengaturan', href: '/settings', icon: Cog6ToothIcon, permission: 'menu:settings' },
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [permissions, setPermissions] = useState<string[]>([])

    useEffect(() => {
        const fetchPerms = async () => {
            const perms = await getMyPermissionsAction()
            setPermissions(perms)
        }
        fetchPerms()
    }, [])

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const filteredNavigation = navigation.filter(item => {
        if (permissions.includes('*')) return true
        if (item.permission === '*') return true
        return permissions.includes(item.permission)
    })

    return (
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary text-center justify-center">
                    <h1 className="text-white font-black text-xl tracking-tighter italic">NUGRAHA <span className="text-blue-200">BENGKEL</span></h1>
                </div>
                <div className="flex-1 flex flex-col overflow-y-auto">
                    <nav className="flex-1 px-3 py-4 space-y-1">
                        {filteredNavigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={clsx(
                                        isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                        'group flex items-center px-3 py-2.5 text-sm font-black uppercase tracking-tight rounded-lg transition-all'
                                    )}
                                >
                                    <item.icon
                                        className={clsx(
                                            isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500',
                                            'mr-3 flex-shrink-0 h-5 w-5'
                                        )}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
                <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                    <button
                        onClick={handleLogout}
                        className="flex-shrink-0 w-full group block"
                    >
                        <div className="flex items-center">
                            <ArrowRightOnRectangleIcon className="inline-block h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                    Logout
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}
