'use client'

import { useState, useTransition, useEffect } from 'react'
import { PlusIcon, MagnifyingGlassIcon, TrashIcon, CubeIcon, ExclamationTriangleIcon, ArchiveBoxArrowDownIcon, PencilIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { getProducts, getCategories, createProduct, deleteProduct, addStock, adjustStock, updateProduct, type Product, type Category } from './actions'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import clsx from 'clsx'

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isStockModalOpen, setIsStockModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false)

    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('all') // all, low_stock
    const [isPending, startTransition] = useTransition()

    // Initial load
    useEffect(() => {
        startTransition(async () => {
            const [prodData, catData] = await Promise.all([
                getProducts(),
                getCategories()
            ])
            setProducts(prodData)
            setCategories(catData)
        })
    }, [])

    // Handlers
    function refreshData() {
        startTransition(async () => {
            const data = await getProducts(searchQuery, filterType)
            setProducts(data)
        })
    }

    function handleSearch(term: string) {
        setSearchQuery(term)
        startTransition(async () => {
            const data = await getProducts(term, filterType)
            setProducts(data)
        })
    }

    function handleFilterChange(filter: string) {
        setFilterType(filter)
        startTransition(async () => {
            const data = await getProducts(searchQuery, filter)
            setProducts(data)
        })
    }

    async function handleDelete(id: string) {
        if (confirm('Hapus barang ini? Stok dan history akan hilang.')) {
            await deleteProduct(id)
            refreshData()
        }
    }

    function openStockModal(product: Product) {
        setSelectedProduct(product)
        setIsStockModalOpen(true)
    }

    function openAdjustmentModal(product: Product) {
        setSelectedProduct(product)
        setIsAdjustmentModalOpen(true)
    }

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                    <p className="text-sm text-gray-500">Stok barang dan gudang</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Barang Baru
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex gap-2">
                        <select
                            value={filterType}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md text-black"
                        >
                            <option value="all">Semua Barang</option>
                            <option value="low_stock">⚠️ Stok Menipis</option>
                        </select>
                    </div>
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm text-black"
                            placeholder="Cari nama barang..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                </div>

                <ul className="divide-y divide-gray-200">
                    {products.map((product) => (
                        <li key={product.id} className="hover:bg-gray-50 transition-colors">
                            <div className="flex items-center px-4 py-4 sm:px-6">
                                <div className="min-w-0 flex-1 flex items-center">
                                    <div className="flex-shrink-0">
                                        <span className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <CubeIcon className="h-6 w-6 text-blue-600" />
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-primary truncate">{product.name}</p>
                                                {product.stock <= product.min_stock && (
                                                    <ExclamationTriangleIcon className="w-5 h-5 text-accent" title="Stok Menipis" />
                                                )}
                                            </div>
                                            <div className="mt-1">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    <span className="truncate">{product.category?.name || 'Uncategorized'}</span>
                                                    <span className="mx-2">•</span>
                                                    <span className="text-primary font-medium">{formatCurrency(product.price)}</span>
                                                </p>
                                                {product.cost_price > 0 && (
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        HPP: {formatCurrency(product.cost_price)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-2 md:mt-0">
                                            <div>
                                                <p className="text-sm text-gray-900">
                                                    Stok: <span className={clsx("font-bold", product.stock <= product.min_stock ? "text-accent" : "text-gray-900")}>
                                                        {product.stock} {product.unit}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Min: {product.min_stock}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openStockModal(product)}
                                        className="p-2 text-primary hover:bg-blue-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-primary/20"
                                        title="Tambah Stok"
                                    >
                                        <ArchiveBoxArrowDownIcon className="w-4 h-4" />
                                        <span className="text-xs font-medium hidden md:inline">Stok Masuk</span>
                                    </button>
                                    <button
                                        onClick={() => openAdjustmentModal(product)}
                                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-orange-200"
                                        title="Penyesuaian Stok"
                                    >
                                        <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                        <span className="text-xs font-medium hidden md:inline">Penyesuaian</span>
                                    </button>
                                    <button
                                        onClick={() => setEditingProduct(product)}
                                        className="p-2 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                                        title="Edit Barang"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                                        title="Hapus Barang"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                    {products.length === 0 && !isPending && (
                        <li className="px-4 py-12 text-center text-gray-500 flex flex-col items-center">
                            <CubeIcon className="w-12 h-12 text-gray-300 mb-2" />
                            <p>Belum ada data barang.</p>
                        </li>
                    )}
                </ul>
            </div>

            {/* Modals */}
            {isAddModalOpen && (
                <AddProductModal
                    categories={categories}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => {
                        setIsAddModalOpen(false)
                        refreshData()
                    }}
                />
            )}

            {isStockModalOpen && selectedProduct && (
                <StockInModal
                    product={selectedProduct}
                    onClose={() => setIsStockModalOpen(false)}
                    onSuccess={() => {
                        setIsStockModalOpen(false)
                        refreshData()
                    }}
                />
            )}

            {isAdjustmentModalOpen && selectedProduct && (
                <StockAdjustmentModal
                    product={selectedProduct}
                    onClose={() => setIsAdjustmentModalOpen(false)}
                    onSuccess={() => {
                        setIsAdjustmentModalOpen(false)
                        refreshData()
                    }}
                />
            )}

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
        </div>
    )
}

// --- MODALS ---

function AddProductModal({ categories, onClose, onSuccess }: { categories: Category[], onClose: () => void, onSuccess: () => void }) {
    const [state, formAction] = useActionState(createProduct, null)

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg p-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Tambah Barang Baru</h3>

                    <form action={async (formData) => {
                        await formAction(formData)
                    }} className="space-y-4">
                        {state?.error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{state.error}</p>}
                        {state?.success && (
                            <div className="text-green-600 text-sm bg-green-50 p-2 rounded">
                                Berhasil! {setTimeout(onSuccess, 500) && ""}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Barang</label>
                            <input type="text" name="name" required className="input-std" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Kategori</label>
                            <select name="category_id" required className="input-std">
                                <option value="">Pilih Kategori</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 font-bold">Barcode / SKU (Opsional)</label>
                            <input type="text" name="barcode" className="input-std" placeholder="Scan atau ketik kode..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Stok Awal</label>
                                <input type="number" name="stock" defaultValue={0} min="0" required className="input-std" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Stok Minimum (Alert)</label>
                                <input type="number" name="min_stock" defaultValue={5} min="1" required className="input-std" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Harga Beli (HPP)</label>
                                <input type="number" name="cost_price" required className="input-std" placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Harga Jual</label>
                                <input type="number" name="price" required className="input-std" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Satuan</label>
                            <select name="unit" className="input-std">
                                <option value="pcs">pcs</option>
                                <option value="porsi">porsi</option>
                                <option value="gelas">gelas</option>
                                <option value="cup">cup</option>
                                <option value="piring">piring</option>
                                <option value="mangkok">mangkok</option>
                                <option value="bungkus">bungkus</option>
                                <option value="sachet">sachet</option>
                                <option value="botol">botol</option>
                                <option value="liter">liter</option>
                                <option value="kg">kg</option>
                                <option value="gram">gram</option>
                                <option value="ikat">ikat</option>
                                <option value="dus">dus</option>
                                <option value="set">set</option>
                                <option value="jerigen">jerigen</option>
                                <option value="cup">cup</option>
                                <option value="drum">drum</option>
                            </select>
                        </div>

                        <div className="mt-6 flex gap-3 justify-end">
                            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
                            <SubmitButton label="Simpan" />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

function EditProductModal({ product, categories, onClose, onSuccess }: { product: Product, categories: Category[], onClose: () => void, onSuccess: () => void }) {
    const [state, formAction] = useActionState(updateProduct, null)

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Edit Barang</h3>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                            <XMarkIcon className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <form action={async (formData) => {
                        await formAction(formData)
                    }} className="space-y-4">
                        <input type="hidden" name="id" value={product.id} />
                        {state?.error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{state.error}</p>}
                        {state?.success && (
                            <div className="text-green-600 text-sm bg-green-50 p-2 rounded">
                                Berhasil! {setTimeout(onSuccess, 500) && ""}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Barang</label>
                            <input type="text" name="name" defaultValue={product.name} required className="input-std" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Kategori</label>
                            <select name="category_id" defaultValue={product.category_id} required className="input-std">
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 font-bold">Barcode / SKU (Opsional)</label>
                            <input type="text" name="barcode" defaultValue={product.barcode || ''} className="input-std" placeholder="Scan atau ketik kode..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Harga Beli (HPP)</label>
                                <input type="number" name="cost_price" defaultValue={product.cost_price} required className="input-std" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Harga Jual</label>
                                <input type="number" name="price" defaultValue={product.price} required className="input-std" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Stok Minimum (Alert)</label>
                                <input type="number" name="min_stock" defaultValue={product.min_stock} min="1" required className="input-std" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Satuan</label>
                                <select name="unit" defaultValue={product.unit} className="input-std">
                                    <option value="pcs">pcs</option>
                                    <option value="porsi">porsi</option>
                                    <option value="gelas">gelas</option>
                                    <option value="cup">cup</option>
                                    <option value="piring">piring</option>
                                    <option value="mangkok">mangkok</option>
                                    <option value="bungkus">bungkus</option>
                                    <option value="sachet">sachet</option>
                                    <option value="botol">botol</option>
                                    <option value="liter">liter</option>
                                    <option value="kg">kg</option>
                                    <option value="gram">gram</option>
                                    <option value="ikat">ikat</option>
                                    <option value="dus">dus</option>
                                    <option value="set">set</option>
                                    <option value="jerigen">jerigen</option>
                                    <option value="cup">cup</option>
                                    <option value="drum">drum</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3 justify-end">
                            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
                            <SubmitButton label="Simpan" />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

function StockInModal({ product, onClose, onSuccess }: { product: Product, onClose: () => void, onSuccess: () => void }) {
    const [state, formAction] = useActionState(addStock, null)

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md p-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Stok Masuk</h3>
                    <p className="text-sm text-gray-500 mb-4">{product.name} (Stok saat ini: {product.stock})</p>

                    <form action={async (formData) => {
                        await formAction(formData)
                    }} className="space-y-4">
                        <input type="hidden" name="product_id" value={product.id} />

                        {state?.error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{state.error}</p>}
                        {state?.success && (
                            <div className="text-green-600 text-sm bg-green-50 p-2 rounded">
                                Berhasil! {setTimeout(onSuccess, 500) && ""}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Jumlah Masuk</label>
                            <input type="number" name="qty" min="1" required className="input-std" autoFocus />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Keterangan / Sumber</label>
                            <input type="text" name="description" placeholder="Contoh: Belanja dari Supplier A" className="input-std" />
                        </div>

                        <div className="mt-6 flex gap-3 justify-end">
                            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
                            <SubmitButton label="Tambah Stok" />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}


function StockAdjustmentModal({ product, onClose, onSuccess }: { product: Product, onClose: () => void, onSuccess: () => void }) {
    const [state, formAction] = useActionState(adjustStock, null)

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={onClose}></div>
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md p-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Penyesuaian Stok (Opname)</h3>
                    <p className="text-sm text-gray-500 mb-4">{product.name} (Stok saat ini: {product.stock})</p>

                    <form action={async (formData) => {
                        await formAction(formData)
                    }} className="space-y-4">
                        <input type="hidden" name="product_id" value={product.id} />

                        {state?.error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{state.error}</p>}
                        {state?.success && (
                            <div className="text-green-600 text-sm bg-green-50 p-2 rounded">
                                Berhasil diperbarui! {setTimeout(onSuccess, 500) && ""}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Stok Akhir (Hasil Opname)</label>
                            <input type="number" name="new_total" defaultValue={product.stock} min="0" required className="input-std" autoFocus />
                            <p className="text-[10px] text-gray-400 mt-1 italic">* Masukkan jumlah total barang yang ada di gudang saat ini.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Keterangan</label>
                            <input type="text" name="description" placeholder="Contoh: Stok opname bulanan / barang rusak" className="input-std" />
                        </div>

                        <div className="mt-6 flex gap-3 justify-end">
                            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
                            <SubmitButton label="Simpan Penyesuaian" />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:text-sm disabled:opacity-50 cursor-pointer"
        >
            {pending ? 'Menyimpan...' : label}
        </button>
    )
}
