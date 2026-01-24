# AOC Wines Distributor Web App

A full-stack wine distribution management system with admin and customer portals.

## 📁 Project Structure

```
wine-distributor-project/
├── src/
│   └── wine-distributor-app.jsx       # Main React application
├── converters/
│   ├── convert_louis_dressner_pdf.py  # Python PDF converter
│   └── louis_dressner_converter_mac.py # Mac app version
├── docs/
│   ├── MAC_INSTALLATION.md            # Mac app setup guide
│   └── README.md                      # This file
└── data/
    └── Louis_Dressner_Jan_2026.xlsx   # Sample price list
```

## 🚀 Features

### Admin Portal
- Upload Excel/PDF price lists
- Column mapping with saved templates per supplier
- Editable supplier names
- Product catalog management
- AOC pricing formula calculations (wine, spirits, non-alcoholic)
- Order management
- Discontinued product tracking
- FOB and frontline pricing visibility

### Customer Portal
- Browse wine catalog
- Search by producer, product, vintage, or supplier
- Filter by supplier
- Shopping cart
- Place orders
- Only see frontline pricing (FOB hidden)

## 🏗️ Tech Stack

- **Frontend**: React (JSX artifact)
- **Spreadsheet Processing**: SheetJS (XLSX)
- **Storage**: Browser localStorage API
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

## 📊 Pricing Formulas

### Wine
- Tax: (Case Size L × $0.32) + $0.15
- Margin: 0.65
- SRP Multiplier: 1.47

### Spirits
- Tax: (Case Size L × $1.17) + $0.15
- Margin: 0.65
- SRP Multiplier: 1.47

### Non-Alcoholic
- Tax: $0.00
- Margin: 0.65
- SRP Multiplier: 1.47

## 🔧 Development Setup

### Running the App
1. Open `src/wine-distributor-app.jsx` in VS Code
2. This is a React artifact designed to run in claude.ai
3. For local development, you'll need to:
   - Set up a React project: `npx create-react-app wine-app`
   - Replace `src/App.js` with the JSX content
   - Install dependencies: `npm install lucide-react xlsx`
   - Run: `npm start`

### PDF Converter Setup
See `docs/MAC_INSTALLATION.md` for detailed setup instructions.

Quick install:
```bash
pip3 install pdfplumber openpyxl --break-system-packages
```

Usage:
```bash
python3 converters/convert_louis_dressner_pdf.py input.pdf output.xlsx
```

## 📝 Monthly Workflow

1. Receive Louis Dressner PDF price list
2. Convert to Excel:
   ```bash
   python3 converters/convert_louis_dressner_pdf.py Louis_Dressner_Feb_2026.pdf LouisDressner.xlsx
   ```
3. Upload Excel file in admin panel
4. Verify/edit supplier name
5. Review column mapping
6. Import products

## 🎯 Key Features in Detail

### Column Mapping
- Auto-detects columns from headers
- Saves mapping templates per supplier
- Manual adjustment available
- Shows sample data for verification

### Product Lifecycle
- **Active Catalog**: Currently available products
- **Discontinued**: Products in active orders (preserves pricing)
- **Orders**: Complete order history

### Supplier Replacement
- New price list replaces old products
- Products in active orders moved to discontinued
- No data loss for pending orders

## 🔐 Demo Login

- **Admin**: Any username/password
- **Customer**: Any username/password
- (Production would use real authentication)

## 📦 Data Storage

All data stored in browser localStorage:
- `wine-products`: Active catalog
- `wine-orders`: All orders
- `wine-discontinued`: Discontinued products
- `wine-formulas`: Pricing configuration
- `wine-mapping-templates`: Saved column mappings

## 🚧 Future Enhancements

- [ ] Backend API integration
- [ ] Real authentication
- [ ] PDF direct upload in browser
- [ ] Email integration for order notifications
- [ ] Rep dashboard
- [ ] Multi-jurisdiction support
- [ ] Vinosmith-style customer UI redesign
- [ ] Order status tracking
- [ ] Inventory management

## 📞 Support

For questions or issues, refer to the session transcript or start a new conversation in claude.ai.

---

**Project Status**: MVP Complete ✅  
**Last Updated**: January 2026  
**Version**: 1.0
