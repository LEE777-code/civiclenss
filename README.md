# CivicLens - Crowdsourced Issue Reporting System

A comprehensive civic engagement platform connecting citizens and government administrators for efficient issue reporting and resolution.

## Project Structure

```
CivicLens/
├── admin/              # Admin Web App (Under Reconstruction)
├── src/                # Citizen Mobile App (React + Vite + TypeScript)
└── README.md
```

## Applications

### 1. Citizen Mobile App (`/src`) ✅ ACTIVE
Mobile-friendly web application for citizens to:
- Report civic issues with photos and location
- Track issue status
- View nearby issues
- Manage profile

**Tech Stack**: React, Vite, TypeScript, Clerk Auth, Supabase

**Run**: `npm run dev` (Port 5173)

### 2. Admin Web App (`/admin`) 🚧 UNDER RECONSTRUCTION
Dashboard for government administrators - currently being rebuilt from scratch.

**Status**: Clean minimal structure ready for UI redesign
**Tech Stack**: React, Vite, TypeScript, Tailwind CSS

**Run**: `cd admin && npm run dev` (Port 5174)

> [!NOTE]
> The admin app has been reset to a minimal structure and is ready for a fresh UI redesign. All previous pages, components, and services have been removed.

### 3. Backend API Server ❌ REMOVED
The backend server has been completely removed from this project. The mobile app connects directly to Supabase.

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Clerk account

### 1. Set Up Mobile App

```bash
npm install
# Update .env with Supabase and Clerk credentials
npm run dev
```

### 2. Set Up Admin App (Optional - Under Reconstruction)

```bash
cd admin
npm install
# Admin app is currently a minimal shell ready for redesign
npm run dev
```

> [!WARNING]
> The backend server and database setup instructions have been removed as the server folder no longer exists. The mobile app connects directly to Supabase.

## Environment Variables

### Mobile App (`.env`)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key

### Admin App (`admin/.env`) - Under Reconstruction
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- Additional variables TBD during redesign

## Development Workflow

1. Start mobile app: `npm run dev`
2. (Optional) Start admin app: `cd admin && npm run dev`
3. Access apps:
   - Mobile: http://localhost:5173
   - Admin: http://localhost:5174

> [!NOTE]
> The backend API server is no longer part of this project. The mobile app connects directly to Supabase for all data operations.

## License

MIT
