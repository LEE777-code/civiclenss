# CivicLens Admin Web App - Complete Setup Guide

This guide will help you set up the admin web app to work seamlessly with the citizen mobile app.

## Overview

The admin web app is now fully integrated with the mobile app:
- ✅ Shares the same `.env` file for database and authentication
- ✅ Uses the same Supabase database
- ✅ Issues submitted from mobile app appear in admin dashboard
- ✅ No separate backend or server needed
- ✅ Real-time data synchronization
- ✅ Clean, production-ready code with no dummy data

## Step 1: Database Setup

### Create Tables in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `admin-web-app/database-schema.sql`
4. Copy all the SQL code
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute

This will create:
- `issues` table - stores all civic issues
- `admins` table - stores admin accounts
- `categories` table - stores issue categories
- Indexes for performance
- Row Level Security policies
- Default categories (Roads, Water, Electricity, etc.)

### Verify Tables

After running the SQL, verify the tables exist:
1. Go to **Table Editor** in Supabase
2. You should see: `issues`, `admins`, `categories`

## Step 2: Environment Variables

The admin app uses the **SAME** `.env` file as the mobile app (located in project root).

Verify your `.env` file contains:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Note**: Both the mobile app and admin app read from this shared `.env` file.

## Step 3: Install Dependencies

```bash
cd admin-web-app
npm install
```

This installs:
- React, TypeScript, Vite
- Supabase client
- Clerk authentication
- Recharts for analytics
- shadcn/ui components
- All necessary dependencies

## Step 4: Run the Admin App

```bash
cd admin-web-app
npm run dev
```

The admin app will start at: `http://localhost:5173`

## Step 5: Create Admin Account

1. Open `http://localhost:5173` in your browser
2. Click **Sign Up** (or navigate to `/auth/signup`)
3. Create an admin account with your email
4. After signing up, you'll be redirected to the dashboard

### Add Admin to Database

After signing up with Clerk, you need to add your admin record to the database:

1. Go to Supabase **Table Editor**
2. Open the `admins` table
3. Click **Insert row**
4. Fill in:
   - `clerk_id`: Your Clerk user ID (found in Clerk dashboard)
   - `email`: Your email
   - `name`: Your name
   - `role`: Choose from: `state`, `district`, `local`, or `super_admin`
   - `state`: Your state (e.g., "Tamil Nadu")
   - `district`: Your district (optional)
5. Click **Save**

## Step 6: Test the Integration

### Test Issue Submission from Mobile App

1. Run the mobile app: `npm run dev` (in project root)
2. Navigate to **Report Issue**
3. Fill in issue details and submit
4. The issue should be saved to Supabase

### Verify in Admin Dashboard

1. Open the admin app: `http://localhost:5173`
2. Go to **Dashboard** or **Issues**
3. You should see the issue you just submitted
4. Try updating the status, filtering, searching

## Features Overview

### Dashboard
- Real-time statistics (Total, Open, In Progress, Resolved)
- Recent issues table
- Issue summary panel
- Automatically fetches data from Supabase

### Issues Management
- View all issues from the database
- Filter by status, priority, category
- Search by title, ID, or location
- Update issue status (Open → In Progress → Resolved)
- Delete issues
- All changes sync to database immediately

### Analytics
- Monthly trend charts (reported vs resolved)
- Category distribution pie chart
- Bar charts comparing metrics
- Data calculated from real database records

### Profile
- Admin information from database
- Monthly resolution trend graph
- Issue status distribution chart
- Performance analytics

### Categories
- View all issue categories
- Add new categories
- Edit/delete categories
- See issue count per category

### Admins
- View all admin accounts
- See admin roles and jurisdictions
- Manage admin access

## Data Flow

```
Mobile App (Citizen)
    ↓
  Reports Issue
    ↓
Supabase Database (issues table)
    ↓
Admin Web App
    ↓
  Views/Updates Issue
    ↓
Supabase Database
    ↓
Mobile App (sees updated status)
```

## File Structure

```
admin-web-app/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── IssuesTable.tsx      # Issues table with filters
│   │   │   ├── StatCard.tsx         # Statistics cards
│   │   │   └── IssueSummaryPanel.tsx # Issue details panel
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx      # Main layout wrapper
│   │   │   └── AdminSidebar.tsx     # Navigation sidebar
│   │   └── ui/                      # shadcn/ui components
│   ├── contexts/
│   │   └── AuthContext.tsx          # Authentication state
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client + types
│   │   └── utils.ts                 # Utility functions
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx        # Main dashboard
│   │   │   ├── Issues.tsx           # Issues management
│   │   │   ├── Analytics.tsx        # Analytics & charts
│   │   │   ├── Profile.tsx          # Admin profile
│   │   │   ├── Categories.tsx       # Category management
│   │   │   └── Admins.tsx           # Admin management
│   │   └── auth/
│   │       ├── SignIn.tsx           # Sign in page
│   │       └── SignUp.tsx           # Sign up page
│   ├── services/
│   │   ├── issueService.ts          # Issue CRUD operations
│   │   ├── authService.ts           # Admin auth operations
│   │   └── categoryService.ts       # Category operations
│   ├── App.tsx                      # Main app with routing
│   └── main.tsx                     # Entry point
├── database-schema.sql              # Database setup SQL
├── .env                             # Shared with mobile app
└── package.json
```

## Key Services

### issueService.ts
- `getIssues(filters)` - Fetch issues with optional filters
- `getIssueById(id)` - Get single issue
- `updateIssueStatus(id, status)` - Update issue status
- `updateIssuePriority(id, priority)` - Update priority
- `getIssueStats()` - Get statistics
- `deleteIssue(id)` - Delete issue

### authService.ts
- `getAdminByClerkId(clerkId)` - Get admin profile
- `createAdmin(data)` - Create admin account
- `updateAdmin(clerkId, updates)` - Update admin
- `getAllAdmins()` - Get all admins

### categoryService.ts
- `getCategories()` - Get all categories
- `createCategory(data)` - Create category
- `updateCategory(id, updates)` - Update category
- `deleteCategory(id)` - Delete category

## Troubleshooting

### Issues not appearing in admin dashboard

1. Check Supabase connection:
   - Verify `.env` variables are correct
   - Check Supabase project is active
   - Verify tables exist in Supabase

2. Check browser console for errors
3. Verify issue was saved to database (check Supabase Table Editor)

### Authentication not working

1. Verify Clerk publishable key in `.env`
2. Check Clerk dashboard for user accounts
3. Ensure admin record exists in `admins` table

### Charts not showing data

1. Ensure issues exist in database
2. Check browser console for errors
3. Verify issue dates are valid

## Production Deployment

### Build the Admin App

```bash
cd admin-web-app
npm run build
```

This creates a `dist` folder with optimized production files.

### Deploy Options

1. **Vercel** (Recommended)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   - Connect GitHub repo
   - Set build command: `npm run build`
   - Set publish directory: `dist`

3. **Custom Server**
   - Upload `dist` folder contents
   - Configure web server to serve static files

### Environment Variables in Production

Add these to your hosting platform:
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Security Notes

- Row Level Security (RLS) is enabled on all tables
- Admins must be authenticated via Clerk
- Database queries use Supabase's built-in security
- Anonymous issue reporting is supported
- Admin roles control access levels

## Next Steps

1. ✅ Set up database tables
2. ✅ Configure environment variables
3. ✅ Install dependencies
4. ✅ Run admin app
5. ✅ Create admin account
6. ✅ Test issue submission from mobile app
7. ✅ Verify issues appear in admin dashboard
8. 🚀 Deploy to production

## Support

For issues or questions:
1. Check browser console for errors
2. Check Supabase logs
3. Verify database tables and data
4. Review this guide

---

**Congratulations!** Your admin web app is now fully integrated with the mobile app and ready for production use.
