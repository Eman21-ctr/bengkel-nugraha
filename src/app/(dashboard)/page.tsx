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

  function getGreeting() {
    const hour = new Date().getHours()
    if (hour >= 4 && hour < 11) return 'Pagi'
    if (hour >= 11 && hour < 15) return 'Siang'
    if (hour >= 15 && hour < 19) return 'Sore'
    return 'Malam'
  }

  const greeting = getGreeting()

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
        {/* Header with Premium Feel */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Selamat {greeting}, <span className="text-primary transition-colors hover:text-blue-700">Nugraha!</span>
            </h1>
            <p className="text-gray-500 text-lg font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Semoga usaha lancar hari ini
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-blue-50 p-2 rounded-xl">
              <ClockIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider tabular-nums leading-none">Waktu Server</span>
              <span className="text-sm font-black text-gray-700 tabular-nums leading-none mt-1">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
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

      {/* Premium Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] px-1 italic">Menu Transaksi Cepat</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="group relative flex flex-col items-center justify-center gap-3 p-6 bg-white border border-gray-100 rounded-[24px] shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all overflow-hidden"
            >
              <div className={clsx("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-current", action.color.replace('bg-', 'text-'))} />
              <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg text-white transition-transform group-hover:scale-110", action.color)}>
                <action.icon className="w-7 h-7" />
              </div>
              <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Detailed List */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-7 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <h2 className="font-black text-gray-900 flex items-center gap-3 uppercase tracking-wider text-sm">
              <ExclamationTriangleIcon className="w-5 h-5 text-accent" />
              Alert Stok Menipis
            </h2>
            <Link href="/inventory" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline bg-blue-50 px-3 py-1.5 rounded-full">Lihat Semua</Link>
          </div>
          <div className="p-0">
            {stats.lowStockItems.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {stats.lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-6 hover:bg-blue-50/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                        <CubeIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Minimal: {item.min_stock} {item.unit}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-red-600 leading-none">{item.stock}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{item.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-16 flex flex-col items-center gap-3">
                <div className="bg-green-50 p-6 rounded-full">
                  <span className="text-5xl">🎉</span>
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Semua Stok Aman</p>
                  <p className="text-xs text-gray-500 font-medium">Bekerja dengan luar biasa!</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Premium Banner / Info Card */}
        <div className="bg-[#1A1C1E] rounded-[32px] p-10 text-white relative overflow-hidden flex flex-col justify-center shadow-2xl shadow-gray-200">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            <div className="bg-white/10 backdrop-blur-md w-fit px-4 py-1.5 rounded-full border border-white/10 mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Pro Feature</span>
            </div>
            <h2 className="text-3xl font-black mb-4 leading-tight tracking-tight">Tingkatkan Performa <br /><span className="text-blue-400 capitalize">Bengkel & Kafe Nugraha</span> Anda 🚀</h2>
            <p className="text-gray-400 mb-8 text-base leading-relaxed max-w-md">
              Kelola transaksi, pantau stok barang secara real-time, dan berikan layanan terbaik untuk pelanggan setia Anda.
            </p>
            <Link href="/transactions" className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-500/20 group">
              Buka Kasir Sekarang
              <ArrowUpRightIcon className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
