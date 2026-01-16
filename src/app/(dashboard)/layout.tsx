import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Desktop Sidebar */}
            <div className="print:hidden">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 md:pl-64 transition-all duration-300">
                {/* Top spacer for mobile or just content wrapper */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <div className="print:hidden">
                <BottomNav />
            </div>
        </div>
    )
}
