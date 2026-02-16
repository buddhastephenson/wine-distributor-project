
import React, { useEffect, useState } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { Settings, Save, RefreshCw, X } from 'lucide-react';
import { IFormulas, IFormula } from '../../../shared/types';
import { DuplicateReviewModal } from '../../components/admin/DuplicateReviewModal';
import { SupplierManagementModal } from '../../components/admin/SupplierManagementModal';

export const SettingsPage: React.FC = () => {
    const [formulas, setLocalFormulas] = useState<IFormulas | null>(null);
    const { formulas: storeFormulas, fetchFormulas, updateFormulas, isLoading, scanDuplicates } = useProductStore();
    const [hasChanges, setHasChanges] = useState(false);

    // Deduplication State
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [duplicates, setDuplicates] = useState<any[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

    // Supplier Management State
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

    useEffect(() => {
        fetchFormulas();
    }, [fetchFormulas]);

    useEffect(() => {
        if (storeFormulas) {
            setLocalFormulas(storeFormulas);
        }
    }, [storeFormulas]);

    const handleChange = (category: keyof IFormulas, field: keyof IFormula, value: string) => {
        if (!formulas) return;

        const numValue = parseFloat(value);
        setLocalFormulas({
            ...formulas,
            [category]: {
                ...formulas[category],
                [field]: isNaN(numValue) ? 0 : numValue
            }
        });
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (formulas) {
            await updateFormulas(formulas);
            setHasChanges(false);
            setScanMessage({ type: 'success', text: 'Settings Saved!' });
            setTimeout(() => setScanMessage(null), 3000);
        }
    };

    const handleScan = async () => {
        console.log('Starting scan...');
        setIsScanning(true);
        setScanMessage(null);
        try {
            const results = await scanDuplicates();
            console.log('Scan results:', results);
            setIsScanning(false);

            if (results && results.length > 0) {
                console.log('Duplicates found, opening modal...');
                setDuplicates(results);
                setIsReviewOpen(true);
            } else {
                console.log('No duplicates found.');
                setScanMessage({ type: 'success', text: 'Great news! No duplicate products found.' });
            }
        } catch (e) {
            console.error('Scan error:', e);
            setIsScanning(false);
            setScanMessage({ type: 'error', text: 'Scan failed. Please check console.' });
        }
    };

    if (isLoading && !storeFormulas) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600"></div>
            </div>
        );
    }

    if (!formulas) return null;

    const renderFormulaSection = (title: string, category: keyof IFormulas) => {
        const formula = formulas[category];
        return (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider border-b border-slate-100 pb-2">
                    {title} Default Variables
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                            Tax Per Liter ($)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formula.taxPerLiter}
                            onChange={(e) => handleChange(category, 'taxPerLiter', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                            Fixed Tax ($)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formula.taxFixed}
                            onChange={(e) => handleChange(category, 'taxFixed', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                            Shipping Per Case ($)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formula.shippingPerCase}
                            onChange={(e) => handleChange(category, 'shippingPerCase', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                            Margin Divisor (e.g. 0.65)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formula.marginDivisor}
                            onChange={(e) => handleChange(category, 'marginDivisor', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                            SRP Multiplier (e.g. 1.47)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formula.srpMultiplier}
                            onChange={(e) => handleChange(category, 'srpMultiplier', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <DuplicateReviewModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                duplicates={duplicates}
            />

            <SupplierManagementModal
                isOpen={isSupplierModalOpen}
                onClose={() => setIsSupplierModalOpen(false)}
            />

            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 relative overflow-hidden">
                {scanMessage && (
                    <div className={`absolute top-0 left-0 w-full h-1 ${scanMessage.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                )}

                <div className="flex items-center space-x-4 z-10">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">System Settings</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest flex items-center">
                            Calculation Engine & System Variables
                            {scanMessage && (
                                <div className={`ml-3 px-3 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center shadow-sm ${scanMessage.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                    }`}>
                                    <span className="mr-2">{scanMessage.text}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setScanMessage(null); }}
                                        className="p-0.5 rounded-full hover:bg-white/50 transition-colors cursor-pointer"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex space-x-3 z-10">
                    <button
                        onClick={() => setIsSupplierModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors flex items-center border border-indigo-100 dark:border-indigo-900/30"
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Price Lists
                    </button>

                    <button
                        onClick={handleScan}
                        disabled={isScanning}
                        className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-bold text-sm hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors flex items-center border border-rose-100 dark:border-rose-900/30"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                        {isScanning ? 'Scanning...' : 'Scan Duplicates'}
                    </button>

                    <button
                        onClick={() => fetchFormulas()}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center shadow-lg ${hasChanges
                            ? 'bg-[#1a1a1a] dark:bg-white text-white dark:text-black hover:bg-slate-800 hover:scale-105'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Sections */}
            {renderFormulaSection('Wine & Standard', 'wine')}
            {renderFormulaSection('Spirits & High ABV', 'spirits')}
            {renderFormulaSection('Non-Alcoholic', 'nonAlcoholic')}
        </div>
    );
};
