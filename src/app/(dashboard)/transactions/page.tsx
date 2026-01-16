'use client'

import { useState, useEffect, useTransition, useCallback, useActionState } from 'react'
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
    PencilIcon
} from '@heroicons/react/24/outline'
import {
    getProductsForPOS,
    getServicesForPOS,
    searchMembers,
    getPointConfig,
    processTransaction,
    type CartItem,
    type TransactionType,
    type TransactionPayload
} from './actions'
import { getCategories, updateProduct, type Category } from '../inventory/actions'
import { updateService } from '../services/actions'
import { getStoreProfile } from '../settings/actions'
import { Receipt } from '@/components/Receipt'
import clsx from 'clsx'
import { PrinterIcon, CameraIcon } from '@heroicons/react/24/outline'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { getItemByBarcode } from './actions'

type Product = { id: string; name: string; category_id: string; price: number; cost_price: number; stock: number; min_stock: number; unit: string; barcode?: string | null }
type Service = { id: string; name: string; price: number; description?: string | null; barcode?: string | null }
type Member = { id: string; name: string; phone: string; vehicle_plate: string | null; points: number }

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

    // Cart
    const [cart, setCart] = useState<CartItem[]>([])

    // Member
    const [memberSearch, setMemberSearch] = useState('')
    const [memberResults, setMemberResults] = useState<Member[]>([])
    const [selectedMember, setSelectedMember] = useState<Member | null>(null)
    const [pointsToUse, setPointsToUse] = useState(0)

    // Payment
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash')
    const [paymentAmount, setPaymentAmount] = useState(0)
    const [showSuccess, setShowSuccess] = useState(false)
    const [invoiceNumber, setInvoiceNumber] = useState('')

    const [isPending, startTransition] = useTransition()
    const [isProcessing, setIsProcessing] = useState(false)
    const [itemSearch, setItemSearch] = useState('')
    const [showMobileItems, setShowMobileItems] = useState(false)
    const [isScanning, setIsScanning] = useState(false)

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

    // Search members
    useEffect(() => {
        if (memberSearch.length >= 2) {
            const timer = setTimeout(async () => {
                const results = await searchMembers(memberSearch)
                setMemberResults(results)
            }, 300)
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
    const addToCart = useCallback((item: Product | Service, type: 'product' | 'service') => {
        setCart(prev => {
            const price = Number(item.price) || 0
            const existing = prev.find(c => c.id === item.id && c.type === type)
            if (existing) {
                return prev.map(c =>
                    c.id === item.id && c.type === type
                        ? { ...c, qty: c.qty + 1, subtotal: (c.qty + 1) * price }
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
                subtotal: price
            }]
        })
        // Auto hide on mobile after add
        if (window.innerWidth < 1024) {
            setShowMobileItems(false)
        }
    }, [])

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
    const selectMember = (member: Member) => {
        setSelectedMember(member)
        setMemberSearch('')
        setMemberResults([])
        setPointsToUse(0)
    }

    // Clear member
    const clearMember = () => {
        setSelectedMember(null)
        setPointsToUse(0)
    }

    // Handle print
    const handlePrint = () => {
        window.print()
    }

    // Process payment
    const handlePayment = async () => {
        if (cart.length === 0) return
        if (paymentAmount < finalTotal) {
            alert('Jumlah bayar kurang!')
            return
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
            payment_amount: paymentAmount
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
        setPointsToUse(0)
        setPaymentAmount(0)
        setShowSuccess(false)
        refreshData()
    }

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(itemSearch.toLowerCase())
    )

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(itemSearch.toLowerCase())
    )

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-8rem)] print:hidden">
            {/* Left Panel - Product/Service Selection */}
            <div className={clsx(
                "flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300",
                !showMobileItems && "max-h-[72px] lg:max-h-full"
            )}>
                {/* Header with Type Toggle */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="text-xl font-bold text-gray-900">Transaksi Baru</h1>
                        <button
                            onClick={() => setShowMobileItems(!showMobileItems)}
                            className="lg:hidden text-primary text-sm font-bold flex items-center gap-1 cursor-pointer"
                        >
                            {showMobileItems ? (
                                <>Tutup <MinusIcon className="w-4 h-4" /></>
                            ) : (
                                <>Pilih Barang <PlusIcon className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>

                    {/* Search & Type Toggle */}
                    <div className={clsx("space-y-3 lg:block", !showMobileItems && "hidden")}>
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                            <button
                                onClick={() => setTxType('bengkel')}
                                className={clsx(
                                    'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all cursor-pointer',
                                    txType === 'bengkel'
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-200'
                                )}
                            >
                                <WrenchScrewdriverIcon className="w-5 h-5" />
                                Bengkel
                            </button>
                            <button
                                onClick={() => setTxType('kafe')}
                                className={clsx(
                                    'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all cursor-pointer',
                                    txType === 'kafe'
                                        ? 'bg-secondary text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-200'
                                )}
                            >
                                <ShoppingCartIcon className="w-5 h-5" />
                                Kafe
                            </button>
                        </div>

                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={`Cari ${txType === 'bengkel' ? 'jasa / produk' : 'produk'}...`}
                                value={itemSearch}
                                onChange={(e) => setItemSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-primary focus:border-primary text-black"
                            />
                        </div>

                        {/* Scanner Toggle and Reader */}
                        <div className="space-y-3">
                            <button
                                onClick={() => setIsScanning(!isScanning)}
                                className={clsx(
                                    "w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all cursor-pointer",
                                    isScanning ? "bg-red-100 text-red-600 border border-red-200" : "bg-primary text-white"
                                )}
                            >
                                <CameraIcon className="w-5 h-5" />
                                {isScanning ? "Matikan Kamera" : "Scan Barcode / Menu"}
                            </button>

                            {isScanning && (
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-2 bg-gray-50">
                                    <div id="reader" className="w-full"></div>
                                    <p className="text-[10px] text-gray-400 text-center mt-2 italic">Pastikan kode berada di tengah kotak</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Grid */}
                <div className={clsx(
                    "flex-1 overflow-y-auto p-4 lg:block",
                    !showMobileItems && "hidden"
                )}>
                    {txType === 'bengkel' && (
                        <>
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Jasa Servis</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                {filteredServices.map(service => (
                                    <div key={service.id} className="relative group/item">
                                        <button
                                            onClick={() => addToCart(service, 'service')}
                                            className="w-full p-3 bg-orange-50 border border-orange-200 rounded-lg text-left hover:bg-orange-100 transition-colors cursor-pointer group"
                                        >
                                            <p className="font-medium text-gray-900 text-sm truncate group-hover:whitespace-normal">{service.name}</p>
                                            <p className="text-primary font-bold text-sm mt-1">{formatCurrency(service.price)}</p>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingService(service as any); }}
                                            className="absolute top-2 right-2 p-1.5 bg-white shadow-sm border border-gray-100 rounded-md text-gray-400 hover:text-primary transition-opacity opacity-0 group-hover/item:opacity-100 cursor-pointer"
                                        >
                                            <PencilIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {filteredServices.length === 0 && (
                                    <p className="text-gray-400 text-sm col-span-full py-4 text-center">Jasa tidak ditemukan</p>
                                )}
                            </div>
                        </>
                    )}

                    <h3 className="text-sm font-medium text-gray-500 mb-3">Produk / Sparepart</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="relative group/item">
                                <button
                                    onClick={() => addToCart(product, 'product')}
                                    disabled={product.stock <= 0}
                                    className={clsx(
                                        "w-full p-3 border rounded-lg text-left transition-all cursor-pointer group",
                                        product.stock > 0
                                            ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                                            : "bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <p className="font-medium text-gray-900 text-sm truncate group-hover:whitespace-normal">{product.name}</p>
                                    <p className="text-primary font-bold text-sm mt-1">{formatCurrency(product.price)}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-[10px] text-gray-500">Stok: {product.stock}</p>
                                        {product.stock <= 5 && product.stock > 0 && (
                                            <span className="text-[10px] text-orange-600 font-bold">Limit!</span>
                                        )}
                                    </div>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingProduct(product); }}
                                    className="absolute top-2 right-2 p-1.5 bg-white shadow-sm border border-gray-100 rounded-md text-gray-400 hover:text-primary transition-opacity opacity-0 group-hover/item:opacity-100 cursor-pointer"
                                >
                                    <PencilIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                        {filteredProducts.length === 0 && (
                            <p className="text-gray-400 text-sm col-span-full py-4 text-center">Produk tidak ditemukan</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile View Adjustment: Cart becomes secondary on mobile but scrollable */}
            <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] lg:min-h-0">
                {/* Member Selection */}
                <div className="p-4 border-b border-gray-200">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Member (Opsional)</label>
                    {selectedMember ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <UserIcon className="w-8 h-8 text-green-600" />
                                <div>
                                    <p className="font-medium text-gray-900">{selectedMember.name}</p>
                                    <p className="text-xs text-gray-500">{selectedMember.phone} • {selectedMember.vehicle_plate || '-'}</p>
                                    <p className="text-xs text-green-600 font-medium">Poin: {selectedMember.points}</p>
                                </div>
                            </div>
                            <button onClick={clearMember} className="p-1 hover:bg-green-100 rounded cursor-pointer">
                                <XMarkIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama / HP / Nopol..."
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary text-black"
                            />
                            {memberResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                    {memberResults.map(member => (
                                        <button
                                            key={member.id}
                                            onClick={() => selectMember(member)}
                                            className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 cursor-pointer"
                                        >
                                            <p className="font-medium text-gray-900">{member.name}</p>
                                            <p className="text-xs text-gray-500">{member.phone} • {member.vehicle_plate || '-'}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Keranjang</h3>
                    {cart.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <ShoppingCartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Keranjang kosong</p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {cart.map(item => (
                                <li key={`${item.type}-${item.id}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                                        <p className="text-xs text-gray-500">{formatCurrency(item.price)} x {item.qty}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateQty(item.id, item.type, -1)}
                                            className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-100 cursor-pointer"
                                        >
                                            <MinusIcon className="w-4 h-4" />
                                        </button>
                                        <span className="w-8 text-center font-medium text-black">{item.qty}</span>
                                        <button
                                            onClick={() => updateQty(item.id, item.type, 1)}
                                            className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-100 cursor-pointer"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => removeFromCart(item.id, item.type)}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Summary & Payment */}
                <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
                    {/* Points Redemption */}
                    {selectedMember && selectedMember.points > 0 && (
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-600">Gunakan Poin</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max={selectedMember.points}
                                    value={pointsToUse}
                                    onChange={(e) => setPointsToUse(Math.min(Number(e.target.value), selectedMember.points))}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right text-black"
                                />
                                <span className="text-xs text-gray-500">/ {selectedMember.points}</span>
                            </div>
                        </div>
                    )}

                    {/* Totals */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatCurrency(cleanSubtotal)}</span>
                        </div>
                        {pointDiscount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Diskon Poin</span>
                                <span>- {formatCurrency(pointDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                            <span>Total</span>
                            <span>{formatCurrency(finalTotal)}</span>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPaymentMethod('cash')}
                            className={clsx(
                                'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer',
                                paymentMethod === 'cash'
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            )}
                        >
                            <BanknotesIcon className="w-5 h-5" />
                            Tunai
                        </button>
                        <button
                            onClick={() => setPaymentMethod('qris')}
                            className={clsx(
                                'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer',
                                paymentMethod === 'qris'
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            )}
                        >
                            <QrCodeIcon className="w-5 h-5" />
                            QRIS
                        </button>
                    </div>

                    {/* Payment Amount */}
                    <div>
                        <label className="text-sm text-gray-600 mb-1 block">Jumlah Bayar</label>
                        <input
                            type="number"
                            value={paymentAmount || ''}
                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg font-bold text-right focus:ring-primary focus:border-primary text-black"
                        />
                        {cleanChange > 0 && paymentAmount >= finalTotal && (
                            <p className="text-right text-sm text-green-600 mt-1">Kembalian: {formatCurrency(cleanChange)}</p>
                        )}
                    </div>

                    {/* Pay Button */}
                    <button
                        onClick={handlePayment}
                        disabled={cart.length === 0 || Number(paymentAmount) < finalTotal || isProcessing}
                        className="w-full py-3 bg-secondary text-white font-bold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isProcessing ? 'Memproses...' : 'Bayar'}
                    </button>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 print:hidden">
                    <div className="bg-white rounded-xl p-8 text-center max-w-sm mx-4 animate-bounce-in shadow-2xl">
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Transaksi Berhasil!</h2>
                        <p className="text-gray-500 mb-6">No. Invoice: <span className="font-mono font-bold text-gray-900">{invoiceNumber}</span></p>

                        <div className="space-y-3">
                            <button
                                onClick={handlePrint}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                            >
                                <PrinterIcon className="w-5 h-5" />
                                Cetak Struk
                            </button>
                            <button
                                onClick={resetPOS}
                                className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Transaksi Baru
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
                    items: cart,
                    subtotal: cleanSubtotal,
                    discount: pointDiscount,
                    total: finalTotal,
                    paymentMethod,
                    paymentAmount,
                    change: cleanChange,
                    member: selectedMember
                }}
            />
            {/* Modals */}
            {editingProduct && (
                <EditProductModal
                    product={editingProduct}
                    categories={categories}
                    onClose={() => setEditingProduct(null)}
                    onSuccess={() => {
                        setEditingProduct(null)
                        refreshData()
                    }}
                />
            )}

            {editingService && (
                <EditServiceModal
                    service={editingService}
                    onClose={() => setEditingService(null)}
                    onSuccess={() => {
                        setEditingService(null)
                        refreshData()
                    }}
                />
            )}
        </div>
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
