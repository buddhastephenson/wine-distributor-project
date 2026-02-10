import React from 'react';
import { Plus } from 'lucide-react';
import { IProduct, IFormulas } from '../../../shared/types';
import { ProductCard } from './ProductCard';
import { calculateFrontlinePrice } from '../../utils/formulas';

interface ProductGridProps {
    products: IProduct[];
    formulas: IFormulas | null;
    onAdd: (product: IProduct, pricing: any) => void;
    onEdit?: (product: IProduct) => void;
    viewMode: 'grid' | 'list';
    isDarkMode?: boolean;
    isAdmin?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, formulas, onAdd, onEdit, viewMode, isDarkMode, isAdmin }) => {
    if (viewMode === 'grid') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {products.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        formulas={formulas}
                        onAdd={onAdd}
                        onEdit={onEdit}
                        isDarkMode={isDarkMode}
                        isAdmin={isAdmin}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100/80 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-colors duration-300">
            <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                            <th className="py-5 px-8 text-left">Producer / Product</th>
                            <th className="py-5 px-6 text-left">Vintage</th>
                            <th className="py-5 px-6 text-left">Format</th>
                            <th className="py-5 px-6 text-left">Type</th>
                            <th className="py-5 px-6 text-right">Unit Net</th>
                            {isAdmin && <th className="py-5 px-6 text-right text-rose-600 dark:text-rose-400">FOB</th>}
                            <th className="py-5 px-8 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {products.map(product => {
                            const calc = formulas ? calculateFrontlinePrice(product, formulas) : { frontlinePrice: '0.00' };
                            return (
                                <tr key={product.id} className="group hover:bg-rose-50/20 dark:hover:bg-rose-900/10 transition-all duration-300">
                                    <td className="py-4 px-8">
                                        <div>
                                            <p className="font-extrabold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors uppercase tracking-tight">
                                                {product.producer}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                                {product.productName}
                                            </p>
                                            {product.uploadDate && (
                                                <p className="text-[9px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-wide mt-1">
                                                    Updated: {new Date(product.uploadDate).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                            {product.vintage || 'NV'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100/50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                            {product.packSize}×{product.bottleSize}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-[9px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full">
                                            {product.productType || 'Wine'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <span className="text-sm font-black text-slate-900 dark:text-white">
                                            ${calc.frontlinePrice}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td className="py-4 px-6 text-right">
                                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                                ${typeof product.fobCasePrice === 'number' ? product.fobCasePrice.toFixed(2) : product.fobCasePrice}
                                            </span>
                                        </td>
                                    )}
                                    <td className="py-4 px-8 text-center">
                                        <button
                                            onClick={() => onAdd(product, calc)}
                                            className="p-2.5 bg-slate-900 dark:bg-rose-600 text-white rounded-xl hover:bg-rose-600 dark:hover:bg-rose-700 transition-all shadow-sm active:scale-90"
                                            title="Add to List"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
