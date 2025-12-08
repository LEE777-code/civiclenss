# Quick Start Guide: AI Image Description

## For Users

### How to Use the AI Feature

1. **Navigate to Report Issue**
   - Open CivicLens app
   - Tap "Report Issue" button

2. **Upload a Photo**
   - Tap the camera icon
   - Choose "Take Photo" or "Choose from Gallery"
   - Select a clear image of the civic issue

3. **Wait for AI Magic** ✨
   - You'll see: "🤖 Analyzing image with AI..."
   - Takes just 2-3 seconds
   - Form fields will be disabled during analysis

4. **Review Auto-Generated Content**
   - **Title**: Check if the suggested title is accurate
   - **Description**: Review the AI-generated description
   - **Category**: Verify the recommended category is correct

5. **Edit If Needed**
   - All fields are fully editable
   - Make any corrections or additions
   - Add more details if you want

6. **Continue as Normal**
   - Set location
   - Choose severity
   - Preview and submit

### Tips for Best Results

✅ **DO:**
- Take clear, well-lit photos
- Make sure the issue fills most of the frame
- Use good resolution images
- Take photos during daylight if possible

❌ **DON'T:**
- Upload very dark or overexposed images
- Take blurry photos
- Capture from too far away
- Use images where the issue is unclear

### What If AI Fails?

No worries! If AI analysis fails:
- You'll see an error message
- All form fields remain editable
- Just fill in the details manually
- Your report will work exactly the same

---

## For Developers

### Environment Setup

1. **Get Gemini API Key**
   ```bash
   # Visit: https://makersuite.google.com/app/apikey
   # Sign in and create API key
   ```

2. **Configure .env**
   ```env
   VITE_GEMINI_API_KEY=AIzaSy...your-key-here
   VITE_VISION_MODEL=gemini-2.0-flash-exp
   ```

3. **Restart Dev Server**
   ```bash
   # IMPORTANT: Vite requires restart for env changes
   npm run dev
   ```

### Testing

```typescript
// Test the service directly
import { generateImageDescription } from '@/services/geminiVision'

const imageData = 'data:image/jpeg;base64,...'
const description = await generateImageDescription(imageData)
console.log(description)
```

### API Usage Limits

**Free Tier (Google Gemini):**
- 60 requests per minute
- 1,500 requests per day

**Monitor Usage:**
- Check [Google AI Studio](https://makersuite.google.com/)
- View API usage in dashboard
- Set up alerts for quota limits

### Error Handling

The service handles these errors gracefully:
- Invalid API key → User-friendly message
- Network errors → "Try again" message
- Empty responses → Fallback to manual entry
- Rate limiting → Clear error message

### Customization

Want to customize AI prompts?

Edit `src/services/geminiVision.ts`:

```typescript
// For description generation
const prompt = `Your custom prompt here...`

// For title generation
const prompt = `Your custom title prompt...`

// For category suggestion
const prompt = `Your custom category prompt...`
```

---

## Troubleshooting

### "API Key Not Configured"

**Problem**: Error message about missing API key

**Solution**:
```bash
# 1. Check .env file exists
ls -la .env

# 2. Verify content
cat .env | grep VITE_GEMINI

# 3. Restart dev server
npm run dev
```

### AI Takes Too Long

**Problem**: Analysis timeout or very slow

**Causes**:
- Slow internet connection
- Large image file (> 5MB)
- API rate limiting

**Solutions**:
- Check internet speed
- Compress images before upload
- Wait a minute if rate limited

### Wrong Categories

**Problem**: AI suggests wrong category

**Why**: AI isn't perfect, especially for unusual issues

**Solution**: User can easily change the category

### Generic Descriptions

**Problem**: Description is too vague

**Why**: Photo quality or unclear issue

**Solution**: 
- Encourage users to edit
- Provide tips for better photos
- AI serves as starting point only

---

## Advanced Usage

### Batch Processing

For testing multiple images:

```typescript
const images = [image1, image2, image3]

const results = await Promise.all(
  images.map(async (img) => ({
    description: await generateImageDescription(img),
    title: await generateImageTitle(img),
    category: await suggestCategory(img)
  }))
)
```

### Custom Workflows

Integrate AI in other parts of the app:

```typescript
// In admin dashboard for verification
const aiDescription = await generateImageDescription(reportImage)
if (userDescription === aiDescription) {
  // High confidence in report accuracy
}

// For report categorization
const suggestedCategory = await suggestCategory(image)
// Use for automatic routing
```

---

## API Reference

### `generateImageDescription(imageData: string): Promise<string>`

Generates detailed 2-3 sentence description.

**Parameters:**
- `imageData`: Base64 encoded image data URL

**Returns:**
- Promise resolving to description string

**Throws:**
- Error if API key missing
- Error if network fails
- Error if response empty

### `generateImageTitle(imageData: string): Promise<string>`

Generates concise title (max 8 words).

**Parameters:**
- `imageData`: Base64 encoded image data URL

**Returns:**
- Promise resolving to title string

**Throws:**
- Error if API key missing
- Error if network fails
- Error if response empty

### `suggestCategory(imageData: string): Promise<string>`

Suggests category from predefined list.

**Parameters:**
- `imageData`: Base64 encoded image data URL

**Returns:**
- Promise resolving to category string
- Falls back to "Other" if uncertain

**Throws:**
- Returns "Other" on any error (graceful)

---

## Performance Metrics

Typical performance (good internet):
- **Description**: 1-2 seconds
- **Title**: 1-2 seconds  
- **Category**: 1-2 seconds
- **Total (parallel)**: ~2 seconds

Network impact:
- Image size: Varies (typically < 2MB)
- API request: ~50-100KB
- Response: ~500 bytes

---

## Privacy & Security

### Data Flow

1. User uploads image → Base64 in browser
2. Base64 sent to Gemini API over HTTPS
3. AI processes and returns text
4. No image stored on CivicLens servers

### Google's Privacy

- Images processed by Google Gemini
- Subject to [Google's Privacy Policy](https://policies.google.com/privacy)
- Not used for training (as per API terms)
- Encrypted in transit

### User Control

- Users can see AI is being used (transparent)
- Can edit all AI-generated content
- Can opt to upload without using AI (future feature)
- Anonymous reporting still supported

---

## Future Roadmap

Planned enhancements:

- [ ] **Severity Detection**: Auto-detect Low/Medium/High
- [ ] **Multi-Image Analysis**: Analyze multiple angles
- [ ] **Location Extraction**: Get location from EXIF data
- [ ] **Offline Support**: Cache for offline editing
- [ ] **Language Support**: Multi-language descriptions
- [ ] **Admin Prompts**: Let admins customize AI behavior

---

## Support

Questions? Check:
- [Full Documentation](./AI_IMAGE_DESCRIPTION_DOCUMENTATION.md)
- [README](./README.md)
- [Source Code](./src/services/geminiVision.ts)

---

**Happy Reporting! 🎉**
