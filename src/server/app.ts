import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import connectDB from './utils/db';

// Initialize App
const app = express();
const SERVER_PORT = process.env.PORT || 3001;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads'); // Adjust path based on dist folder
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Check if we are running from dist (production/compiled) or src (dev)
// __dirname in dist/server/app.js -> .../dist/server
// We want to serve .../build (React app) which is at root level
// In dev (ts-node src/server/app.ts), root is execution path
const BUILD_PATH = path.join(process.cwd(), 'build');

// Serve static files from the React app
if (fs.existsSync(BUILD_PATH)) {
    app.use(express.static(BUILD_PATH));
}

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import specialOrderRoutes from './routes/specialOrderRoutes';
import storageRoutes from './routes/storageRoutes';
import uploadRoutes from './routes/uploadRoutes';

// API Routes
app.use('/api/auth/users', userRoutes); // Mount users first to avoid conflict if any (though structured differently)
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/special-orders', specialOrderRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/upload', uploadRoutes);

// Catch-all handler
app.get(/(.*)/, (req, res) => {
    if (fs.existsSync(path.join(BUILD_PATH, 'index.html'))) {
        res.sendFile(path.join(BUILD_PATH, 'index.html'));
    } else {
        res.send('API Running. React Frontend not built.');
    }
});

// Start Server
app.listen(SERVER_PORT, () => {
    console.log(`Server running at http://localhost:${SERVER_PORT}`);
    // Server restarted via tool call to force update.
});

export default app;
