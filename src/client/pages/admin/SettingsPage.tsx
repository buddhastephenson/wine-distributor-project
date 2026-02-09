import React, { useEffect, useState } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { IFormulas, IFormula } from '../../../shared/types';

export const SettingsPage: React.FC = () => {
    const { formulas, fetchFormulas, updateFormulas, isLoading } = useProductStore();
    const [localFormulas, setLocalFormulas] = useState<IFormulas | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        fetchFormulas();
    }, [fetchFormulas]);

    useEffect(() => {
        if (formulas) {
            setLocalFormulas(formulas);
        }
    }, [formulas]);

    const handleChange = (category: keyof IFormulas, field: keyof IFormula, value: string) => {
        if (!localFormulas) return;

        const numValue = parseFloat(value); // Allow NaN during typing, handle on save or blur?
        // Actually, let's keep it as number but handle empty strings if needed.
        // For simplicity, we parse. If NaN, it might be 0.

        setLocalFormulas({
            ...localFormulas,
            [category]: {
                ...localFormulas[category],
                [field]: isNaN(numValue) ? 0 : numValue
            }
        });
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (localFormulas) {
            await updateFormulas(localFormulas);
            setHasChanges(false);
            alert('Settings Saved!');
        }
    };

    if (isLoading && !formulas) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600"></div>
            </div>
        );
    }

    if (!localFormulas) return null;

    const renderFormulaSection = (title: string, category: keyof IFormulas) => {
        const formula = localFormulas[category];
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
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">System Settings</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Calculation Engine & System Variables</p>
                    </div>
                </div>
                <div className="flex space-x-3">
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
