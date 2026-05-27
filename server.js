import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3011;
const CSV_FILE = path.join(__dirname, 'leads.csv');

// Initialize email transporter
let transporter = null;

function initializeEmail() {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    console.log('⚠️  EMAIL_USER or EMAIL_PASSWORD not set - email notifications disabled');
    return;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword
    }
  });

  console.log('✅ Email transporter initialized');
}

// Initialize CSV file with headers if it doesn't exist
function initializeCSV() {
  if (!fs.existsSync(CSV_FILE)) {
    const headers = 'timestamp,goal,property_value,credit_score,name,email,phone,consent\n';
    fs.writeFileSync(CSV_FILE, headers);
    console.log('📄 CSV file created');
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

// POST /api/leads - Save lead and send email
app.post('/api/leads', async (req, res) => {
  try {
    console.log('📝 Received lead submission');

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

    // Save to CSV
    const csvRow = `${timestamp || new Date().toISOString()},"${goal || ''}","${value || ''}","${credit || ''}","${name}","${email}","${phone}",${consent}\n`;
    fs.appendFileSync(CSV_FILE, csvRow);
    console.log(`✅ Lead saved to CSV`);

    // Send email if transporter is configured
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: 'hovboard@gmail.com',
          subject: `New Cleveland Mortgage Lead: ${name}`,
          html: `
            <h2>New Lead Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Goal:</strong> ${goal || 'Not specified'}</p>
            <p><strong>Property Value:</strong> ${value || 'Not specified'}</p>
            <p><strong>Credit Score:</strong> ${credit || 'Not specified'}</p>
            <p><strong>Timestamp:</strong> ${timestamp || new Date().toISOString()}</p>
            <p><strong>Consent Given:</strong> ${consent ? 'Yes' : 'No'}</p>
          `
        });
        console.log(`📧 Email sent to hovboard@gmail.com`);
      } catch (emailError) {
        console.error('❌ Error sending email:', emailError.message);
        // Continue anyway - lead is saved to CSV
      }
    }

    res.json({
      success: true,
      message: 'Lead saved and notification sent'
    });
  } catch (error) {
    console.error('❌ Error processing lead:', error.message);
    res.status(500).json({
      error: 'Server error while processing lead',
      message: error.message
    });
  }
});

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    emailConfigured: transporter ? 'yes' : 'no',
    csvReady: fs.existsSync(CSV_FILE) ? 'yes' : 'no'
  });
});

// Initialize
initializeEmail();
initializeCSV();

app.listen(PORT, () => {
  console.log(`\n🏠 Cleveland Mortgage Backend`);
  console.log(`Port: ${PORT}`);
  console.log(`CSV Storage: ${CSV_FILE}`);
  console.log(`\n📡 API Endpoints:`);
  console.log(`  POST   /api/leads`);
  console.log(`  GET    /api/health\n`);
});
