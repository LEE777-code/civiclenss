# 📧 Resend Email Integration - Setup Guide

## ✅ What's Changed

Now using **Resend** API for professional email delivery instead of mailto: links!

### Benefits:
- ✅ **Actually sends emails** (no email client needed)
- ✅ **Beautiful HTML templates**
- ✅ **Reliable delivery**
- ✅ **Email tracking**
- ✅ **Professional appearance**
- ✅ **Works on all devices**

---

## 🚀 Setup Steps

### Step 1: Get Resend API Key

1. **Go to** [https://resend.com](https://resend.com)
2. **Sign up** for free account
3. Click **"API Keys"** in sidebar
4. Click **"Create API Key"**
5. **Copy the key** (starts with `re_`)

### Step 2: Configure Backend

1. **Open** `backend/.env` file
2. **Add** your Resend API key:

```env
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=CivicLens <noreply@yourdomain.com>
PORT=3001
```

**Important:** 
- Replace `re_your_actual_api_key_here` with your real key
- Replace `noreply@yourdomain.com` with verified domain OR use `onboarding@resend.dev` for testing

### Step 3: Start Backend Server

```bash
cd backend
npm start
```

**Expected Output:**
```
🚀 Server running on port 3001
📧 Resend configured: Yes
```

### Step 4: Configure Admin Frontend

1. **Create** `admin/.env` if not exists
2. **Add** backend URL:

```env
VITE_BACKEND_URL=http://localhost:3001
```

### Step 5: Test!

1. Open admin panel
2. Go to any report
3. Click **"Assign via Email"**
4. Select an officer
5. Click **"Send via Email"**
6. ✅ Email sends automatically!

---

## 📁 Files Created/Modified

### Backend (New!)
```
backend/
  ├── server.js          ✅ Express server with Resend
  ├── package.json       ✅ Dependencies
  ├── .env              ✅ Your config (create this!)
  └── .env.example      ✅ Template
```

### Admin (Updated)
```
admin/src/services/
  └── emailService.ts    ✅ Now calls backend API
  
admin/src/pages/admin/
  └── ReportDetails.tsx  ✅ Async email sending
```

---

## 🎨 Email Template Preview

Recipients will receive beautiful HTML emails:

```
┌────────────────────────────────────┐
│  🚨 New Report Assignment          │
│  CivicLens Admin Panel             │
├────────────────────────────────────┤
│                                    │
│  Dear Officer Name,                │
│                                    │
│  📋 Report Details                 │
│  ├─ Report ID: ABC12345            │
│  ├─ Title: Broken Street Light    │
│  ├─ Category: Road Issues          │
│  ├─ Severity: HIGH ⚠️              │
│  └─ Reported: 12/6/2025, 2:52 PM   │
│                                    │
│  📍 Location                       │
│  MG Road, Bangalore                │
│  [📍 Open in Google Maps]          │
│                                    │
│  📝 Description                    │
│  Street light not working...       │
│                                    │
│  🖼️ Attached Image                 │
│  [View Image]                      │
│                                    │
│  ⚠️ ACTION REQUIRED                │
│  Please review and take action...  │
│                                    │
└────────────────────────────────────┘
```

---

## 🔧 Backend API Endpoints

### 1. Send Report Assignment

```bash
POST http://localhost:3001/api/send-report-assignment

Body:
{
  "officerEmail": "officer@example.com",
  "officerName": "John Doe",
  "reportId": "ABC123",
  "title": "Broken Light",
  "category": "Road Issues",
  "severity": "high",
  "description": "...",
  "locationName": "MG Road",
  "googleMapsLink": "https://maps.google.com/...",
  "imageUrl": "https://...",
  "reportedAt": "12/6/2025, 2:52 PM",
  "assignedBy": "admin@example.com"
}
```

### 2. Send Custom Email

```bash
POST http://localhost:3001/api/send-email

Body:
{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "html": "<h1>Hello!</h1>"
}
```

### 3. Health Check

```bash
GET http://localhost:3001/health
```

---

## 🧪 Testing

### Test 1: Backend Running

```bash
curl http://localhost:3001/health
```

**Expected:**
```json
{"status": "ok", "timestamp": "2025-12-06T..."}
```

### Test 2: Send Test Email

```bash
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test from CivicLens",
    "html": "<h1>It works!</h1>"
  }'
```

**Expected:**
```json
{
  "success": true,
  "messageId": "...",
  "message": "Email sent successfully"
}
```

### Test 3: Full Assignment Flow

1. Start backend: `cd backend && npm start`
2. Start admin: `cd admin && npm run dev`
3. Open report in admin panel
4. Click "Assign via Email"
5. Select officer
6. Click "Send via Email"
7. Check officer's email inbox!

---

## ⚙️ Configuration

### Resend Free Tier Limits:
- ✅ 100 emails/day
- ✅ 3,000 emails/month
- ✅ Perfect for testing!

### Domain Verification (Production):

For production, verify your domain:

1. Go to Resend dashboard
2. Click "Domains"
3. Add your domain (e.g., `civiclens.com`)
4. Add DNS records as shown
5. Wait for verification
6. Update `.env`:
   ```env
   RESEND_FROM_EMAIL=CivicLens <noreply@civiclens.com>
   ```

### Development Mode:

For testing, use Resend's test email:
```env
RESEND_FROM_EMAIL=CivicLens <onboarding@resend.dev>
```

---

## 🐛 Troubleshooting

### Issue: "Resend configured: No"

**Solution:** 
- Check `.env` file exists in backend folder
- Verify `RESEND_API_KEY` is set correctly
- Restart backend server

### Issue: "Failed to send email"

**Checks:**
1. ✅ Backend server running?
2. ✅ API key valid?
3. ✅ From email verified in Resend?
4. ✅ CORS enabled in backend?

Check server logs for detailed error!

### Issue: "Network error"

**Solution:**
- Verify `VITE_BACKEND_URL` in `admin/.env`
- Make sure backend is running on port 3001
- Check firewall/antivirus not blocking

### Issue: Email not received

**Checks:**
1. ✅ Check spam folder
2. ✅ Verify officer email is correct
3. ✅ Check Resend dashboard logs
4. ✅ Verify domain if using custom domain

---

## 📊 Resend Dashboard

Monitor your emails:

1. Go to [https://resend.com/emails](https://resend.com/emails)
2. See all sent emails
3. Check delivery status
4. View email content
5. Debug failures

---

## 🚀 Production Deployment

### Backend Deployment (Railway/Render/Heroku):

1. Push code to Git
2. Deploy backend
3. Set environment variables:
   ```
   RESEND_API_KEY=re_your_key
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   PORT=3001
   ```
4. Get deployment URL (e.g., `https://your-app.railway.app`)

### Update Admin .env:

```env
VITE_BACKEND_URL=https://your-app.railway.app
```

---

## 📝 Quick Start Checklist

```
[ ] Sign up for Resend account
[ ] Get API key from Resend
[ ] Create backend/.env file
[ ] Add RESEND_API_KEY to .env
[ ] Add RESEND_FROM_EMAIL to .env
[ ] Run: cd backend && npm install
[ ] Run: npm start (backend on port 3001)
[ ] Create admin/.env
[ ] Add VITE_BACKEND_URL=http://localhost:3001
[ ] Test: Click "Assign via Email" in admin
[ ] Verify: Email received in officer's inbox
```

---

## ✅ Success Indicators

**Backend Started:**
```
🚀 Server running on port 3001
📧 Resend configured: Yes
```

**Email Sent:**
```
✅ Email sent to John Doe successfully!
```

**Resend Dashboard:**
- Shows email in "Emails" list
- Status: "Delivered" ✅

---

## 🎯 Summary

**Before:** mailto: links (opens email client)  
**Now:** Resend API (actually sends emails!)

**Steps:**
1. Get Resend API key
2. Configure backend `.env`
3. Start backend server
4. Configure admin `.env`
5. Test assignment!

**Result:** Professional emails delivered automatically! 📧✨

---

## 📞 Support

- **Resend Docs:** https://resend.com/docs
- **API Reference:** https://resend.com/docs/api-reference
- **Status:** https://status.resend.com

---

**Ready to send professional emails!** 🚀📧
