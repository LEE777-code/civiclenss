# Troubleshooting "Viewed by Admin" Status Not Updating

## Issue
Admin views a report but the "Viewed by Admin" status doesn't appear on the client side.

## Checklist to Fix

### ✅ Step 1: Verify Database Columns Exist

**Run this in Supabase SQL Editor:**

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'reports' 
AND column_name IN ('viewed_by_admin', 'admin_viewed_at', 'resolved_by');
```

**Expected Result:** Should show 3 rows

**If empty, run this:**
```sql
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS viewed_by_admin BOOLEAN DEFAULT FALSE;

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS admin_viewed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS resolved_by TEXT;

CREATE INDEX IF NOT EXISTS idx_reports_viewed_by_admin ON reports(viewed_by_admin);
```

### ✅ Step 2: Enable Supabase Realtime

**In Supabase Dashboard:**
1. Go to **Database** → **Replication**
2. Find the `reports` table
3. Make sure **Realtime** is **enabled** ✅

### ✅ Step 3: Check RLS Policies

**Run this to verify policies allow SELECT:**
```sql
-- Check RLS policies for reports table
SELECT * FROM pg_policies WHERE tablename = 'reports';
```

**Make sure there's a policy like:**
```sql
CREATE POLICY "Anyone can view reports" ON reports 
FOR SELECT USING (true);
```

### ✅ Step 4: Test the markAsViewedByAdmin Function

**In Supabase SQL Editor:**
```sql
-- Manually mark a report as viewed
UPDATE reports 
SET viewed_by_admin = true, 
    admin_viewed_at = NOW()
WHERE id = 'your-report-id-here';

-- Verify it worked
SELECT id, title, viewed_by_admin, admin_viewed_at 
FROM reports 
WHERE id = 'your-report-id-here';
```

### ✅ Step 5: Check Browser Console

**On Admin Side:**
1. Open admin dashboard
2. Press F12 (open DevTools)
3. Go to Console tab
4. Click "View Details" on a report
5. Look for: "Marking as viewed" or similar logs

**On Client Side:**
1. Open citizen app viewing the same report
2. Press F12
3. Look for: "Report updated:" log
4. Should see the payload with new data

### ✅ Step 6: Verify Real-time Connection

**In browser console, run:**
```javascript
// Check if Supabase realtime is connected
console.log('Checking realtime status...');
```

**Look in Network tab:**
- Filter by "WS" (WebSocket)
- Should see connection to Supabase
- Status should be "101 Switching Protocols"

## Testing Procedure

### Complete End-to-End Test:

**Setup:**
1. Have both admin and client apps open
2. Client viewing a specific report details page
3. Admin on dashboard

**Test Steps:**

```
Step 1: Client Side
- Open http://localhost:8080
- Navigate to "My Reports"
- Click on a report
- Note: "Not yet viewed" badge

Step 2: Admin Side  
- Open http://localhost:5173 (or admin port)
- Log in as admin
- Go to "Issues" page
- Find the same report
- Click "View Details"

Step 3: Check Client Side
- DON'T refresh the page
- Watch for "Viewed by Admin" badge to appear
- Should appear within 1-2 seconds
```

## Common Issues & Solutions

### Issue 1: Columns Don't Exist
**Symptom:** SQL errors in console
**Solution:** Run the ALTER TABLE commands above

### Issue 2: Realtime Not Enabled
**Symptom:** No WebSocket connection
**Solution:** Enable in Supabase Dashboard → Database → Replication

### Issue 3: RLS Blocking Updates
**Symptom:** Updates don't save
**Solution:** Check RLS policies allow UPDATE

### Issue 4: Real-time Subscription Not Working
**Symptom:** No console log "Report updated:"
**Solution:** 
```typescript
// Check channel is subscribed
const channel = supabase.channel(`report-${id}`);
console.log('Channel state:', channel.state);
// Should be 'joined'
```

### Issue 5: Wrong Report ID
**Symptom:** Updates go to different report
**Solution:** Verify IDs match between admin and client

### Issue 6: Cache Issue
**Symptom:** Old data showing
**Solution:** 
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check Network tab for fresh API calls

## Debugging Commands

### Check Realtime Subscription Status

**In browser console (client side):**
```javascript
// This will show all active subscriptions
supabase.getChannels().forEach(channel => {
  console.log('Channel:', channel.topic, 'State:', channel.state);
});
```

### Manual Test Update

**In Supabase SQL Editor:**
```sql
-- Update a specific report
UPDATE reports 
SET viewed_by_admin = true,
    admin_viewed_at = NOW()
WHERE title LIKE '%test%';

-- Then check if client updates
```

### Check Network Activity

**In browser DevTools:**
1. Network tab
2. Filter: "reports"
3. Should see:
   - Initial SELECT query
   - WebSocket messages when updates occur

## Expected Console Output

### Admin Side (when viewing report):
```
Fetching report: abc-123
Marking as viewed: abc-123
Report fetched successfully
```

### Client Side (when admin views):
```
Real-time update received: {
  eventType: 'UPDATE',
  new: {
    id: 'abc-123',
    viewed_by_admin: true,
    admin_viewed_at: '2025-12-06T04:29:15.000Z',
    ...
  },
  old: {
    id: 'abc-123',
    viewed_by_admin: false,
    ...
  }
}
Refetching report data...
```

## Quick Fix Script

**If nothing works, try this:**

```sql
-- 1. Drop and recreate columns
ALTER TABLE reports DROP COLUMN IF EXISTS viewed_by_admin;
ALTER TABLE reports DROP COLUMN IF EXISTS admin_viewed_at;
ALTER TABLE reports DROP COLUMN IF EXISTS resolved_by;

-- 2. Add them back
ALTER TABLE reports ADD COLUMN viewed_by_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE reports ADD COLUMN admin_viewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE reports ADD COLUMN resolved_by TEXT;

-- 3. Update existing reports
UPDATE reports SET viewed_by_admin = FALSE WHERE viewed_by_admin IS NULL;

-- 4. Verify
SELECT id, viewed_by_admin, admin_viewed_at FROM reports LIMIT 5;
```

## Contact Points for Debugging

1. **Database Issue?** → Check Supabase logs
2. **Realtime Issue?** → Check WebSocket in Network tab
3. **Code Issue?** → Check browser console
4. **Cache Issue?** → Clear cache and hard refresh

## Success Criteria

✅ SQL query shows columns exist
✅ Realtime enabled in Supabase
✅ WebSocket connected (check Network tab)
✅ "Report updated:" appears in client console
✅ "Viewed by Admin" badge appears within 1-2 seconds
✅ No SQL errors in console
✅ Manual UPDATE query triggers client update

---

## Still Not Working?

If you've tried everything above:

1. **Restart dev servers:**
   ```bash
   # Kill all servers
   # Restart client
   cd CivicLens
   npm run dev
   
   # Restart admin
   cd admin
   npm run dev
   ```

2. **Check Supabase service status:**
   - Is Supabase online?
   - Any rate limiting?

3. **Try different browser:**
   - Sometimes websockets are blocked
   - Try Chrome/Firefox/Edge

4. **Check .env files:**
   - Same Supabase URL in both apps?
   - Same anon key?

5. **Enable verbose logging:**
   ```typescript
   // Add to your code temporarily
   supabase.realtime.setAuth('your-token');
   console.log('Supabase config:', supabase.supabaseUrl);
   ```
