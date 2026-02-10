const axios = require('axios');

async function testQuickAdd() {
    const API_URL = 'http://localhost:3002/api'; // Backend runs on 3002 per package.json
    // If running via full stack dev, it might be proxied from 3000, but let's hit 3001 directly to be safe or 3000/api if proxy.
    // app.ts says process.env.PORT || 3001.
    // Let's try 3001 directly.

    try {
        console.log('1. Logging in as treys...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'treys',
            password: 'password'
        });

        if (!loginRes.data.success) {
            console.error('Login failed:', loginRes.data);
            process.exit(1);
        }

        console.log('Login successful.');
        const user = loginRes.data.user;
        console.log('User:', user.username, user.type);

        // NOTE: If the app uses cookies, axios automatically handles them if we use a jar or if we manually pass headers.
        // If it uses JWT in body, we need to attach it.
        // Looking at AuthService, it returns { user: ... }, doesn't seem to return a token string explicitly in the body?
        // Let's assume it relies on cookies or there's no auth middleware on the products endpoint (checked productRoutes, didn't see middleware... wait. I should check that).
        // If there is middleware, it likely expects a session cookie.

        // The middleware/auth.ts uses 'x-user-id' header
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.id
            }
        };

        console.log('2. Creating Product via API...');
        const newProduct = {
            itemCode: 'API-TEST-001',
            productName: 'API Test Wine',
            vintage: '2023',
            producer: 'Test Producer',
            bottleSize: '750ml',
            packSize: '12',
            fobCasePrice: 100,
            productType: 'wine',
            supplier: 'Dalla Terra' // Assuming 'treys' has access to this or is superadmin
        };

        const createRes = await axios.post(`${API_URL}/products`, newProduct, config);

        if (createRes.status === 201 && createRes.data.success) {
            console.log('Product created successfully!');
            console.log('Product ID:', createRes.data.product.id);
            console.log('Product Name:', createRes.data.product.productName);
        } else {
            console.error('Failed to create product:', createRes.status, createRes.data);
            process.exit(1);
        }

        console.log('3. Verifying Product Existence...');
        // We can just verify the create response gave us the product.
        // But let's double check by fetching it?
        // GET /api/products is usually all products.
        // We can skip this if create returned success.

    } catch (error) {
        if (error.response) {
            console.error('API Error:', error.response.status, JSON.stringify(error.response.data));
        } else {
            console.error('Error Message:', error.message);
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}

testQuickAdd();
