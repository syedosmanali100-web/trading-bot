# 🎯 COMPLETE INSTALLATION GUIDE

## 📦 Prerequisites

Before you begin, ensure you have installed:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Check installation: `node --version`

2. **pnpm** (recommended) or npm/yarn
   - Install pnpm: `npm install -g pnpm`
   - Check installation: `pnpm --version`

3. **Git** (optional, for version control)
   - Download from: https://git-scm.com/

## 🚀 Installation Steps

### Step 1: Install Dependencies

Open Command Prompt or PowerShell in your project folder and run:

```bash
pnpm install
```

Or if using npm:
```bash
npm install
```

Or if using yarn:
```bash
yarn install
```

This will install all required packages including:
- Next.js 15
- Supabase
- TypeScript
- Tailwind CSS
- shadcn/ui components
- And all other dependencies

### Step 2: Set Up Supabase

1. **Create a Supabase Account**
   - Go to https://supabase.com
   - Click "Start your project"
   - Sign up with GitHub, Google, or email

2. **Create a New Project**
   - Click "New Project"
   - Enter project name: `nexus-trading-bot`
   - Create a strong database password (save this!)
   - Select a region close to you
   - Click "Create new project"
   - Wait 2-3 minutes for project setup

3. **Get Your API Keys**
   - Once project is ready, go to **Settings** (gear icon)
   - Click **API** in the sidebar
   - You'll see:
     - **Project URL**: `https://xxxxx.supabase.co`
     - **anon public**: `eyJhbGci...` (long string)
     - **service_role**: `eyJhbGci...` (another long string)
   - Keep this tab open!

4. **Configure Environment Variables**
   - Open `.env.local` in your project folder
   - Replace the placeholder values with your actual keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

5. **Create Database Table**
   - In Supabase dashboard, click **SQL Editor** (in sidebar)
   - Click **New Query**
   - Copy and paste this SQL code:

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

-- Create index for faster lookups
CREATE INDEX idx_users_username ON users(username);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access" ON users
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert" ON users
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update" ON users
    FOR UPDATE TO public USING (true);

CREATE POLICY "Allow public delete" ON users
    FOR DELETE TO public USING (true);
```

   - Click **Run** (or press Ctrl/Cmd + Enter)
   - You should see "Success. No rows returned"
   - Go to **Table Editor** to verify the table was created

### Step 3: Start the Development Server

#### Option A: Using the Start Script (Easiest)

Double-click `start.bat` file in your project folder.

#### Option B: Manual Command

Open Command Prompt/PowerShell in project folder:

```bash
pnpm dev
```

Or with npm:
```bash
npm run dev
```

You should see:
```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Ready in 2.5s
```

### Step 4: Test Your Installation

1. **Open the Application**
   - Navigate to http://localhost:3000/login in your browser

2. **Access Admin Panel**
   - Go to http://localhost:3000/admin
   - Enter password: `admin123`
   - You should see the admin dashboard

3. **Create a Test User**
   - Click "Create New User"
   - Set subscription days (e.g., 30)
   - Click "Generate User"
   - Credentials will be copied to clipboard

4. **Test Login**
   - Go back to http://localhost:3000/login
   - Paste/enter the generated credentials
   - You should be redirected to the trading dashboard

5. **Test Trading Dashboard**
   - Click "Connect" button
   - You should see market data loading
   - Wait for signals to appear (may take a few minutes)

## ✅ Verification Checklist

- [ ] Dependencies installed successfully
- [ ] Supabase project created
- [ ] Environment variables configured in `.env.local`
- [ ] Database table created
- [ ] Development server running
- [ ] Admin panel accessible
- [ ] User creation working
- [ ] Login system functional
- [ ] Trading dashboard loading

## 🔧 Troubleshooting

### Problem: "Module not found" errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
pnpm install
```

### Problem: "Cannot connect to Supabase"

**Solution:**
1. Check `.env.local` has correct credentials
2. Verify Supabase project is active
3. Check internet connection
4. Restart development server

### Problem: "Table does not exist"

**Solution:**
1. Go to Supabase SQL Editor
2. Re-run the CREATE TABLE script
3. Verify table appears in Table Editor

### Problem: Port 3000 already in use

**Solution:**
```bash
# Use a different port
pnpm dev -- -p 3001
```

### Problem: Login not working

**Solution:**
1. Check browser console for errors (F12)
2. Verify user exists in Supabase Table Editor
3. Check username/password exactly match
4. Try creating a new user from admin panel

### Problem: Build errors

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next
pnpm dev
```

## 📱 Access URLs

Once running, access these URLs:

| Page | URL | Description |
|------|-----|-------------|
| Login | http://localhost:3000/login | User login page |
| Admin | http://localhost:3000/admin | Admin dashboard |
| Dashboard | http://localhost:3000 | Main trading dashboard |
| Profile | http://localhost:3000/profile | User profile & settings |

## 🎨 Customization

### Change Admin Password

Edit `app/admin/page.tsx`, line ~30:
```typescript
const ADMIN_PASSWORD = "your_secure_password_here"
```

### Change Color Theme

Edit `app/globals.css` and modify CSS variables:
```css
--primary: 166 100% 50%; /* Change this */
```

### Add Currency Pairs

Edit `app/page.tsx`, find `CURRENCY_PAIRS` array and add:
```typescript
{ symbol: "NEW/PAIR OTC", name: "New Pair Name", basePrice: 1.0 },
```

## 🚀 Next Steps

1. ✅ Test all features thoroughly
2. ✅ Change admin password
3. ✅ Customize branding if needed
4. ✅ Create your first real user
5. ✅ Deploy to production (see DEPLOYMENT.md)

## 📞 Support

If you encounter issues:

1. Check this guide again
2. Review error messages carefully
3. Check browser console (F12)
4. Check server terminal for errors
5. Verify Supabase credentials

## 🎉 Success!

If you can:
- Access admin panel
- Create users
- Login with created credentials
- See trading dashboard

**Congratulations! Your installation is complete!** 🎊

You're now ready to start selling trading bot subscriptions! 💰

---

**Time to complete:** ~15-20 minutes
**Difficulty:** Beginner-friendly
**Cost:** $0 (using free tiers)
