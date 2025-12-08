# Quick Start: Resend Email Setup

## 🚀 3-Minute Setup

### Step 1: Get Resend API Key (2 minutes)

1. Go to: https://resend.com/signup
2. Sign up (free)
3. Click "API Keys" → "Create API Key"
4. Copy the key (starts with `re_`)

### Step 2: Configure Backend (30 seconds)

Create `backend/.env`:

```env
RESEND_API_KEY=re_paste_your_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
PORT=3001
```

### Step 3: Start Backend (30 seconds)

```bash
cd backend
npm start
```

Should see:
```
🚀 Server running on port 3001
📧 Resend configured: Yes
```

### Step 4: Configure Admin (optional)

If admin on different port, create `admin/.env`:

```env
VITE_BACKEND_URL=http://localhost:3001
```

### Step 5: Test!

1. Open admin panel
2. Go to any report
3. Click "Assign via Email"
4. Select officer
5. Click "Send via Email"
6. ✅ Email sent!

---

## ✅ That's It!

**3 Steps:**
1. Get Resend key → backend/.env
2. npm start
3. Click "Assign via Email"

**Done!** Emails now send automatically with beautiful templates! 📧✨

---

## 🔧 If Something's Wrong

**Backend not starting?**
```bash
cd backend
npm install
npm start
```

**Email not sending?**
- Check backend console for errors
- Verify API key is correct
- Check officer email is valid

**Need help?**
Read full guide: `RESEND_EMAIL_SETUP.md`

---

## 📝 Testing Email

Send test email to yourself:

```bash
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your@email.com","subject":"Test","html":"<h1>Works!</h1>"}'
```

Should return:
```json
{"success":true,"messageId":"..."}
```

Check your email! ✅

---

**Quick, simple, works!** 🚀
