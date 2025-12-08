# 🏛️ CivicLens

**AI-Powered Civic Issue Reporting Platform**

CivicLens is a modern, intelligent platform for reporting and managing civic issues. Using advanced AI technology, it makes reporting civic problems faster, easier, and more accurate than ever before.

---

## ✨ Key Features

### 🤖 AI-Powered Image Analysis
Upload a photo of a civic issue and watch as AI automatically:
- Generates detailed descriptions
- Suggests appropriate titles
- Recommends relevant categories
- **Powered by Google Gemini 2.0 Flash (Latest Model)**

### 📱 Mobile-First Design
- Responsive design optimized for mobile devices
- Native-like experience with smooth animations
- Swipe gestures and touch-optimized controls
- PWA ready for installation on home screen

### 📍 Location-Based Reporting
- Interactive map for selecting issue locations
- GPS-based automatic location detection
- View nearby reported issues
- Track issues in your neighborhood

### 👥 User & Admin Interfaces
- **Citizen App**: Easy issue submission and tracking
- **Admin Dashboard**: Comprehensive management tools
- Real-time updates and notifications
- Report status tracking

### 🔐 Secure & Private
- Clerk authentication for secure access
- Anonymous reporting option
- Supabase backend for data security
- Privacy-first architecture

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Google Gemini API key (free tier available)
- Supabase account (free tier available)
- Clerk account for authentication (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CivicLens
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_VISION_MODEL=gemini-2.0-flash-exp
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

---

## 🔑 Getting API Keys

### Google Gemini API (Free)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy the key and add to `.env`

**Free Tier Limits:**
- 60 requests per minute
- 1,500 requests per day
- Perfect for development and light production use

### Supabase Setup

1. Create account at [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings > API
4. Copy your project URL and anon key
5. Add to `.env`

See `database-schema-reports.sql` for database schema setup.

---

## 📂 Project Structure

```
CivicLens/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   │   ├── Home.tsx
│   │   ├── ReportIssue.tsx  # AI-powered issue reporting
│   │   ├── MyReports.tsx
│   │   └── ...
│   ├── services/       # API services
│   │   ├── geminiVision.ts  # AI image analysis
│   │   ├── pdfService.ts
│   │   └── WeatherService.ts
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and helpers
│   └── App.tsx
├── admin/              # Admin dashboard
│   └── src/
│       └── pages/
│           └── admin/
├── backend/            # Backend services
├── public/             # Static assets
├── .env.example        # Environment variables template
└── package.json
```

---

## 🎨 Technology Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type safety
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **Framer Motion** - Smooth animations
- **React Router** - Client-side routing
- **Leaflet** - Interactive maps

### AI & Backend
- **Google Gemini 2.0 Flash** - Vision AI
- **Supabase** - Backend as a Service
- **Clerk** - Authentication
- **React Query** - Data fetching

### Developer Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TS linting
- **Prettier** - Code formatting (recommended)

---

## 🤖 AI Features Deep Dive

### Image Analysis

When a user uploads a civic issue photo, the AI:

1. **Analyzes the image** using Google Gemini Vision API
2. **Identifies the issue type** (pothole, garbage, streetlight, etc.)
3. **Assesses severity** and environmental factors
4. **Generates a description** optimized for municipal authorities
5. **Suggests a title** (concise, max 8 words)
6. **Recommends a category** from predefined options

### Categories Supported

- Road Issues
- Garbage & Cleanliness
- Water / Drainage
- Streetlight / Electricity
- Public Safety
- Public Facilities
- Parks & Environment
- Other

### Technical Implementation

The AI service (`src/services/geminiVision.ts`) provides three async functions:

```typescript
// Generate detailed description
await generateImageDescription(imageData)

// Generate concise title
await generateImageTitle(imageData)

// Suggest appropriate category
await suggestCategory(imageData)
```

All three run **in parallel** for maximum speed!

For complete details, see [`AI_IMAGE_DESCRIPTION_DOCUMENTATION.md`](./AI_IMAGE_DESCRIPTION_DOCUMENTATION.md)

---

## 🎯 User Journey

### Reporting an Issue

1. **Tap "Report Issue"** from home screen
2. **Upload Photo** - take new or choose from gallery
3. **AI Analysis** - watch as AI auto-fills details (2-3 seconds)
4. **Review & Edit** - adjust AI suggestions if needed
5. **Set Location** - pin exact location on map
6. **Choose Severity** - Low, Medium, or High
7. **Preview** - review before submission
8. **Submit** - issue sent to administrators

### Tracking Issues

- View **"My Reports"** to see your submissions
- Check **real-time status** updates
- View **officer assignments**
- Receive **notifications** on progress

---

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build with development mode (for testing)
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Admin Dashboard

```bash
cd admin
npm install
npm run dev
```

### Backend Services

```bash
cd backend
npm install
npm run dev
```

---

## 🌐 Deployment

### Frontend (Vercel/Netlify)

1. Connect your Git repository
2. Set environment variables in dashboard
3. Deploy!

**Build Command**: `npm run build`  
**Output Directory**: `dist`

### Database (Supabase)

1. Run SQL schemas from `database-schema-*.sql` files
2. Set up Row Level Security (RLS) policies
3. Configure authentication providers

---

## 📊 Database Schema

Key tables:
- `reports` - Civic issue reports
- `officers` - Municipal officers
- `assignments` - Report assignments to officers
- Admin tracking tables

See `database-schema-reports.sql` and `CREATE_OFFICERS_TABLE.sql` for full schema.

---

## 🔒 Security Considerations

### API Keys

- ✅ Never commit `.env` to version control
- ✅ Use environment variables for all secrets
- ✅ Rotate API keys regularly
- ✅ Use different keys for dev/staging/production

### Data Privacy

- ✅ Anonymous reporting supported
- ✅ Minimal PII collection
- ✅ Secure image handling (HTTPS only)
- ✅ RLS policies on database

---

## 🐛 Troubleshooting

### AI Not Working

**Issue**: "Gemini API key is not configured"

**Fix**:
1. Check `.env` file exists
2. Verify `VITE_GEMINI_API_KEY` is set
3. Restart dev server (Vite requires restart for env changes)

---

### Build Errors

**Issue**: TypeScript errors during build

**Fix**:
```bash
# Check for lint errors
npm run lint

# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### Database Connection Issues

**Issue**: Can't connect to Supabase

**Fix**:
1. Verify Supabase URL and key in `.env`
2. Check Supabase project status
3. Verify network connectivity
4. Check browser console for CORS errors

---

## 📚 Documentation

- [AI Image Analysis Documentation](./AI_IMAGE_DESCRIPTION_DOCUMENTATION.md)
- [Complete Implementation Summary](./COMPLETE_IMPLEMENTATION_SUMMARY.md)
- Database schemas in root directory

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests if applicable
5. Submit a pull request

---

## 📝 License

[Add your license here]

---

## 🙏 Acknowledgments

- **Google Gemini** for powerful vision AI
- **Supabase** for backend infrastructure  
- **shadcn/ui** for beautiful components
- **OpenStreetMap** for mapping data

---

## 📧 Support

For questions or issues:
- Open a GitHub issue
- Contact the development team
- Check documentation files

---

## 🎉 What's New

### Version 2.0 (Latest)

✨ **NEW: AI-Powered Image Analysis**
- Automatic description generation
- Smart title suggestions
- Category recommendations
- Powered by Gemini 2.0 Flash

🚀 **Performance Improvements**
- Parallel AI processing
- Optimized image handling
- Faster loading times

💅 **UI Enhancements**
- Beautiful AI analyzing indicator
- Smooth animations
- Better mobile experience

---

**Made with ❤️ for better civic engagement**
