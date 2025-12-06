# Fix for Issue Submission Failure - CivicLens

## Problem
The client-side app was unable to submit issues to the database.

## Root Causes Identified
1. **Table Mismatch**: Client was trying to insert into `issues` table, but admin dashboard reads from `reports` table
2. **Missing Table**: The `reports` table may not exist in your Supabase database
3. **Field Mismatch**: Column names didn't match between what client sent and what database expected

## Solutions Applied

### ✅ Step 1: Updated Client Code
- Changed `IssuePreview.tsx` to insert into `reports` table instead of `issues`
- Updated field mapping:
  - `priority` → `severity`
  - `location` → `location_name`
  - `reported_by` → `user_id`
  - `status: 'open'` → `status: 'pending'`
- Now uses the selected category from the form

### ✅ Step 2: Created Database Schema
- Created `database-schema-reports.sql` file
- **You need to run this in your Supabase SQL Editor**

## How to Complete the Fix

### 1. Run the SQL Schema in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your CivicLens project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the contents of `database-schema-reports.sql`
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. You should see "Success. No rows returned"

### 2. Verify Your Environment Variables

Make sure you have the correct Supabase credentials in your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

To find these:
1. Go to Supabase Dashboard
2. Click on your project
3. Go to **Settings** > **API**
4. Copy **Project URL** → `VITE_SUPABASE_URL`
5. Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 3. Test the Submission

1. Open your app: http://localhost:8080
2. Navigate to **Report an Issue**
3. Fill in the form:
   - Upload/take a photo (optional)
   - Enter a title (required)
   - Add description
   - Select a category (required)
   - Choose severity
4. Click **Preview**
5. Click **Submit Issue**
6. You should see "Issue reported successfully!"

### 4. Verify in Supabase

1. Go to Supabase Dashboard
2. Click **Table Editor**
3. Select the `reports` table
4. You should see your submitted issue

## Common Errors and Solutions

### Error: "relation 'reports' does not exist"
**Solution**: Run the SQL schema file in Supabase SQL Editor (Step 1 above)

### Error: "No API key found in request"
**Solution**: Check your `.env` file has the correct `VITE_SUPABASE_ANON_KEY`

### Error: "new row violates row-level security policy"
**Solution**: The SQL schema includes RLS policies. If you still get this error:
1. Go to Supabase Dashboard > Authentication > Policies
2. Check that the "Anyone can insert reports" policy is enabled

### Error: "Failed to submit issue"
**Solution**: Open browser console (F12) to see the actual error message, then:
- Check if required fields are missing
- Verify network connection
- Check Supabase service status

## What Changed

### Before
```typescript
// Client tried to insert into 'issues' table
const issueData = {
  status: 'open',
  priority: 'high',
  location: '123 Main St',
  reported_by: 'user-id'
};
await supabase.from('issues').insert([issueData]);
```

### After
```typescript
// Client now inserts into 'reports' table
const reportData = {
  status: 'pending',
  severity: 'high',
  location_name: '123 Main St',
  user_id: 'user-id'
};
await supabase.from('reports').insert([reportData]);
```

## Testing Checklist

- [ ] SQL schema executed successfully in Supabase
- [ ] `reports` table visible in Supabase Table Editor
- [ ] `.env` file has correct Supabase credentials
- [ ] Dev server is running (`npm run dev`)
- [ ] Can fill out the report form
- [ ] Can preview the report
- [ ] Can submit the report successfully
- [ ] Report appears in Supabase `reports` table
- [ ] Report appears in Admin Dashboard

## Next Steps

After the issue submission works:
1. Test viewing the report in the admin dashboard
2. Test updating report status from admin panel
3. Test filtering and searching reports
4. Optionally: Add GPS coordinates for location tracking
5. Optionally: Add image upload to Supabase Storage

## Need Help?

If you're still experiencing issues:
1. Check the browser console for error messages (F12)
2. Check the Network tab to see the Supabase API request
3. Verify the `reports` table exists in Supabase
4. Check RLS policies in Supabase Authentication > Policies
