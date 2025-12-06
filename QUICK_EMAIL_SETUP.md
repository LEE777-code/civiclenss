# 🚀 Nodemailer - 5 Minute Setup

## ✅ Switched to Nodemailer!

**Why?**
- ✅ **100% FREE**
- ✅ Works with Gmail
- ✅ No third-party service
- ✅ Unlimited emails (provider limits)

---

## 📧 Gmail Setup (Fastest)

### Step 1: Get App Password (2 minutes)

1. Go to: https://myaccount.google.com/security
2. Enable **"2-Step Verification"** (if not already)
3. Search for **"App passwords"**
4. Create password for **"Mail"** → **"CivicLens"**
5. **Copy the 16-character code** (remove spaces!)

### Step 2: Configure Backend (1 minute)

Edit `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM_NAME=CivicLens
PORT=3001
```

**Replace:**
- `your-email@gmail.com` → Your Gmail
- `abcdefghijklmnop` → Your app password (NO SPACES!)

### Step 3: Restart Backend (30 seconds)

```bash
cd backend
npm start
```

**Should see:**
```
🚀 Server running on port 3001
✅ Email server is ready to send messages
📧 Email configured: Yes
```

### Step 4: Test! (1 minute)

1. Open admin panel
2. Go to any report
3. Click **"Assign via Email"**
4. Select officer
5. Click **"Send via Email"**
6. ✅ **Email sent!**

---

## 🎯 That's It!

**3 steps:**
1. Get Gmail app password
2. Edit backend/.env
3. Restart backend

**Total time:** 5 minutes  
**Result:** Professional emails! 📧✨

---

## 🧪 Quick Test

Send yourself a test email:

```bash
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your@email.com","subject":"Test","html":"<h1>Works!</h1>"}'
```

Check your inbox! ✅

---

## ❓ Troubleshooting

**"Invalid login"?**
→ Make sure 2-Step Verification is ON
→ Generate new app password
→ Remove spaces from password

**"Connection timeout"?**
→ Check internet connection
→ Try disabling firewalltemporarily

**Still not working?**
→ Read full guide: `NODEMAILER_SETUP.md`

---

## 💡 Outlook Alternative

**Prefer Outlook?**

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@outlook.com
SMTP_PASS=your-regular-password
```

Restart backend → Done!

---

**Email setup complete in 5 minutes!** 🚀
