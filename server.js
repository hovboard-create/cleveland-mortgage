import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3011;

// Google Sheets configuration
const SHEET_ID = '1VXVPjITuKAYE6-iMkWsn0n7UTfMtqjEtu_9vOLF1leY';

let doc = null;

// Initialize Google Sheets
async function initializeGoogleSheets() {
  try {
    console.log('🔍 Initializing Google Sheets...');

    const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;
    if (!credentialsJson) {
      console.log('⚠️  GOOGLE_SHEETS_CREDENTIALS not set');
      return;
    }

    const credentials = JSON.parse(credentialsJson);
    console.log('📝 Credentials loaded. Project:', credentials.project_id);

    const serviceAccountAuth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ],
    });

    doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);

    await doc.loadInfo();
    console.log('✅ Google Sheets initialized. Title:', doc.title);
  } catch (error) {
    console.error('❌ Error initializing Google Sheets:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static HTML files
app.use(express.static(__dirname, {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
  }
}));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// POST /api/leads - Save lead to Google Sheets
app.post('/api/leads', async (req, res) => {
  try {
    if (!doc) {
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get the first sheet
    const sheet = doc.sheetsByIndex[0];

    // Add row to sheet
    const result = await sheet.addRow({
      Timestamp: timestamp,
      Goal: goal || '',
      'Property Value': value || '',
      'Credit Score': credit || '',
      Name: name,
      Email: email,
      Phone: phone,
      Consent: consent
    });

    console.log(`[${new Date().toISOString()}] New lead: ${name} (${email}) → Google Sheets`);

    res.json({
      success: true,
      message: 'Lead saved to Google Sheets',
      rowId: result.rowNumber
    });
  } catch (error) {
    console.error('Error saving lead:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      error: 'Server error while saving lead',
      details: error.message
    });
  }
});

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sheetsInitialized: doc ? 'yes' : 'no'
  });
});

// Start server
await initializeGoogleSheets();

app.listen(PORT, () => {
  console.log(`\n🏠 Cleveland Mortgage Backend`);
  console.log(`Port: ${PORT}`);
  console.log(`Google Sheet ID: ${SHEET_ID}`);
  console.log(`\n📡 API Endpoints:`);
  console.log(`  POST   /api/leads`);
  console.log(`  GET    /api/health\n`);
});
