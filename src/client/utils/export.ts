import * as XLSX from 'xlsx';
import { ISpecialOrder } from '../../shared/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportOrdersToExcel = (orders: ISpecialOrder[], filename: string = 'orders.xlsx', vendorMap: Record<string, string> = {}) => {
    // Flatten data for export
    const data = orders.map(order => {
        // Extract latest chat info if available, or just count
        const chatInfo = order.messages && order.messages.length > 0
            ? order.messages.map(msg => {
                const date = new Date(msg.timestamp).toLocaleDateString();
                return `[${date}] ${msg.sender}: ${msg.text}`;
            }).join('\n')
            : order.adminNotes || order.notes || '';

        // "Vendor" column should be the User (Vendor) Name
        // "Import Name" column should be the Price List/Supplier Name
        const supplierName = order.supplier || 'Unknown';
        const vendorName = vendorMap[supplierName] || (order.supplier ? 'Unassigned' : '');

        return {
            'Item Code': order.itemCode || '',
            'Order ID': order.id, // Needed for re-import
            'Customer': order.username || 'Unknown',
            'Vendor': vendorName, // Real Human Vendor
            'Import Name': supplierName, // Price List Name
            'Producer': order.producer || '',
            'Product': order.productName || '',
            'Vintage': order.vintage || '',
            'Bottle Size': order.bottleSize || '',
            'Case Pack': order.packSize || '',
            'FOB Case': order.fobCasePrice || '',
            'Frontline Case': (parseFloat(order.frontlinePrice || '0') * parseInt(order.packSize || '12')).toFixed(2),
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

export const exportProductsToExcel = (data: any[], filename: string = 'products.xlsx') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Catalog");
    XLSX.writeFile(workbook, filename);
};

export const exportProductsToPDF = (data: any[], filename: string = 'catalog.pdf', logoUrl: string = '/logo.jpg') => {
    const doc = new jsPDF('landscape');

    const addContent = (logoImage?: HTMLImageElement) => {
        if (logoImage) {
            const imgWidth = 50; 
            const imgHeight = (logoImage.height * imgWidth) / logoImage.width;
            doc.addImage(logoImage, 'JPEG', doc.internal.pageSize.width / 2 - imgWidth / 2, 10, imgWidth, imgHeight);
            doc.setFontSize(20);
            doc.text('Special Offering', doc.internal.pageSize.width / 2, 10 + imgHeight + 10, { align: 'center' });
        } else {
            doc.setFontSize(20);
            doc.text('Special Offering', doc.internal.pageSize.width / 2, 20, { align: 'center' });
        }

        const columns = [
            { header: 'Producer', dataKey: 'Producer' },
            { header: 'Product Name', dataKey: 'Product Name' },
            { header: 'Vintage', dataKey: 'Vintage' },
            { header: 'Size', dataKey: 'Size' },
            { header: 'Type', dataKey: 'Type' },
            { header: 'Frontline Btl', dataKey: 'Frontline Bottle' },
            { header: 'Frontline Cs', dataKey: 'Frontline Case' }
        ];

        const rows = data.map(item => ({
            'Producer': item.Producer || '',
            'Product Name': item['Product Name'] || '',
            'Vintage': item.Vintage || '',
            'Size': `${item['Bottle Size'] || ''} ${item['Pack Size'] ? '/ ' + item['Pack Size'] + 'pk' : ''}`.trim(),
            'Type': item.Type || '',
            'Frontline Bottle': item['Frontline Bottle'] ? `$${parseFloat(item['Frontline Bottle']).toFixed(2)}` : '',
            'Frontline Case': item['Frontline Case'] ? `$${parseFloat(item['Frontline Case']).toFixed(2)}` : '',
        }));

        autoTable(doc, {
            columns: columns,
            body: rows,
            startY: logoImage ? 10 + ((logoImage.height * 50) / logoImage.width) + 15 : 30,
            headStyles: { fillColor: [41, 128, 185] },
            theme: 'striped',
            styles: { fontSize: 9 },
        });

        doc.save(filename);
    };

    if (logoUrl) {
        const img = new Image();
        img.src = logoUrl;
        img.onload = () => addContent(img);
        img.onerror = () => {
            console.warn("Could not load logo. Proceeding without it.");
            addContent();
        };
    } else {
        addContent();
    }
};
