import React, { useState, useEffect } from 'react';
import { IProduct } from '../../../shared/types';
import { Button } from '../shared/Button';
import { X, Save, AlertCircle } from 'lucide-react';
import { productApi } from '../../services/api';

interface ProductEditModalProps {
    product: IProduct;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({ product, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<IProduct>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (product) {
            setFormData({
                productName: product.productName,
                vintage: product.vintage,
                producer: product.producer,
                bottleSize: product.bottleSize,
                packSize: product.packSize,
                fobCasePrice: product.fobCasePrice,
                productType: product.productType,
                country: product.country,
                region: product.region,
                appellation: product.appellation,
                productLink: product.productLink
            });
        }
    }, [product]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'fobCasePrice' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await productApi.update(product.id, formData);
            onSave();
            onClose();
        } catch (err: any) {
            console.error('Update failed', err);
            setError(err.response?.data?.error || 'Failed to update product');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Product</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg flex items-center text-sm">
                            <AlertCircle size={16} className="mr-2" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Product Name</label>
                            <input
                                name="productName"
                                value={formData.productName || ''}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Producer</label>
                            <input
                                name="producer"
                                value={formData.producer || ''}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vintage</label>
                            <input
                                name="vintage"
                                value={formData.vintage || ''}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                            <select
                                name="productType"
                                value={formData.productType || 'wine'}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
                            >
                                <option value="wine">Wine</option>
                                <option value="spirit">Spirit</option>
                                <option value="beer">Beer</option>
                                <option value="non-alcoholic">Non-Alcoholic</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bottle Size</label>
                            <input
                                name="bottleSize"
                                value={formData.bottleSize || ''}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pack Size</label>
                            <input
                                name="packSize"
                                value={formData.packSize || ''}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">FOB Case Price</label>
                            <input
                                type="number"
                                step="0.01"
                                name="fobCasePrice"
                                value={formData.fobCasePrice || ''}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link (URL)</label>
                            <input
                                name="productLink"
                                value={formData.productLink || ''}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Country</label>
                            <input
                                name="country"
                                value={formData.country || ''}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Region</label>
                            <input
                                name="region"
                                value={formData.region || ''}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Appellation</label>
                            <input
                                name="appellation"
                                value={formData.appellation || ''}
                                onChange={handleChange}
                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
                        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
