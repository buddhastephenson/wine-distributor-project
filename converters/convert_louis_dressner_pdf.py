#!/usr/bin/env python3
"""
Louis Dressner PDF to Excel Converter
Converts Louis/Dressner Selections PDF price lists to Excel format for upload to AOC Wines system.

Usage:
    python3 convert_louis_dressner_pdf.py input.pdf output.xlsx
"""

import sys
import pdfplumber
import re
from openpyxl import Workbook

def parse_louis_dressner_pdf(pdf_path):
    """Extract product data from Louis Dressner PDF format."""
    products = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
            
            lines = text.split('\n')
            current_region = None
            current_producer = None
            
            for line in lines:
                line = line.strip()
                if not line or 'Price List' in line or 'January 2026' in line:
                    continue
                
                # Region headers (all caps, no LD code)
                if line.isupper() and not line.startswith('LD') and len(line) < 50 and '$' not in line:
                    if line not in ['NEW ARRIVALS', 'SPECIAL PRICING', 'LAST CASES']:
                        current_region = line
                    continue
                
                # Producer lines (has comma, not LD code, no price)
                if ', ' in line and not line.startswith('LD') and '$' not in line and len(line) < 100:
                    current_producer = line
                    continue
                
                # Product lines (start with LD code)
                if line.startswith('LD'):
                    parts = line.split()
                    if len(parts) < 3:
                        continue
                    
                    item_code = parts[0]
                    
                    # Find price (contains /cs)
                    price_idx = None
                    for i, part in enumerate(parts):
                        if '/cs' in part:
                            price_idx = i
                            break
                    
                    if price_idx is None:
                        continue
                    
                    # Extract FOB price
                    price_str = parts[price_idx].replace('$', '').replace('/cs', '')
                    try:
                        fob_price = float(price_str)
                    except:
                        continue
                    
                    # Product name is everything between code and price
                    product_name_parts = parts[1:price_idx]
                    product_name = ' '.join(product_name_parts)
                    
                    # Clean up product name (remove duplicate pack size info)
                    product_name = re.sub(r'\s+\(\d+\)\s+\(\d+/\d+ml\)$', '', product_name)
                    
                    # Extract vintage
                    vintage_match = re.search(r'\b(20\d{2}|NV)\b', product_name)
                    vintage = vintage_match.group(1) if vintage_match else 'NV'
                    
                    # Extract pack size (like 12/750ml, 6/1.5L)
                    pack_match = re.search(r'(\d+)/(\d+(?:\.\d+)?)(ml|L)', product_name)
                    if pack_match:
                        pack_size = pack_match.group(1)
                        bottle_size_num = pack_match.group(2)
                        bottle_size_unit = pack_match.group(3)
                        
                        # Convert to ml
                        if bottle_size_unit.upper() == 'L':
                            bottle_size = str(int(float(bottle_size_num) * 1000))
                        else:
                            bottle_size = bottle_size_num
                    else:
                        pack_size = '12'
                        bottle_size = '750'
                    
                    # Determine product type
                    name_lower = product_name.lower()
                    if any(w in name_lower for w in ['sparkling', 'frizzante', 'brut', 'mousseaux', 'metodo', 'pétillant']):
                        product_type = 'Sparkling Wine'
                    elif any(w in name_lower for w in ['rosé', 'rosato', 'rose', 'pink']):
                        product_type = 'Rosé'
                    elif any(w in name_lower for w in ['blanc', 'bianco', 'white', 'branco']):
                        product_type = 'White Wine'
                    elif any(w in name_lower for w in ['rouge', 'rosso', 'tinto', 'red']):
                        product_type = 'Red Wine'
                    elif any(w in name_lower for w in ['porto', 'port', 'tawny']):
                        product_type = 'Fortified Wine'
                    elif 'cidre' in name_lower or 'cider' in name_lower:
                        product_type = 'Cider'
                    else:
                        product_type = 'Wine'
                    
                    products.append({
                        'Item Code': item_code,
                        'Producer': current_producer or 'Unknown Producer',
                        'Product Name': product_name,
                        'Vintage': vintage,
                        'Pack Size': pack_size,
                        'Bottle Size (ml)': bottle_size,
                        'Product Type': product_type,
                        'FOB Case Price': fob_price
                    })
    
    return products

def write_to_excel(products, output_path):
    """Write products to Excel file."""
    wb = Workbook()
    ws = wb.active
    ws.title = "Price List"
    
    # Write headers
    headers = ['Item Code', 'Producer', 'Product Name', 'Vintage', 
               'Pack Size', 'Bottle Size (ml)', 'Product Type', 'FOB Case Price']
    ws.append(headers)
    
    # Write data
    for product in products:
        row = [product[h] for h in headers]
        ws.append(row)
    
    # Format columns
    ws.column_dimensions['A'].width = 12
    ws.column_dimensions['B'].width = 35
    ws.column_dimensions['C'].width = 50
    ws.column_dimensions['D'].width = 10
    ws.column_dimensions['E'].width = 10
    ws.column_dimensions['F'].width = 15
    ws.column_dimensions['G'].width = 15
    ws.column_dimensions['H'].width = 15
    
    wb.save(output_path)

def main():
    if len(sys.argv) != 3:
        print("Usage: python3 convert_louis_dressner_pdf.py input.pdf output.xlsx")
        print("\nExample:")
        print("  python3 convert_louis_dressner_pdf.py Louis_Dressner_Jan_2026.pdf LouisDressner.xlsx")
        sys.exit(1)
    
    input_pdf = sys.argv[1]
    output_xlsx = sys.argv[2]
    
    print(f"Converting {input_pdf}...")
    products = parse_louis_dressner_pdf(input_pdf)
    
    print(f"Extracted {len(products)} products")
    
    if products:
        write_to_excel(products, output_xlsx)
        print(f"✓ Saved to {output_xlsx}")
        print(f"\nYou can now upload {output_xlsx} to the AOC Wines system")
    else:
        print("✗ No products found in PDF")
        sys.exit(1)

if __name__ == '__main__':
    main()
