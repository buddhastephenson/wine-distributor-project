# Louis Dressner PDF Converter - Mac Installation

## Quick Setup (5 minutes)

### Step 1: Install Python Dependencies
Open Terminal (Applications → Utilities → Terminal) and run:

```bash
pip3 install pdfplumber openpyxl --break-system-packages
```

### Step 2: Create the Application

1. **Download the converter script:**
   - Save `louis_dressner_converter_mac.py` to your Desktop

2. **Open Automator:**
   - Go to Applications → Automator
   - Click "New Document"
   - Choose "Application"

3. **Add Run Shell Script:**
   - In the left sidebar, search for "Run Shell Script"
   - Drag "Run Shell Script" to the workflow area on the right
   - At the top, change "Pass input:" to **"as arguments"**

4. **Paste this code:**
   ```bash
   /usr/bin/python3 ~/Desktop/louis_dressner_converter_mac.py "$@"
   ```

5. **Save the Application:**
   - File → Save
   - Name it: **"Louis Dressner Converter"**
   - Save to: **Desktop** (or Applications)
   - File Format: **Application**

### Step 3: Use It!

**Drag and drop any Louis Dressner PDF onto the "Louis Dressner Converter" app icon.**

The app will:
- ✅ Convert PDF to Excel automatically
- ✅ Save the Excel file next to the original PDF
- ✅ Open the Excel file for you
- ✅ Show you how many products were extracted

---

## Alternative: Simple Script (No Automator)

If you prefer not to use Automator, just run this in Terminal:

```bash
python3 ~/Desktop/louis_dressner_converter_mac.py ~/Desktop/YourPDFFile.pdf
```

Replace `YourPDFFile.pdf` with your actual PDF filename.

---

## Troubleshooting

**"python3 not found"**
- Install Python from python.org or use Homebrew: `brew install python3`

**"Permission denied"**
- Make script executable: `chmod +x ~/Desktop/louis_dressner_converter_mac.py`

**"No module named pdfplumber"**
- Reinstall: `pip3 install pdfplumber openpyxl --break-system-packages`

---

## What Gets Created

When you drop `Louis_Dressner_Jan_2026.pdf` onto the app:
- Creates: `Louis_Dressner_Jan_2026_converted.xlsx` in the same folder
- Opens Excel file automatically
- Ready to upload to AOC Wines system!
