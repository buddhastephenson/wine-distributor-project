import * as XLSX from 'xlsx';
import { ISpecialOrder } from '../../shared/types';

export const exportOrdersToExcel = (orders: ISpecialOrder[], filename: string = 'orders.xlsx') => {
    // Flatten data for export
    const data = orders.map(order => {
        // Extract latest chat info if available, or just count
        const chatInfo = order.messages && order.messages.length > 0
            ? `${order.messages.length} messages. Latest: ${order.messages[order.messages.length - 1].text} (${order.messages[order.messages.length - 1].sender})`
            : order.adminNotes || order.notes || '';

        return {
            'Order ID': order.id, // Needed for re-import
            'Customer': order.username || 'Unknown',
            'Vendor': order.supplier || '',
            'Producer': order.producer || '',
            'Product': order.productName || '',
            'Vintage': order.vintage || '',
            'Bottle Size': order.bottleSize || '',
            'Case Pack': order.packSize || '',
            'FOB Case': order.fobCasePrice || '',
            'Frontline Case': order.frontlinePrice || '',
            'Wholesale Bottle': order.whlsBottle || '',
            'Status': order.status || 'Pending',
            'Quantity (Cases)': order.cases || 0,
            'Quantity (Bottles)': order.bottles || 0,
            'Date Requested': new Date(order.createdAt || order.uploadDate || Date.now()).toLocaleDateString(),
            'Chat/Notes': chatInfo,
            'Submitted': order.submitted ? 'Yes' : 'No'
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, filename);
};

export const exportProductsToExcel = (products: any[], filename: string = 'products.xlsx') => {
    const data = products.map(product => ({
        'Item Code': product.itemCode || '',
        'Product Name': product.productName || '',
        'Producer': product.producer || '',
        'Vintage': product.vintage || '',
        'Bottle Size': product.bottleSize || '',
        'Pack Size': product.packSize || '',
        'Country': product.country || '',
        'Region': product.region || '',
        'Appellation': product.appellation || '',
        'Supplier': product.supplier || '',
        'Type': product.productType || '',
        'FOB Case': product.fobCasePrice || 0,
        'Laid In': product.laidInCost || 0,
        'Wholesale Case': product.wholesalePrice || 0,
        'Status': product.status || 'Active'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Catalog");
    XLSX.writeFile(workbook, filename);
};
