import { Router } from 'express';
import multer from 'multer';
import UploadController from '../controllers/UploadController';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const upload = multer({ dest: 'uploads/' }); // Relative to CWD

// POST /api/upload/pdf
router.post('/pdf', upload.single('pdf'), UploadController.processPdf.bind(UploadController));

export default router;
