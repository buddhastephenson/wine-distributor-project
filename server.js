const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const multer = require('multer');
const XLSX = require('xlsx');

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data', 'persistence');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

app.get('/api/storage/:key', (req, res) => {
    const key = req.params.key;
    const filePath = path.join(DATA_DIR, `${key}.json`);

    if (fs.existsSync(filePath)) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            res.json({ value: data });
        } catch (error) {
            res.status(500).json({ error: 'Failed to read data' });
        }
    } else {
        res.status(404).json({ error: 'Key not found' });
    }
});

app.post('/api/storage/:key', (req, res) => {
    const key = req.params.key;
    const { value } = req.body;
    const filePath = path.join(DATA_DIR, `${key}.json`);

    try {
        fs.writeFileSync(filePath, value, 'utf8');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// --- Auth Endpoints ---

const USERS_FILE = path.join(DATA_DIR, 'users.json');

const getUsers = () => {
    if (fs.existsSync(USERS_FILE)) {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
    return [];
};

const saveUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
};

app.post('/api/auth/signup', (req, res) => {
    const { username, password, type, email } = req.body;
    const users = getUsers();

    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = { id: `user-${Date.now()}`, username, password, type, email };
    users.push(newUser);
    saveUsers(users);

    res.json({ success: true, user: { id: newUser.id, username, type, email } });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();

    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ success: true, user: { id: user.id, username: user.username, type: user.type } });
});

app.delete('/api/storage/:key', (req, res) => {
    const key = req.params.key;
    const filePath = path.join(DATA_DIR, `${key}.json`);

    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete data' });
        }
    } else {
        res.status(404).json({ error: 'Key not found' });
    }
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

app.listen(PORT, () => {
    console.log(`Persistence server running at http://localhost:${PORT}`);
});
