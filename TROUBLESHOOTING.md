# 🔧 TROUBLESHOOTING GUIDE

Common issues and their solutions for Nexus Trading Bot.

---

## 🚨 Installation Issues

### Problem: `pnpm: command not found` or `npm: command not found`

**Solution:**
```bash
# Install Node.js first from https://nodejs.org/
# Then install pnpm
npm install -g pnpm

# Verify installation
pnpm --version
```

### Problem: "Permission denied" errors

**Solution (Windows):**
- Run Command Prompt as Administrator
- Or use PowerShell with elevated permissions

**Solution (Mac/Linux):**
```bash
sudo npm install -g pnpm
# Or use nvm to manage Node.js without sudo
```

### Problem: Dependencies won't install

**Solution:**
```bash
# Clear cache and reinstall
pnpm store prune
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

---

## 🔌 Connection Issues

### Problem: "Cannot connect to Supabase"

**Checklist:**
1. ✅ Check `.env.local` exists and has correct values
2. ✅ Verify Supabase URL starts with `https://`
3. ✅ Verify keys are complete (very long strings)
4. ✅ Check Supabase project is active (not paused)
5. ✅ Restart development server

**Solution:**
```bash
# Stop server (Ctrl+C)
# Verify .env.local content
cat .env.local  # Mac/Linux
type .env.local  # Windows

# Restart
pnpm dev
```

### Problem: "Failed to fetch" or CORS errors

**Solution:**
1. Check Supabase API settings
2. Verify RLS policies are set correctly
3. Try clearing browser cache
4. Check browser console for specific error

---

## 🔐 Authentication Issues

### Problem: Login not working - "Invalid credentials"

**Checklist:**
1. ✅ User exists in Supabase (check Table Editor)
2. ✅ Username is exact match (case-sensitive)
3. ✅ Password is exact match (no extra spaces)
4. ✅ User `is_active` = true
5. ✅ Subscription hasn't expired

**Solution:**
```sql
-- Check user in Supabase SQL Editor
SELECT * FROM users WHERE username = 'user_xyz';

-- Verify user is active
UPDATE users 
SET is_active = true 
WHERE username = 'user_xyz';
```

### Problem: "User not found" after login

**Solution:**
- Clear browser localStorage:
```javascript
// Open browser console (F12) and run:
localStorage.clear()
// Then try logging in again
```

### Problem: Redirects to login immediately after logging in

**Solution:**
```javascript
// Check if session is being saved
// Open browser console and check:
console.log(localStorage.getItem('user_session'))

// If null, there's an issue with login logic
// Check browser console for errors
```

---

## 👨‍💼 Admin Panel Issues

### Problem: "Invalid admin password"

**Solution:**
1. Check you're using: `admin123` (default)
2. If changed, verify the code in `app/admin/page.tsx`
3. Look for: `const ADMIN_PASSWORD = "..."`

### Problem: Can't create users

**Checklist:**
1. ✅ Supabase connected
2. ✅ Users table exists
3. ✅ RLS policies active
4. ✅ Browser has clipboard permissions

**Solution:**
```sql
-- Verify table exists
SELECT * FROM users LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';
```

### Problem: "Table does not exist" error

**Solution:**
Run this in Supabase SQL Editor:
```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    subscription_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📊 Dashboard Issues

### Problem: Signals not generating

**Checklist:**
1. ✅ Click "Connect" button
2. ✅ Wait 30-60 seconds for data
3. ✅ Market must show clear trend (not sideways)
4. ✅ Check cooldown isn't active

**Normal Behavior:**
- Signals appear every 10-20 minutes
- Only generate when strong trends detected
- Sideways market = no signals (by design)

### Problem: "Checking authentication..." screen stuck

**Solution:**
```javascript
// Clear session and try again
localStorage.clear()
// Refresh page
location.reload()
```

### Problem: Market data not updating

**Solution:**
1. Check browser console for errors (F12)
2. Verify WebSocket connection
3. Try disconnecting and reconnecting
4. Refresh page

---

## 🎨 UI/Display Issues

### Problem: Styles not loading properly

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next
pnpm dev
```

### Problem: Mobile view broken

**Solution:**
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Try different browser
4. Check responsive mode in DevTools

### Problem: Icons not showing

**Solution:**
```bash
# Reinstall lucide-react
pnpm remove lucide-react
pnpm add lucide-react
```

---

## 🚀 Deployment Issues

### Problem: Build fails on Vercel

**Common causes:**
1. Missing environment variables
2. TypeScript errors
3. Missing dependencies

**Solution:**
```bash
# Test build locally first
pnpm build

# If successful, check Vercel logs
# Add environment variables in Vercel dashboard
```

### Problem: "Module not found" in production

**Solution:**
- Ensure package is in `dependencies`, not `devDependencies`
- Run `pnpm install` and commit `pnpm-lock.yaml`

### Problem: Environment variables not working

**Solution in Vercel:**
1. Go to project settings
2. Click "Environment Variables"
3. Add variables for all environments
4. Redeploy

---

## 💾 Database Issues

### Problem: "row-level security policy" error

**Solution:**
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Allow public access" ON users
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);
```

### Problem: Can't read/write to database

**Solution:**
1. Check Supabase service status
2. Verify API keys in `.env.local`
3. Check RLS policies
4. Verify network connection

### Problem: Database full

**Solution:**
- Upgrade Supabase plan
- Delete old/inactive users
- Archive historical data

---

## 🐛 Runtime Errors

### Problem: "Hydration error"

**Solution:**
```javascript
// Common in Next.js 15
// Usually caused by localStorage access during SSR
// Use useEffect for client-side only code:

useEffect(() => {
  // Client-side code here
}, [])
```

### Problem: "Cannot read property of undefined"

**Solution:**
1. Check browser console for full error
2. Add null checks in code:
```typescript
const value = data?.property ?? defaultValue
```

### Problem: Page refresh loses data

**Solution:**
- Data should be in localStorage
- Check if localStorage.setItem() is called
- Verify localStorage permissions in browser

---

## 🔍 Debugging Tips

### Enable Verbose Logging

Add to your code:
```typescript
console.log('Debug info:', { variable1, variable2 })
```

### Check Network Requests

1. Open DevTools (F12)
2. Go to "Network" tab
3. Look for failed requests (red)
4. Check response for error details

### Inspect Database

In Supabase:
1. Go to "Table Editor"
2. View `users` table
3. Check data is correct
4. Look for null/unexpected values

### Check Browser Console

Always check console for errors:
1. Press F12
2. Click "Console" tab
3. Look for red error messages
4. Read full error stack trace

---

## 🆘 Still Having Issues?

### Checklist for Support:

When asking for help, provide:
1. ✅ Error message (full text)
2. ✅ Browser console logs
3. ✅ What you were trying to do
4. ✅ What you expected to happen
5. ✅ What actually happened
6. ✅ Steps you've already tried

### Where to Get Help:

1. **Review Documentation:**
   - INSTALLATION.md
   - SETUP_GUIDE.md
   - DEPLOYMENT.md
   - This file (TROUBLESHOOTING.md)

2. **Check Official Docs:**
   - Next.js: https://nextjs.org/docs
   - Supabase: https://supabase.com/docs
   - Tailwind: https://tailwindcss.com/docs

3. **Community Resources:**
   - Next.js Discord
   - Supabase Discord
   - Stack Overflow

---

## 🎯 Prevention Tips

### Best Practices:

1. **Always use version control (Git)**
   ```bash
   git add .
   git commit -m "Working state"
   ```

2. **Test locally before deploying**
   ```bash
   pnpm build
   pnpm start
   ```

3. **Keep backups of:**
   - `.env.local` (securely)
   - Supabase database
   - Working code state

4. **Monitor logs:**
   - Browser console
   - Vercel/Netlify logs
   - Supabase logs

5. **Update regularly:**
   ```bash
   pnpm update
   ```

6. **Document changes:**
   - Keep notes of customizations
   - Comment complex code
   - Update README

---

## 📊 Performance Issues

### Problem: Slow page loads

**Solution:**
1. Check Vercel/Netlify analytics
2. Optimize images
3. Enable caching
4. Use CDN (automatic with Vercel)

### Problem: High database usage

**Solution:**
1. Add database indexes
2. Optimize queries
3. Cache frequent queries
4. Archive old data

### Problem: Memory leaks

**Solution:**
```typescript
// Clean up in useEffect
useEffect(() => {
  const interval = setInterval(...)
  
  return () => {
    clearInterval(interval) // Cleanup!
  }
}, [])
```

---

## ✅ Health Check

Run this checklist regularly:

```bash
# 1. Test local development
pnpm dev
# Open http://localhost:3000

# 2. Test production build
pnpm build
pnpm start

# 3. Check Supabase
# - Database online?
# - API responding?
# - Users table accessible?

# 4. Check deployment
# - Site accessible?
# - SSL working?
# - All features working?

# 5. Monitor
# - Check error logs
# - Review analytics
# - Test user flows
```

---

## 🎉 Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| Module not found | `rm -rf node_modules && pnpm install` |
| Can't connect | Check `.env.local` |
| Login fails | Verify user in Supabase |
| Build error | `rm -rf .next && pnpm build` |
| Styles broken | Clear cache & hard refresh |
| DB error | Check RLS policies |
| Slow performance | Check Vercel analytics |

---

**Remember:** Most issues are configuration-related. Double-check your environment variables and Supabase setup!

**Pro Tip:** When in doubt, check the browser console and server logs first. They usually tell you exactly what's wrong!

---

*Happy debugging! 🐛🔨*
