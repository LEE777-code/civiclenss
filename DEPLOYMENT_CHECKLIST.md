# CivicLens Admin - Deployment Checklist

Use this checklist to ensure everything is set up correctly before deploying to production.

## ✅ Pre-Deployment Checklist

### 1. Database Setup
- [ ] Supabase project created
- [ ] `database-schema.sql` executed successfully
- [ ] Tables verified: `issues`, `admins`, `categories`
- [ ] Default categories inserted (6 categories)
- [ ] Row Level Security (RLS) enabled
- [ ] Indexes created for performance

### 2. Environment Variables
- [ ] `.env` file exists in project root
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` is set
- [ ] `VITE_SUPABASE_URL` is set
- [ ] `VITE_SUPABASE_ANON_KEY` is set
- [ ] All values are correct and active

### 3. Authentication Setup
- [ ] Clerk project created
- [ ] Clerk publishable key added to `.env`
- [ ] Test admin account created in Clerk
- [ ] Admin record added to `admins` table in Supabase
- [ ] Admin can sign in successfully

### 4. Local Testing

#### Admin Web App
- [ ] Dependencies installed: `cd admin-web-app && npm install`
- [ ] App runs without errors: `npm run dev`
- [ ] Can access at `http://localhost:5173`
- [ ] Sign in/sign up works
- [ ] Dashboard loads with stats
- [ ] Issues page displays (empty or with data)
- [ ] Analytics charts render
- [ ] Profile page shows admin info
- [ ] Categories page loads
- [ ] Admins page displays

#### Mobile App Integration
- [ ] Mobile app runs: `npm run dev` (in project root)
- [ ] Can submit an issue from mobile app
- [ ] Issue appears in Supabase `issues` table
- [ ] Issue appears in admin dashboard
- [ ] Can update issue status from admin
- [ ] Status change reflects in database

### 5. Code Quality
- [ ] No TypeScript errors: `npm run build` (in admin-web-app)
- [ ] No console errors in browser
- [ ] All imports resolved correctly
- [ ] All services working (issueService, authService, categoryService)

### 6. Features Testing

#### Dashboard
- [ ] Stats cards show correct numbers
- [ ] Recent issues table displays
- [ ] Issue summary panel works
- [ ] Data refreshes on page load

#### Issues Management
- [ ] All issues display in table
- [ ] Search functionality works
- [ ] Filter by status works
- [ ] Filter by category works
- [ ] Can update issue status
- [ ] Can delete issues
- [ ] Pagination works (if implemented)

#### Analytics
- [ ] Monthly trend chart displays
- [ ] Category pie chart displays
- [ ] Bar chart displays
- [ ] Charts update with real data

#### Profile
- [ ] Admin info displays correctly
- [ ] Monthly resolution trend shows
- [ ] Status distribution chart shows
- [ ] Account settings form works

#### Categories
- [ ] All categories display
- [ ] Can create new category
- [ ] Can edit category
- [ ] Can delete category
- [ ] Issue counts are accurate

#### Admins
- [ ] All admins display
- [ ] Search works
- [ ] Admin cards show correct info
- [ ] Role badges display correctly

## 🚀 Production Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Build and Deploy**
   ```bash
   cd admin-web-app
   vercel
   ```

3. **Add Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add:
     - `VITE_CLERK_PUBLISHABLE_KEY`
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

4. **Redeploy**
   ```bash
   vercel --prod
   ```

### Option 2: Netlify

1. **Build the App**
   ```bash
   cd admin-web-app
   npm run build
   ```

2. **Deploy via Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

3. **Or Deploy via GitHub**
   - Connect repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

### Option 3: Custom Server

1. **Build the App**
   ```bash
   cd admin-web-app
   npm run build
   ```

2. **Upload `dist` Folder**
   - Upload contents of `dist` folder to your server
   - Configure web server (Nginx, Apache, etc.)

3. **Nginx Configuration Example**
   ```nginx
   server {
       listen 80;
       server_name admin.civiclens.com;
       root /var/www/admin-web-app/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## ✅ Post-Deployment Checklist

### 1. Verify Production App
- [ ] Admin app loads at production URL
- [ ] No console errors
- [ ] Can sign in with admin account
- [ ] Dashboard displays correctly
- [ ] All pages accessible

### 2. Test Core Features
- [ ] Submit issue from mobile app
- [ ] Issue appears in admin dashboard
- [ ] Can update issue status
- [ ] Analytics charts display
- [ ] Profile page works

### 3. Performance
- [ ] Page load time < 3 seconds
- [ ] Images load properly
- [ ] Charts render smoothly
- [ ] No lag when filtering/searching

### 4. Security
- [ ] HTTPS enabled
- [ ] Environment variables not exposed
- [ ] RLS policies working in Supabase
- [ ] Authentication required for admin routes
- [ ] API keys secure

### 5. Mobile App Integration
- [ ] Mobile app can submit issues to production database
- [ ] Issues appear in production admin dashboard
- [ ] Status updates sync correctly

## 🔧 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
cd admin-web-app
rm -rf node_modules dist
npm install
npm run build
```

### Environment Variables Not Working
- Ensure variables start with `VITE_`
- Restart dev server after changing `.env`
- In production, set variables in hosting platform

### Database Connection Issues
- Verify Supabase URL and key
- Check Supabase project is active
- Verify RLS policies allow access

### Authentication Issues
- Verify Clerk publishable key
- Check Clerk project is active
- Ensure admin record exists in database

## 📊 Monitoring

### Things to Monitor
- [ ] Error logs in hosting platform
- [ ] Supabase usage and quotas
- [ ] Clerk authentication logs
- [ ] Page load times
- [ ] User feedback

### Recommended Tools
- **Vercel Analytics** (if using Vercel)
- **Supabase Dashboard** for database monitoring
- **Clerk Dashboard** for auth monitoring
- **Google Analytics** for user tracking

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Admin app is accessible at production URL
- ✅ Admins can sign in and access dashboard
- ✅ Issues from mobile app appear in admin dashboard
- ✅ All CRUD operations work
- ✅ Analytics charts display correctly
- ✅ No console errors or warnings
- ✅ Performance is acceptable (< 3s load time)
- ✅ Mobile app integration works seamlessly

## 📝 Final Notes

### Backup Strategy
- Supabase automatically backs up your database
- Export data regularly from Supabase dashboard
- Keep a copy of environment variables secure

### Scaling Considerations
- Supabase free tier: 500MB database, 2GB bandwidth
- Upgrade Supabase plan as needed
- Consider CDN for static assets
- Implement caching for frequently accessed data

### Maintenance
- Monitor Supabase usage
- Update dependencies regularly
- Review and optimize database queries
- Check for security updates

---

**Congratulations on deploying CivicLens Admin! 🎉**

For support, refer to:
- `QUICK_START.md` - Quick setup guide
- `ADMIN_SETUP_GUIDE.md` - Detailed setup instructions
- `ADMIN_CHANGES_SUMMARY.md` - What was changed
- `admin-web-app/README.md` - Project documentation
