import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Upload, FileText, CheckCircle, AlertCircle, Save, X, Download, ArrowRight, RefreshCw } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';
import { useAuthStore } from '../../store/useAuthStore';
import { productApi, userApi } from '../../services/api';

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
    { key: 'grapeVariety', label: 'Grape Variety', required: false, aliases: ['Grape', 'Variety', 'Varietal', 'Grapes'] },
    { key: 'productLink', label: 'Product Link', required: false, aliases: ['Product Link', 'Website', 'Site', 'URL', 'Link'] },
];

export const ImportPage: React.FC = () => {
    const { products, fetchProducts } = useProductStore();
    const user = useAuthStore(state => state.user);
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Map, 3: Preview/Import
    const [file, setFile] = useState<File | null>(null);
    const [rawFileDetails, setRawFileDetails] = useState<{ headers: string[], data: any[] } | null>(null);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({}); // System Key -> File Header
    const [selectedExtraColumns, setSelectedExtraColumns] = useState<string[]>([]); // Headers to import as extended data

    const [previewData, setPreviewData] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<string[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<string>('');
    const [isNewSupplier, setIsNewSupplier] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStats, setUploadStats] = useState<{ added: number, updated: number, deleted: number, kept: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [vendors, setVendors] = useState<any[]>([]);
    const [selectedVendor, setSelectedVendor] = useState<string>('');
    const [defaultProductType, setDefaultProductType] = useState<string>('wine');

    // Fetch products and users (vendors) on mount
    useEffect(() => {
        fetchProducts();

        const fetchVendors = async () => {
            try {
                const response = await userApi.getAll();
                // Filter for users who are explicitly 'vendor' (Restricted Admin)
                // OR 'admin' users who have restricted 'vendors' list?
                // The user said: "Vendor is created by an Admin as a User with Vendor credentials... type 'vendor'?"
                // Our system uses type='admin' + vendors=[] for Restricted Vendor.
                // Let's look for users who are NOT full admins (isSuperAdmin=false, type='admin', vendors.length > 0) OR type='vendor'.
                // Actually, let's just show ALL users who are capable of being a vendor.
                // But to be "Clean", let's just show users who have type='vendor' OR (type='admin' AND !isSuperAdmin AND vendors.length > 0)
                // Wait, previous fix sets type='admin' for restricted vendors.
                // Let's stick to: Users who are NOT Customers.
                // Actually, the user wants "Vendor will show up". 
                // Let's show all users of type 'vendor' or 'admin' (excluding Super Admin maybe? Or include them if they manage a portfolio).
                // Let's keep it simple: Show all users that are NOT 'customer'.

                const potentialVendors = response.data
                    .filter(u => u.type === 'vendor' || (u.type === 'admin' && !u.isSuperAdmin))
                    .sort((a, b) => a.username.localeCompare(b.username));

                setVendors(potentialVendors);
            } catch (err) {
                console.error('Failed to fetch vendors:', err);
            }
        };
        fetchVendors();
    }, [fetchProducts]);

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
            productType: String(row[columnMapping['productType']] || '').trim(), // Do not default to wine yet, check mapping
            country: String(row[columnMapping['country']] || '').trim(),
            region: String(row[columnMapping['region']] || '').trim(),
            appellation: String(row[columnMapping['appellation']] || '').trim(),
            grapeVariety: String(row[columnMapping['grapeVariety']] || '').trim(),
            productLink: String(row[columnMapping['productLink']] || '').trim(),
            extendedData: selectedExtraColumns.reduce((acc, col) => {
                const val = row[col];
                if (val !== undefined && val !== null && String(val).trim() !== '') {
                    acc[col] = val;
                }
                return acc;
            }, {} as Record<string, any>)
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
        const user = useAuthStore.getState().user;

        // 1. If User is Vendor, force selection to themselves.
        if (user?.type === 'vendor') {
            setSelectedVendor(user.id);
            // Also restrict suppliers to their list
            const vendorPortfolios = user.vendors || [];

            // If they have portfolios, and the file has suppliers, check overlap?
            // For now, let's just let the UI filter the dropdown options and validation handle it.
        }
        // 2. If User is Restricted Vendor Admin with exactly 1 allowed vendor -> Force Select that one.
        else if (user?.type === 'admin' && user?.vendors && user.vendors.length === 1) {
            setSelectedVendor(user.id); // Wait, for admin, 'vendors' is list of SUPPLIERS, not user IDs? 
            // Actually looking at User model: vendors: [String] -> these are supplier NAMES.
            // And 'vendor' field in Product is User ID.
            // So for Admin, we are selecting which *Admin User* manages it? No, `selectedVendor` is the User ID of the owner.
            // If I am an Admin, I can assign it to any vendor user.

            // Wait, previous logic was:
            // if (user?.type === 'admin' && user?.vendors && user.vendors.length === 1) {
            //    setSelectedSupplier(user.vendors[0]);
            // }
            // Correct.

            setSelectedSupplier(user.vendors[0]);
        } else {
            // For Super Admins or Multi-Vendor users, ensure we reset so they must choose
            if ((user?.type as string) !== 'vendor') setSelectedSupplier('');
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

        // Logic to validate supplier against vendor permissions
        // Logic to validate supplier against vendor permissions
        const user = useAuthStore.getState().user;

        // If user is Restriced Admin (Vendor), MUST match assigned portfolio
        if (user?.type === 'admin' && user.vendors && user.vendors.length > 0) {
            // They can only import if the selected supplier matches one of their assigned vendors
            if (!user.vendors.includes(finalSupplier)) {
                setError(`You are authorized for "${user.vendors.join(', ')}", but trying to import "${finalSupplier}".`);
                return;
            }
        }
        // If user is full Super Admin (no vendors restriction), they can import whatever.


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

        // Apply Default Product Type if Type is missing in any product
        // (Actually, if the column wasn't mapped, it's empty string now. If it was mapped but empty, it's empty string)
        if (!columnMapping['productType'] || productsToImport.some(p => !p.productType)) {
            productsToImport = productsToImport.map(p => ({
                ...p,
                productType: p.productType || defaultProductType
            }));
        }

        if (productsToImport.length === 0) {
            setError(`No products found for supplier "${finalSupplier}" in the file.`);
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            // Use authenticated API service
            const response = await productApi.import(productsToImport, finalSupplier, selectedVendor);

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

                            <div className="mt-8 border-t border-slate-100 dark:border-slate-700 pt-6">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
                                    Additional Data Columns (Optional)
                                </h3>
                                <p className="text-xs text-slate-500 mb-4">
                                    Select any other columns you want to import. These will be displayed as extra details on the product card.
                                </p>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {rawFileDetails.headers.filter(h => !Object.values(columnMapping).includes(h)).map(header => (
                                        <label key={header} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedExtraColumns.includes(header)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedExtraColumns(prev => [...prev, header]);
                                                    } else {
                                                        setSelectedExtraColumns(prev => prev.filter(h => h !== header));
                                                    }
                                                }}
                                                className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300 truncate" title={header}>{header}</span>
                                        </label>
                                    ))}
                                </div>
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
                                        {/* Vendor Selection - Only show for Super Admins */}
                                        {((user?.type === 'admin' && !user.vendors?.length)) && (
                                            <>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Assign to Vendor User
                                                    <span className="text-xs text-slate-400 font-normal ml-2">(Who manages this portfolio?)</span>
                                                </label>

                                                <div className="mb-6">
                                                    <select
                                                        value={selectedVendor}
                                                        onChange={(e) => {
                                                            const vId = e.target.value;
                                                            setSelectedVendor(vId);
                                                            // If we selected a vendor, check if they have strict portfolios
                                                            const vendorUser = vendors.find(v => v.id === vId);
                                                            if (vendorUser && vendorUser.vendors && vendorUser.vendors.length > 0) {
                                                                // Pre-select the first one if only one
                                                                if (vendorUser.vendors.length === 1) setSelectedSupplier(vendorUser.vendors[0]);
                                                                else setSelectedSupplier('');
                                                            } else {
                                                                setSelectedSupplier('');
                                                            }
                                                        }}
                                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 border"
                                                    >
                                                        <option value="">-- Select Vendor User --</option>
                                                        {vendors.map(v => (
                                                            <option key={v.id} value={v.id}>
                                                                {v.username} {v.vendors?.length > 0 ? `(${v.vendors.join(', ')})` : '(No Portfolios)'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Select the User account that owns this portfolio.
                                                        <br />
                                                        <span className="italic">Note: Vendors must be created in the Users tab first.</span>
                                                    </p>
                                                </div>
                                            </>
                                        )}

                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Select Name of Price List or Offer
                                            <span className="text-xs text-slate-400 font-normal ml-2">(e.g., "Spring 2024 Portfolio")</span>
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
                                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 border disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="">-- Select Price List --</option>

                                                {/* Logic for Options:
                                                    1. If Restricted Admin (User): Show ONLY their allowed portfolios.
                                                    2. If Super Admin AND Selected Vendor User: Show ONLY that vendor's portfolios.
                                                    3. If Super Admin AND No Vendor Selected: Show ALL portfolios? Or force selection?
                                                */}
                                                {(() => {
                                                    // 1. Restricted Admin
                                                    if (user?.type === 'admin' && user.vendors && user.vendors.length > 0) {
                                                        return user.vendors.map((s: string) => <option key={s} value={s}>{s}</option>);
                                                    }

                                                    // 2. Super Admin with Selected Vendor
                                                    if (selectedVendor) {
                                                        const vendorUser = vendors.find(v => v.id === selectedVendor);
                                                        if (vendorUser && vendorUser.vendors && vendorUser.vendors.length > 0) {
                                                            return [
                                                                ...vendorUser.vendors.map((s: string) => <option key={s} value={s}>{s}</option>),
                                                                <option key="new" value="___NEW___" className="font-bold text-indigo-600">+ Add New Portfolio to User</option>
                                                            ];
                                                        } else {
                                                            // Vendor has NO portfolios? Allow adding new.
                                                            return <option value="___NEW___" className="font-bold text-indigo-600">+ Create First Portfolio for User</option>;
                                                        }
                                                    }

                                                    // 3. Super Admin / No Vendor Selected (Scanning all products? or just empty)
                                                    // Let's show existing suppliers from products as fallback, but really we want them to pick a user first.
                                                    return suppliers.map((s: string) => <option key={s} value={s}>{s}</option>);
                                                })()}

                                                {/* General Add New Option (if not restricted) */}
                                                {(!selectedVendor && (!user?.vendors || user.vendors.length === 0)) && (
                                                    <option value="___NEW___" className="font-bold text-indigo-600">+ Create New Price List Name</option>
                                                )}
                                            </select>
                                        ) : (
                                            <div className="flex space-x-2">
                                                <input
                                                    type="text"
                                                    value={newSupplierName}
                                                    onChange={(e) => setNewSupplierName(e.target.value)}
                                                    placeholder="Enter Price List Name"
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
                                            Warning: Importing will replace the entire catalog for this price list.
                                        </p>
                                    </div>

                                    {/* Default Product Type Selection if Type Column NOT Mapped */}
                                    {!columnMapping['productType'] && (
                                        <div className="mt-6">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Default Product Type
                                                <span className="text-xs text-slate-400 font-normal ml-2">(Since 'Type' column was not mapped)</span>
                                            </label>
                                            <select
                                                value={defaultProductType}
                                                onChange={(e) => setDefaultProductType(e.target.value)}
                                                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 border"
                                            >
                                                <option value="wine">Wine (Standard Formula)</option>
                                                <option value="spirit">Spirits / High ABV</option>
                                                <option value="non-alcoholic">Non-Alcoholic</option>
                                                <option value="beer">Beer</option>
                                            </select>
                                            <p className="text-xs text-slate-500 mt-1">
                                                This type determines which pricing formula is applied to all imported products.
                                            </p>
                                        </div>
                                    )}

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
                                            disabled={
                                                isUploading ||
                                                (!selectedSupplier && !newSupplierName) ||
                                                // If NOT vendor, must select vendor. If Vendor, valid.
                                                (user?.type !== 'vendor' && !selectedVendor)
                                            }
                                            className={`py-2 px-6 rounded-xl flex items-center justify-center space-x-2 font-bold text-white transition-all shadow-md
                                                ${isUploading || (!selectedSupplier && !newSupplierName) || (user?.type !== 'vendor' && !selectedVendor) ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'}
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
