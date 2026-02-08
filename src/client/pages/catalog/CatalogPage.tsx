import React, { useEffect, useState, useMemo } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { useAuthStore } from '../../store/useAuthStore';
import { TaxonomySidebar } from '../../components/catalog/TaxonomySidebar';
import { ProductGrid } from '../../components/catalog/ProductGrid';
import { LayoutGrid, List } from 'lucide-react';
import { calculateFrontlinePrice } from '../../utils/formulas';

export const CatalogPage: React.FC = () => {
    const { products, formulas, isLoading, error, fetchProducts, fetchFormulas, addSpecialOrder } = useProductStore();
    const { user } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('all');
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedAppellation, setSelectedAppellation] = useState('all');
    const [selectedSupplier, setSelectedSupplier] = useState('all');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Fetch Data on Mount
    useEffect(() => {
        fetchProducts();
        fetchFormulas();
    }, [fetchProducts, fetchFormulas]);

    // Derive Unique Filter Options
    const uniqueCountries = useMemo(() => {
        const countries = new Set(products.map(p => p.country).filter(Boolean));
        return Array.from(countries).sort() as string[];
    }, [products]);

    const uniqueRegions = useMemo(() => {
        const regions = new Set(products.filter(p => selectedCountry === 'all' || p.country === selectedCountry).map(p => p.region).filter(Boolean));
        return Array.from(regions).sort() as string[];
    }, [products, selectedCountry]);

    const uniqueAppellations = useMemo(() => {
        const appellations = new Set(products.filter(p =>
            (selectedCountry === 'all' || p.country === selectedCountry) &&
            (selectedRegion === 'all' || p.region === selectedRegion)
        ).map(p => p.appellation).filter(Boolean));
        return Array.from(appellations).sort() as string[];
    }, [products, selectedCountry, selectedRegion]); // Added selectedRegion dependency

    const uniqueSuppliers = useMemo(() => {
        const suppliers = new Set(products.map(p => p.supplier).filter(Boolean));
        return Array.from(suppliers).sort() as string[];
    }, [products]);


    // Filter Products
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            // Search Term
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                (product.productName?.toLowerCase().includes(searchLower)) ||
                (product.producer?.toLowerCase().includes(searchLower)) ||
                (product.itemCode?.toLowerCase().includes(searchLower)) ||
                (product.vintage?.toString().includes(searchLower));

            if (!matchesSearch) return false;

            // Dropdowns
            if (selectedCountry !== 'all' && product.country !== selectedCountry) return false;
            if (selectedRegion !== 'all' && product.region !== selectedRegion) return false;
            if (selectedAppellation !== 'all' && product.appellation !== selectedAppellation) return false;
            if (selectedSupplier !== 'all' && product.supplier !== selectedSupplier) return false;

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
    }, [products, searchTerm, selectedCountry, selectedRegion, selectedAppellation, selectedSupplier, priceRange, formulas]);

    const handleAddProduct = (product: any, pricing: any) => {
        // Data Sanitization for weird import artifacts
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
            status: 'pending',
            submitted: false,
            username: user?.username || 'Guest'
        };
        console.log('Adding Special Order Payload:', payload);

        if (!payload.username) {
            alert("Error: No username found. Please log in.");
            return;
        }

        addSpecialOrder(payload);
        // Ideally show a toast here instead of an alert
        // alert(`Added ${validProductName} to your list.`);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedCountry('all');
        setSelectedRegion('all');
        setSelectedAppellation('all');
        setSelectedSupplier('all');
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

    return (
        <div className="space-y-6 animate-fade-in-up">
            <TaxonomySidebar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCountry={selectedCountry}
                setSelectedCountry={setSelectedCountry}
                selectedRegion={selectedRegion}
                setSelectedRegion={setSelectedRegion}
                selectedAppellation={selectedAppellation}
                setSelectedAppellation={setSelectedAppellation}
                selectedSupplier={selectedSupplier}
                setSelectedSupplier={setSelectedSupplier}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                uniqueCountries={uniqueCountries}
                uniqueRegions={uniqueRegions}
                uniqueAppellations={uniqueAppellations}
                suppliers={uniqueSuppliers}
                resetFilters={resetFilters}
            />

            <div className="flex justify-between items-center bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    Viewing {filteredProducts.length} Products
                </h2>
                <div className="flex space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <ProductGrid
                products={filteredProducts}
                formulas={formulas}
                onAdd={handleAddProduct}
                viewMode={viewMode}
            />
        </div>
    );
};
