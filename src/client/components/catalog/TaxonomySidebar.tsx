import React from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface TaxonomySidebarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedCountry: string;
    setSelectedCountry: (country: string) => void;
    selectedRegion: string;
    setSelectedRegion: (region: string) => void;
    selectedAppellation: string;
    setSelectedAppellation: (appellation: string) => void;
    selectedSupplier: string;
    setSelectedSupplier: (supplier: string) => void;
    priceRange: [number, number];
    setPriceRange: (range: [number, number]) => void;
    uniqueCountries: string[];
    uniqueRegions: string[];
    uniqueAppellations: string[];
    suppliers: string[];
    bottleSizes: string[];
    minSize: number | '';
    setMinSize: (size: number | '') => void;
    maxSize: number | '';
    setMaxSize: (size: number | '') => void;
    resetFilters: () => void;
}

export const TaxonomySidebar: React.FC<TaxonomySidebarProps> = ({
    searchTerm,
    setSearchTerm,
    selectedCountry,
    setSelectedCountry,
    selectedRegion,
    setSelectedRegion,
    selectedAppellation,
    setSelectedAppellation,
    selectedSupplier,
    setSelectedSupplier,
    priceRange,
    setPriceRange,
    uniqueCountries,
    uniqueRegions,
    uniqueAppellations,
    suppliers,
    bottleSizes,
    minSize,
    setMinSize,
    maxSize,
    setMaxSize,
    resetFilters,
}) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 mb-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 dark:border-slate-800 transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Search Collection</h2>
                <button
                    onClick={resetFilters}
                    className="text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-colors flex items-center"
                >
                    <X className="w-3 h-3 mr-1" />
                    Reset Filters
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="md:col-span-2 lg:col-span-1 space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search</label>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600 group-focus-within:text-rose-500 transition-colors" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Name, vintage, producer..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 font-bold text-xs text-slate-700 dark:text-slate-200"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Country</label>
                    <div className="relative">
                        <select
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all font-bold text-xs appearance-none cursor-pointer pr-8 text-slate-700 dark:text-slate-200 truncate"
                        >
                            <option value="all">All Countries</option>
                            {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Region</label>
                    <div className="relative">
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all font-bold text-xs appearance-none cursor-pointer pr-8 text-slate-700 dark:text-slate-200 truncate"
                        >
                            <option value="all">All Regions</option>
                            {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Appellation</label>
                    <div className="relative">
                        <select
                            value={selectedAppellation}
                            onChange={(e) => setSelectedAppellation(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all font-bold text-xs appearance-none cursor-pointer pr-8 text-slate-700 dark:text-slate-200 truncate"
                        >
                            <option value="all">All Appellations</option>
                            {uniqueAppellations.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    </div>
                </div>

                <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bottle Size (mL)</label>
                    <div className="flex space-x-2">
                        <input
                            type="number"
                            min="0"
                            value={minSize}
                            onChange={(e) => setMinSize(e.target.value ? parseInt(e.target.value) : '')}
                            placeholder="Min mL"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all font-bold text-xs text-slate-700 dark:text-slate-200"
                        />
                        <input
                            type="number"
                            min="0"
                            value={maxSize}
                            onChange={(e) => setMaxSize(e.target.value ? parseInt(e.target.value) : '')}
                            placeholder="Max mL"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all font-bold text-xs text-slate-700 dark:text-slate-200"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5 lg:col-span-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Distributor Portfolios & Special Offers</label>
                    <div className="relative">
                        <select
                            value={selectedSupplier}
                            onChange={(e) => setSelectedSupplier(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all font-bold text-xs appearance-none cursor-pointer pr-8 text-slate-700 dark:text-slate-200"
                        >
                            <option value="all">All Suppliers and Offers</option>
                            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    </div>
                </div>

                {/* Price Range Inputs */}
                <div className="md:col-span-2 lg:col-span-2 flex space-x-2 pb-1 px-1">
                    <div className="flex-1">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Min Price ($)</label>
                        <input
                            type="number"
                            min="0"
                            value={priceRange[0]}
                            onChange={(e) => {
                                const val = Math.max(0, parseFloat(e.target.value) || 0);
                                setPriceRange([val, priceRange[1]]);
                            }}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all font-bold text-sm text-slate-700 dark:text-slate-200"
                            placeholder="Min"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Max Price ($)</label>
                        <input
                            type="number"
                            min="0"
                            value={priceRange[1]}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setPriceRange([priceRange[0], val]);
                            }}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all font-bold text-sm text-slate-700 dark:text-slate-200"
                            placeholder="Max"
                        />
                    </div>
                </div>
            </div>
        </div >
    );
};
