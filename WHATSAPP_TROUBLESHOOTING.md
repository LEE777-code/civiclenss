# 🔍 WhatsApp Troubleshooting Guide

## ✅ Code Verification - All Correct!

I've checked the WhatsApp implementation and **everything is correctly coded**:

✅ WhatsApp service properly generates messages  
✅ Google Maps links included (when coordinates available)  
✅ Phone number cleaning works correctly  
✅ URL encoding handles special characters  
✅ Assignment handler calls service properly  

---

## 🧪 Common Issues & Solutions

### Issue 1: WhatsApp Not Opening

**Symptoms:**
- Click "Assign via WhatsApp"
- Select officer
- Click "Send via WhatsApp"
- Nothing happens OR error occurs

**Possible Causes:**

#### A) Popup Blocked
**Solution:**
1. Check browser's address bar for popup icon
2. Click and allow popups for localhost
3. Try again

#### B) No Phone Number
**Solution:**
```sql
-- Check if officer has phone number
SELECT name, email, phone FROM admins WHERE phone IS NOT NULL;

-- Add phone if missing
UPDATE admins 
SET phone = '919876543210'  -- Your WhatsApp number
WHERE email = 'officer@example.com';
```

#### C) Invalid Phone Format
**Solution:**
- ✅ Correct: `919876543210` (country code + number, no spaces)
- ❌ Wrong: `+91 98765 43210`
- ❌ Wrong: `+91-9876543210`
- ❌ Wrong: `9876543210` (missing country code)

---

### Issue 2: WhatsApp Opens But Message is Garbled

**Symptoms:**
- WhatsApp opens successfully
- Message is unreadable or has strange characters

**Possible Causes:**

#### A) Special Characters in Report
**Solution:** Already handled! The code uses `encodeURIComponent()` which escapes special characters properly.

#### B) Emoji Issues
**Status:** ✅ Emojis work correctly in WhatsApp!

---

### Issue 3: "Location not available" Shows

**Symptoms:**
- Message says "Location not available" instead of Google Maps link

**Cause:**
- Report doesn't have latitude/longitude in database

**Solutions:**

#### For New Reports:
1. Make sure to use "Choose Location" feature
2. Click on map OR use "Current Location"
3. Confirm location before submitting

#### For Old Reports:
```sql
-- Check if report has coordinates
SELECT id, title, latitude, longitude 
FROM reports 
WHERE id = 'your-report-id';

-- If null, you can update manually if you know coordinates
UPDATE reports 
SET latitude = 13.0827, longitude = 80.2707
WHERE id = 'your-report-id';
```

---

### Issue 4: Number Not on WhatsApp

**Symptoms:**
- WhatsApp opens
- Says "Number not on WhatsApp" or "Invalid number"

**Solutions:**

1. **Verify phone number has WhatsApp:**
   - Test by manually messaging the number
   - Make sure it's the correct number

2. **Check country code:**
   - India: `91`
   - US: `1`
   - UK: `44`
   - Format: `{code}{number}` (e.g., `919876543210`)

3. **Update admin's phone:**
```sql
UPDATE admins 
SET phone = '919876543210'  -- Verified WhatsApp number
WHERE id = 'admin-id';
```

---

### Issue 5: Browser Console Errors

**How to Check:**
1. Press `F12` in browser
2. Go to "Console" tab
3. Click "Assign via WhatsApp"
4. Check for red error messages

**Common Errors:**

#### "selectedOfficer is undefined"
**Solution:** Make sure to click an officer card to select before clicking send

#### "report.latitude is undefined"
**Solution:** This is OK if report doesn't have coordinates - it will show "Location not available"

#### "window.open blocked"
**Solution:** Allow popups for localhost

---

## 🧪 Step-by-Step Testing

### Test 1: Basic Functionality

```
1. Open admin panel
2. Go to any report
3. Click "Assign to Officer" section
4. Click "Assign via WhatsApp"
   ✅ Dialog should open
5. Click an officer card
   ✅ Card should highlight/checkmark
6. Click "Send via WhatsApp" button
   ✅ WhatsApp should open

Expected: WhatsApp Web/App opens with pre-filled message
```

### Test 2: Message Content

Check if message includes:
- ✅ Report ID
- ✅ Title
- ✅ Category
- ✅ Severity
- ✅ Location name
- ✅ Google Maps link (if coordinates available)
- ✅ Description
- ✅ Image URL (if available)

### Test 3: Google Maps Link

```
1. Assign a report WITH coordinates
2. Check WhatsApp message
3. Find Google Maps URL
4. Click it
   ✅ Should open Google Maps
   ✅ Should show correct pin location
```

---

## 💡 Debug Mode

### Enable Console Logging

Add this to browser console while testing:

```javascript
// Monitor WhatsApp service
console.log('WhatsApp Service Test');

// Test message generation
import { generateWhatsAppMessage } from '/src/services/whatsappService';

const testReport = {
  id: 'test123',
  title: 'Test Report',
  category: 'Road Issues',
  severity: 'High',
  description: 'Test description',
  location_name: 'Test Location',
  latitude: 12.9716,
  longitude: 77.5946,
  image_url: null,
  created_at: new Date().toISOString()
};

const message = generateWhatsAppMessage(testReport);
console.log('Generated Message:', message);

// Test URL generation
import { generateWhatsAppLink } from '/src/services/whatsappService';
const url = generateWhatsAppLink('919876543210', message);
console.log('WhatsApp URL:', url);
```

---

## 📱 Phone Number Format Guide

### Correct Formats:

| Country | Code | Example | Full Number |
|---------|------|---------|-------------|
| India | 91 | 9876543210 | 919876543210 |
| US | 1 | 5551234567 | 15551234567 |
| UK | 44 | 7700900123 | 447700900123 |
| UAE | 971 | 501234567 | 971501234567 |

### How to Store:

```sql
-- In admins table, phone column:
UPDATE admins SET phone = '919876543210';  -- No +, no spaces, no dashes
```

---

## ✅ Verification Checklist

Run through this checklist:

```
Database:
[ ] Admins table has phone column
[ ] At least one admin has phone number
[ ] Phone number format is correct (no +, no spaces)
[ ] Phone number includes country code

Frontend:
[ ] Admin panel loads without errors
[ ] Can open report details
[ ] "Assign to Officer" section visible
[ ] "Assign via WhatsApp" button works
[ ] Officer dialog opens
[ ] Can select officer
[ ] "Send via WhatsApp" button enabled when officer selected

Browser:
[ ] Popups allowed for localhost
[ ] No console errors
[ ] WhatsApp Web is logged in (desktop)
[ ] WhatsApp app installed (mobile)

Message:
[ ] Message appears in WhatsApp
[ ] All fields populated correctly
[ ] Google Maps link appears (if coordinates available)
[ ] Link is clickable
[ ] Formatting is correct
```

---

## 🆘 Still Not Working?

### Collect This Information:

1. **What happens when you click "Send via WhatsApp"?**
   - Nothing
   - Error message (what does it say?)
   - WhatsApp opens but wrong number
   - Message is garbled

2. **Browser console errors:**
   - Press F12
   - Copy any red error messages

3. **Officer phone number:**
   ```sql
   SELECT phone FROM admins WHERE id = 'selected-officer-id';
   ```

4. **Report coordinates:**
   ```sql
   SELECT latitude, longitude FROM reports WHERE id = 'report-id';
   ```

### Quick Test:

Try this direct link in browser:
```
https://wa.me/919876543210?text=Test%20from%20CivicLens
```

Replace `919876543210` with officer's phone number.

**If this works:** Problem is in the code  
**If this doesn't work:** Problem is with WhatsApp/phone number

---

## 📊 Working Example

**Database:**
```
admins table:
ID    | name      | email            | phone
123   | John Doe  | john@example.com | 919876543210
```

**Report:**
```
reports table:
ID    | title     | latitude | longitude
456   | Pothole   | 12.9716  | 77.5946
```

**Result:**
```
WhatsApp opens with:

🚨 New Civic Report Assigned

Report ID: 456
Title: Pothole
Category: Road Issues
Severity: HIGH

📍 Location:
MG Road, Bangalore
https://www.google.com/maps?q=12.9716,77.5946

...
```

---

## ✅ Summary

**The code is correct!** ✅

Common issues are usually:
1. Phone number format (most common)
2. Browser blocking popups
3. Missing coordinates in old reports
4. Phone number not on WhatsApp

**Test with a new report that has coordinates for best results!**

---

**Everything should work! If still having issues, share specific error messages!** 🚀
