import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
// Imports removed
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Multer Config
// Multer Config removed

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error.message);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Routes removed (Resolution & PDF) per user request to revert ---

// Geocoding API Endpoints
/**
 * Reverse geocoding: lat/lon → address
 * Proxies requests to Nominatim with proper User-Agent header
 */
app.get('/api/reverse-geocode', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon query parameters are required' });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`,
      {
        headers: {
          // REQUIRED by OpenStreetMap Nominatim usage policy
          'User-Agent': 'CivicLens/1.0 (civic.lens.app@gmail.com)'
        }
      }
    );

    if (!response.ok) {
      console.error(`Nominatim reverse geocode failed: ${response.status}`);
      return res.status(response.status).json({
        error: 'Geocoding service request failed',
        status: response.status
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error('Reverse geocode error:', err);
    res.status(500).json({
      error: 'Internal server error during reverse geocoding',
      message: err.message
    });
  }
});

/**
 * Search location by text query
 * Proxies requests to Nominatim with proper User-Agent header
 */
app.get('/api/search-location', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'q query parameter is required' });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&accept-language=en`,
      {
        headers: {
          // REQUIRED by OpenStreetMap Nominatim usage policy
          'User-Agent': 'CivicLens/1.0 (civic.lens.app@gmail.com)'
        }
      }
    );

    if (!response.ok) {
      console.error(`Nominatim search failed: ${response.status}`);
      return res.status(response.status).json({
        error: 'Location search service request failed',
        status: response.status
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error('Location search error:', err);
    res.status(500).json({
      error: 'Internal server error during location search',
      message: err.message
    });
  }
});


// Send email endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject, html'
      });
    }

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'CivicLens'}" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: html,
    });

    res.json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
});

// Send report assignment email
app.post('/api/send-report-assignment', async (req, res) => {
  try {
    const {
      officerEmail,
      officerName,
      reportId,
      title,
      category,
      severity,
      description,
      locationName,
      googleMapsLink,
      imageUrl,
      reportedAt,
      assignedBy
    } = req.body;

    // Generate HTML email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
            border-radius: 10px 10px 0 0; 
          }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 14px; }
          .content { background: #f9f9f9; padding: 30px 20px; }
          .section { 
            background: white; 
            padding: 20px; 
            margin-bottom: 20px; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
          }
          .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            color: #667eea; 
            margin-bottom: 15px; 
            padding-bottom: 10px; 
            border-bottom: 2px solid #667eea; 
          }
          .detail-row { 
            display: flex; 
            margin-bottom: 10px; 
            padding: 5px 0;
          }
          .detail-label { 
            font-weight: bold; 
            min-width: 140px; 
            color: #666; 
          }
          .detail-value { flex: 1; word-wrap: break-word; }
          .severity-high { color: #dc2626; font-weight: bold; }
          .severity-medium { color: #ea580c; font-weight: bold; }
          .severity-low { color: #16a34a; font-weight: bold; }
          .button { 
            display: inline-block; 
            background: #667eea; 
            color: white !important; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 10px 5px 10px 0; 
            }
          .button:hover { background: #5568d3; }
          .footer { 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            font-size: 12px; 
            background: #f9f9f9;
          }
          .alert-box { 
            background: #fef2f2; 
            border-left: 4px solid #dc2626; 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: 4px; 
            }
          @media only screen and (max-width: 600px) {
            .detail-row { flex-direction: column; }
            .detail-label { margin-bottom: 5px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 New Report Assignment</h1>
            <p>CivicLens Admin Panel</p>
          </div>
          
          <div class="content">
            <p style="margin-top: 0;">Dear ${officerName},</p>
            <p>You have been assigned a new civic report. Please review and take appropriate action.</p>
            
            <div class="section">
              <div class="section-title">📋 Report Details</div>
              <div class="detail-row">
                <div class="detail-label">Report ID:</div>
                <div class="detail-value"><strong>${reportId}</strong></div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Title:</div>
                <div class="detail-value">${title}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Category:</div>
                <div class="detail-value">${category}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Severity:</div>
                <div class="detail-value severity-${severity.toLowerCase()}">${severity.toUpperCase()}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Reported:</div>
                <div class="detail-value">${reportedAt}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Assigned By:</div>
                <div class="detail-value">${assignedBy}</div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">📍 Location</div>
              <p style="margin: 0 0 10px 0;"><strong>${locationName}</strong></p>
              ${googleMapsLink ? `<a href="${googleMapsLink}" class="button" target="_blank">📍 Open in Google Maps</a>` : ''}
            </div>
            
            <div class="section">
              <div class="section-title">📝 Description</div>
              <p style="margin: 0; white-space: pre-wrap;">${description || 'No description provided'}</p>
            </div>
            
            ${imageUrl ? `
              <div class="section">
                <div class="section-title">🖼️ Attached Image</div>
                <a href="${imageUrl}" class="button" target="_blank">View Image</a>
              </div>
            ` : ''}
            
            <div class="alert-box">
              <strong>⚠️ Action Required</strong><br>
              Please review this report and take necessary action at your earliest convenience.
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 5px 0;">This is an automated message from CivicLens Admin Panel.</p>
            <p style="margin: 0;">© ${new Date().getFullYear()} CivicLens. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'CivicLens'}" <${process.env.SMTP_USER}>`,
      to: officerEmail,
      subject: `[CivicLens] New Report Assignment: ${title} (${severity.toUpperCase()})`,
      html: htmlContent,
    });

    res.json({
      success: true,
      messageId: info.messageId,
      message: `Email sent to ${officerName} successfully`
    });

  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email configured: ${process.env.SMTP_USER ? 'Yes' : 'No'}`);
  console.log(`📬 Using SMTP: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
});
