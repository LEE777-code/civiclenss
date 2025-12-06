# Image Preview Troubleshooting Guide

## Issue: Image Not Visible in Preview

### Quick Checks:

1. **Open Browser Console (F12)**
   - Go to Preview page
   - Look for console logs:
     - "Image is a string:" → Image data is there
     - "No image provided:" → Image not being passed
   
2. **Check Yellow Debug Box**
   - Should appear on preview page
   - Shows:
     - Image type
     - Has image: Yes/No
     - Preview URL set: Yes/No
     - Image length

### Common Issues:

#### Issue 1: Image Not Being Passed
**Symptom:** Debug shows "Has image: No"

**Solution:** Check ReportIssue page
```typescript
// Make sure this is being called:
navigate("/issue-preview", { 
  state: { ...formData, image: selectedImage } 
});
```

#### Issue 2: Image is String But Not Displaying
**Symptom:** 
- Debug shows "Has image: Yes"
- Debug shows "Image length: XXXX chars"
- Still not visible

**Solution:** Base64 string might be incomplete
- Check if string starts with "data:image/"
- Open console and copy first 100 chars of image
- Should look like: `data:image/jpeg;base64,/9j/4AAQSkZJRg...`

#### Issue 3: Preview URL Not Set
**Symptom:** 
- Debug shows "Has image: Yes"
- Debug shows "Preview URL set: No"

**Solution:** useEffect not running
- Check console for errors
- Try refreshing page

### Testing Steps:

1. **Upload an Image:**
   ```
   Report Issue → Camera icon → Choose file
   ```

2. **Check It's Selected:**
   ```
   Should see preview thumbnail in ReportIssue page
   ```

3. **Navigate to Preview:**
   ```
   Click "Preview" button
   ```

4. **Check Debug Info:**
   ```
   Yellow box should show:
   - Image type: string
   - Has image: Yes
   - Preview URL set: Yes
   - Image length: >1000 chars
   ```

5. **Check Console:**
   ```
   Should see: "Image is a string: data:image/jpeg..."
   ```

### Manual Test:

Open browser console on Preview page and run:
```javascript
// Check formData
console.log('Form Data:', window.location.state);

// Check if base64 is valid
const img = new Image();
img.src = 'YOUR_BASE64_STRING_HERE';
img.onload = () => console.log('Image loaded successfully!');
img.onerror = () => console.log('Image failed to load');
```

### Fix Attempts:

#### Attempt 1: Clear LocalStorage
```javascript
localStorage.clear();
```
Then try uploading again.

#### Attempt 2: Hard Refresh
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

#### Attempt 3: Check File Size
Large images (>10MB) might not convert properly.
Try a smaller image (<5MB).

### What Should Work:

When you upload an image:
1. File is read as base64 (ReportIssue.tsx line 28-32)
2. Stored in `selectedImage` state
3. Passed to preview via navigate state
4. Picked up by formData.image
5. useEffect detects it's a string
6. Sets imagePreviewUrl
7. Img tag displays it

### Debug Output Examples:

**Working:**
```
Debug:
Image type: string
Has image: Yes
Preview URL set: Yes
Image length: 45678 chars
```

**Not Working (image not passed):**
```
Debug:
Image type: undefined
Has image: No
Preview URL set: Yes (sample image)
Image length: 
```

**Not Working (conversion failed):**
```
Debug:
Image type: string  
Has image: Yes
Preview URL set: No
Image length: 23 chars  ← Too short!
```

## Next Steps:

1. Check the yellow debug box
2. Check browser console
3. Share what you see

This will help identify the exact issue!
