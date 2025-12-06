# 📧 Nodemailer Setup Guide

## ✅ Now Using Nodemailer!

**Benefits:**
- ✅ **FREE** - No paid service needed
- ✅ **Works with Gmail** - Use your existing email
- ✅ **Works with Outlook** - Or any email provider
- ✅ **Custom SMTP** - Use your organization's server
- ✅ **No limits** - Send as many emails as your provider allows

---

## 🚀 Quick Setup (5 Minutes)

### Option 1: Gmail (Recommended for Testing)

#### Step 1: Enable App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Scroll to "How you sign in to Google"
3. Click **"2-Step Verification"** → Enable it
4. Go back to Security
5. Click **"App passwords"** (search for it)
6. Select app: **"Mail"**
7. Select device: **"Other"** → Type: **"CivicLens"**
8. Click **"Generate"**
9. **Copy the 16-character password** (remove spaces)

#### Step 2: Configure Backend

Edit `backend/.env`:

```env
# Gmail Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # <- Paste app password here (no spaces!)
EMAIL_FROM_NAME=CivicLens
PORT=3001
```

**Important:** Remove spaces from the app password!

#### Step 3: Start Server

```bash
cd backend
npm start
```

**Expected Output:**
```
🚀 Server running on port 3001
✅ Email server is ready to send messages
📧 Email configured: Yes
📬 Using SMTP: smtp.gmail.com
```

### Option 2: Outlook

#### Step 1: Use Regular Password

Outlook is simpler - just use your regular password!

#### Step 2: Configure

Edit `backend/.env`:

```env
# Outlook Configuration
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-outlook-password
EMAIL_FROM_NAME=CivicLens
PORT=3001
```

#### Step 3: Restart Server

```bash
cd backend
npm start
```

### Option 3: Custom SMTP

If you have your own email server or organization email:

```env
# Custom SMTP
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false  # or true for port 465
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
EMAIL_FROM_NAME=CivicLens
PORT=3001
```

---

## 🧪 Testing

### Test 1: Health Check

```bash
curl http://localhost:3001/health
```

**Expected:**
```json
{"status":"ok","timestamp":"2025-12-06T..."}
```

### Test 2: Send Test Email

```bash
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@gmail.com",
    "subject": "Test from CivicLens",
    "html": "<h1>It works!</h1><p>Email configured successfully!</p>"
  }'
```

**Expected:**
```json
{
  "success": true,
  "messageId": "<...>",
  "message": "Email sent successfully"
}
```

### Test 3: Check Your Inbox

1. **Check your email** (the "to" address)
2. Should receive test email within seconds
3. ✅ Success!

---

## 📧 Email Configuration Explained

### SMTP Settings:

```env
SMTP_HOST=smtp.gmail.com          # Email server address
SMTP_PORT=587                     # Port (587 = TLS, 465 = SSL)
SMTP_SECURE=false                 # false for 587, true for 465
SMTP_USER=your@email.com          # Your email address
SMTP_PASS=your-password           # App password or regular password
EMAIL_FROM_NAME=CivicLens         # Display name in emails
```

### Common SMTP Servers:

| Provider | Host | Port | Secure |
|----------|------|------|--------|
| Gmail | smtp.gmail.com | 587 | false |
| Outlook | smtp-mail.outlook.com | 587 | false |
| Yahoo | smtp.mail.yahoo.com | 587 | false |
| Office 365 | smtp.office365.com | 587 | false |
| Custom | your-host | 587/465 | varies |

---

## 🔧 Troubleshooting

### Issue: "Invalid login"

**Gmail:**
- ✅ Enabled 2-Step Verification?
- ✅ Created App Password?
- ✅ Removed spaces from app password?
- ✅ Used correct email address?

**Outlook:**
- ✅ Correct password?
- ✅ Account not locked?

### Issue: "Email server is NOT ready"

**Check:**
1. SMTP settings in `.env` correct?
2. Internet connection working?
3. Firewall not blocking port 587?
4. Email provider allows SMTP?

**Solution:**
```bash
# Restart backend with verbose logging
cd backend
npm start
# Check console for detailed error
```

### Issue: "Connection timeout"

**Causes:**
- Firewall blocking SMTP ports
- Wrong SMTP_HOST
- Network issues

**Fix:**
- Try different port (587 vs 465)
- Check firewall settings
- Try with VPN off

### Issue: Email goes to spam

**Solutions:**
1. Add "from" email to contacts
2. Use verified domain (production)
3. Configure SPF/DKIM (advanced)

---

## 🎨 Email Template

Recipients receive beautiful HTML emails:

**Subject:**
```
[CivicLens] New Report Assignment: Broken Street Light (HIGH)
```

**Content:**
- 🎨 Gradient header
- 📋 All report details
- 📍 Location with Maps link
- 📝 Full description
- 🖼️ Image link
- ⚠️ Action required box
- 🏢 Professional footer

---

## 💡 Gmail App Password Setup (Detailed)

### If You Can't Find "App Passwords":

1. **Make sure 2-Step Verification is ON**
   - Go to: https://myaccount.google.com/security
   - Scroll to "How you sign in to Google"
   - Click "2-Step Verification"
   - Click "Get Started" and follow steps

2. **Access App Passwords**
   - After 2-Step is enabled
   - Go back to: https://myaccount.google.com/security
   - Search for "App passwords" in the search bar
   - OR go directly to: https://myaccount.google.com/apppasswords

3. **Generate Password**
   - Select app: "Mail"
   - Select device: "Other (Custom name)"
   - Type: "CivicLens Backend"
   - Click "Generate"
   - **Copy the 16-character password**

4. **Use in .env**
   ```env
   SMTP_PASS=abcdefghijklmnop  # Remove spaces!
   ```

---

## 🚀 Production Setup

### For Production:

1. **Use Organization Email**
   ```env
   SMTP_USER=noreply@yourdomain.com
   ```

2. **Secure Credentials**
   - Use environment variables (not .env file)
   - Deploy secrets securely

3. **Monitor Usage**
   - Gmail: 500 emails/day limit
   - Outlook: 300 emails/day limit
   - Custom SMTP: Check your limits

4. **Add SPF Record** (Optional)
   ```
   v=spf1 include:_spf.google.com ~all
   ```

---

## 📊 Comparison

### Nodemailer vs Resend:

| Feature | Nodemailer | Resend |
|---------|-----------|--------|
| **Cost** | FREE | Paid (after 100/day) |
| **Setup** | 5 minutes | 2 minutes |
| **Provider** | Gmail/Outlook/Any | Resend only |
| **Limits** | Provider limits | 100/day free |
| **Control** | Full control | Less control |
| **Reliability** | High | High |

**Winner:** Nodemailer for free, unlimited use! ✅

---

## ✅ Success Checklist

```
[ ] Gmail/Outlook account exists
[ ] 2-Step Verification enabled (Gmail)
[ ] App Password generated (Gmail)
[ ] backend/.env configured
[ ] SMTP_PASS has no spaces
[ ] npm start successful
[ ] Server shows "Email server is ready"
[ ] Test email sent successfully
[ ] Test email received in inbox
[ ] Email template looks good
```

---

## 🎯 Quick Start Commands

```bash
# Step 1: Configure
nano backend/.env  # Or use any editor

# Step 2: Install (if needed)
cd backend
npm install

# Step 3: Start
npm start

# Step 4: Test
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","html":"<h1>Works!</h1>"}'

# Step 5: Use in admin panel!
```

---

## 📝 Common Configurations

### Gmail:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Outlook:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@outlook.com
SMTP_PASS=your-regular-password
```

### Office 365:
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@yourcompany.com
SMTP_PASS=your-password
```

---

## 💡 Pro Tips

1. **Use dedicated email** for sending (like noreply@)
2. **Test locally first** before production
3. **Monitor email limits** to avoid blocking
4. **Keep credentials secure** - never commit .env!
5. **Check spam folders** when testing

---

## 🆘 Still Not Working?

**Check server logs:**
```bash
cd backend
npm start
# Look for error messages
```

**Common errors:**
- "Invalid login" → Wrong password
- "Connection timeout" → Firewall/network issue
- "Authentication failed" → 2-Step not enabled (Gmail)

**Need help?**
1. Check console logs for details
2. Verify all settings in .env
3. Test with curl command first
4. Try different email provider

---

**Ready to send emails!** 📧✨

**Next:** Open admin panel → Assign via Email → It works!
