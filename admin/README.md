# CivicLens Admin Web App

Production-ready admin dashboard for managing civic issues reported through the CivicLens mobile app.

## Features

- **Dashboard**: Real-time overview of all issues with statistics and recent activity
- **Issues Management**: View, filter, search, and update issue statuses
- **Analytics**: Interactive charts showing issue trends, category distribution, and resolution rates
- **Profile**: Admin profile with performance analytics and activity graphs
- **Categories**: Manage issue categories
- **Admins**: View and manage administrator accounts
- **Authentication**: Secure admin authentication via Clerk
- **Database**: Direct integration with Supabase for real-time data

## Setup Instructions

### 1. Database Setup

Run the SQL schema in your Supabase project:

```bash
# Navigate to your Supabase project dashboard
# Go to SQL Editor
# Copy and paste the contents of database-schema.sql
# Execute the SQL
```

### 2. Environment Variables

The admin app uses the same `.env` file as the mobile app (located in the project root):

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies

```bash
cd admin-web-app
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

The admin app will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

## Project Structure

```
admin-web-app/
├── src/
│   ├── components/
│   │   ├── dashboard/       # Dashboard-specific components
│   │   ├── layout/          # Layout components (Sidebar, etc.)
│   │   └── ui/              # Reusable UI components (shadcn/ui)
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication context
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client & types
│   │   └── utils.ts         # Utility functions
│   ├── pages/
│   │   ├── admin/           # Admin pages
│   │   └── auth/            # Authentication pages
│   ├── services/
│   │   ├── authService.ts   # Admin authentication
│   │   ├── categoryService.ts # Category management
│   │   └── issueService.ts  # Issue management
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── database-schema.sql      # Database schema
└── package.json
```

## Integration with Mobile App

The admin web app shares the same database and authentication system with the citizen mobile app:

- **Shared Database**: Both apps use the same Supabase database
- **Shared .env**: Both apps use the same environment variables
- **Real-time Sync**: Issues submitted from the mobile app appear instantly in the admin dashboard
- **No Separate Backend**: All API calls go directly to Supabase

## Key Features

### Issues Management
- View all issues with filtering by status, priority, and category
- Search issues by title, ID, or location
- Update issue status (Open → In Progress → Resolved)
- Delete issues
- View detailed issue information

### Analytics
- Monthly trend charts (reported vs resolved)
- Category distribution pie charts
- Issue status breakdown
- Performance metrics

### Profile
- Admin information and role
- Monthly resolution trend graph
- Issue status distribution chart
- Account settings

## Technologies

- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Recharts** for analytics graphs
- **Clerk** for authentication
- **Supabase** for database
- **React Router** for navigation
- **TanStack Query** for data fetching

## Authentication

Admins must sign up and be authenticated via Clerk. After signing up, admin accounts are stored in the `admins` table with role-based access control.

## Database Tables

- **issues**: All civic issues reported by citizens
- **admins**: Administrator accounts with roles
- **categories**: Issue categories for classification

## Support

For issues or questions, please refer to the main project documentation.
