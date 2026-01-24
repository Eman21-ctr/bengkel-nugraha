'use client'

import { useState, useEffect, useTransition, useCallback, useActionState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    ShoppingCartIcon,
    WrenchScrewdriverIcon,
    PlusIcon,
    MinusIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    UserIcon,
    XMarkIcon,
    CheckCircleIcon,
    BanknotesIcon,
    QrCodeIcon,
    PrinterIcon,
    PencilIcon,
    CameraIcon
} from '@heroicons/react/24/outline'
import {
    getProductsForPOS,
    getServicesForPOS,
    searchMembers,
    getPointConfig,
    processTransaction,
    getMemberById,
    type CartItem,
    type TransactionType,
    type TransactionPayload,
    getEmployees
} from './actions'
import { getEligibleReward, claimReward } from '../settings/loyalty-actions'
import { getCategories, updateProduct, type Category } from '../inventory/actions'
import { updateService } from '../services/actions'
import { getStoreProfile } from '../settings/actions'
import { Receipt } from '@/components/Receipt'
import clsx from 'clsx'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { getItemByBarcode } from './actions'
import QueueSidebar from '@/components/QueueSidebar'
import QueueDropdown from '@/components/QueueDropdown'
import QuickQueueModal from '@/components/QuickQueueModal'
import { type Queue, linkQueueToTransaction } from '../queues/actions'

type Product = { id: string; name: string; category_id: string; price: number; cost_price: number; stock: number; min_stock: number; unit: string; barcode?: string | null }
type ServicePrice = { vehicle_type: string; vehicle_size: string; price: number }
type Service = { id: string; name: string; price: number; description?: string | null; barcode?: string | null; prices?: ServicePrice[] }
type Member = { id: string; name: string; phone: string; vehicle_plate: string | null; points: number; vehicle_type: string; vehicle_size: string; visit_count: number; member_code?: string }

export default function TransactionsPage() {
    // Transaction type
    const [txType, setTxType] = useState<TransactionType>('bengkel')

    // Data
    const [products, setProducts] = useState<Product[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [pointConfig, setPointConfig] = useState({ earn_per: 10000, earn_point: 1, redeem_value: 100 })
    const [storeProfile, setStoreProfile] = useState({ name: '', address: '', phone: '' })

    // Edit states
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [editingService, setEditingService] = useState<Service | null>(null)
    const [employees, setEmployees] = useState<any[]>([])
    const [activeEmployeeId, setActiveEmployeeId] = useState<string>('')
    const [userProfile, setUserProfile] = useState<any>(null)

    // Cart
    const [cart, setCart] = useState<CartItem[]>([])

    // Member
    const [memberSearch, setMemberSearch] = useState('')
    const [memberResults, setMemberResults] = useState<Member[]>([])
    const [selectedMember, setSelectedMember] = useState<Member | null>(null)
    const [eligibleReward, setEligibleReward] = useState<{ milestone: number; reward_name: string } | null>(null)
    const [pointsToUse, setPointsToUse] = useState(0)

    // Payment
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash')
    const [paymentAmount, setPaymentAmount] = useState<number>(0)
    const [receiptNote, setReceiptNote] = useState<string>('')
    const [showSuccess, setShowSuccess] = useState(false)
    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [selectedCashierName, setSelectedCashierName] = useState<string>('')

    const [isPending, startTransition] = useTransition()
    const [isProcessing, setIsProcessing] = useState(false)
    const [itemSearch, setItemSearch] = useState('')
    const [showMobileItems, setShowMobileItems] = useState(false)
    const [isScanning, setIsScanning] = useState(false)

    // Queue integration
    const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null)
    const [showQueueModal, setShowQueueModal] = useState(false)

    // General Customer Vehicle Selection
    const [selectingVehicleForService, setSelectingVehicleForService] = useState<Service | null>(null)
    const [vehicleChoice, setVehicleChoice] = useState<{ type: 'R2' | 'R3' | 'R4', size: 'Kecil' | 'Sedang' | 'Besar' | 'Jumbo' }>({ type: 'R2', size: 'Kecil' })

    // Load initial data
    useEffect(() => {
        async function initData() {
            console.log('POS: Initializing data...')
            try {
                const [prodData, svcData, ptConfig, profile, catData] = await Promise.all([
                    getProductsForPOS(),
                    getServicesForPOS(),
                    getPointConfig(),
                    getStoreProfile(),
                    getCategories()
                ])
                setProducts(prodData || [])
                setServices(svcData || [])
                setPointConfig({
                    earn_per: Number(ptConfig?.earn_per) || 10000,
                    earn_point: Number(ptConfig?.earn_point) || 1,
                    redeem_value: Number(ptConfig?.redeem_value) || 100
                })
                setStoreProfile(profile)
                setCategories(catData || [])
                const empData = await getEmployees()
                setEmployees(empData || [])

                // STICKY DEFAULTS LOGIC
                // 1. Recover Note
                const savedNote = localStorage.getItem('pos_receipt_note')
                if (savedNote) setReceiptNote(savedNote)

                // 2. Recover Cashier
                const savedCashier = localStorage.getItem('pos_cashier_name')

                const { data: { user } } = await createClient().auth.getUser()
                if (user) {
                    const { data: userP } = await createClient().from('profiles').select('full_name').eq('id', user.id).single()
                    setUserProfile(userP)

                    if (savedCashier) {
                        setSelectedCashierName(savedCashier)
                    } else {
                        // Default to logged-in user if no sticky value
                        setSelectedCashierName(userP?.full_name || 'Admin')
                    }
                } else if (savedCashier) {
                    setSelectedCashierName(savedCashier)
                }
            } catch (err) {
                console.error('POS: Initial load error', err)
            }
        }
        initData()
    }, [])

    const refreshData = () => {
        startTransition(async () => {
            const [prodData, svcData] = await Promise.all([
                getProductsForPOS(),
                getServicesForPOS()
            ])
            setProducts(prodData || [])
            setServices(svcData || [])
        })
    }

    // Search members - More sensitive (1 char, 150ms debounce)
    useEffect(() => {
        if (memberSearch.length >= 1) {
            const timer = setTimeout(async () => {
                const results = await searchMembers(memberSearch)
                setMemberResults(results)
            }, 50)
            return () => clearTimeout(timer)
        } else {
            setMemberResults([])
        }
    }, [memberSearch])

    // Calculations - Final hardening
    const cleanSubtotal = Number(cart.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0)) || 0
    const pointRate = Number(pointConfig?.redeem_value) || 100
    const pointsToUseSafe = Number(pointsToUse) || 0
    const pointDiscount = pointsToUseSafe * pointRate
    const finalTotal = Math.max(0, cleanSubtotal - (pointDiscount || 0))
    const cleanChange = (Number(paymentAmount) || 0) - finalTotal

    // Safe formatter
    const formatCurrency = (amount: any) => {
        const val = Number(amount)
        if (isNaN(val)) return 'Rp 0'
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val)
    }

    // Add item to cart
    const addToCart = useCallback((item: Product | Service, type: 'product' | 'service', customVehicle?: typeof vehicleChoice) => {
        const vehicleInfo = customVehicle || (selectedMember ? { type: selectedMember.vehicle_type as any, size: selectedMember.vehicle_size as any } : null)

        if (type === 'service' && !vehicleInfo) {
            setSelectingVehicleForService(item as Service)
            return
        }

        // If it's a service, maybe we want to auto-assign current active employee if selected
        const employee_id = (type === 'service') ? activeEmployeeId : undefined

        setCart(prev => {
            let price = Number(item.price) || 0

            // Apply special pricing for services
            if (type === 'service' && vehicleInfo) {
                const service = item as Service
                const customPrice = service.prices?.find(p =>
                    p.vehicle_type === vehicleInfo.type &&
                    p.vehicle_size === vehicleInfo.size
                )
                if (customPrice) {
                    price = Number(customPrice.price)
                    console.log(`POS: Applied dynamic price for ${service.name}: ${price}`)
                } else {
                    price = 0 // Pure tiered pricing: if no match, price is 0
                }
            }

            const existing = prev.find(c => c.id === item.id && c.type === type)
            if (existing) {
                return prev.map(c =>
                    c.id === item.id && c.type === type
                        ? { ...c, price: price, qty: c.qty + 1, subtotal: (c.qty + 1) * price }
                        : c
                )
            }
            return [...prev, {
                id: item.id,
                name: item.name,
                type,
                price: price,
                cost_price: Number('cost_price' in item ? item.cost_price : 0) || 0,
                qty: 1,
                subtotal: price,
                employee_id: employee_id
            }]
        })

        setSelectingVehicleForService(null)

        // Auto hide on mobile after add
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setShowMobileItems(false)
        }
    }, [selectedMember])

    // Scanner logic
    useEffect(() => {
        if (isScanning) {
            const scanner = new Html5QrcodeScanner(
                'reader',
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            )

            scanner.render(
                async (decodedText) => {
                    scanner.clear()
                    setIsScanning(false)
                    // Play bip sound if possible or visual feedback
                    const item = await getItemByBarcode(decodedText)
                    if (item) {
                        addToCart(item as any, item.type)
                    } else {
                        alert(`Barang dengan kode ${decodedText} tidak ditemukan`)
                    }
                },
                (error) => {
                    // console.warn(error)
                }
            )

            return () => {
                scanner.clear()
            }
        }
    }, [isScanning, addToCart])

    // Update cart qty
    const updateQty = (id: string, type: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id && item.type === type) {
                const newQty = Math.max(1, item.qty + delta)
                const price = Number(item.price) || 0
                return { ...item, qty: newQty, subtotal: newQty * price }
            }
            return item
        }))
    }

    // Remove from cart
    const removeFromCart = (id: string, type: string) => {
        setCart(prev => prev.filter(item => !(item.id === id && item.type === type)))
    }

    // Select member
    const selectMember = async (member: Member) => {
        setSelectedMember(member)
        setMemberSearch('')
        setMemberResults([])
        setPointsToUse(0)

        // Check loyalty reward
        const reward = await getEligibleReward(member.id)
        setEligibleReward(reward)
    }

    // Clear member
    const clearMember = () => {
        setSelectedMember(null)
        setPointsToUse(0)
        setEligibleReward(null)
    }

    // Queue selection handler - auto load member from queue
    const handleSelectQueue = async (queue: Queue | null) => {
        setSelectedQueue(queue)
        if (queue?.member_id) {
            // Auto-fetch the full member data
            const memberData = await getMemberById(queue.member_id)
            if (memberData) {
                // Map DB member to POS Member type
                const member: Member = {
                    id: memberData.id,
                    name: memberData.name,
                    phone: memberData.phone || '',
                    vehicle_plate: memberData.vehicle_plate || '',
                    points: memberData.points || 0,
                    vehicle_type: memberData.vehicle_type as 'R2' | 'R4',
                    vehicle_size: memberData.vehicle_size as 'Kecil' | 'Sedang' | 'Besar' | 'Jumbo',
                    member_code: memberData.member_code,
                    visit_count: memberData.visit_count
                }
                selectMember(member)
            }
        } else if (!queue) {
            clearMember()
        }
    }

    // Handle queue created
    const handleQueueCreated = () => {
        // Refresh will happen via useEffect interval in components
    }

    // Effect to update cart prices when member changes
    useEffect(() => {
        if (cart.length === 0) return

        setCart(prev => prev.map(item => {
            if (item.type !== 'service') return item

            const service = services.find(s => s.id === item.id)
            if (!service) return item

            let price = 0
            if (selectedMember) {
                const customPrice = service.prices?.find(p =>
                    p.vehicle_type === selectedMember.vehicle_type &&
                    p.vehicle_size === selectedMember.vehicle_size
                )
                if (customPrice) {
                    price = Number(customPrice.price)
                }
            }

            return { ...item, price, subtotal: item.qty * price }
        }))
    }, [selectedMember, services])

    // Handle print
    const handlePrint = () => {
        document.body.classList.add('is-printing-receipt')
        window.print()
        // Penundaan kecil untuk memastikan window.print() selesai memicu dialog sebelum class dihapus
        setTimeout(() => {
            document.body.classList.remove('is-printing-receipt')
        }, 500)
    }

    // Process payment
    const handlePayment = async () => {
        if (cart.length === 0) return

        // Confirm if unpaid or partial
        if (paymentAmount < finalTotal) {
            const isPartial = paymentAmount > 0;
            const msg = isPartial
                ? `Pembayaran belum lunas (Sisa: ${formatCurrency(finalTotal - paymentAmount)}). Simpan sebagai Termin/Hutang?`
                : `Belum ada pembayaran sama sekali. Simpan sebagai Transaksi Belum Lunas?`;

            if (!confirm(msg)) return;
        }

        // Auto-claim reward if eligibility exists
        if (eligibleReward && confirm(`Member berhak mendapatkan hadiah: ${eligibleReward.reward_name}. Klaim sekarang?`)) {
            await claimReward(selectedMember!.id, eligibleReward.milestone)
        }

        setIsProcessing(true)

        const payload: TransactionPayload = {
            type: txType,
            member_id: selectedMember?.id,
            items: cart,
            subtotal: cleanSubtotal,
            discount: pointDiscount,
            points_used: pointsToUse,
            total: finalTotal,
            payment_method: paymentMethod,
            payment_amount: paymentAmount,
            queue_id: selectedQueue?.id,
            note: receiptNote,
            cashier_name: selectedCashierName || userProfile?.full_name || 'Admin'
        }

        const result = await processTransaction(payload)

        if (result.success) {
            setInvoiceNumber(result.invoice || '')
            setShowSuccess(true)

            // Do not auto-close so user can print
        } else {
            alert(result.error)
        }

        setIsProcessing(false)
    }

    const resetPOS = () => {
        setCart([])
        setSelectedMember(null)
        setSelectedQueue(null)
        setPointsToUse(0)
        setPaymentAmount(0)
        setShowSuccess(false)
        setInvoiceNumber('')
        // setReceiptNote('') <--- KNOCKED OUT (Review Request: Sticky Note)
        // Cashier Name also remains sticky
    }

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(itemSearch.toLowerCase())
    )

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(itemSearch.toLowerCase())
    )

    return (
        <>
            {/* General Vehicle Selection Modal */}
            {selectingVehicleForService && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectingVehicleForService(null)}></div>
                    <div className="relative transform overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl transition-all w-full max-w-sm">
                        <div className="text-center mb-6">
                            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                                <WrenchScrewdriverIcon className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase italic">{selectingVehicleForService.name}</h3>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Pilih jenis & ukuran kendaraan</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Jenis Kendaraan</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['R2', 'R3', 'R4'] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setVehicleChoice(prev => ({ ...prev, type: t }))}
                                            className={clsx(
                                                "py-3 rounded-xl text-xs font-black transition-all border-2",
                                                vehicleChoice.type === t ? "bg-primary border-primary text-white shadow-lg" : "bg-gray-50 border-gray-100 text-gray-400"
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Ukuran</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['Kecil', 'Sedang', 'Besar', 'Jumbo'] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setVehicleChoice(prev => ({ ...prev, size: s }))}
                                            className={clsx(
                                                "py-3 rounded-xl text-xs font-black transition-all border-2",
                                                vehicleChoice.size === s ? "bg-primary border-primary text-white shadow-lg" : "bg-gray-50 border-gray-100 text-gray-400"
                                            )}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={() => setSelectingVehicleForService(null)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => addToCart(selectingVehicleForService, 'service', vehicleChoice)}
                                    className="flex-[2] py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100"
                                >
                                    Pilih & Tambah
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Queue Modal */}
            <QuickQueueModal
                isOpen={showQueueModal}
                onClose={() => setShowQueueModal(false)}
                onSuccess={handleQueueCreated}
            />

            {/* Employee/Mechanic Quick Select Overlay for Services in Cart */}
            <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-8rem)]">
                <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-8rem)] flex-1 print:hidden">
                    {/* Queue Sidebar - Desktop Only */}
                    <div className="hidden lg:block w-72 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <QueueSidebar
                            onSelectQueue={handleSelectQueue}
                            onCreateQueue={() => setShowQueueModal(true)}
                            selectedQueueId={selectedQueue?.id}
                        />
                    </div>

                    {/* Left Panel - Product/Service Selection */}
                    <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-0">
                        {/* Header with Member Selection (Top Priority) */}
                        <div className="p-4 border-b border-gray-100 flex flex-col gap-3 bg-white sticky top-0 z-20">
                            {/* Mobile Queue Dropdown */}
                            <div className="lg:hidden">
                                <QueueDropdown
                                    onSelectQueue={handleSelectQueue}
                                    onCreateQueue={() => setShowQueueModal(true)}
                                    selectedQueueId={selectedQueue?.id}
                                />
                            </div>

                            {/* Queue Info Banner */}
                            {selectedQueue && (
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-black text-primary">{selectedQueue.queue_number}</span>
                                        <div>
                                            <p className="text-xs font-bold text-blue-700">Antrian Aktif</p>
                                            {selectedQueue.notes && (
                                                <p className="text-xs text-blue-600">{selectedQueue.notes}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSelectQueue(null)}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
                                    >
                                        Lepas
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-between lg:mb-0">
                                <h1 className="text-xl font-black text-primary italic uppercase tracking-tighter">KASIR <span className="text-gray-300">NUGRAHA</span></h1>
                                <button
                                    onClick={() => setShowMobileItems(!showMobileItems)}
                                    className="lg:hidden text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer bg-blue-50 px-3 py-2 rounded-xl"
                                >
                                    {showMobileItems ? (
                                        <>TUTUP KATALOG <MinusIcon className="w-4 h-4" /></>
                                    ) : (
                                        <>LIHAT KATALOG <PlusIcon className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>

                            {/* Member Selection - The Core Flow */}
                            <div className={clsx(
                                "p-3 rounded-2xl transition-all",
                                selectedMember ? "bg-green-50" : "bg-slate-50 border border-slate-100"
                            )}>
                                <div className="flex flex-col md:flex-row md:items-center gap-3">
                                    <div className="flex-1">
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 block ml-1">PELANGGAN</label>
                                        {selectedMember ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-green-100">
                                                        <UserIcon className="w-6 h-6 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-900 leading-tight">{selectedMember?.name}</p>
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                                            {selectedMember?.vehicle_plate || '-'} • {selectedMember?.vehicle_type} {selectedMember?.vehicle_size}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button onClick={clearMember} className="p-2 hover:bg-red-50 text-red-400 rounded-xl transition-colors cursor-pointer">
                                                    <XMarkIcon className="w-6 h-6" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                                                <input
                                                    type="text"
                                                    placeholder="Cari Nama / No HP / Plat Nomor..."
                                                    value={memberSearch}
                                                    onChange={(e) => setMemberSearch(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl text-sm font-bold text-gray-900 focus:border-primary focus:ring-0 transition-all placeholder:text-gray-300 shadow-sm"
                                                />
                                                {memberResults.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] max-h-64 overflow-y-auto">
                                                        {memberResults.map(m => (
                                                            <button
                                                                key={m.id}
                                                                onClick={() => selectMember(m)}
                                                                className="w-full p-4 text-left hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors flex items-center gap-4 group cursor-pointer"
                                                            >
                                                                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-white flex items-center justify-center text-lg transition-colors">
                                                                    {m.vehicle_type === 'R2' ? '🏍️' : '🚗'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-gray-900 group-hover:text-primary transition-colors">{m.name}</p>
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{m.vehicle_plate} • {m.phone}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {selectedMember && (
                                        <div className="flex flex-col gap-1 pr-2">
                                            <div className="flex items-center justify-between md:justify-end gap-4">
                                                <div className="text-right">
                                                    <p className="text-[7px] font-black text-green-600 uppercase tracking-widest leading-none mb-0.5">POIN</p>
                                                    <p className="text-sm font-black text-gray-900 leading-none">{selectedMember?.points}</p>
                                                </div>
                                                <div className="text-right border-l border-gray-100 pl-4">
                                                    <p className="text-[7px] font-black text-blue-600 uppercase tracking-widest leading-none mb-0.5">VISIT</p>
                                                    <p className="text-sm font-black text-gray-900 leading-none">{selectedMember?.visit_count || 0}</p>
                                                </div>
                                                {eligibleReward && (
                                                    <div className="bg-orange-500 text-white px-3 py-1.5 rounded-xl shadow-lg shadow-orange-200 flex items-center gap-2 animate-bounce cursor-default">
                                                        <span className="text-sm">🎁</span>
                                                        <div className="leading-none">
                                                            <p className="text-[7px] font-black uppercase tracking-widest">KLAIM!</p>
                                                            <p className="text-[10px] font-black whitespace-nowrap">{eligibleReward?.reward_name}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Filter & Search Bar - ALWAYS VISIBLE */}
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari produk / jasa..."
                                            value={itemSearch}
                                            onChange={(e) => {
                                                setItemSearch(e.target.value);
                                                if (e.target.value.length > 0) setShowMobileItems(true);
                                            }}
                                            onFocus={() => setShowMobileItems(true)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-primary focus:border-primary transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setIsScanning(!isScanning)}
                                        className={clsx(
                                            "px-4 rounded-xl border-2 transition-all cursor-pointer",
                                            isScanning ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-100 text-primary hover:border-primary"
                                        )}
                                    >
                                        <CameraIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                {isScanning && (
                                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-2 bg-gray-50">
                                        <div id="reader" className="w-full overflow-hidden rounded-xl"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Items Grid - Show both always */}
                        <div className={clsx(
                            "flex-1 overflow-y-auto p-4 lg:block",
                            !showMobileItems && "hidden"
                        )}>
                            {/* Jasa Section */}
                            <>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-1.5 w-8 bg-orange-400 rounded-full" />
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Jasa Servis Professional</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                                    {filteredServices.map(service => {
                                        const customPriceObj = selectedMember ? service.prices?.find(p =>
                                            p.vehicle_type === selectedMember.vehicle_type &&
                                            p.vehicle_size === selectedMember.vehicle_size
                                        ) : null;
                                        const displayPrice = customPriceObj ? customPriceObj.price : service.price;

                                        return (
                                            <div key={service.id} className="relative group/item">
                                                <button
                                                    onClick={() => addToCart(service, 'service')}
                                                    className="w-full p-4 bg-orange-50/50 border border-orange-100 rounded-2xl text-left hover:bg-orange-50 hover:border-orange-300 transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col justify-between"
                                                >
                                                    <div className="relative z-10">
                                                        <p className="font-black text-gray-900 text-xs leading-tight mb-2 uppercase tracking-wide">{service.name}</p>
                                                        <div className="mt-auto">
                                                            {customPriceObj ? (
                                                                <>
                                                                    <p className="text-primary font-black text-base">{formatCurrency(customPriceObj.price)}</p>
                                                                    <span className="inline-block mt-1 bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Harga {selectedMember?.vehicle_type}</span>
                                                                </>
                                                            ) : (
                                                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest italic">Pilih Kendaraan</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-orange-200 opacity-10 rounded-full group-hover:scale-150 transition-transform" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingService(service as any); }}
                                                    className="absolute top-2 right-2 p-1.5 bg-white shadow-sm border border-gray-100 rounded-lg text-gray-300 hover:text-primary transition-opacity opacity-0 group-hover/item:opacity-100 cursor-pointer"
                                                >
                                                    <PencilIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>

                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-1.5 w-8 bg-blue-400 rounded-full" />
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Produk & Menu</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProducts.map(product => (
                                    <div key={product.id} className="relative group/item">
                                        <button
                                            onClick={() => addToCart(product, 'product')}
                                            disabled={product.stock <= 0}
                                            className={clsx(
                                                "w-full p-4 border-2 rounded-2xl text-left transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col justify-between",
                                                product.stock > 0
                                                    ? "bg-blue-50/30 border-blue-50 hover:bg-white hover:border-primary hover:shadow-xl hover:shadow-blue-50"
                                                    : "bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed"
                                            )}
                                        >
                                            <div className="relative z-10">
                                                <p className="font-black text-gray-900 text-xs leading-tight mb-2 uppercase tracking-wide truncate group-hover:whitespace-normal">{product.name}</p>
                                                <p className="text-primary font-black text-base">{formatCurrency(product.price)}</p>
                                                <div className="flex justify-between items-center mt-3">
                                                    <span className={clsx(
                                                        "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-[0.1em]",
                                                        product.stock <= 5 ? "bg-red-500 text-white" : "bg-gray-800 text-white"
                                                    )}>Stok: {product.stock}</span>
                                                </div>
                                            </div>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingProduct(product); }}
                                            className="absolute top-2 right-2 p-1.5 bg-white shadow-sm border border-gray-100 rounded-lg text-gray-300 hover:text-primary transition-opacity opacity-0 group-hover/item:opacity-100 cursor-pointer"
                                        >
                                            <PencilIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Cart & Checkout */}
                    <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Keranjang Belanja</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-300 py-12">
                                    <ShoppingCartIcon className="w-16 h-16 opacity-10 mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Belum Ada Item</p>
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {cart.map(item => (
                                        <li key={`${item.type}-${item.id}`} className="flex items-center gap-2 p-2 bg-gray-50/50 border border-gray-100 rounded-xl group transition-all hover:bg-white hover:shadow-md hover:shadow-gray-100">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-gray-900 text-[10px] uppercase tracking-wide truncate leading-tight">{item.name}</p>
                                                {item.type === 'service' && (
                                                    <div className="mt-1 flex items-center gap-1">
                                                        <span className="text-[8px] font-black text-gray-400">PETUGAS:</span>
                                                        <select
                                                            value={item.employee_id || ''}
                                                            onChange={(e) => {
                                                                const empId = e.target.value;
                                                                setCart(prev => prev.map(c =>
                                                                    (c.id === item.id && c.type === 'service') ? { ...c, employee_id: empId } : c
                                                                ));
                                                            }}
                                                            className="bg-transparent border-none text-[8px] font-black text-primary p-0 m-0 outline-none cursor-pointer uppercase"
                                                        >
                                                            <option value="">Pilih...</option>
                                                            {employees.map(emp => (
                                                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                                <p className="text-[9px] font-bold text-primary mt-0.5">{formatCurrency(item.price)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={item.qty}
                                                    onChange={(e) => {
                                                        const newQty = parseInt(e.target.value);
                                                        if (!isNaN(newQty) && newQty >= 0) {
                                                            const diff = newQty - item.qty;
                                                            updateQty(item.id, item.type, diff);
                                                        }
                                                    }}
                                                    className="w-12 py-1 px-1 bg-white border border-gray-200 rounded-lg text-center text-xs font-black text-gray-900 focus:ring-primary focus:border-primary outline-none"
                                                />
                                                <button
                                                    onClick={() => removeFromCart(item.id, item.type)}
                                                    className="p-1 text-red-200 group-hover:text-red-500 transition-colors cursor-pointer"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Checkout Summary */}
                        <div className="p-4 bg-white border-t border-gray-100 space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                            {/* Points Redemption Slider-style Toggle if Member exists */}
                            {selectedMember && selectedMember.points > 0 && (
                                <div className="flex items-center justify-between p-2 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">LOYALTY POIN</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max={selectedMember?.points}
                                            value={pointsToUse}
                                            onChange={(e) => setPointsToUse(Math.min(Number(e.target.value), selectedMember?.points || 0))}
                                            className="w-12 bg-white border border-blue-200 rounded px-1.5 py-0.5 text-[10px] font-black text-gray-900 text-center focus:ring-1 focus:ring-primary outline-none"
                                        />
                                        <span className="text-[8px] font-black text-primary uppercase">/ {selectedMember?.points} PTS</span>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1 pt-1">
                                <div className="flex justify-between text-[9px] font-bold text-gray-400">
                                    <span>SUBTOTAL</span>
                                    <span>{formatCurrency(cleanSubtotal)}</span>
                                </div>
                                {pointDiscount > 0 && (
                                    <div className="flex justify-between text-[9px] font-black text-green-600">
                                        <span>DISKON POIN</span>
                                        <span>- {formatCurrency(pointDiscount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-black text-gray-900 border-t border-gray-100 pt-1.5 mt-1.5">
                                    <span className="tracking-tighter italic">TOTAL</span>
                                    <span className="text-primary">{formatCurrency(finalTotal)}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPaymentMethod('cash')}
                                    className={clsx(
                                        "flex-1 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border-2 cursor-pointer flex items-center justify-center gap-2",
                                        paymentMethod === 'cash' ? "bg-primary text-white border-primary shadow-lg shadow-blue-100" : "bg-white text-gray-400 border-gray-100 hover:border-blue-100 hover:text-primary"
                                    )}
                                >
                                    <BanknotesIcon className="w-4 h-4" /> TUNAI
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('qris')}
                                    className={clsx(
                                        "flex-1 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border-2 cursor-pointer flex items-center justify-center gap-2",
                                        paymentMethod === 'qris' ? "bg-primary text-white border-primary shadow-lg shadow-blue-100" : "bg-white text-gray-400 border-gray-100 hover:border-blue-100 hover:text-primary"
                                    )}
                                >
                                    <QrCodeIcon className="w-4 h-4" /> QRIS
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div>
                                        <div className="flex justify-between mb-0.5">
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">NOMINAL BAYAR</label>
                                            {cleanChange > 0 && <span className="text-[8px] font-black text-green-600">KEMBALI: {formatCurrency(cleanChange)}</span>}
                                        </div>
                                        <input
                                            type="number"
                                            value={paymentAmount || ''}
                                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                            placeholder="0"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-3 text-[10px] font-black text-primary focus:border-primary focus:ring-0 transition-all placeholder:text-gray-200"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 ml-1">NAMA KASIR</label>
                                        <select
                                            value={selectedCashierName}
                                            onChange={(e) => {
                                                const val = e.target.value
                                                setSelectedCashierName(val)
                                                localStorage.setItem('pos_cashier_name', val)
                                            }}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-3 text-[10px] font-bold text-gray-900 focus:border-primary focus:ring-0 transition-all cursor-pointer uppercase"
                                        >
                                            <option value={userProfile?.full_name || 'Admin'}>{userProfile?.full_name || 'Admin'} (Default)</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.name}>{emp.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 ml-1">CATATAN NOTA (OPSIONAL)</label>
                                    <input
                                        type="text"
                                        value={receiptNote}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            setReceiptNote(val)
                                            localStorage.setItem('pos_receipt_note', val)
                                        }}
                                        placeholder="Terima kasih bosku!"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-3 text-[10px] font-bold text-gray-900 focus:border-primary focus:ring-0 transition-all placeholder:text-gray-200"
                                    />
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={cart.length === 0 || isProcessing}
                                    className={clsx(
                                        "w-full py-4 font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all disabled:opacity-30 disabled:grayscale cursor-pointer shadow-xl",
                                        paymentAmount >= finalTotal ? "bg-primary text-white shadow-blue-100 hover:bg-gray-900" : "bg-orange-500 text-white shadow-orange-100 hover:bg-orange-600"
                                    )}
                                >
                                    {isProcessing ? 'MEMPROSES...' : (paymentAmount >= finalTotal ? 'PROSES PEMBAYARAN' : 'PROSES TERMIN / HUTANG')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals & Success Overlays */}
            {showSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-[2rem] p-6 text-center max-w-lg w-full animate-bounce-in shadow-2xl my-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-xl font-black text-gray-900 leading-none italic uppercase tracking-tighter">MANTAP BOS!</h2>
                                    <p className="text-gray-400 text-[8px] font-black uppercase tracking-widest">Transaksi Berhasil</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none">Nomor Struk</p>
                                <p className="font-mono font-black text-xs text-primary">{invoiceNumber}</p>
                            </div>
                        </div>

                        {/* Receipt Preview */}
                        <div className="mb-6 bg-gray-50 p-2 rounded-2xl border-2 border-dashed border-gray-200">
                            <Receipt
                                showOnScreen={true}
                                storeInfo={storeProfile}
                                transaction={{
                                    invoice: invoiceNumber,
                                    date: new Date(),
                                    type: txType,
                                    items: cart.map(item => ({
                                        ...item,
                                        employee_name: employees.find(e => e.id === item.employee_id)?.name
                                    })),
                                    subtotal: cleanSubtotal,
                                    discount: pointDiscount,
                                    total: finalTotal,
                                    paymentMethod,
                                    paymentAmount,
                                    change: cleanChange,
                                    member: selectedMember,
                                    cashier: selectedCashierName || userProfile?.full_name || 'Admin',
                                    note: receiptNote
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handlePrint}
                                className="flex items-center justify-center gap-2 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-primary/90 transition-all cursor-pointer shadow-lg shadow-primary/20"
                            >
                                <PrinterIcon className="w-5 h-5" /> CETAK STRUK
                            </button>
                            <button
                                onClick={resetPOS}
                                className="flex items-center justify-center gap-2 py-4 bg-gray-100 text-gray-600 font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-gray-200 transition-all cursor-pointer"
                            >
                                <PlusIcon className="w-5 h-5" /> DATA BARU
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Receipt for Printing */}
            <Receipt
                storeInfo={storeProfile}
                transaction={{
                    invoice: invoiceNumber,
                    date: new Date(),
                    type: txType,
                    items: cart.map(item => ({
                        ...item,
                        employee_name: employees.find(e => e.id === item.employee_id)?.name
                    })),
                    subtotal: cleanSubtotal,
                    discount: pointDiscount,
                    total: finalTotal,
                    paymentMethod,
                    paymentAmount,
                    change: cleanChange,
                    member: selectedMember,
                    cashier: userProfile?.full_name || 'Admin',
                    note: receiptNote
                }}
            />

            {/* Edit Modals */}
            {editingProduct && (
                <EditProductModal
                    product={editingProduct!}
                    categories={categories}
                    onClose={() => setEditingProduct(null)}
                    onSuccess={() => { setEditingProduct(null); refreshData(); }}
                />
            )}
            {editingService && (
                <EditServiceModal
                    service={editingService!}
                    onClose={() => setEditingService(null)}
                    onSuccess={() => { setEditingService(null); refreshData(); }}
                />
            )}
        </>
    )
}

function EditProductModal({ product, categories, onClose, onSuccess }: { product: Product, categories: Category[], onClose: () => void, onSuccess: () => void }) {
    const [state, formAction] = useActionState(updateProduct, null)

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-bounce-in">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900">Edit Produk</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded cursor-pointer">
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <form action={async (formData) => { await formAction(formData); }} className="p-4 space-y-4">
                    <input type="hidden" name="id" value={product.id} />
                    {state?.error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded">{state.error}</p>}
                    {state?.success && <p className="text-green-500 text-xs bg-green-50 p-2 rounded">Berhasil diperbarui! {setTimeout(onSuccess, 500) && ""}</p>}

                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Nama Produk</label>
                        <input name="name" defaultValue={product.name} required className="input-std" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Kategori</label>
                        <select name="category_id" defaultValue={product.category_id} className="input-std">
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Barcode / SKU</label>
                        <input name="barcode" defaultValue={product.barcode || ''} className="input-std" placeholder="Scan atau ketik..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">Harga Beli</label>
                            <input type="number" name="cost_price" defaultValue={product.cost_price} className="input-std" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">Harga Jual</label>
                            <input type="number" name="price" defaultValue={product.price} className="input-std" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">Min Stok</label>
                            <input type="number" name="min_stock" defaultValue={product.min_stock} className="input-std" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">Satuan</label>
                            <input name="unit" defaultValue={product.unit} className="input-std" />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 cursor-pointer">Batal</button>
                        <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 cursor-pointer">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function EditServiceModal({ service, onClose, onSuccess }: { service: Service, onClose: () => void, onSuccess: () => void }) {
    const [state, formAction] = useActionState(updateService, null)

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-bounce-in">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900">Edit Jasa</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded cursor-pointer">
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <form action={async (formData) => { await formAction(formData); }} className="p-4 space-y-4">
                    <input type="hidden" name="id" value={service.id} />
                    {state?.error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded">{state.error}</p>}
                    {state?.success && <p className="text-green-500 text-xs bg-green-50 p-2 rounded">Berhasil diperbarui! {setTimeout(onSuccess, 500) && ""}</p>}

                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Nama Jasa</label>
                        <input name="name" defaultValue={service.name} required className="input-std" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Harga</label>
                        <input type="number" name="price" defaultValue={service.price} required className="input-std" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Keterangan</label>
                        <textarea name="description" defaultValue={service.description || ''} rows={2} className="input-std" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Barcode / Kode</label>
                        <input name="barcode" defaultValue={service.barcode || ''} className="input-std" placeholder="Scan atau ketik..." />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 cursor-pointer">Batal</button>
                        <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 cursor-pointer">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
