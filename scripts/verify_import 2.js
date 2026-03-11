const axios = require('axios');

async function verifyImport() {
    try {
        const response = await axios.get('http://localhost:3000/api/products?limit=1000');
        const products = response.data.products || response.data;
        const extendedWine = products.find(p => p.productName === 'Extended Test Wine' || p.itemCode === 'TEST-EXT-001');

        if (extendedWine) {
            console.log('--- FOUND PRODUCT ---');
            console.log('ID:', extendedWine.id);
            console.log('Name:', extendedWine.productName);
            console.log('Grape Variety:', extendedWine.grapeVariety);
            console.log('Product Link:', extendedWine.productLink);
            console.log('Extended Data:', extendedWine.extendedData);

            const checks = {
                grape: extendedWine.grapeVariety === 'Cabernet Sauvignon',
                link: extendedWine.productLink === 'https://example.com/wine',
                rating: extendedWine.extendedData && extendedWine.extendedData['Rating'] === '99 pts',
                organic: extendedWine.extendedData && extendedWine.extendedData['Organic'] === 'Yes'
            };

            console.log('--- CHECKS ---');
            console.log(checks);

            if (Object.values(checks).every(Boolean)) {
                console.log('VERIFICATION SUCCESSFUL');
            } else {
                console.log('VERIFICATION FAILED: Data mismatch');
            }

        } else {
            console.log('Product "Extended Test Wine" NOT FOUND.');
        }

    } catch (error) {
        console.error('Error fetching products:', error.message);
    }
}

verifyImport();
