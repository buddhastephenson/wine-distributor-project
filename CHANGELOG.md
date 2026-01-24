# Changelog

All notable changes to the AOC Wines Distributor project.

## [1.0.0] - 2026-01-18

### Added
- Initial MVP release
- Admin portal with file upload and column mapping
- Customer portal with product browsing and ordering
- AOC pricing formula calculations (wine, spirits, non-alcoholic)
- Column mapping with auto-detection and saved templates
- Editable supplier names during upload
- Search by producer, product, vintage, and supplier
- Product lifecycle management (active, discontinued, orders)
- Louis Dressner PDF converter (Python script)
- Louis Dressner Mac app converter
- Sample data (Louis Dressner January 2026 price list)

### Features
- Excel file upload (.xlsx, .xls)
- Automatic column detection with manual adjustment
- Persistent storage using browser localStorage
- Shopping cart and order placement
- FOB pricing hidden from customers
- Supplier-based product filtering
- Template-based imports for returning suppliers

### Documentation
- README with full project overview
- MAC_INSTALLATION guide for PDF converter
- Code comments and inline documentation

### Known Limitations
- Browser-only storage (no backend database)
- Demo authentication (not production-ready)
- PDF processing requires external conversion
- Single-user system (no multi-tenancy)

## Future Versions

### Planned for 2.0
- Backend API integration
- Real authentication system
- Direct PDF processing in browser
- Email notifications for orders
- Rep dashboard
- Market jurisdiction filtering
- Vinosmith-style UI redesign for customer portal

### Under Consideration
- Mobile app
- Inventory tracking
- Sales analytics
- Multi-language support
- Integration with accounting systems
