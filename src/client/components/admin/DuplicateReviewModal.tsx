
import React, { useState } from 'react';
import { IProduct } from '../../../shared/types';
import { LayoutList, Search, AlertCircle, CheckCircle, ArrowRight, Trash2, X } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';

interface DuplicateReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    duplicates: any[];
}

export const DuplicateReviewModal: React.FC<DuplicateReviewModalProps> = ({ isOpen, onClose, duplicates }) => {
    console.log(`Modal Render: isOpen=${isOpen}, duplicates=`, duplicates?.length);

    const { executeDeduplication } = useProductStore();
    const [selectedWinners, setSelectedWinners] = useState<{ [key: string]: string }>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<{ merged: number, deleted: number, error?: string } | null>(null);

    const [isConfirming, setIsConfirming] = useState(false);

    // Initialize winners on mount if not set (default to first/newest in doc list)
    React.useEffect(() => {
        const initialWinners: { [key: string]: string } = {};
        duplicates.forEach((group: any) => {
            const groupKey = `${group._id.itemCode}-${group._id.supplier}`;
            if (!selectedWinners[groupKey]) {
                // Find newest
                const sorted = [...group.docs].sort((a: any, b: any) => {
                    const getDate = (d: any) => {
                        const val = d.updatedAt || d.uploadDate;
                        if (!val) return 0;
                        const dateObj = new Date(val);
                        return isNaN(dateObj.getTime()) ? 0 : dateObj.getTime();
                    };
                    return getDate(b) - getDate(a); // Descending
                });
                initialWinners[groupKey] = sorted[0].id;
            }
        });
        setSelectedWinners(prev => ({ ...prev, ...initialWinners }));
    }, [duplicates]);

    if (!isOpen) return null;

    const handleSelectWinner = (groupKey: string, winnerId: string) => {
        setSelectedWinners(prev => ({ ...prev, [groupKey]: winnerId }));
    };

    const handleMergeClick = () => {
        setIsConfirming(true);
    };

    const handleExecute = async () => {
        setIsProcessing(true);
        try {
            // Build payload
            const groupsToMerge = duplicates.map((group: any) => {
                const groupKey = `${group._id.itemCode}-${group._id.supplier}`;
                const winnerId = selectedWinners[groupKey];
                const loserIds = group.docs.filter((d: any) => d.id !== winnerId).map((d: any) => d.id);
                return { winnerId, loserIds };
            });

            const stats = await executeDeduplication(groupsToMerge);
            setResults(stats);
            // Don't close automatically. Show success message.
        } catch (error) {
            console.error('Deduplication failed:', error);
            setResults({ merged: 0, deleted: 0, error: 'Failed to execute deduplication. Check console for details.' });
        } finally {
            setIsProcessing(false);
            setIsConfirming(false);
        }
    };

    if (results) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
                    {results.error ? (
                        <>
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Error</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">
                                {results.error}
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Cleanup Complete!</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">
                                Successfully merged <span className="font-bold text-slate-800 dark:text-white">{results.merged} groups</span> and deleted <span className="font-bold text-red-500">{results.deleted} duplicates</span>.
                            </p>
                        </>
                    )}
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-800 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header - Matching SupplierManagementModal */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                            <LayoutList className="w-6 h-6 mr-3 text-rose-500" />
                            Review Duplicates
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Found {duplicates.length} groups of duplicates. Select the "Winner" to keep.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50 dark:bg-slate-950/50">
                    {duplicates.map((group: any, idx) => {
                        const groupKey = `${group._id.itemCode}-${group._id.supplier}`;
                        const winnerId = selectedWinners[groupKey];

                        return (
                            <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <span className="font-mono text-xs font-bold bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                        {group._id.itemCode}
                                    </span>
                                    <span className="text-sm font-bold text-slate-500">{group._id.supplier}</span>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {group.docs.map((doc: any) => {
                                        const isWinner = doc.id === winnerId;
                                        return (
                                            <div
                                                key={doc.id}
                                                onClick={() => handleSelectWinner(groupKey, doc.id)}
                                                className={`p-4 flex items-center cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isWinner ? 'bg-rose-50/50 dark:bg-rose-900/10' : ''}`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 ${isWinner ? 'border-rose-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                                    {isWinner && <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className={`font-bold text-sm ${isWinner ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                        {doc.productName}
                                                    </h4>
                                                    <div className="flex items-center space-x-4 mt-1">
                                                        <span className="text-xs text-slate-500">
                                                            Uploaded: {(() => {
                                                                try {
                                                                    const d = doc.uploadDate || doc.createdAt;
                                                                    return d ? new Date(d).toLocaleDateString() : 'N/A';
                                                                } catch (e) { return 'Invalid Date'; }
                                                            })()}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            Updated: {(() => {
                                                                try {
                                                                    return doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : '-';
                                                                } catch (e) { return '-'; }
                                                            })()}
                                                        </span>
                                                    </div>
                                                </div>
                                                {isWinner ? (
                                                    <span className="text-xs font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/30 px-2 py-1 rounded-full flex items-center">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> KEEP
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-400 flex items-center">
                                                        <Trash2 className="w-3 h-3 mr-1" /> DELETE
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl h-[88px]">
                    {isConfirming ? (
                        <div className="flex items-center space-x-4 animate-scale-in">
                            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                                Confirm merge? Unselected products will be deleted.
                            </span>
                            <button
                                onClick={() => setIsConfirming(false)}
                                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold hover:bg-slate-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExecute}
                                disabled={isProcessing}
                                className="px-6 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 shadow-lg flex items-center"
                            >
                                {isProcessing ? (
                                    <span className="animate-spin mr-2">⟳</span>
                                ) : (
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                )}
                                Confirm
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 font-medium transition-colors mr-4"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMergeClick}
                                disabled={isProcessing}
                                className="bg-rose-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg hover:bg-rose-700 active:scale-95 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Merge Selected
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
