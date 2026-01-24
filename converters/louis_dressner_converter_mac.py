#!/usr/bin/env python3
"""
Louis Dressner PDF Converter - Mac App
Drag and drop PDF files onto this app to convert them to Excel.
"""

import sys
import os
from pathlib import Path

# Check if running as app bundle
if getattr(sys, 'frozen', False):
    # Running as compiled app
    script_dir = os.path.dirname(sys.executable)
else:
    # Running as script
    script_dir = os.path.dirname(os.path.abspath(__file__))

# Import the converter
sys.path.insert(0, script_dir)

try:
    import pdfplumber
    from openpyxl import Workbook
except ImportError:
    import subprocess
    print("Installing required packages...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "openpyxl", "--break-system-packages"])
    import pdfplumber
    from openpyxl import Workbook

import re

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
                    
                    # Clean up product name
                    product_name = re.sub(r'\s+\(\d+\)\s+\(\d+/\d+ml\)$', '', product_name)
                    
                    # Extract vintage
                    vintage_match = re.search(r'\b(20\d{2}|NV)\b', product_name)
                    vintage = vintage_match.group(1) if vintage_match else 'NV'
                    
                    # Extract pack size
                    pack_match = re.search(r'(\d+)/(\d+(?:\.\d+)?)(ml|L)', product_name)
                    if pack_match:
                        pack_size = pack_match.group(1)
                        bottle_size_num = pack_match.group(2)
                        bottle_size_unit = pack_match.group(3)
                        
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
    if len(sys.argv) < 2:
        print("Louis Dressner PDF to Excel Converter")
        print("\nDrag and drop a PDF file onto this app to convert it.")
        input("\nPress Enter to exit...")
        return
    
    pdf_path = sys.argv[1]
    
    if not pdf_path.lower().endswith('.pdf'):
        print(f"Error: {pdf_path} is not a PDF file")
        input("\nPress Enter to exit...")
        return
    
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        input("\nPress Enter to exit...")
        return
    
    # Generate output filename
    pdf_name = Path(pdf_path).stem
    output_dir = Path(pdf_path).parent
    output_path = output_dir / f"{pdf_name}_converted.xlsx"
    
    print(f"Converting {Path(pdf_path).name}...")
    
    try:
        products = parse_louis_dressner_pdf(pdf_path)
        
        if not products:
            print("Error: No products found in PDF")
            input("\nPress Enter to exit...")
            return
        
        print(f"Extracted {len(products)} products")
        write_to_excel(products, str(output_path))
        
        print(f"\n✓ SUCCESS!")
        print(f"Saved to: {output_path}")
        print(f"\nYou can now upload this file to the AOC Wines system")
        
        # Open the file
        import subprocess
        subprocess.call(['open', str(output_path)])
        
        input("\nPress Enter to exit...")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        input("\nPress Enter to exit...")

if __name__ == '__main__':
    main()
