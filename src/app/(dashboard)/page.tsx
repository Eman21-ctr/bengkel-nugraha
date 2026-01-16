import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
  ShoppingCartIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  ArrowUpRightIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { getDashboardStats } from './actions'
import Link from 'next/link'
import clsx from 'clsx'

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const stats = await getDashboardStats()

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const quickActions = [
    { name: 'Kasir', href: '/transactions', icon: ShoppingCartIcon, color: 'bg-blue-500' },
    { name: 'Gudang', href: '/inventory', icon: CubeIcon, color: 'bg-orange-500' },
    { name: 'Servis', href: '/services', icon: WrenchScrewdriverIcon, color: 'bg-green-500' },
    { name: 'Member', href: '/members', icon: UserGroupIcon, color: 'bg-purple-500' },
  ]

  return (
    <div className="relative min-h-screen -m-4 md:-m-8 p-4 md:p-8 bg-slate-50/50 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-100/30 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto space-y-8 pb-20 md:pb-8">
        {/* Header with Glassmorphism feel */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-500 mt-1">Selamat datang kembali, <span className="text-primary font-semibold">{user.email?.split('@')[0]}</span></p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-white/50">
            <ClockIcon className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium text-gray-600">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </header>

        {/* Premium Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary to-blue-700 p-6 rounded-2xl shadow-lg shadow-blue-200 group transition-all hover:scale-[1.02]">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform">
              <BanknotesIcon className="w-24 h-24 text-white" />
            </div>
            <div className="relative">
              <h3 className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-2">Pemasukan Hari Ini</h3>
              <p className="text-4xl font-black text-white">{formatCurrency(stats.totalRevenue)}</p>

              <div className="flex items-center mt-4 text-blue-100 text-xs gap-2">
                <span className="bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                  <ArrowUpRightIcon className="w-3 h-3" />
                  Real-time
                </span>
                <div className="flex gap-4 ml-2 pl-4 border-l border-white/20">
                  <div className="flex flex-col">
                    <p className="text-[10px] text-blue-200 uppercase font-bold">Bengkel</p>
                    <p className="font-bold text-white text-sm">{formatCurrency(stats.bengkelSales)}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[10px] text-blue-200 uppercase font-bold">Kafe</p>
                    <p className="font-bold text-white text-sm">{formatCurrency(stats.kafeSales)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl transition-all border-l-4 border-l-orange-500">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Pesanan</h3>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <ShoppingCartIcon className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-4xl font-bold mt-2 text-gray-900">{stats.totalTransactions}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
                Status: Aktif Hari Ini
              </p>
            </div>
          </div>

          {/* Low Stock Card */}
          <div className={clsx(
            "p-6 rounded-2xl shadow-sm border flex flex-col justify-between hover:shadow-xl transition-all",
            stats.lowStockCount > 0
              ? "bg-red-50 border-red-100 border-l-4 border-l-red-500"
              : "bg-white border-gray-100 border-l-4 border-l-green-500"
          )}>
            <div>
              <div className="flex justify-between items-start">
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Stok Menipis</h3>
                <div className={clsx(
                  "p-2 rounded-lg",
                  stats.lowStockCount > 0 ? "bg-red-100" : "bg-green-100"
                )}>
                  <ExclamationTriangleIcon className={clsx(
                    "w-6 h-6",
                    stats.lowStockCount > 0 ? "text-red-600" : "text-green-600"
                  )} />
                </div>
              </div>
              <p className="text-4xl font-bold mt-2 text-gray-900">{stats.lowStockCount}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className={clsx(
                "text-xs font-medium",
                stats.lowStockCount > 0 ? "text-red-600" : "text-green-600"
              )}>
                {stats.lowStockCount > 0 ? 'Perlu Restock Segera!' : 'Stok Aman Terkendali'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Quick Actions */}
      <div className="md:hidden">
        <h3 className="text-sm font-bold text-gray-900 mb-4 px-1">Akses Cepat</h3>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="flex flex-col items-center gap-2"
            >
              <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg text-white", action.color)}>
                <action.icon className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Detailed List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-accent" />
              Alert Stok Menipis
            </h2>
            <Link href="/inventory" className="text-primary text-xs font-bold hover:underline">Lihat Semua</Link>
          </div>
          <div className="p-0">
            {stats.lowStockItems.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {stats.lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <CubeIcon className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.name}</p>
                        <p className="text-[10px] text-gray-500">Min. Stok: {item.min_stock} {item.unit}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-red-600">{item.stock}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">{item.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-12 flex flex-col items-center gap-2">
                <span className="text-4xl">🎉</span>
                <p className="text-sm font-medium">Mantap! Semua stok aman.</p>
              </div>
            )}
          </div>
        </div>

        {/* Banner / Info Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-center">
          <div className="absolute -bottom-10 -right-10 opacity-10">
            <WrenchScrewdriverIcon className="w-64 h-64" />
          </div>
          <h2 className="text-2xl font-bold mb-4 relative z-10">Tingkatkan Performa Bengkel & Kafe Anda 🚀</h2>
          <p className="text-gray-300 mb-6 text-sm leading-relaxed relative z-10">
            Kelola transaksi, pantau stok barang secara real-time, dan berikan layanan terbaik untuk pelanggan setia Anda.
          </p>
          <div className="flex gap-3 relative z-10">
            <Link href="/transactions" className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-primary/20">
              Buka Kasir Sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
    </div >
  )
}
