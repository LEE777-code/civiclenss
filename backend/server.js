import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
// Imports removed
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';

dotenv.config();

const app = express();

// Supabase Configuration - MUST use service role key for backend
if (!process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ CRITICAL: SUPABASE_SERVICE_KEY is missing in .env file');
  console.error('Backend requires service role key for database write access');
  throw new Error('SUPABASE_SERVICE_KEY is required for backend operations');
}

if (!process.env.SUPABASE_URL) {
  console.error('❌ CRITICAL: SUPABASE_URL is missing in .env file');
  throw new Error('SUPABASE_URL is required for backend operations');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase initialized with service role key');

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
// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:5174', process.env.VITE_FRONTEND_URL],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Routes removed (Resolution & PDF) per user request to revert ---

// Geocoding API Endpoints
/**
 * Reverse geocoding: lat/lon → address
 * Uses Supabase cache to reduce Nominatim API calls
 * Checks cache for nearby coordinates (within ~1km) before calling Nominatim
 */
app.get('/api/reverse-geocode', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon query parameters are required' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: 'lat and lon must be valid numbers' });
  }

  console.log(`🔍 Reverse geocode request: lat=${latitude}, lon=${longitude}`);

  try {
    // Cache proximity matching: ~200m radius for civic reporting use case
    // Small enough to be accurate, large enough for efficient caching
    const radius = 0.002; // ~200 meters
    const minLat = latitude - radius;
    const maxLat = latitude + radius;
    const minLon = longitude - radius;
    const maxLon = longitude + radius;

    // Check cache for nearby coordinates
    console.log(`🔎 Checking cache within ~200m: lat [${minLat.toFixed(4)}, ${maxLat.toFixed(4)}], lon [${minLon.toFixed(4)}, ${maxLon.toFixed(4)}]`);
    const { data: cachedResults, error: cacheError } = await supabase
      .from('reverse_geocache')
      .select('*')
      .gte('lat', minLat)
      .lte('lat', maxLat)
      .gte('lon', minLon)
      .lte('lon', maxLon)
      .limit(1);

    if (cacheError) {
      console.error('❌ Cache lookup error:', cacheError);
      // Continue to Nominatim if cache fails
    }

    // If we found a cached result, return it with the CACHED coordinates
    if (cachedResults && cachedResults.length > 0) {
      console.log('✅ Cache HIT! Returning cached result:', {
        cached_lat: cachedResults[0].lat,
        cached_lon: cachedResults[0].lon,
        address: cachedResults[0].address.substring(0, 50) + '...'
      });
      return res.json({
        display_name: cachedResults[0].address,
        lat: cachedResults[0].lat.toString(),
        lon: cachedResults[0].lon.toString(),
        cached: true
      });
    }

    console.log('❌ Cache MISS - calling Nominatim API');

    // Cache miss - call Nominatim API with STRICT English language enforcement
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en,en-US&addressdetails=1&extratags=0`,
      {
        headers: {
          // REQUIRED by OpenStreetMap Nominatim usage policy
          'User-Agent': 'CivicLens/1.0 (civic.lens.app@gmail.com)',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ Nominatim reverse geocode failed: ${response.status}`);
      return res.status(response.status).json({
        error: 'Geocoding service request failed',
        status: response.status
      });
    }

    const data = await response.json();
    console.log('✅ Nominatim response received:', data.display_name?.substring(0, 50) + '...');

    // Store in cache asynchronously
    console.log('💾 Attempting to cache result...');
    supabase
      .from('reverse_geocache')
      .insert({
        lat: latitude,
        lon: longitude,
        address: data.display_name || 'Unknown Location'
      })
      .then(({ data: insertData, error: insertError }) => {
        if (insertError) {
          console.error('❌ FAILED to cache geocode result:', {
            error: insertError,
            code: insertError.code,
            message: insertError.message,
            details: insertError.details
          });
        } else {
          console.log('✅ Successfully cached geocode result to database');
        }
      });

    res.json(data);

  } catch (err) {
    console.error('❌ Reverse geocode error:', err);
    res.status(500).json({
      error: 'Internal server error during reverse geocoding',
      message: err.message
    });
  }
});

// Cache management endpoints for debugging
/**
 * Clear all geocoding cache
 */
app.post('/api/clear-cache', async (req, res) => {
  try {
    const { error } = await supabase
      .from('reverse_geocache')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (error) {
      console.error('❌ Failed to clear cache:', error);
      return res.status(500).json({ error: 'Failed to clear cache', details: error.message });
    }

    console.log('🗑️ Cache cleared successfully');
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (err) {
    console.error('❌ Error clearing cache:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

/**
 * View cache contents for debugging
 */
app.get('/api/view-cache', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reverse_geocache')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('❌ Failed to fetch cache:', error);
      return res.status(500).json({ error: 'Failed to fetch cache', details: error.message });
    }

    res.json({
      count: data?.length || 0,
      entries: data
    });
  } catch (err) {
    console.error('❌ Error fetching cache:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
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
    // STRICT English language enforcement for search results
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&accept-language=en,en-US&addressdetails=1&extratags=0`,
      {
        headers: {
          // REQUIRED by OpenStreetMap Nominatim usage policy
          'User-Agent': 'CivicLens/1.0 (civic.lens.app@gmail.com)',
          'Accept-Language': 'en-US,en;q=0.9'
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

// ============================================
// Push Notifications Endpoints
// ============================================

/**
 * Register FCM token for a user (silent, automatic)
 * Stores token in database for push notification targeting
 */
app.post('/api/notifications/register', async (req, res) => {
  try {
    const { userId, fcmToken, platform, appVersion, timestamp } = req.body;

    if (!userId || !fcmToken) {
      return res.status(400).json({
        error: 'Missing required fields: userId, fcmToken'
      });
    }

    console.log(`📱 Registering FCM token for user: ${userId} (${platform})`);

    // Check if token already exists for this user
    const { data: existingToken, error: checkError } = await supabase
      .from('fcm_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('fcm_token', fcmToken)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not an error for us)
      console.error('Error checking existing token:', checkError);
    }

    if (existingToken) {
      // Update existing token
      const { error: updateError } = await supabase
        .from('fcm_tokens')
        .update({
          platform,
          app_version: appVersion,
          last_updated: new Date().toISOString(),
          is_active: true
        })
        .eq('user_id', userId)
        .eq('fcm_token', fcmToken);

      if (updateError) {
        console.error('Error updating FCM token:', updateError);
        return res.status(500).json({
          error: 'Failed to update FCM token',
          details: updateError.message
        });
      }

      console.log('✅ FCM token updated successfully');
      return res.json({
        success: true,
        message: 'FCM token updated successfully',
        action: 'updated'
      });
    }

    // Insert new token
    const { error: insertError } = await supabase
      .from('fcm_tokens')
      .insert({
        user_id: userId,
        fcm_token: fcmToken,
        platform: platform || 'unknown',
        app_version: appVersion || '1.0.0',
        is_active: true
      });

    if (insertError) {
      console.error('Error inserting FCM token:', insertError);
      return res.status(500).json({
        error: 'Failed to register FCM token',
        details: insertError.message
      });
    }

    console.log('✅ FCM token registered successfully');
    res.json({
      success: true,
      message: 'FCM token registered successfully',
      action: 'created'
    });

  } catch (error) {
    console.error('FCM registration error:', error);
    res.status(500).json({
      error: 'Internal server error during FCM registration',
      details: error.message
    });
  }
});

/**
 * Unregister FCM token (on logout)
 */
app.post('/api/notifications/unregister', async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;

    if (!userId || !fcmToken) {
      return res.status(400).json({
        error: 'Missing required fields: userId, fcmToken'
      });
    }

    console.log(`🔕 Unregistering FCM token for user: ${userId}`);

    // Mark token as inactive instead of deleting
    const { error } = await supabase
      .from('fcm_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('fcm_token', fcmToken);

    if (error) {
      console.error('Error unregistering FCM token:', error);
      return res.status(500).json({
        error: 'Failed to unregister FCM token',
        details: error.message
      });
    }

    console.log('✅ FCM token unregistered successfully');
    res.json({
      success: true,
      message: 'FCM token unregistered successfully'
    });

  } catch (error) {
    console.error('FCM unregistration error:', error);
    res.status(500).json({
      error: 'Internal server error during FCM unregistration',
      details: error.message
    });
  }
});

/**
 * Get all active tokens for a user (for debugging/admin)
 */
app.get('/api/notifications/tokens/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('fcm_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching FCM tokens:', error);
      return res.status(500).json({
        error: 'Failed to fetch FCM tokens',
        details: error.message
      });
    }

    res.json({
      userId,
      tokens: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;

// ============================================
// GOVERNANCE & SLA FEATURES
// ============================================

// Helper: Calculate Deadline based on Severity
function calculateSLA(severity) {
  const now = new Date();
  switch (severity?.toLowerCase()) {
    case 'high':
      now.setHours(now.getHours() + 24); // 24 hours
      return now;
    case 'medium':
      now.setDate(now.getDate() + 3); // 3 days
      return now;
    case 'low':
      now.setDate(now.getDate() + 7); // 7 days
      return now;
    default:
      now.setDate(now.getDate() + 7); // Default to 7 days
      return now;
  }
}

// 1. Audit Logging Endpoint
app.post('/api/audit-logs', async (req, res) => {
  const { reportId, adminId, action, details, adminName } = req.body;

  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        report_id: reportId,
        admin_id: adminId,
        admin_name: adminName,
        action: action,
        details: details
      });

    if (error) throw error;

    res.json({ success: true, message: 'Audit log recorded' });
  } catch (err) {
    console.error('Audit log error:', err);
    res.status(500).json({ error: 'Failed to record audit log' });
  }
});

// 2. Fetch Audit Logs Endpoint
app.get('/api/reports/:id/audit-logs', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('report_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Fetch audit logs error:', err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// 3. Auto-Escalation Cron Job (Runs every 10 minutes)
cron.schedule('*/10 * * * *', async () => {
  console.log('⏳ Running Auto-Escalation Check...');

  try {
    const now = new Date().toISOString();

    // Find overdue pending reports not yet escalated
    const { data: overdueReports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'pending')
      .eq('escalated', false)
      .lt('deadline', now);

    if (error) throw error;

    if (!overdueReports || overdueReports.length === 0) {
      console.log('✅ No overdue reports found.');
      return;
    }

    console.log(`⚠️ Found ${overdueReports.length} overdue reports. Escalating...`);

    for (const report of overdueReports) {
      // 1. Mark as Escalated
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          escalated: true,
          escalated_at: new Date().toISOString()
        })
        .eq('id', report.id);

      if (updateError) {
        console.error(`Failed to update report ${report.id}:`, updateError);
        continue;
      }

      // 2. Log to Audit
      await supabase.from('audit_logs').insert({
        report_id: report.id,
        admin_id: 'SYSTEM',
        action: 'AUTO_ESCALATION',
        details: `Report escalated due to missed SLA deadline of ${new Date(report.deadline).toLocaleString()}`
      });

      // 3. Notify Admins (Dynamic Lookup)
      let recipientEmail = process.env.SMTP_USER;

      try {
        if (report.district) {
          const { data: admins } = await supabase
            .from('admins')
            .select('email')
            .eq('district', report.district)
            .in('role', ['district', 'state', 'DISTRICT_ADMIN', 'STATE_ADMIN'])
            .limit(1);

          if (admins && admins.length > 0 && admins[0].email) {
            recipientEmail = admins[0].email;
            console.log(`📧 Found District Admin: ${recipientEmail}`);
          }
        }
      } catch (lookupError) {
        console.error('Failed to lookup admin email, defaulting to system:', lookupError);
      }

      const emailHtml = `
        <h2>⚠️ Report Escalated: ${report.title}</h2>
        <p>This report has exceeded its SLA deadline.</p>
        <ul>
          <li><strong>ID:</strong> ${report.id}</li>
          <li><strong>Severity:</strong> ${report.severity}</li>
          <li><strong>Deadline:</strong> ${new Date(report.deadline).toLocaleString()}</li>
          <li><strong>Location:</strong> ${report.district || 'Unknown District'}, ${report.state || 'Unknown State'}</li>
        </ul>
        <p>Please take immediate action.</p>
      `;

      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'CivicLens System'}" <${process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: `[ESCALATED] Overdue Report: ${report.title}`,
        html: emailHtml
      });

      console.log(`🚀 Escalated Report ${report.id} and notified ${recipientEmail}`);
    }

  } catch (err) {
    console.error('❌ Escalation Job Failed:', err);
  }
});

// ============================================
// ADMIN WORKFLOW ENDPOINTS (NEW)
// ============================================

// 4. Get Nearby Supervisors
app.get('/api/supervisors/nearby', async (req, res) => {
  const { lat, lon, department, district } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and Longitude are required' });
  }

  try {
    // Basic implementation: Filter by district/dept first, then sort by distance in memory 
    // Query 'admins' table who are not super_admins (treating them as supervisors)
    let query = supabase.from('admins')
      .select('id, full_name, role, department, district, current_lat, current_lon, is_available')
      .neq('role', 'super_admin');

    if (department) query = query.eq('department', department);
    if (district) query = query.eq('district', district);

    const { data: supervisors, error } = await query;

    if (error) throw error;

    // Haversine Distance Calculation
    const getDistance = (lat1, lon1, lat2, lon2) => {
      if (!lat1 || !lon1 || !lat2 || !lon2) return 99999; // Handle missing coords
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in km
    };

    const sortedSupervisors = supervisors.map(s => ({
      ...s,
      name: s.full_name, // Map full_name to name for frontend compatibility
      distance: getDistance(parseFloat(lat), parseFloat(lon), s.current_lat, s.current_lon)
    })).sort((a, b) => a.distance - b.distance);

    res.json(sortedSupervisors);
  } catch (err) {
    console.error('Error fetching supervisors:', err);
    res.status(500).json({ error: 'Failed to fetch supervisors' });
  }
});

// 5. Assign Supervisor
app.post('/api/reports/assign', async (req, res) => {
  const { reportId, supervisorId, adminId, adminName } = req.body;

  try {
    // 1. Update Report
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        assigned_to: supervisorId,
        status: 'in-progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (updateError) throw updateError;

    // 2. Log Audit
    await supabase.from('audit_logs').insert({
      report_id: reportId,
      admin_id: adminId,
      admin_name: adminName,
      action: 'ASSIGNMENT',
      details: { supervisor_id: supervisorId }
    });

    res.json({ success: true, message: 'Supervisor assigned successfully' });
  } catch (err) {
    console.error('Assignment error:', err);
    res.status(500).json({ error: 'Failed to assign supervisor' });
  }
});

// 6. Work Completion (Supervisor uploads proof)
app.post('/api/reports/complete', async (req, res) => {
  const { reportId, image, notes } = req.body;

  try {
    const { error } = await supabase
      .from('reports')
      .update({
        completion_image: image,
        supervisor_notes: notes,
        status: 'resolved',
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (error) throw error;

    res.json({ success: true, message: 'Work marked as complete' });
  } catch (err) {
    console.error('Completion error:', err);
    res.status(500).json({ error: 'Failed to submit completion proof' });
  }
});

// 7. Issue Closure (Admin Finalizes)
app.post('/api/reports/close', async (req, res) => {
  const { reportId, adminId, adminName } = req.body;

  try {
    const { error } = await supabase
      .from('reports')
      .update({
        status: 'resolved',
        state: 'closed', // Final state
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (error) throw error;

    await supabase.from('audit_logs').insert({
      report_id: reportId,
      admin_id: adminId,
      admin_name: adminName,
      action: 'CLOSE',
      details: 'Report officially closed by admin'
    });

    res.json({ success: true, message: 'Report closed successfully' });
  } catch (err) {
    console.error('Closure error:', err);
    res.status(500).json({ error: 'Failed to close report' });
  }
});

// 8. Submit Feedback
app.post('/api/reports/feedback', async (req, res) => {
  const { reportId, rating, comment } = req.body;

  try {
    const { error } = await supabase.from('feedbacks').insert({
      report_id: reportId,
      rating,
      comment
    });

    if (error) throw error;

    res.json({ success: true, message: 'Feedback submitted' });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// 9. Reopen Request
app.post('/api/reports/reopen', async (req, res) => {
  const { reportId, reason } = req.body;

  try {
    const { error } = await supabase
      .from('reports')
      .update({
        reopen_requested: true,
        reopen_reason: reason
      })
      .eq('id', reportId);

    if (error) throw error;

    res.json({ success: true, message: 'Reopen request submitted' });
  } catch (err) {
    console.error('Reopen error:', err);
    res.status(500).json({ error: 'Failed to request reopen' });
  }
});

// ============================================
// INTELLIGENT SUPERVISOR ASSIGNMENT (NEW)
// ============================================

// 10. Get Eligible Supervisors with Weighted Scoring
app.get('/api/admin/eligible-supervisors', async (req, res) => {
  const { issue_id } = req.query;

  if (!issue_id) {
    return res.status(400).json({ error: 'issue_id is required' });
  }

  try {
    // 1. Fetch Issue Details
    const { data: issue, error: issueError } = await supabase
      .from('reports')
      .select('id, category, department, district, latitude, longitude')
      .eq('id', issue_id)
      .single();

    if (issueError || !issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // 2. Fetch Eligible Supervisors (same department + district + available)
    const { data: supervisors, error: supError } = await supabase
      .from('supervisors')
      .select('id, name, email, phone, department, district, current_lat, current_lon, is_available, active_tasks, sla_delay_count')
      .eq('department', issue.department)
      .eq('district', issue.district)
      .eq('is_available', true);

    if (supError) throw supError;

    if (!supervisors || supervisors.length === 0) {
      return res.json({ supervisors: [], message: 'No eligible supervisors found' });
    }

    // 3. Haversine Distance Calculation
    const getDistance = (lat1, lon1, lat2, lon2) => {
      if (!lat1 || !lon1 || !lat2 || !lon2) return 99999;
      const R = 6371; // km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round((R * c) * 100) / 100; // km rounded to 2 decimals
    };

    // 4. Calculate Scores
    const issueLat = issue.latitude;
    const issueLon = issue.longitude;

    const scored = supervisors.map(s => {
      const distance = getDistance(issueLat, issueLon, s.current_lat, s.current_lon);
      const score = (distance * 0.5) + ((s.active_tasks || 0) * 0.3) + ((s.sla_delay_count || 0) * 0.2);
      return { ...s, distance, score };
    });

    // 5. Sort by Score (lowest = best)
    scored.sort((a, b) => a.score - b.score);

    // 6. Find Best Tags
    const minDistance = Math.min(...scored.map(s => s.distance));
    const minWorkload = Math.min(...scored.map(s => s.active_tasks || 0));

    // 7. Return Top 3 with Tags
    const top3 = scored.slice(0, 3).map((s, index) => ({
      ...s,
      isRecommended: index === 0,
      isNearest: s.distance === minDistance,
      isLeastWorkload: (s.active_tasks || 0) === minWorkload
    }));

    res.json({ supervisors: top3, issue: { department: issue.department, district: issue.district } });
  } catch (err) {
    console.error('Error fetching eligible supervisors:', err);
    res.status(500).json({ error: 'Failed to fetch eligible supervisors' });
  }
});

// 11. Assign Supervisor (Enhanced with Override Reason)
app.post('/api/admin/assign-supervisor', async (req, res) => {
  const { issue_id, supervisor_id, override_reason, admin_id, admin_name } = req.body;

  if (!issue_id || !supervisor_id) {
    return res.status(400).json({ error: 'issue_id and supervisor_id are required' });
  }

  try {
    // 1. Fetch Issue for Validation
    const { data: issue, error: issueError } = await supabase
      .from('reports')
      .select('id, department, district, latitude, longitude, assigned_to')
      .eq('id', issue_id)
      .single();

    if (issueError || !issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (issue.assigned_to) {
      return res.status(400).json({ error: 'Issue already assigned. Use reassign instead.' });
    }

    // 2. Fetch Supervisor for Validation
    const { data: supervisor, error: supError } = await supabase
      .from('supervisors')
      .select('id, name, department, district, current_lat, current_lon, active_tasks')
      .eq('id', supervisor_id)
      .single();

    if (supError || !supervisor) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }

    // 3. Validate Department & District Match
    if (supervisor.department !== issue.department || supervisor.district !== issue.district) {
      return res.status(400).json({ error: 'Supervisor department/district does not match issue.' });
    }

    // 4. Calculate Distance for Audit
    const getDistance = (lat1, lon1, lat2, lon2) => {
      if (!lat1 || !lon1 || !lat2 || !lon2) return null;
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round((R * c) * 100) / 100;
    };
    const distanceAtAssignment = getDistance(issue.latitude, issue.longitude, supervisor.current_lat, supervisor.current_lon);

    // 5. Update Issue
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        assigned_to: supervisor_id,
        status: 'in-progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', issue_id);

    if (updateError) throw updateError;

    // 6. Increment Supervisor Workload
    await supabase
      .from('supervisors')
      .update({ active_tasks: (supervisor.active_tasks || 0) + 1 })
      .eq('id', supervisor_id);

    // 7. Audit Log
    await supabase.from('audit_logs').insert({
      report_id: issue_id,
      admin_id: admin_id || 'ADMIN',
      admin_name: admin_name || 'Admin',
      action: 'SUPERVISOR_ASSIGNED',
      details: { supervisor_id, supervisor_name: supervisor.name },
      override_reason: override_reason || null,
      distance_at_assignment: distanceAtAssignment
    });

    // 8. Create Notification for Supervisor
    await supabase.from('notifications').insert({
      recipient_type: 'supervisor',
      recipient_clerk_id: supervisor_id,
      report_id: issue_id,
      type: 'task_assigned',
      title: 'New Task Assigned',
      body: `You have been assigned a new civic issue.`,
      status: 'pending'
    });

    res.json({ success: true, message: `Supervisor ${supervisor.name} assigned successfully`, supervisor_name: supervisor.name });
  } catch (err) {
    console.error('Assignment error:', err);
    res.status(500).json({ error: 'Failed to assign supervisor' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email configured: ${process.env.SMTP_USER ? 'Yes' : 'No'}`);
  console.log(`📬 Using SMTP: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
});
