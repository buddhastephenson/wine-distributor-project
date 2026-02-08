import React from 'react';
import { Plus, ExternalLink } from 'lucide-react';
import { IProduct, IFormulas } from '../../../shared/types';
import { calculateFrontlinePrice } from '../../utils/formulas';

interface ProductCardProps {
    product: IProduct;
    formulas: IFormulas | null;
    onAdd: (product: IProduct, pricing: any) => void;
    isDarkMode?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, formulas, onAdd, isDarkMode }) => {
    const calc = formulas ? calculateFrontlinePrice(product, formulas) : { frontlinePrice: '0.00' };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-slate-800 hover:border-rose-100 dark:hover:border-rose-900/50 hover:shadow-[0_12px_48px_-12px_rgba(225,29,72,0.08)] transition-all duration-500 group flex flex-col justify-between h-full">
            <div>
                <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-3 py-1 rounded-full uppercase tracking-wider">
                        {product.productType || 'Wine'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-300 dark:text-slate-600">
                        {product.itemCode}
                    </span>
                </div>
                <h3 className="font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight leading-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors uppercase">
                    {product.producer}
                </h3>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 mb-2">
                    <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold uppercase tracking-widest">
                        {product.supplier}
                    </p>
                    {(product.country || product.region) && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-tight">
                            <span className="text-slate-200 dark:text-slate-800 mx-1.5">•</span>
                            {product.country}{product.region ? ` / ${product.region}` : ''}
                        </p>
                    )}
                    {product.uploadDate && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-tight">
                            <span className="text-slate-200 dark:text-slate-800 mx-1.5">•</span>
                            Updated: {new Date(product.uploadDate).toLocaleDateString()}
                        </p>
                    )}
                </div>
                {product.appellation && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold italic uppercase tracking-tighter mb-2">
                        {product.appellation}
                    </p>
                )}
                {product.productLink ? (
                    <a
                        href={product.productLink.startsWith('http') ? product.productLink : `https://${product.productLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed hover:text-rose-600 dark:hover:text-rose-400 transition-all inline-flex items-center group/link decoration-slate-200 dark:decoration-slate-700"
                    >
                        {product.productName}
                        <ExternalLink className="w-3 h-3 ml-2 opacity-0 group-hover/link:opacity-100 transition-all transform translate-x-1" />
                    </a>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                        {product.productName}
                    </p>
                )}

                {/* Dynamic Extra Fields Display */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                    {Object.entries(product).map(([key, value]) => {
                        const standardFields = ['id', 'itemCode', 'producer', 'productName', 'vintage', 'packSize', 'bottleSize', 'productType', 'fobCasePrice', 'productLink', 'supplier', 'uploadDate', 'frontlinePrice', 'frontlineCase', 'srp', 'whlsBottle', 'whlsCase', 'laidIn', 'formulaUsed', 'country', 'region', 'appellation'];
                        if (standardFields.includes(key) || !value || typeof value === 'object') return null;
                        return (
                            <span key={key} className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700 shadow-sm">
                                <span className="text-slate-300 dark:text-slate-600 mr-2">{key}:</span> <span className="text-slate-600 dark:text-slate-300">{String(value)}</span>
                            </span>
                        );
                    })}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex flex-col gap-6">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">
                            Frontline Price
                        </p>
                        <div className="flex items-baseline space-x-1">
                            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                ${calc.frontlinePrice}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                / btl
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            {product.packSize}pk • {product.bottleSize}
                        </p>
                        <p className="text-sm font-black text-slate-900 dark:text-white tracking-wide uppercase">
                            {product.vintage || 'NV'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => onAdd(product, calc)}
                    className="w-full bg-[#1a1a1a] dark:bg-rose-600 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-rose-700 transition-all duration-300 flex items-center justify-center space-x-3 active:scale-[0.98] shadow-lg shadow-slate-200 dark:shadow-none"
                >
                    <Plus className="w-4 h-4" />
                    <span>Submit Request</span>
                </button>
            </div>
        </div>
    );
};
