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
    <div className="relative min-h-screen -m-4 md:-m-8 bg-white md:bg-slate-50/50 overflow-x-hidden">
      {/* BACKGROUND DECORATIVE (Desktop Only) */}
      <div className="hidden md:block">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-100/30 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* MOBILE HEADER (BCA Style) */}
      <div className="md:hidden relative bg-gradient-to-br from-blue-600 to-blue-500 pb-16 pt-8 px-6 rounded-b-[40px] shadow-xl shadow-blue-200/50 overflow-hidden">
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-white font-black text-xl tracking-tighter italic">BENGKEL<span className="text-blue-200">mobile</span></h2>
            <form action={async () => {
              'use server'
              const supabase = await createClient()
              await supabase.auth.signOut()
              redirect('/login')
            }}>
              <button className="bg-white/20 p-2 rounded-xl backdrop-blur-md active:bg-white/30 transition-colors">
                <ArrowUpRightIcon className="w-5 h-5 text-white rotate-45" />
              </button>
            </form>
          </div>
          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <p className="text-blue-100 text-xs font-medium uppercase tracking-widest leading-none">Selamat {greeting},</p>
              <h1 className="text-3xl font-black text-white tracking-tight leading-none capitalize">
                {user.email?.split('@')[0] || 'Nugraha'}
              </h1>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden shadow-lg p-0.5">
              <div className="w-full h-full bg-blue-400 rounded-full flex items-center justify-center">
                <span className="text-white font-black text-sm">{user.email?.charAt(0).toUpperCase()}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest">Pemasukan Hari Ini</p>
            <p className="text-3xl font-black text-white tabular-nums drop-shadow-md">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* DESKTOP CONTENT */}
      <div className="hidden md:block relative max-w-7xl mx-auto space-y-8 p-8">
        {/* Header with Premium Feel */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
              Selamat {greeting}, <span className="text-primary transition-colors hover:text-blue-700">Nugraha!</span>
            </h1>
            <p className="text-gray-500 text-lg font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Semoga usaha lancar hari ini
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Revenue Card - Premium White with Subtle Details */}
          <div className="relative overflow-hidden bg-white p-7 rounded-[32px] shadow-xl shadow-blue-100/50 group transition-all hover:translate-y-[-4px] border border-gray-100">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
                    <BanknotesIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-green-100 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                    <ArrowUpRightIcon className="w-3 h-3" /> Real-time
                  </span>
                </div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-1">Pemasukan Hari Ini</h3>
                <p className="text-4xl font-black text-gray-900 tracking-tight">{formatCurrency(stats.totalRevenue)}</p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 flex gap-6 text-xs">
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Bengkel</p>
                  <p className="font-extrabold text-gray-800">{formatCurrency(stats.bengkelSales)}</p>
                </div>
                <div className="w-px h-10 bg-gray-100" />
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Kafe</p>
                  <p className="font-extrabold text-blue-600">{formatCurrency(stats.kafeSales)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Card - Premium White */}
          <div className="bg-white p-7 rounded-[32px] shadow-xl shadow-orange-100/30 group border border-gray-100 hover:translate-y-[-4px] transition-all relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="bg-orange-500 p-3 rounded-2xl shadow-lg shadow-orange-200">
                    <ShoppingCartIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                </div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-1">Total Pesanan</h3>
                <p className="text-4xl font-black text-gray-900 tracking-tight">{stats.totalTransactions}</p>
              </div>
              <div className="mt-8">
                <div className="bg-orange-50/50 p-4 rounded-2xl flex items-center justify-between border border-orange-100/50">
                  <span className="text-[10px] font-black uppercase text-orange-700 tracking-wider">Aktifitas</span>
                  <span className="text-[10px] font-black text-orange-900 uppercase tracking-wider bg-white px-2 py-1 rounded-lg">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Card - Premium Dynamic Color */}
          <div className={clsx(
            "p-7 rounded-[32px] shadow-xl group border hover:translate-y-[-4px] transition-all relative overflow-hidden",
            stats.lowStockCount > 0
              ? "bg-red-50/50 border-red-100 shadow-red-100/30"
              : "bg-white border-gray-100 shadow-green-100/30"
          )}>
            <div className={clsx(
              "absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500",
              stats.lowStockCount > 0 ? "bg-red-100/50" : "bg-green-50/50"
            )} />
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className={clsx(
                    "p-3 rounded-2xl shadow-lg",
                    stats.lowStockCount > 0 ? "bg-red-500 shadow-red-200" : "bg-green-500 shadow-green-200"
                  )}>
                    <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-1">Stok Menipis</h3>
                <p className={clsx(
                  "text-4xl font-black tracking-tight",
                  stats.lowStockCount > 0 ? "text-red-700" : "text-gray-900"
                )}>{stats.lowStockCount}</p>
              </div>
              <div className="mt-8">
                <div className={clsx(
                  "p-4 rounded-2xl flex items-center justify-between border",
                  stats.lowStockCount > 0 ? "bg-red-100/50 border-red-200/50" : "bg-green-50/50 border-green-200/50"
                )}>
                  <span className={clsx(
                    "text-[10px] font-black uppercase tracking-widest",
                    stats.lowStockCount > 0 ? "text-red-700" : "text-green-700"
                  )}>
                    {stats.lowStockCount > 0 ? 'Perlu Restock' : 'Stok Aman'}
                  </span>
                  <Link href="/inventory" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Detail</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHARED CONTENT (Mobile Layout Optimized) */}
      <div className="relative max-w-7xl mx-auto space-y-6 px-6 -mt-10 md:mt-0 pb-12">
        {/* REVENUE BREAKDOWN CARD (Mobile Only) */}
        <div className="md:hidden bg-white p-6 rounded-[32px] shadow-xl shadow-gray-200/50 flex gap-6 text-center border border-gray-50">
          <div className="flex-1 space-y-1">
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none">Bengkel</p>
            <p className="font-extrabold text-gray-800 text-sm italic">{formatCurrency(stats.bengkelSales).replace('Rp', 'Rp ')}</p>
          </div>
          <div className="w-px h-10 bg-gray-100 self-center" />
          <div className="flex-1 space-y-1">
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none">Kafe</p>
            <p className="font-extrabold text-blue-600 text-sm italic">{formatCurrency(stats.kafeSales).replace('Rp', 'Rp ')}</p>
          </div>
        </div>

        {/* Premium Quick Actions */}
        <div className="space-y-4">
          <h3 className="hidden md:block text-xs font-bold text-gray-400 uppercase tracking-[0.2em] px-1 italic">Menu Transaksi Cepat</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="group relative flex flex-col items-center justify-center gap-3 p-6 bg-white border border-gray-100 rounded-[28px] shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all overflow-hidden active:scale-95"
              >
                <div className={clsx("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-current", action.color.replace('bg-', 'text-'))} />
                <div className={clsx("w-16 h-16 md:w-14 md:h-14 rounded-[22px] flex items-center justify-center shadow-lg text-white transition-transform group-hover:scale-110", action.color)}>
                  <action.icon className="w-8 h-8 md:w-7 md:h-7" />
                </div>
                <span className="text-xs md:text-[10px] font-black text-gray-700 uppercase tracking-widest">{action.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* PROMO BANNER & INFO (Shared, Layout Balanced) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Low Stock Detailed List (Desktop Only according to request) */}
          <div className="hidden md:block bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
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
          <div className="bg-[#1A1C1E] rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden flex flex-col justify-center shadow-2xl shadow-slate-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10">
              <div className="bg-white/10 backdrop-blur-md w-fit px-4 py-1.5 rounded-full border border-white/10 mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Pusat Bantuan</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-4 leading-tight tracking-tight">Semangat Terus 🔥 <br /><span className="text-blue-400 capitalize">Nugraha Bengkel & Kafe</span></h2>
              <p className="text-gray-400 mb-8 text-sm md:text-base leading-relaxed max-w-sm">
                Gunakan menu transaksi cepat untuk memproses pesanan pelanggan dengan lebih efisien.
              </p>
              <Link href="/transactions" className="inline-flex items-center gap-3 bg-blue-600 active:bg-blue-800 md:hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-500/20 group">
                Mulai Transaksi
                <ArrowUpRightIcon className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
