# 🚀 Nexus Trading Bot - Quick Start

## ⚡ Run the Server

```bash
npm run dev
```

or

```bash
pnpm dev
```

or

```bash
yarn dev
```

## 🌐 Access URLs

Once the server is running, you can access:

- **Main Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Login Page:** [http://localhost:3000/login](http://localhost:3000/login)
- **Admin Panel:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Profile Page:** [http://localhost:3000/profile](http://localhost:3000/profile)

## 🔑 Default Admin Credentials

**Admin Password:** `admin123`

⚠️ **IMPORTANT:** This should be changed in `/app/admin/page.tsx` before going live!

## 📋 Before You Start

1. ✅ Install dependencies: `npm install` or `pnpm install`
2. ✅ Set up Supabase account (free at [supabase.com](https://supabase.com))
3. ✅ Configure `.env.local` with your Supabase credentials
4. ✅ Run the SQL script to create the database table (see SETUP_GUIDE.md)
5. ✅ Run the development server

## 🎯 First Time Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for free
3. Create a new project

### Step 3: Get Your API Keys
1. In Supabase, go to **Settings** → **API**
2. Copy your **Project URL**
3. Copy your **anon public** key
4. Copy your **service_role** key (keep secure!)

### Step 4: Configure Environment Variables
Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 5: Create Database Table
In Supabase SQL Editor, run:
```sql
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    subscription_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON users
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert" ON users
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update" ON users
    FOR UPDATE TO public USING (true);

CREATE POLICY "Allow public delete" ON users
    FOR DELETE TO public USING (true);
```

### Step 6: Start the Server
```bash
npm run dev
```

### Step 7: Access Admin Panel
1. Go to [http://localhost:3000/admin](http://localhost:3000/admin)
2. Enter admin password: `admin123`
3. Create your first user!

## 🎨 Features

### 👤 User Features
- Secure login system
- Real-time trading signals
- Multiple currency pairs (USD/BRL, EUR/USD, GBP/USD, USD/JPY, AUD/USD)
- Advanced technical indicators (RSI, MACD, Bollinger Bands, etc.)
- Customizable trading strategies
- Signal history tracking
- Professional dark theme UI

### 👨‍💼 Admin Features
- User management dashboard
- Auto-generate credentials
- Set subscription duration
- Activate/Deactivate users
- Delete users
- Copy credentials to clipboard
- User statistics overview

## 📱 How to Use

### For Admins:
1. Access admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)
2. Click "Create New User"
3. Set subscription duration
4. System generates username/password automatically
5. Credentials are copied to clipboard
6. Share credentials with your customer

### For Users:
1. Receive username/password from admin
2. Go to [http://localhost:3000/login](http://localhost:3000/login)
3. Enter credentials
4. Access the trading dashboard
5. Connect to start receiving signals
6. Customize strategies in profile

## 🚀 Deployment

### Quick Deploy to Vercel:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or:
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

## 📚 Full Documentation

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for complete documentation including:
- Detailed setup instructions
- Database schema
- Security notes
- Customization guide
- Deployment options

## 🔧 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL)
- **UI:** shadcn/ui + Tailwind CSS
- **Language:** TypeScript
- **Icons:** Lucide React
- **Notifications:** Sonner

## 📞 Quick Troubleshooting

**Can't connect to server?**
- Make sure you ran `npm install` first
- Check if port 3000 is available
- Try `npm run dev -- -p 3001` to use a different port

**Login not working?**
- Make sure Supabase is configured correctly
- Check `.env.local` has correct credentials
- Verify the users table exists in Supabase
- Check browser console for errors

**Admin panel access denied?**
- Default password is `admin123`
- Make sure you're entering it correctly
- Check if there are any console errors

## 🎯 Your Trading Bot is Ready!

The server URL will be: **http://localhost:3000**

Start creating users and selling subscriptions! 🚀💰

---

**Need help?** Check SETUP_GUIDE.md for detailed documentation.
