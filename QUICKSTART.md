# ⚡ QUICK START CARD

## 🎯 5-Minute Setup

### Step 1: Install (1 min)
```bash
pnpm install
```

### Step 2: Configure Supabase (2 min)
1. Create account at https://supabase.com
2. Create new project
3. Copy API keys to `.env.local`
4. Run SQL script in SQL Editor

### Step 3: Start Server (30 sec)
```bash
pnpm dev
```
OR double-click `start.bat`

### Step 4: Test (90 sec)
1. Open http://localhost:3000/admin
2. Login with: `admin123`
3. Click "Create New User"
4. Test login with generated credentials

✅ **Done!** You're ready to sell subscriptions!

---

## 📋 Essential Info

### URLs
- **Login:** http://localhost:3000/login
- **Admin:** http://localhost:3000/admin
- **Dashboard:** http://localhost:3000

### Default Password
- **Admin:** `admin123` ⚠️ Change before production!

### Where to Change Admin Password
File: `app/admin/page.tsx`
Line: ~30
```typescript
const ADMIN_PASSWORD = "your_password_here"
```

---

## 🚀 To Deploy

```bash
# Push to GitHub
git add .
git commit -m "Initial commit"
git push

# Then on Vercel.com:
# 1. Import from GitHub
# 2. Add environment variables
# 3. Deploy
```

Live in 2 minutes! 🎉

---

## 💰 To Start Making Money

1. Deploy to production (Vercel)
2. Create users in admin panel
3. Share credentials with customers
4. Collect payments (Stripe/PayPal)
5. Profit! 💵

---

## 📞 Need Help?

Check these files:
- `INSTALLATION.md` - Detailed setup
- `TROUBLESHOOTING.md` - Fix issues
- `COMMANDS.md` - All commands
- `SUMMARY.md` - Complete overview

---

## ✅ Quick Checklist

- [ ] `pnpm install` completed
- [ ] `.env.local` configured
- [ ] Supabase table created
- [ ] `pnpm dev` running
- [ ] Admin panel accessible
- [ ] Test user created
- [ ] Login working
- [ ] Dashboard loading

**All checked?** You're ready! 🚀

---

*⏱️ Total setup time: ~5-10 minutes*
*💰 Time to first sale: ~1 hour*
*🎯 Difficulty: Beginner-friendly*

**Let's make some money!** 💵💵💵
