# CivicLens Admin - Quick Start Guide

Get your admin web app running in 5 minutes!

## Prerequisites

- Node.js installed
- Supabase account
- Clerk account
- `.env` file configured (already done)

## Step 1: Database Setup (2 minutes)

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Copy contents of `admin-web-app/database-schema.sql`
4. Paste and click **Run**
5. ✅ Tables created!

## Step 2: Install & Run (1 minute)

```bash
cd admin-web-app
npm install
npm run dev
```

Open: `http://localhost:5173`

## Step 3: Create Admin Account (1 minute)

1. Click **Sign Up**
2. Enter your email and password
3. Complete sign up

## Step 4: Add Admin to Database (1 minute)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open **Table Editor** → `admins` table
3. Click **Insert row**
4. Fill in:
   - `clerk_id`: Get from [Clerk Dashboard](https://dashboard.clerk.com) → Users
   - `email`: Your email
   - `name`: Your name
   - `role`: `super_admin`
   - `state`: Your state
5. Click **Save**

## Step 5: Test It! (30 seconds)

### From Mobile App:
```bash
# In project root
npm run dev
```

1. Navigate to **Report Issue**
2. Fill in details and submit
3. Issue saved to database ✅

### In Admin Dashboard:
1. Refresh `http://localhost:5173`
2. Go to **Dashboard** or **Issues**
3. See your submitted issue ✅

## That's It! 🎉

Your admin web app is now:
- ✅ Connected to the database
- ✅ Receiving issues from mobile app
- ✅ Showing real-time data
- ✅ Ready for production

## Common Commands

```bash
# Development
cd admin-web-app
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

### Issue not appearing?
- Check Supabase Table Editor → `issues` table
- Verify issue was saved
- Refresh admin dashboard

### Can't sign in?
- Verify Clerk key in `.env`
- Check Clerk dashboard for user
- Ensure admin record exists in database

### Charts empty?
- Submit a few issues first
- Refresh the page
- Check browser console for errors

## Next Steps

- 📊 View **Analytics** for insights
- 👤 Check **Profile** for your stats
- 🏷️ Manage **Categories**
- 👥 View **Admins** list
- 🚀 Deploy to production

## Need Help?

See detailed guides:
- `ADMIN_SETUP_GUIDE.md` - Complete setup instructions
- `ADMIN_CHANGES_SUMMARY.md` - What was changed
- `admin-web-app/README.md` - Project documentation

---

**Happy Managing! 🚀**
