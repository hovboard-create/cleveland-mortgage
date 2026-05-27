import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3011;

// Email configuration
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || '';
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'jleung1205@gmail.com';

let transporter = null;
if (EMAIL_USER && EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    }
  });
  console.log('Email notifications enabled');
} else {
  console.log('Email notifications disabled (set EMAIL_USER and EMAIL_PASSWORD env vars)');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static HTML files

const CSV_FILE = path.join(__dirname, 'leads.csv');
const EXCEL_FILE = path.join(__dirname, 'leads.xlsx');

// Initialize CSV with header if it doesn't exist
if (!fs.existsSync(CSV_FILE)) {
  const header = 'timestamp,goal,property_value,credit_score,name,email,phone,consent\n';
  fs.writeFileSync(CSV_FILE, header);
  console.log('Created leads.csv');
}

// Initialize Excel file if it doesn't exist
const initializeExcelFile = async () => {
  if (!fs.existsSync(EXCEL_FILE)) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads');

    // Define columns FIRST with proper key mapping and widths
    worksheet.columns = [
      { header: 'Timestamp', key: 'timestamp', width: 25 },
      { header: 'Goal', key: 'goal', width: 15 },
      { header: 'Property Value', key: 'property_value', width: 15 },
      { header: 'Credit Score', key: 'credit_score', width: 15 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Consent', key: 'consent', width: 10 }
    ];

    // Format header row (row 1 is automatically created by worksheet.columns)
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FF0F3D3E' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFE6D3' } };

    await workbook.xlsx.writeFile(EXCEL_FILE);
    console.log('Created leads.xlsx');
  }
};

// Initialize Excel file on startup
await initializeExcelFile();

// POST /api/leads - Save a new lead to both CSV and Excel
app.post('/api/leads', async (req, res) => {
  try {
    const { timestamp, goal, value, credit, name, email, phone, consent } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'email', 'phone']
      });
    }

    if (consent !== true) {
      return res.status(400).json({ error: 'Consent must be accepted' });
    }

    // Validate email format (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Sanitize fields (escape quotes in CSV)
    const sanitize = (val) => {
      if (!val) return '';
      return String(val).replace(/"/g, '""');
    };

    // Format CSV row
    const row = `${timestamp},"${sanitize(goal)}","${sanitize(value)}","${sanitize(credit)}","${sanitize(name)}","${sanitize(email)}","${sanitize(phone)}",${consent}\n`;

    // Append to CSV
    fs.appendFileSync(CSV_FILE, row);

    // Append to Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(EXCEL_FILE);
    const worksheet = workbook.getWorksheet('Leads');

    // Get next row number
    const nextRow = worksheet.rowCount + 1;

    // Write values directly to cells
    worksheet.getCell(`A${nextRow}`).value = timestamp;
    worksheet.getCell(`B${nextRow}`).value = goal || '';
    worksheet.getCell(`C${nextRow}`).value = value || '';
    worksheet.getCell(`D${nextRow}`).value = credit || '';
    worksheet.getCell(`E${nextRow}`).value = name;
    worksheet.getCell(`F${nextRow}`).value = email;
    worksheet.getCell(`G${nextRow}`).value = phone;
    worksheet.getCell(`H${nextRow}`).value = consent;

    await workbook.xlsx.writeFile(EXCEL_FILE);

    console.log(`[${new Date().toISOString()}] New lead: ${name} (${email}) → CSV & Excel`);

    // Send email notification if configured
    if (transporter) {
      const emailContent = `
New Lead Submission
==================

Timestamp: ${timestamp}
Goal: ${goal || 'N/A'}
Property Value: ${value || 'N/A'}
Credit Score: ${credit || 'N/A'}
Name: ${name}
Email: ${email}
Phone: ${phone}
Consent: ${consent}

View all leads: Download Excel file from /api/leads/download-excel
      `.trim();

      transporter.sendMail({
        from: EMAIL_USER,
        to: NOTIFICATION_EMAIL,
        subject: `New Lead: ${name}`,
        text: emailContent
      }, (error) => {
        if (error) {
          console.error('Error sending email:', error);
        } else {
          console.log(`Email notification sent to ${NOTIFICATION_EMAIL}`);
        }
      });
    }

    res.json({
      success: true,
      message: 'Lead saved to CSV and Excel',
      leadCount: fs.readFileSync(CSV_FILE, 'utf8').split('\n').length - 2 // subtract header and empty line
    });
  } catch (error) {
    console.error('Error saving lead:', error);
    res.status(500).json({ error: 'Server error while saving lead' });
  }
});

// GET /api/leads/download - Download CSV file (for admin)
app.get('/api/leads/download', (req, res) => {
  try {
    const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('Error downloading CSV:', error);
    res.status(500).json({ error: 'Server error while downloading CSV' });
  }
});

// GET /api/leads/download-excel - Download Excel file (for admin)
app.get('/api/leads/download-excel', async (req, res) => {
  try {
    const fileBuffer = fs.readFileSync(EXCEL_FILE);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.xlsx"');
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading Excel:', error);
    res.status(500).json({ error: 'Server error while downloading Excel' });
  }
});

// GET /api/leads/count - Get lead count
app.get('/api/leads/count', (req, res) => {
  try {
    const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
    const count = csvContent.split('\n').filter(line => line.trim()).length - 1; // subtract header
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Error reading lead count' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🏠 Cleveland Mortgage Backend`);
  console.log(`Port: ${PORT}`);
  console.log(`CSV: ${CSV_FILE}`);
  console.log(`Excel: ${EXCEL_FILE}`);
  if (transporter) {
    console.log(`📧 Email notifications: ${NOTIFICATION_EMAIL}`);
  }
  console.log(`\n📡 API Endpoints:`);
  console.log(`  POST   /api/leads`);
  console.log(`  GET    /api/leads/count`);
  console.log(`  GET    /api/leads/download`);
  console.log(`  GET    /api/leads/download-excel`);
  console.log(`  GET    /api/health\n`);
});
