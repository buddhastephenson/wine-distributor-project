import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '../../store/useProductStore';
import { useAuthStore } from '../../store/useAuthStore';
import { TaxonomySidebar } from '../../components/catalog/TaxonomySidebar';
import { ProductGrid } from '../../components/catalog/ProductGrid';
import { ProductEditModal } from '../../components/catalog/ProductEditModal';
import { LayoutGrid, List, CheckCircle, Download, Plus } from 'lucide-react';
import { calculateFrontlinePrice, parseVolumeToMl } from '../../utils/formulas';
import { exportProductsToExcel } from '../../utils/export';
import { IProduct } from '../../../shared/types';

export const CatalogPage: React.FC = () => {
    const { products, formulas, isLoading, error, fetchProducts, fetchFormulas, addSpecialOrder } = useProductStore();
    const { user, isAuthenticated } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('all');
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedAppellation, setSelectedAppellation] = useState('all');
    const [selectedSupplier, setSelectedSupplier] = useState('all');
    const [minSize, setMinSize] = useState<number | ''>('');
    const [maxSize, setMaxSize] = useState<number | ''>('');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const navigate = useNavigate();

    // Fetch Data on Mount
    useEffect(() => {
        fetchProducts();
        fetchFormulas();
    }, [fetchProducts, fetchFormulas]);

    // Base Product Set (Filtered by Vendor Role)
    const allowedProducts = useMemo(() => {
        if (user?.type === 'admin' && user?.vendors && user.vendors.length > 0) {
            return products.filter(p => p.supplier && user.vendors!.includes(p.supplier));
        }
        return products;
    }, [products, user]);

    // Derive Unique Filter Options
    const uniqueCountries = useMemo(() => {
        const countries = new Set(allowedProducts.map(p => p.country).filter(Boolean));
        return Array.from(countries).sort() as string[];
    }, [allowedProducts]);

    const uniqueRegions = useMemo(() => {
        const regions = new Set(allowedProducts.filter(p => selectedCountry === 'all' || p.country === selectedCountry).map(p => p.region).filter(Boolean));
        return Array.from(regions).sort() as string[];
    }, [allowedProducts, selectedCountry]);

    const uniqueAppellations = useMemo(() => {
        const appellations = new Set(allowedProducts.filter(p =>
            (selectedCountry === 'all' || p.country === selectedCountry) &&
            (selectedRegion === 'all' || p.region === selectedRegion)
        ).map(p => p.appellation).filter(Boolean));
        return Array.from(appellations).sort() as string[];
    }, [allowedProducts, selectedCountry, selectedRegion]);

    const uniqueSuppliers = useMemo(() => {
        const suppliers = new Set(allowedProducts.map(p => p.supplier).filter(Boolean));
        return Array.from(suppliers).sort() as string[];
    }, [allowedProducts]);

    const uniqueBottleSizes = useMemo(() => {
        const sizes = new Set(allowedProducts.map(p => p.bottleSize).filter(Boolean));
        return Array.from(sizes).sort() as string[];
    }, [allowedProducts]);


    // Helper for accent-insensitive search
    const normalizeText = (text: string | undefined) => {
        if (!text) return '';
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    // Filter Products
    const filteredProducts = useMemo(() => {
        return allowedProducts.filter(product => {
            // Search Term
            const searchNormalized = normalizeText(searchTerm);

            const matchesSearch = !searchTerm ||
                normalizeText(product.productName).includes(searchNormalized) ||
                normalizeText(product.producer).includes(searchNormalized) ||
                normalizeText(product.itemCode).includes(searchNormalized) ||
                normalizeText(product.vintage?.toString()).includes(searchNormalized);

            if (!matchesSearch) return false;

            // Dropdowns
            if (selectedCountry !== 'all' && product.country !== selectedCountry) return false;
            if (selectedRegion !== 'all' && product.region !== selectedRegion) return false;
            if (selectedAppellation !== 'all' && product.appellation !== selectedAppellation) return false;
            if (selectedSupplier !== 'all' && product.supplier !== selectedSupplier) return false;
            if (selectedSupplier !== 'all' && product.supplier !== selectedSupplier) return false;

            // Bottle Size Range Check
            if (minSize !== '' || maxSize !== '') {
                const ml = parseVolumeToMl(product.bottleSize);
                if (ml === null) return false; // Exclude unparsable sizes if filter is active? Or maybe include? Let's exclude.
                if (minSize !== '' && ml < minSize) return false;
                if (maxSize !== '' && ml > maxSize) return false;
            }

            // Price Range
            if (formulas) {
                const pricing = calculateFrontlinePrice(product, formulas);
                const price = parseFloat(pricing.frontlinePrice || '0');
                if (price < priceRange[0] || (priceRange[1] > 0 && price > priceRange[1])) return false;
            }

            return true;
        }).sort((a, b) => {
            // 1. Sort by Producer (A-Z)
            const producerDiff = (a.producer || '').localeCompare(b.producer || '');
            if (producerDiff !== 0) return producerDiff;

            // 2. Sort by Product Name (A-Z)
            const nameDiff = (a.productName || '').localeCompare(b.productName || '');
            if (nameDiff !== 0) return nameDiff;

            // 3. Sort by Bottle Size (750ml first)
            const getRank = (size: string | undefined) => {
                if (!size) return 2;
                const s = size.toLowerCase();
                if (s.includes('750') || s.includes('0.75')) return 0;
                return 1;
            };
            return getRank(a.bottleSize) - getRank(b.bottleSize);
        });
    }, [allowedProducts, searchTerm, selectedCountry, selectedRegion, selectedAppellation, selectedSupplier, minSize, maxSize, priceRange, formulas]);

    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleAddProduct = async (product: any, pricing: any) => {
        let validItemCode = product.itemCode;
        let validProductName = product.productName;

        // heuristic: if productName is short code (e.g. MECH251) and itemCode is long description
        if (product.productName && product.productName.length < 15 && product.productName === product.productName.toUpperCase()) {
            // Assume productName holds the code
            validItemCode = product.productName;

            // Try to extract real name from itemCode if it's the long concatenated string
            if (product.itemCode && product.itemCode.startsWith(validItemCode)) {
                // Often it's "CODECODE Name - Updated" or just "CODE Name"
                // Let's try to strip the code from the start
                let cleanedName = product.itemCode;
                while (cleanedName.startsWith(validItemCode)) {
                    cleanedName = cleanedName.substring(validItemCode.length);
                }
                validProductName = cleanedName.trim() || product.productName;
            }
        }

        // Add standard "1 pack" order
        const payload = {
            itemCode: validItemCode, // Use sanitized code
            productId: product.id,
            producer: product.producer,
            productName: validProductName, // Use sanitized name
            vintage: product.vintage,
            packSize: product.packSize,
            bottleSize: product.bottleSize,
            productType: product.productType,
            fobCasePrice: product.fobCasePrice,
            supplier: product.supplier,
            uploadDate: product.uploadDate,
            frontlinePrice: pricing.frontlinePrice,
            srp: pricing.srp,
            whlsBottle: pricing.whlsBottle,
            laidIn: pricing.laidIn,
            formulaUsed: pricing.formulaUsed,
            productLink: product.productLink,
            cases: 1,
            bottles: 0,
            status: 'Pending',
            submitted: false,
            username: user?.username || 'Guest'
        };
        console.log('Adding Special Order Payload:', payload);

        const newOrder = await addSpecialOrder(payload);
        if (newOrder) {
            navigate('/orders', { state: { highlightOrderId: newOrder.id } });
        } else {
            setSuccessMessage(`Added ${validProductName} to your list.`);
            window.scrollTo(0, 0);
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedCountry('all');
        setSelectedRegion('all');
        setSelectedAppellation('all');
        setSelectedSupplier('all');
        setMinSize('');
        setMaxSize('');
        setPriceRange([0, 10000]);
    };

    if (isLoading && products.length === 0) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 py-10">
                <h2 className="text-2xl font-bold">Error Loading Catalog</h2>
                <p>{error}</p>
            </div>
        );
    }

    const handleCountryChange = (country: string) => {
        setSelectedCountry(country);
        setSelectedRegion('all');
        setSelectedAppellation('all');
    };

    const handleRegionChange = (region: string) => {
        setSelectedRegion(region);
        setSelectedAppellation('all');
    };

    const handleExport = () => {
        const exportData = filteredProducts.map(p => {
            let pricing = {};
            if (formulas) {
                pricing = calculateFrontlinePrice(p, formulas);
            }
            const combined = { ...p, ...pricing } as any;

            // Base Export Object
            const exportItem: any = {
                'Item Code': combined.itemCode || '',
                'Product Name': combined.productName || '',
                'Producer': combined.producer || '',
                'Vintage': combined.vintage || '',
                'Bottle Size': combined.bottleSize || '',
                'Pack Size': combined.packSize || '',
                'Country': combined.country || '',
                'Region': combined.region || '',
                'Appellation': combined.appellation || '',
                'Supplier': combined.supplier || '',
                'Type': combined.productType || '',
                'Frontline Bottle': combined.frontlinePrice || '',
                'Frontline Case': combined.frontlineCase || '',
            };

            // Admin Only Columns
            if (user?.type === 'admin') {
                exportItem['FOB Case'] = combined.fobCasePrice || '';
            }

            return exportItem;
        });
        exportProductsToExcel(exportData, `AOC_Catalog_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleEditProduct = (product: IProduct) => {
        // Permission Check
        const isAuthorized = user?.type === 'admin' || user?.type === 'vendor';
        if (!isAuthorized) return;

        // Vendor Check
        if (user?.type === 'vendor' && user.vendors && user.vendors.length > 0) {
            // Vendors can only edit their own products
            if (!product.supplier || !user.vendors.includes(product.supplier)) {
                alert("You can only edit products from your assigned suppliers.");
                return;
            }
        }

        setEditingProduct(product);
        setIsEditModalOpen(true);
    };

    const handleAddNewProduct = () => {
        setEditingProduct(null);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = () => {
        fetchProducts(); // Refresh list to get updated data and recalculate prices
        setSuccessMessage(`Product updated successfully.`);
    };

    const canEdit = user?.type === 'admin' || user?.type === 'vendor';

    return (
        <div className="space-y-6 animate-fade-in-up">
            {isEditModalOpen && (
                <ProductEditModal
                    product={editingProduct}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveEdit}
                    suppliers={uniqueSuppliers}
                />
            )}

            <TaxonomySidebar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCountry={selectedCountry}
                setSelectedCountry={handleCountryChange}
                selectedRegion={selectedRegion}
                setSelectedRegion={handleRegionChange}
                selectedAppellation={selectedAppellation}
                setSelectedAppellation={setSelectedAppellation}
                selectedSupplier={selectedSupplier}
                setSelectedSupplier={setSelectedSupplier}
                minSize={minSize}
                setMinSize={setMinSize}
                maxSize={maxSize}
                setMaxSize={setMaxSize}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                uniqueCountries={uniqueCountries}
                uniqueRegions={uniqueRegions}
                uniqueAppellations={uniqueAppellations}
                suppliers={uniqueSuppliers}
                bottleSizes={uniqueBottleSizes}
                resetFilters={resetFilters}
            />

            {successMessage && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4 flex items-center justify-between animate-fade-in-up">
                    <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-bold text-emerald-800 dark:text-emerald-200">{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 font-bold text-sm">Dismiss</button>
                </div>
            )}

            <div className="flex justify-between items-center bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    Viewing {filteredProducts.length} Products
                </h2>
                <div className="flex items-center space-x-4">
                    {/* Add Product: Only Admin (Super/Rep) - Vendors typically import? Or can add? User didn't specify add, just "edit individual". Let's restrict Add to Admin for now unless specified. */}
                    {user?.type === 'admin' && (
                        <button
                            onClick={handleAddNewProduct}
                            className="flex items-center space-x-2 bg-rose-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Product</span>
                        </button>
                    )}

                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export Excel</span>
                    </button>

                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-rose-600 dark:text-rose-400' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <ProductGrid
                products={filteredProducts}
                formulas={formulas}
                onAdd={handleAddProduct}
                onEdit={canEdit ? handleEditProduct : undefined}
                viewMode={viewMode}
                isAdmin={canEdit} // Controls seeing FOB, which editors need
            />
        </div>
    );
};
