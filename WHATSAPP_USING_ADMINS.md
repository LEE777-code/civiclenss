# Updated: Using Admins Table for Officer Assignment 📱

## Key Changes

Instead of creating a separate `officers` table, we're using your **existing `admins` table**!

**Why?**
- ✅ Avoids data duplication
- ✅ Admins table already has: `phone`, `department`, `name`, `email`
- ✅ Uses existing role hierarchy (state, district, local)
- ✅ Cleaner architecture

---

## Setup Steps

### Step 1: Add Assignment Tracking Columns

Run this SQL in Supabase:

```sql
-- Add assignment columns to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES admins(id),
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assigned_by TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_reports_assigned_admin ON reports(assigned_admin_id);
```

**That's it!** No new table needed.

### Step 2: Ensure Admins Have Phone Numbers

**Check which admins have phone numbers:**
```sql
SELECT name, email, phone, department, role
FROM admins
ORDER BY name;
```

**Add phone numbers to admins:**
```sql
-- Update specific admin's phone
UPDATE admins 
SET phone = '919876543210'  -- Your WhatsApp number
WHERE email = 'your-email@example.com';

-- Or update multiple
UPDATE admins 
SET phone = '919876543211'
WHERE name = 'Admin Name';
```

**Phone Format:** `{country_code}{number}` (no +, no spaces)
- India: `919876543210`
- US: `19876543210`

---

## How It Works Now

### Officer Selection

When admin clicks "Assign to Officer":
- Shows list of **admins with phone numbers**
- Displays: Name, Department, Role, State/District/Local
- Admin selects who to assign

### Assignment Process

1. Admin selects an admin from list
2. System saves `assigned_admin_id` to report
3. Generates WhatsApp message with report details
4. Opens WhatsApp with selected admin's phone
5. Admin sends message

### Database Tracking

```sql
-- See assignments
SELECT 
  r.title,
  r.assigned_at,
  r.assigned_by,
  a.name as assigned_to,
  a.phone as assigned_to_phone,
  a.department,
  a.role,
  a.state,
  a.district
FROM reports r
LEFT JOIN admins a ON r.assigned_admin_id = a.id
WHERE r.assigned_admin_id IS NOT NULL
ORDER BY r.assigned_at DESC;
```

---

## Benefits of Using Admins Table

### ✅ Role-Based Assignment

Can filter by role:
- **State Level:** Assign to state admins
- **District Level:** Assign to district admins
- **Local Level:** Assign to local body admins

```sql
-- Get only district admins with phones
SELECT * FROM admins 
WHERE phone IS NOT NULL 
AND role = 'district'
AND district = 'YourDistrict';
```

### ✅ Geographic Assignment

Can assign based on location:
```sql
-- Get admins in specific state
SELECT * FROM admins 
WHERE phone IS NOT NULL 
AND state = 'Karnataka';

-- Get admins in specific district
SELECT * FROM admins 
WHERE phone IS NOT NULL 
AND district = 'Bangalore'
AND role IN ('district', 'local');
```

### ✅ Department-Based Assignment

```sql
-- Get admins from specific department
SELECT * FROM admins 
WHERE phone IS NOT NULL 
AND department = 'Public Works';
```

---

## Testing

### Quick Test:

1. **Add phone to your admin account:**
   ```sql
   UPDATE admins 
   SET phone = 'YOUR_WHATSAPP_NUMBER'
   WHERE email = 'YOUR_EMAIL';
   ```

2. **Verify:**
   ```sql
   SELECT name, phone, department FROM admins WHERE phone IS NOT NULL;
   ```

3. **Test in console:**
   ```javascript
   const { getOfficers } = await import('/src/services/officerService');
   const officers = await getOfficers();
   console.log('Available Officers:', officers);
   ```

**Expected:** Should see your admin in the list!

---

## Example WhatsApp Message

When assigning to an admin:

```
🚨 New Civic Report Assigned

Report ID: abc12345
Title: Broken Street Light
Category: Road Issues
Severity: HIGH
Reported: 12/6/2025, 1:14 PM

📍 Location:
MG Road, Bangalore
https://www.google.com/maps?q=12.9716,77.5946

📝 Description:
Street light not working at main junction...

🖼 Image:
https://...

👤 Assigned by: admin@city.gov

⚠️ Please take immediate action.

_This is an automated message from CivicLens Admin Panel._
```

---

## Updated File Structure

**Modified Files:**
- ✅ `officerService.ts` - Now queries `admins` table
- ✅ `CREATE_OFFICERS_TABLE.sql` - Now just adds assignment columns
- ✅ `whatsappService.ts` - No changes (still works same way)

**No Separate Officers Table Needed!** 🎉

---

## Sample Test Queries

### Add phone to current admin:
```sql
-- If you logged in as admin@example.com
UPDATE admins 
SET phone = '919876543210',
    department = 'Public Works'
WHERE email = 'admin@example.com';
```

### Create test assignment:
```sql
-- Assign report to specific admin
UPDATE reports 
SET 
  assigned_admin_id = (SELECT id FROM admins WHERE email = 'admin@example.com'),
  assigned_at = NOW(),
  assigned_by = 'test.admin@example.com'
WHERE id = 'YOUR_REPORT_ID';
```

### View assignments:
```sql
SELECT 
  r.id,
  r.title,
  a.name as assigned_to,
  a.phone,
  a.department,
  a.role,
  r.assigned_at
FROM reports r
JOIN admins a ON r.assigned_admin_id = a.id
WHERE r.assigned_admin_id IS NOT NULL
ORDER BY r.assigned_at DESC
LIMIT 10;
```

---

## Ready to Test!

1. ✅ Run the SQL to add columns
2. ✅ Add phone number to at least one admin
3. ✅ Test `getOfficers()` in console
4. ✅ Ready for UI!

**Much simpler than creating a separate table!** 🚀
