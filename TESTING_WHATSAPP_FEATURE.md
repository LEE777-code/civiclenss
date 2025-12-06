# Testing WhatsApp Officer Assignment 🧪

## Step-by-Step Testing Guide

### ⚠️ Prerequisites

Before testing, ensure:
- ✅ Supabase is running
- ✅ Admin panel is running (`npm run dev` in admin folder)
- ✅ You're logged into WhatsApp Web (on desktop) or have WhatsApp app (on mobile)

---

## Step 1: Setup Database

### 1.1 Run SQL Script

**Open Supabase SQL Editor:**
1. Go to https://supabase.com
2. Select your project
3. Click "SQL Editor" in sidebar
4. Click "New Query"
5. Copy and paste contents of `CREATE_OFFICERS_TABLE.sql`
6. Click "Run"

**Expected Output:**
```
Officers table created successfully!
officer_count: 4
```

### 1.2 Update Officer Phone Numbers

**IMPORTANT:** Update with REAL phone numbers for testing!

```sql
-- Update officer phone numbers (RUN THIS AFTER CREATING TABLE)
UPDATE officers 
SET phone = '919876543210'  -- ⚠️ CHANGE TO REAL NUMBER!
WHERE name = 'Officer John Doe';

-- Verify
SELECT name, phone, department FROM officers;
```

**Phone Number Format:**
- ✅ Correct: `919876543210` (India - no spaces, no +)
- ✅ Correct: `19876543210` (US)
- ❌ Wrong: `+91 9876543210`
- ❌ Wrong: `+91-98765-43210`

---

## Step 2: Quick Console Test

Before testing in the UI, let's test the functions directly in browser console.

### 2.1 Open Browser Console

1. Open admin panel in browser
2. Press `F12` (or Right-click → Inspect)
3. Go to "Console" tab

### 2.2 Test WhatsApp Link Generation

Paste this in console:

```javascript
// Import the function (if using modules)
const testPhone = '919876543210'; // USE YOUR REAL NUMBER
const testMessage = `
🚨 New Civic Report Assigned

Report ID: TEST123
Category: Road Issues
Severity: HIGH

📍 Location:
https://www.google.com/maps?q=40.7128,-74.0060

📝 Description:
This is a test message from CivicLens.

Please take action.
`;

// Generate link
const encodedMessage = encodeURIComponent(testMessage);
const cleanPhone = testPhone.replace(/\D/g, '');
const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

console.log('WhatsApp URL:', whatsappUrl);

// Try opening it
window.open(whatsappUrl, '_blank');
```

**Expected Result:**
- ✅ Console shows the WhatsApp URL
- ✅ New tab opens with WhatsApp Web/App
- ✅ Chat opens with the test number
- ✅ Message is pre-filled

**Troubleshooting:**
- ❌ "Number not found" → Check phone format
- ❌ "WhatsApp not opening" → Make sure you're logged into WhatsApp Web
- ❌ "Blocked popup" → Allow popups for localhost

---

## Step 3: Test Officer Service

### 3.1 Verify Officers Table

Run in Supabase SQL Editor:

```sql
-- Check if officers exist
SELECT * FROM officers WHERE active = true;

-- Check reports table has new columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name IN ('assigned_officer_id', 'assigned_at', 'assigned_by');
```

**Expected:**
- ✅ Shows 4 officers
- ✅ Shows 3 new columns

### 3.2 Test Assignment (Manual SQL)

```sql
-- Create a test assignment
UPDATE reports 
SET 
  assigned_officer_id = (SELECT id FROM officers LIMIT 1),
  assigned_at = NOW(),
  assigned_by = 'admin@test.com'
WHERE id = 'YOUR_REPORT_ID_HERE'  -- ⚠️ CHANGE THIS
RETURNING *;
```

**Expected:**
- ✅ Report updated successfully
- ✅ Shows officer_id, timestamp, admin email

---

## Step 4: Test in Admin Panel (Manual)

Since we haven't added the UI yet, test the functions manually:

### 4.1 Open ReportDetails Page

1. Login to admin panel
2. Go to "Issues"
3. Click any report to open details

### 4.2 Test in Browser Console

Open console (F12) and run:

```javascript
// Get officers list
const { getOfficers } = await import('/src/services/officerService');
const officers = await getOfficers();
console.log('Officers:', officers);

// Test assignment
const { assignOfficerToReport } = await import('/src/services/officerService');
const reportId = 'YOUR_REPORT_ID';  // Get from URL
const officerId = officers[0].id;
const success = await assignOfficerToReport(reportId, officerId, 'test@admin.com');
console.log('Assignment success:', success);

// Test WhatsApp
const { assignReportViaWhatsApp } = await import('/src/services/whatsappService');
const report = {
  id: reportId,
  title: 'Test Report',
  category: 'Road Issues',
  severity: 'High',
  description: 'Test description',
  location_name: '123 Main St',
  latitude: 40.7128,
  longitude: -74.0060,
  image_url: null,
  created_at: new Date().toISOString(),
};

assignReportViaWhatsApp(officers[0], report);
// ✅ WhatsApp should open!
```

---

## Step 5: Verify Full Flow

### 5.1 Check Assignment was Saved

Run in Supabase:

```sql
SELECT 
  r.id,
  r.title,
  r.assigned_officer_id,
  r.assigned_at,
  r.assigned_by,
  o.name as officer_name,
  o.phone as officer_phone
FROM reports r
LEFT JOIN officers o ON r.assigned_officer_id = o.id
WHERE r.assigned_officer_id IS NOT NULL
ORDER BY r.assigned_at DESC
LIMIT 5;
```

**Expected:**
- ✅ Shows assigned reports
- ✅ Shows officer name and phone
- ✅ Shows assignment timestamp

### 5.2 Check WhatsApp Message Format

After WhatsApp opens, verify the message contains:
- ✅ Report ID
- ✅ Title
- ✅ Category & Severity
- ✅ Location name
- ✅ Google Maps link (clickable)
- ✅ Description
- ✅ Image URL (if available)
- ✅ Professional formatting

---

## Expected Test Results

### ✅ SUCCESS Criteria:

1. **Database:**
   - Officers table created
   - 4 sample officers exist
   - Reports table has assignment columns

2. **Functions:**
   - `getOfficers()` returns officer list
   - `assignOfficerToReport()` saves assignment
   - `generateWhatsAppMessage()` creates formatted message
   - `generateWhatsAppLink()` creates valid URL

3. **WhatsApp:**
   - URL opens WhatsApp Web/App
   - Chat opens with correct number
   - Message is pre-filled and formatted
   - Google Maps link is clickable

4. **Database Tracking:**
   - Assignment saved in database
   - Timestamp recorded
   - Admin email recorded

---

## Troubleshooting Common Issues

### Issue 1: WhatsApp Not Opening

**Symptoms:** URL generated but nothing happens

**Solutions:**
- ✅ Allow popups for localhost
- ✅ Make sure WhatsApp Web is logged in
- ✅ Try copying URL and pasting in browser
- ✅ Check browser console for errors

### Issue 2: "Number not on WhatsApp"

**Symptoms:** WhatsApp says number doesn't exist

**Solutions:**
- ✅ Verify phone number format (no +, no spaces)
- ✅ Use a real WhatsApp number for testing
- ✅ Double-check country code

### Issue 3: Message Not Pre-filled

**Symptoms:** WhatsApp opens but message is empty

**Solutions:**
- ✅ Check URL encoding
- ✅ Message might be too long (WhatsApp limit)
- ✅ Special characters might break encoding

### Issue 4: Officers Not Loading

**Symptoms:** `getOfficers()` returns empty array

**Solutions:**
- ✅ Run SQL script to create table
- ✅ Check Supabase connection
- ✅ Verify RLS policies allow reading

### Issue 5: Assignment Not Saving

**Symptoms:** `assignOfficerToReport()` returns false

**Solutions:**
- ✅ Check RLS policies
- ✅ Verify columns exist in reports table
- ✅ Check admin has permission

---

## Test Checklist

Print this and check off as you test:

```
Database Setup:
[ ] CREATE_OFFICERS_TABLE.sql executed
[ ] Officers table exists
[ ] 4 sample officers created
[ ] Report assignment columns added
[ ] Officer phone numbers updated to real numbers

Function Tests:
[ ] getOfficers() returns officers
[ ] assignOfficerToReport() works
[ ] WhatsApp URL generates correctly
[ ] WhatsApp opens when URL is clicked

WhatsApp Tests:
[ ] Opens correct number
[ ] Message is pre-filled
[ ] Formatting is correct
[ ] Google Maps link works
[ ] Image URL included (if available)

Database Verification:
[ ] Assignment saved in database
[ ] Timestamp recorded correctly
[ ] Admin email recorded
[ ] Can query assigned reports
```

---

## Next Steps After Testing

Once all tests pass:
1. ✅ Backend is confirmed working
2. ✅ Ready to add UI components
3. ✅ Can implement assignment button + dialog

**After successful testing, we'll add:**
- Assignment button in ReportDetails
- Officer selection dialog
- Visual confirmation of assignment

---

## Quick Test Summary

**Fastest way to test everything:**

1. Run SQL script in Supabase ✅
2. Update one officer's phone to yours ✅
3. Open browser console in ReportDetails ✅
4. Run the test script from Step 4.2 ✅
5. Check if WhatsApp opens with message ✅

**If all 5 steps work → Backend is ready for UI!** 🎉
