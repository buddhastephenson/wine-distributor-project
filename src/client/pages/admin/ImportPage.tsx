import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Upload, FileText, CheckCircle, AlertCircle, Save, X, Download, ArrowRight, RefreshCw } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';
import { useAuthStore } from '../../store/useAuthStore';
import { productApi } from '../../services/api';

const SYSTEM_FIELDS = [
    { key: 'itemCode', label: 'Item Code', required: true, aliases: ['Item Code', 'ItemCode', 'Code', 'SKU', 'Item'] },
    { key: 'productName', label: 'Product Name', required: true, aliases: ['Product Name', 'ProductName', 'Name', 'Description', 'Title'] },
    { key: 'producer', label: 'Producer', required: false, aliases: ['Producer', 'Brand'] },
    { key: 'vintage', label: 'Vintage', required: false, aliases: ['Vintage', 'Year'] },
    { key: 'bottleSize', label: 'Bottle Size', required: false, aliases: ['Bottle Size', 'Size', 'Bottle'] },
    { key: 'packSize', label: 'Pack Size', required: false, aliases: ['Pack Size', 'Pack', 'Case Size'] },
    { key: 'fobCasePrice', label: 'FOB Case', required: false, aliases: ['FOB Case', 'FobCase', 'Price', 'Cost', 'Case Price'] },
    { key: 'supplier', label: 'Supplier', required: false, aliases: ['Supplier', 'Vendor'] },
    { key: 'productType', label: 'Type', required: false, aliases: ['Type', 'Category'] },
    { key: 'country', label: 'Country', required: false, aliases: ['Country'] },
    { key: 'region', label: 'Region', required: false, aliases: ['Region'] },
    { key: 'appellation', label: 'Appellation', required: false, aliases: ['Appellation'] },
];

export const ImportPage: React.FC = () => {
    const { products, fetchProducts } = useProductStore();
    const user = useAuthStore(state => state.user);
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Map, 3: Preview/Import
    const [file, setFile] = useState<File | null>(null);
    const [rawFileDetails, setRawFileDetails] = useState<{ headers: string[], data: any[] } | null>(null);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({}); // System Key -> File Header

    const [previewData, setPreviewData] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<string[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<string>('');
    const [isNewSupplier, setIsNewSupplier] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStats, setUploadStats] = useState<{ added: number, updated: number, deleted: number, kept: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch products on mount to get existing suppliers
    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDownloadTemplate = () => {
        const headers = SYSTEM_FIELDS.map(f => f.label);
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "product_import_template.xlsx");
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        setFile(file);
        setUploadStats(null);
        setError(null);
        setRawFileDetails(null);
        setStep(1);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); // defval ensures keys exist

                if (jsonData.length === 0) {
                    setError('The Excel sheet appears to be empty.');
                    return;
                }

                // Get Headers from first row keys
                const firstRow: any = jsonData[0];
                const headers = Object.keys(firstRow);

                // Auto-Map
                const initialMapping: Record<string, string> = {};
                SYSTEM_FIELDS.forEach(field => {
                    // Try to find a matching header
                    const match = headers.find(h =>
                        field.aliases.some(alias => h.toLowerCase().replace(/[^a-z0-9]/g, '') === alias.toLowerCase().replace(/[^a-z0-9]/g, ''))
                    );
                    if (match) {
                        initialMapping[field.key] = match;
                    }
                });

                setRawFileDetails({ headers, data: jsonData });
                setColumnMapping(initialMapping);
                setStep(2); // Move to mapping

            } catch (err) {
                console.error('Error parsing Excel:', err);
                setError('Failed to parse Excel file.');
            }
        };
        reader.readAsArrayBuffer(file);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv']
        },
        maxFiles: 1
    });

    const handleMappingConfirm = () => {
        if (!rawFileDetails) return;

        // Process data using mapping
        const mappedProducts = rawFileDetails.data.map((row: any) => ({
            itemCode: String(row[columnMapping['itemCode']] || '').trim(),
            productName: String(row[columnMapping['productName']] || '').trim(),
            producer: String(row[columnMapping['producer']] || '').trim(),
            vintage: String(row[columnMapping['vintage']] || '').trim(),
            bottleSize: String(row[columnMapping['bottleSize']] || '750').trim(),
            packSize: String(row[columnMapping['packSize']] || '12').trim(),
            fobCasePrice: parseFloat(String(row[columnMapping['fobCasePrice']] || '0').replace(/[^0-9.]/g, '')),
            supplier: String(row[columnMapping['supplier']] || '').trim(),
            productType: String(row[columnMapping['productType']] || 'wine').trim(),
            country: String(row[columnMapping['country']] || '').trim(),
            region: String(row[columnMapping['region']] || '').trim(),
            appellation: String(row[columnMapping['appellation']] || '').trim(),
        })).filter(p => p.itemCode && p.productName);

        if (mappedProducts.length === 0) {
            setError('No valid products found after mapping. Ensure Item Code and Product Name are mapped correctly.');
            return;
        }

        setPreviewData(mappedProducts);

        // Extract Suppliers from File AND Existing Products
        const fileSuppliers = Array.from(new Set(mappedProducts.map((p: any) => p.supplier).filter(Boolean))) as string[];
        const existingSuppliers = Array.from(new Set(products.map(p => p.supplier).filter(Boolean))) as string[];
        const allSuppliers = Array.from(new Set([...existingSuppliers, ...fileSuppliers])).sort();

        setSuppliers(allSuppliers);

        setSuppliers(allSuppliers);

        // Auto-select logic:
        // 1. If User is Restricted Vendor with exactly 1 allowed vendor -> Force Select that one.
        // 2. If Super Admin (no vendors restricted) -> DO NOT auto-select based on file. Force them to choose.
        const user = useAuthStore.getState().user;
        if (user?.type === 'admin' && user?.vendors && user.vendors.length === 1) {
            setSelectedSupplier(user.vendors[0]);
        } else {
            // For Super Admins or Multi-Vendor users, ensure we reset so they must choose
            setSelectedSupplier('');
        }

        setStep(3);
        setError(null);
    };

    const handleImport = async () => {
        const finalSupplier = isNewSupplier ? newSupplierName.trim() : selectedSupplier;

        if (!finalSupplier) {
            setError('Please select or enter a Supplier / Portfolio Name.');
            return;
        }

        // Filter data for the selected supplier (in case file has mixed)
        // OR if user selected one, we assume they want to import ALL rows as that supplier?
        // Let's filter to be safe if the file has multiple.
        let productsToImport = previewData;

        // If the file has explicit 'Supplier' columns, filter by the selected one.
        const fileHasSuppliers = previewData.some(p => p.supplier);

        if (isNewSupplier) {
            // If creating new, force all products to have this new supplier name
            productsToImport = previewData.map(p => ({ ...p, supplier: finalSupplier }));
        } else if (fileHasSuppliers) {
            // If file has suppliers and we selected one, filter
            // But if the file supplier doesn't match selected, maybe we want to force it?
            // Current logic: If file has mixed, valid to filter. If file has NONE, map it.
            // If file has one but it differs from selected, we should probably OVERWRITE it to map to expectations.
            // Let's assume if user picks "Classic Wines", all rows become "Classic Wines"
            productsToImport = previewData.map(p => ({ ...p, supplier: finalSupplier }));
        } else {
            // If file has no supplier column, inject the selected one
            productsToImport = previewData.map(p => ({ ...p, supplier: finalSupplier }));
        }

        if (productsToImport.length === 0) {
            setError(`No products found for supplier "${finalSupplier}" in the file.`);
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            // Use authenticated API service
            const response = await productApi.import(productsToImport, finalSupplier);

            setUploadStats(response.data.stats);
            // Don't reset everything, show stats
            useProductStore.getState().fetchProducts();
        } catch (err: any) {
            console.error('Import failed:', err);
            setError(err.response?.data?.error || 'Import failed on server.');
        } finally {
            setIsUploading(false);
        }
    };

    const reset = () => {
        setStep(1);
        setFile(null);
        setRawFileDetails(null);
        setPreviewData([]);
        setUploadStats(null);
        setError(null);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Product Import Engine</h1>
                {step > 1 && (
                    <button onClick={reset} className="flex items-center text-sm text-slate-500 hover:text-slate-700 dark:text-gray-400">
                        <RefreshCw size={14} className="mr-1" /> Start Over
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Steps / Upload */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Step 1: Upload */}
                    <div className={`p-6 rounded-2xl shadow-sm border transition-all ${step === 1 ? 'bg-white dark:bg-slate-800 border-indigo-500 ring-1 ring-indigo-500' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-75'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-slate-700 dark:text-gray-200">1. Upload File</h2>
                            {step === 1 && (
                                <button onClick={handleDownloadTemplate} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                                    <Download size={12} className="mr-1" /> Template
                                </button>
                            )}
                        </div>

                        {step === 1 ? (
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'}`}
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center space-y-3">
                                    <FileText className={`w-10 h-10 ${isDragActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                                    <div className="text-sm text-slate-600 dark:text-slate-300">
                                        <span className="font-medium text-indigo-600">Click to upload</span> or drag
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between text-sm bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
                                <span className="truncate font-medium text-slate-700 dark:text-slate-200">{file?.name}</span>
                                <CheckCircle size={16} className="text-emerald-500" />
                            </div>
                        )}

                        {error && step === 1 && (
                            <div className="mt-3 text-xs text-red-600 flex items-start"><AlertCircle size={12} className="mr-1 mt-0.5" /> {error}</div>
                        )}
                    </div>

                    {/* Step 2 Indicator (Visual Only if not active) */}
                    <div className={`p-4 rounded-xl border ${step === 2 ? 'bg-white dark:bg-slate-800 border-indigo-500 ring-1 ring-indigo-500 shadow-sm' : 'bg-transparent border-transparent text-slate-400'}`}>
                        <h2 className="text-lg font-semibold">2. Map Columns</h2>
                    </div>

                    {/* Step 3 Indicator */}
                    <div className={`p-4 rounded-xl border ${step === 3 ? 'bg-white dark:bg-slate-800 border-indigo-500 ring-1 ring-indigo-500 shadow-sm' : 'bg-transparent border-transparent text-slate-400'}`}>
                        <h2 className="text-lg font-semibold">3. Confirm & Import</h2>
                    </div>
                </div>

                {/* Right Panel: Active Step Content */}
                <div className="lg:col-span-2 space-y-4">

                    {step === 2 && rawFileDetails && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">Map Your Columns</h2>
                            <p className="text-sm text-slate-500 mb-6">Match the system fields on the left with the columns from your Excel file on the right.</p>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {SYSTEM_FIELDS.map(field => (
                                    <div key={field.key} className="flex items-center space-x-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                        <div className="w-1/3">
                                            <div className="font-medium text-slate-700 dark:text-slate-200">
                                                {field.label} {field.required && <span className="text-red-500">*</span>}
                                            </div>
                                            <div className="text-xs text-slate-400">Target Field</div>
                                        </div>
                                        <ArrowRight size={16} className="text-slate-300" />
                                        <div className="flex-1">
                                            <select
                                                value={columnMapping[field.key] || ''}
                                                onChange={(e) => setColumnMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                className={`w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm py-2 px-3 ${!columnMapping[field.key] && field.required ? 'border-red-300 ring-1 ring-red-100' : ''}`}
                                            >
                                                <option value="">-- Ignore --</option>
                                                {rawFileDetails.headers.map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={handleMappingConfirm}
                                    disabled={SYSTEM_FIELDS.filter(f => f.required).some(f => !columnMapping[f.key])}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    Next: Review Data <ArrowRight size={16} className="ml-2" />
                                </button>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center">
                                    <AlertCircle size={16} className="mr-2" />
                                    {error}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 animate-fade-in-up">
                            <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">Confirm Import</h2>

                            {!uploadStats ? (
                                <div className="space-y-6">
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Sample Data (First Record)</span>
                                            <span className="px-2 py-1 bg-white dark:bg-indigo-900 rounded text-xs font-bold text-indigo-600">{previewData.length} Products Found</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                                            <div><span className="font-semibold">Code:</span> {previewData[0]?.itemCode}</div>
                                            <div><span className="font-semibold">Name:</span> {previewData[0]?.productName}</div>
                                            <div><span className="font-semibold">Price:</span> ${previewData[0]?.fobCasePrice}</div>
                                            <div><span className="font-semibold">Pack:</span> {previewData[0]?.packSize}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Select Supplier / Portfolio
                                            <span className="text-xs text-slate-400 font-normal ml-2">(Represents the Price List Name)</span>
                                        </label>

                                        {!isNewSupplier ? (
                                            <select
                                                value={selectedSupplier}
                                                onChange={(e) => {
                                                    if (e.target.value === '___NEW___') {
                                                        setIsNewSupplier(true);
                                                        setSelectedSupplier('');
                                                    } else {
                                                        setSelectedSupplier(e.target.value);
                                                    }
                                                }}
                                                // Disable if user is restricted to fewer than 2 choices (and 1 is auto-selected)
                                                disabled={(() => {
                                                    if (user?.type === 'admin' && user?.vendors && user.vendors.length > 0) {
                                                        // If restricted, and they have <= 1 vendor (which should be auto-selected), disable
                                                        return user.vendors.length <= 1;
                                                    }
                                                    return false;
                                                })()}
                                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 border disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="">-- Select Existing Supplier --</option>
                                                {/* Filter suppliers based on auth */}
                                                {suppliers.filter(s => {
                                                    if (user?.type === 'admin' && user?.vendors && user.vendors.length > 0) {
                                                        return user.vendors.includes(s);
                                                    }
                                                    return true;
                                                }).map(s => <option key={s} value={s}>{s}</option>)}

                                                {/* Only show Add New if logic permits? Actually backend blocks import for unknown suppliers if restricted.
                                                    But user might want to CREATE a new list for their vendor name if it doesn't exist in products yet??
                                                    If I am "Dalla Terra" and no products exist, `suppliers` list is empty.
                                                    I need to be able to select "Dalla Terra" or type it?
                                                    If I am restricted, I should arguably ONLY see my name.
                                                */}
                                                {(!user?.vendors?.length) && (
                                                    <option value="___NEW___" className="font-bold text-indigo-600">+ Add New Supplier / Portfolio</option>
                                                )}
                                            </select>
                                        ) : (
                                            <div className="flex space-x-2">
                                                <input
                                                    type="text"
                                                    value={newSupplierName}
                                                    onChange={(e) => setNewSupplierName(e.target.value)}
                                                    placeholder="Enter New Supplier / Portfolio Name"
                                                    className="flex-1 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 border"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => { setIsNewSupplier(false); setNewSupplierName(''); }}
                                                    className="text-slate-500 hover:text-slate-700 px-3 py-2 border rounded-lg"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}

                                        <p className="text-xs text-orange-600 mt-2 flex items-start">
                                            <AlertCircle size={12} className="mr-1 mt-0.5" />
                                            Warning: Importing will replace the entire catalog for this supplier,
                                            excluding products on active requests.
                                        </p>
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <button
                                            onClick={() => setStep(2)}
                                            disabled={isUploading}
                                            className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleImport}
                                            disabled={isUploading || (!selectedSupplier && !newSupplierName)}
                                            className={`py-2 px-6 rounded-xl flex items-center justify-center space-x-2 font-bold text-white transition-all shadow-md
                                                ${isUploading || (!selectedSupplier && !newSupplierName) ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'}
                                            `}
                                        >
                                            {isUploading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <span>Start Import</span>}
                                        </button>
                                    </div>

                                    {error && (
                                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center">
                                            <AlertCircle size={16} className="mr-2" />
                                            {error}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                                    <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-center mb-6">
                                        <CheckCircle className="mr-2" size={24} /> Import Complete
                                    </h3>
                                    <p className="text-emerald-700 dark:text-emerald-400 mb-6">
                                        The catalog for <span className="font-bold">{(uploadStats as any).supplier}</span> has been updated.
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-white dark:bg-emerald-900/40 p-4 rounded-xl">
                                            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{uploadStats.added}</div>
                                            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-bold uppercase">Added</div>
                                        </div>
                                        <div className="bg-white dark:bg-emerald-900/40 p-4 rounded-xl">
                                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{uploadStats.updated}</div>
                                            <div className="text-xs text-blue-800 dark:text-blue-300 font-bold uppercase">Updated</div>
                                        </div>
                                        <div className="bg-white dark:bg-emerald-900/40 p-4 rounded-xl">
                                            <div className="text-3xl font-bold text-slate-600 dark:text-slate-400">{uploadStats.kept}</div>
                                            <div className="text-xs text-slate-800 dark:text-slate-300 font-bold uppercase">Kept</div>
                                        </div>
                                        <div className="bg-white dark:bg-emerald-900/40 p-4 rounded-xl">
                                            <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">{uploadStats.deleted}</div>
                                            <div className="text-xs text-rose-800 dark:text-rose-300 font-bold uppercase">Removed</div>
                                        </div>
                                    </div>
                                    <button onClick={reset} className="text-emerald-600 hover:text-emerald-800 font-medium">
                                        Import Another File
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
