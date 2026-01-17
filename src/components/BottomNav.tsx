'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    HomeIcon,
    ShoppingCartIcon,
    CubeIcon,
    UserGroupIcon,
    DocumentChartBarIcon,
    Cog6ToothIcon,
    ClockIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

import { useState, useEffect } from 'react'
import { getMyPermissionsAction } from '@/app/(dashboard)/settings/role-actions'

const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon, permission: '*' },
    { name: 'Kasir', href: '/transactions', icon: ShoppingCartIcon, permission: 'menu:transactions' },
    { name: 'Antrean', href: '/queues', icon: ClockIcon, permission: 'menu:queues' },
    { name: 'Stok', href: '/inventory', icon: CubeIcon, permission: 'menu:inventory' },
    { name: 'Setting', href: '/settings', icon: Cog6ToothIcon, permission: 'menu:settings' },
]

export default function BottomNav() {
    const pathname = usePathname()
    const [permissions, setPermissions] = useState<string[]>([])

    useEffect(() => {
        const fetchPerms = async () => {
            const perms = await getMyPermissionsAction()
            setPermissions(perms)
        }
        fetchPerms()
    }, [])

    const filteredNavigation = navigation.filter(item => {
        if (permissions.includes('*')) return true
        if (item.permission === '*') return true
        return permissions.includes(item.permission)
    })

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe-area z-[50]">
            <div className="flex justify-around items-center h-16 px-1">
                {filteredNavigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex flex-col items-center justify-center w-full h-full py-1"
                        >
                            <item.icon
                                className={clsx(
                                    'h-6 w-6 mb-0.5 transition-colors',
                                    isActive ? 'text-primary fill-current' : 'text-gray-400'
                                )}
                            />
                            <span
                                className={clsx(
                                    'text-[10px] font-black uppercase tracking-tighter',
                                    isActive ? 'text-primary' : 'text-gray-500'
                                )}
                            >
                                {item.name}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
