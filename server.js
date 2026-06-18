import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3011;

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

// Middleware
app.use(cors());
app.use(express.json());

// Redirect www to non-www (canonical domain)
app.use((req, res, next) => {
  const host = req.get('host') || req.get('x-forwarded-host') || '';
  if (host.startsWith('www.')) {
    const protocol = req.get('x-forwarded-proto') || 'https';
    const newHost = host.replace(/^www\./, '');
    const redirectUrl = `${protocol}://${newHost}${req.originalUrl}`;
    return res.redirect(301, redirectUrl);
  }
  next();
});

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

// POST /api/leads - Send email notification
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
        console.log(`✅ Email sent to hovboard@gmail.com for ${name}`);
      } catch (emailError) {
        console.error('❌ Error sending email:', emailError.message);
        return res.status(500).json({
          error: 'Failed to send notification email',
          message: emailError.message
        });
      }
    } else {
      console.log('⚠️  Email not configured, lead received but notification not sent');
    }

    res.json({
      success: true,
      message: 'Lead received and notification sent'
    });
  } catch (error) {
    console.error('❌ Error processing lead:', error.message);
    res.status(500).json({
      error: 'Server error while processing lead',
      message: error.message
    });
  }
});

// POST /api/sell-leads - Handle "Sell My Home" form submissions
app.post('/api/sell-leads', async (req, res) => {
  try {
    console.log('📝 Received sell lead submission');

    const { address, bedrooms, bathrooms, sqft, condition, name, email, phone } = req.body;

    // Validate required fields
    if (!address || !bedrooms || !bathrooms || !name || !email || !phone) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['address', 'bedrooms', 'bathrooms', 'name', 'email', 'phone']
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Send email to hovproperties@gmail.com
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: 'hovproperties@gmail.com',
          subject: `New "Sell My Home" Lead: ${name} - ${address}`,
          html: `
            <h2>New Sell-My-Home Lead</h2>
            <h3>Property Details</h3>
            <p><strong>Address:</strong> ${address}</p>
            <p><strong>Bedrooms:</strong> ${bedrooms}</p>
            <p><strong>Bathrooms:</strong> ${bathrooms}</p>
            <p><strong>Square Feet:</strong> ${sqft || 'Not provided'}</p>
            <p><strong>Condition:</strong> ${condition || 'Not specified'}</p>

            <h3>Contact Information</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          `
        });
        console.log(`✅ Sell lead email sent to hovproperties@gmail.com for ${address}`);
      } catch (emailError) {
        console.error('❌ Error sending sell lead email:', emailError.message);
        return res.status(500).json({
          error: 'Failed to send notification email',
          message: emailError.message
        });
      }
    } else {
      console.log('⚠️  Email not configured, sell lead received but notification not sent');
    }

    res.json({
      success: true,
      message: 'Sell lead received and notification sent'
    });
  } catch (error) {
    console.error('❌ Error processing sell lead:', error.message);
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
    emailConfigured: transporter ? 'yes' : 'no'
  });
});

// Initialize
initializeEmail();

app.listen(PORT, () => {
  console.log(`\n🏠 Cleveland Mortgage Backend`);
  console.log(`Port: ${PORT}`);
  console.log(`\n📡 API Endpoints:`);
  console.log(`  POST   /api/leads          (mortgage leads → hovboard@gmail.com)`);
  console.log(`  POST   /api/sell-leads     (sell-my-home leads → hovproperties@gmail.com)`);
  console.log(`  GET    /api/health\n`);
});
