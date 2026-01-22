# Nexus Trading Bot - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 2. Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **Settings** → **API** and copy:
   - `Project URL`
   - `anon/public` key
   - `service_role` key (keep this secure!)

### 3. Configure Environment Variables

Edit `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Create Database Table

In your Supabase project, go to **SQL Editor** and run this SQL:

```sql
-- Create users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    subscription_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster username lookups
CREATE INDEX idx_users_username ON users(username);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (for login)
CREATE POLICY "Allow public read access" ON users
    FOR SELECT
    TO public
    USING (true);

-- Create policy to allow public insert (for creating users)
CREATE POLICY "Allow public insert" ON users
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Create policy to allow public update
CREATE POLICY "Allow public update" ON users
    FOR UPDATE
    TO public
    USING (true);

-- Create policy to allow public delete
CREATE POLICY "Allow public delete" ON users
    FOR DELETE
    TO public
    USING (true);
```

### 5. Run the Development Server

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Features

### User Features:
- ✅ Secure login with username/password
- ✅ Real-time trading signals
- ✅ Multiple currency pairs support
- ✅ Advanced technical indicators
- ✅ Customizable trading strategies
- ✅ Signal history tracking
- ✅ Subscription management

### Admin Features:
- ✅ User management dashboard
- ✅ Auto-generate username/password
- ✅ Subscription control (activate/deactivate)
- ✅ Set subscription duration
- ✅ One-click credential copying
- ✅ User statistics overview
- ✅ Delete users

## 🔐 Default Admin Credentials

**Admin Password:** `admin123`

⚠️ **IMPORTANT:** Change this password in `/app/admin/page.tsx` before deploying!

Find this line and change it:
```typescript
const ADMIN_PASSWORD = "admin123" // Change this to a secure password
```

## 📱 Routes

- `/login` - User login page
- `/admin` - Admin panel (password required)
- `/` - Main trading dashboard (requires authentication)
- `/profile` - User profile and strategy management

## 🎨 UI/UX Features

The design matches your current theme with:
- 🌑 Premium dark theme
- ✨ Gradient text effects
- 💎 Glass morphism cards
- 🎭 Smooth animations
- 📊 Real-time data visualization
- 🔔 Toast notifications
- 🎯 Responsive design (mobile-friendly)

## 🔄 Workflow for Selling Subscriptions

1. **Admin creates a new user:**
   - Go to Admin Panel (`/admin`)
   - Click "Create New User"
   - Set subscription duration (days)
   - System generates random username/password
   - Credentials are automatically copied to clipboard

2. **Share credentials with customer:**
   - Send the username and password to your customer
   - Customer goes to `/login`
   - They enter credentials and access the trading bot

3. **Manage subscriptions:**
   - View all users in admin panel
   - Activate/Deactivate accounts
   - Delete users when needed
   - Monitor subscription end dates

## 🛠️ Customization

### Change Color Scheme
Edit `app/globals.css` to modify colors:
```css
--primary: 166 100% 50%; /* Main accent color */
--background: 222 47% 5%; /* Background color */
```

### Add More Currency Pairs
Edit `app/page.tsx` and add to `CURRENCY_PAIRS` array:
```typescript
const CURRENCY_PAIRS = [
  { symbol: "YOUR/PAIR OTC", name: "Your Pair Name", basePrice: 1.0 },
  // ... existing pairs
]
```

### Modify Trading Strategies
Edit the `DEFAULT_STRATEGIES` array in `app/page.tsx`.

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy!

Your site will be live at `https://your-project.vercel.app`

### Deploy to Other Platforms

This is a standard Next.js app and can be deployed to:
- Netlify
- Railway
- Render
- Any platform supporting Next.js 15

## 📊 Database Schema

```
users
├── id (UUID, Primary Key)
├── username (TEXT, Unique)
├── password (TEXT)
├── is_admin (BOOLEAN)
├── is_active (BOOLEAN)
├── subscription_end (TIMESTAMP)
└── created_at (TIMESTAMP)
```

## 🔒 Security Notes

1. **Change the admin password** in production
2. **Use strong passwords** for database
3. **Enable 2FA** on Supabase account
4. **Never commit** `.env.local` to version control
5. **Regularly backup** your Supabase database

## 📞 Support

If you need help:
1. Check Supabase documentation
2. Check Next.js documentation
3. Review this setup guide
4. Check the console for errors

## 🎯 Next Steps

After setup:
1. ✅ Create your first admin account
2. ✅ Test the login flow
3. ✅ Create a test user subscription
4. ✅ Customize branding/colors
5. ✅ Deploy to production
6. ✅ Start selling subscriptions!

## 📝 Important Files

- `app/login/page.tsx` - Login page
- `app/admin/page.tsx` - Admin panel
- `app/page.tsx` - Main trading dashboard
- `lib/supabase/client.ts` - Supabase client setup
- `.env.local` - Environment variables (DO NOT COMMIT)

---

**Built with:** Next.js 15, Supabase, TypeScript, Tailwind CSS, shadcn/ui

**License:** MIT

Good luck with your trading bot business! 🚀💰
