const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const multer = require('multer');
const XLSX = require('xlsx');
const mongoose = require('mongoose');

// DB Connection
const connectDB = require('./src/db/connect');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const SpecialOrder = require('./src/models/SpecialOrder');
const Taxonomy = require('./src/models/Taxonomy');

const app = express();
// Use process.env.PORT for deployment platform compatibility
const SERVER_PORT = process.env.PORT || 3001;

// Connect to Database
connectDB();

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// --- Storage Endpoints (Legacy Adapter) ---
// Frontend expects { value: "JSON_STRING" } structure. 
// We are mimicking this by querying DB and stringifying result.

app.get('/api/storage/:key', async (req, res) => {
    const key = req.params.key;

    try {
        let result = null;

        if (key === 'wine-products') {
            const products = await Product.find({}, '-_id -__v -createdAt -updatedAt').lean();
            result = products; // Frontend expects array of products
        } else if (key === 'wine-special-orders') {
            // Frontend expects { "username": [order1, order2], ... }
            const allOrders = await SpecialOrder.find({}, '-_id -__v -createdAt -updatedAt').lean();
            const grouped = {};
            for (const order of allOrders) {
                if (!grouped[order.username]) grouped[order.username] = [];
                // Remove username from object to match legacy structure if needed, 
                // but keeping it doesn't hurt.
                grouped[order.username].push(order);
            }
            result = grouped;
        } else if (key === 'taxonomy') {
            const taxDoc = await Taxonomy.findOne({ name: 'main_taxonomy' });
            result = taxDoc ? taxDoc.data : {};
        } else if (['wine-discontinued', 'wine-suspended', 'wine-inventory'].includes(key)) {
            // Return empty list for these legacy keys to prevent 404s until fully migrated
            result = [];
        } else {
            // For other keys (e.g., wine-order-notes), return empty or handle if crucial
            // Currently returning null to signify not found/implemented
            // Returning 404 might break frontend if it expects something, checking frontend logic it warns but continues.
            return res.status(404).json({ error: 'Key not handled in DB migration' });
        }

        // Maintain legacy contract: { value: stringified_json }
        res.json({ value: JSON.stringify(result) });

    } catch (error) {
        console.error(`Error reading key ${key}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Granular Data Endpoints (New Architecture) ---

// 1. Single Product Update (PATCH)
app.patch('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const product = await Product.findOneAndUpdate({ id }, updates, { new: true });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ success: true, product });
    } catch (error) {
        console.error(`Error updating product ${id}:`, error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// 2. Single Product Delete (DELETE)
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await Product.findOneAndDelete({ id });
        if (!result) {
            return res.status(440).json({ error: 'Product not found' });
        }
        res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
        console.error(`Error deleting product ${id}:`, error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// --- Legacy Storage Endpoints (Modified for Read Compatibility) ---

app.post('/api/storage/:key', async (req, res) => {
    const key = req.params.key;
    const { value } = req.body; // value is a JSON string

    try {
        const data = JSON.parse(value);

        if (key === 'wine-products') {
            // For bulk saves (e.g. imports), we still support this, but optimized
            // 1. Identify IDs in the new payload
            const incomingIds = data.map(item => item.id);

            // 2. Delete items in DB that are NOT in the payload (Sync deletion)
            await Product.deleteMany({ id: { $nin: incomingIds } });

            // 3. Upsert items from payload
            for (const item of data) {
                await Product.findOneAndUpdate({ id: item.id }, item, { upsert: true });
            }
        } else if (key === 'wine-special-orders') {
            // data is { "username": [orders...] }

            // 1. Flatten all orders to get all IDs
            const allOrders = Object.values(data).flat();
            const incomingIds = allOrders.map(order => order.id);

            // 2. Delete orders in DB that are NOT in the payload
            await SpecialOrder.deleteMany({ id: { $nin: incomingIds } });

            // 3. Upsert items
            for (const username of Object.keys(data)) {
                const userOrders = data[username];
                for (const order of userOrders) {
                    await SpecialOrder.findOneAndUpdate(
                        { id: order.id },
                        { ...order, username },
                        { upsert: true }
                    );
                }
            }
        } else if (key === 'taxonomy') {
            await Taxonomy.findOneAndUpdate({ name: 'main_taxonomy' }, { data }, { upsert: true });
        }

        res.json({ success: true });
    } catch (error) {
        console.error(`Error saving key ${key}:`, error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// --- Auth Endpoints (Mongoose) ---

app.post('/api/auth/signup', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            if (existingUser.email === email && existingUser.accessRevoked) {
                return res.status(403).json({ error: 'This email is associated with a revoked account.' });
            }
            return res.status(400).json({ error: 'User or Email already exists' });
        }

        const newUser = await User.create({
            id: `user-${Date.now()}`,
            username,
            password,
            type: 'customer',
            email
        });

        res.json({
            success: true,
            user: { id: newUser.id, username, type: newUser.type, email }
        });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.accessRevoked) {
            return res.status(403).json({ error: 'Access Revoked. Please contact administrator.' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                type: user.type,
                isSuperAdmin: !!user.isSuperAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Admin User Management Endpoints ---

app.get('/api/auth/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password -__v');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.patch('/api/auth/users/:id/access', async (req, res) => {
    const { id } = req.params;
    const { accessRevoked } = req.body;

    try {
        const user = await User.findOne({ id });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.username === 'treys') {
            return res.status(403).json({ error: 'Access cannot be revoked for primary administrator "treys"' });
        }

        user.accessRevoked = !!accessRevoked;
        await user.save();

        res.json({ success: true, user: { id: user.id, accessRevoked: user.accessRevoked } });
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
});

app.patch('/api/auth/users/:id/role', async (req, res) => {
    const { id } = req.params;
    const { type } = req.body;

    if (type !== 'admin' && type !== 'customer') {
        return res.status(400).json({ error: 'Invalid role type' });
    }

    try {
        const user = await User.findOneAndUpdate({ id }, { type }, { new: true });
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ success: true, user: { id: user.id, type: user.type } });
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
});

app.patch('/api/auth/users/:id/password', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ error: 'Password is required' });

    try {
        const user = await User.findOneAndUpdate({ id }, { password }, { new: true });
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
});

app.delete('/api/auth/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findOne({ id });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.username === 'treys') {
            return res.status(403).json({ error: 'Primary administrator "treys" cannot be deleted' });
        }

        await User.findOneAndDelete({ id });
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Delete failed' });
    }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            // Security: don't reveal existence
            return res.json({ success: true, message: 'If an account exists with this email, a reset link will be sent.' });
        }

        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiry = Date.now() + 3600000; // 1 hour

        user.resetToken = token;
        user.resetTokenExpiry = expiry;
        await user.save();

        const resetLink = `http://localhost:3000/?token=${token}`;
        console.log(`\n--- PASSWORD RESET SIMULATION ---`);
        console.log(`To: ${email}`);
        console.log(`Link: ${resetLink}`);
        console.log(`----------------------------------\n`);

        res.json({ success: true, message: 'If an account exists with this email, a reset link will be sent.' });
    } catch (error) {
        res.status(500).json({ error: 'Error processing request' });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    const { token, password } = req.body;
    try {
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        user.password = password;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({ success: true, message: 'Password has been reset successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error processing request' });
    }
});

app.delete('/api/storage/:key', async (req, res) => {
    const key = req.params.key;
    // Implementing delete on storage keys is tricky with current schema
    // Assuming clear all data for key? NOT IMPLEMENTED SAFEGUARD
    res.status(501).json({ error: 'Not implemented in DB mode' });
});

// --- PDF Processing Endpoint ---

app.post('/api/upload/pdf', upload.single('pdf'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = `${inputPath}.xlsx`;
    const scriptPath = path.join(__dirname, 'converters', 'convert_louis_dressner_pdf.py');

    console.log(`Processing PDF: ${req.file.originalname}`);

    exec(`python3 "${scriptPath}" "${inputPath}" "${outputPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            // Attempt cleanup
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            return res.status(500).json({ error: 'PDF conversion failed', details: stderr });
        }

        try {
            if (!fs.existsSync(outputPath)) {
                throw new Error('Output file not found');
            }

            const workbook = XLSX.readFile(outputPath);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            // Clean up files
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

            res.json({
                success: true,
                data: jsonData,
                filename: req.file.originalname
            });
        } catch (readError) {
            console.error(`Read error: ${readError}`);
            res.status(500).json({ error: 'Failed to read converted Excel file' });
        }
    });
});

// --- Production Static File Serving ---

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(SERVER_PORT, () => {
    console.log(`Server running at http://localhost:${SERVER_PORT}`);
});
