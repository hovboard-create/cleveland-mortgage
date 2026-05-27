import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3011;

// Google Sheets configuration
const SHEET_ID = '1VXVPjITuKAYE6-iMkWsn0n7UTfMtqjEtu_9vOLF1leY';
const SHEET_NAME = 'Sheet1';

let sheets = null;

// Initialize Google Sheets API
async function initializeGoogleSheets() {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}');

    if (!credentials.type) {
      console.log('⚠️  Google Sheets credentials not configured');
      return;
    }

    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    sheets = google.sheets({ version: 'v4', auth });
    console.log('✅ Google Sheets API initialized');
  } catch (error) {
    console.error('❌ Error initializing Google Sheets:', error.message);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static HTML files from the project root
app.use(express.static(__dirname, {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
  }
}));

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// POST /api/leads - Save a new lead to Google Sheets
app.post('/api/leads', async (req, res) => {
  try {
    if (!sheets) {
      return res.status(500).json({ error: 'Google Sheets not initialized' });
    }

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

    // Append row to Google Sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:H`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [timestamp, goal || '', value || '', credit || '', name, email, phone, consent]
        ]
      }
    });

    console.log(`[${new Date().toISOString()}] New lead: ${name} (${email}) → Google Sheets`);

    res.json({
      success: true,
      message: 'Lead saved to Google Sheets',
      updates: response.data.updates
    });
  } catch (error) {
    console.error('Error saving lead:', error);
    res.status(500).json({ error: 'Server error while saving lead', details: error.message });
  }
});

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sheetsInitialized: sheets ? true : false
  });
});

// Start server
await initializeGoogleSheets();

app.listen(PORT, () => {
  console.log(`\n🏠 Cleveland Mortgage Backend`);
  console.log(`Port: ${PORT}`);
  console.log(`Google Sheet: ${SHEET_ID}`);
  console.log(`\n📡 API Endpoints:`);
  console.log(`  POST   /api/leads`);
  console.log(`  GET    /api/health\n`);
});
