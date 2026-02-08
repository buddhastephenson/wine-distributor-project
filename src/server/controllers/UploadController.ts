import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import XLSX from 'xlsx';

class UploadController {
    async processPdf(req: Request, res: Response) {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const inputPath = req.file.path;
        const outputPath = `${inputPath}.xlsx`;
        // Assuming running from root of project
        const scriptPath = path.join(process.cwd(), 'converters', 'convert_louis_dressner_pdf.py');

        console.log(`Processing PDF: ${req.file?.originalname}`);

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
    }
}

export default new UploadController();
