'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    ChartBarIcon,
    ShoppingCartIcon,
    CubeIcon,
    UserGroupIcon,
    DocumentChartBarIcon,
    Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

const navigation = [
    { name: 'Home', href: '/', icon: ChartBarIcon },
    { name: 'Kasir', href: '/transactions', icon: ShoppingCartIcon },
    { name: 'Stok', href: '/inventory', icon: CubeIcon },
    { name: 'Setting', href: '/settings', icon: Cog6ToothIcon },
]

export default function BottomNav() {
    const pathname = usePathname()

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe-area">
            <div className="flex justify-around items-center h-16 px-1">
                {navigation.map((item) => {
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
                                    'text-[10px] font-medium',
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
