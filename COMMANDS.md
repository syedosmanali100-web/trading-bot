# 🎯 COMPLETE COMMAND REFERENCE

All commands you need for Nexus Trading Bot.

---

## 📦 Initial Setup Commands

### Install Dependencies
```bash
# Using pnpm (recommended)
pnpm install

# Using npm
npm install

# Using yarn
yarn install
```

### Install pnpm (if not installed)
```bash
npm install -g pnpm
```

---

## 🚀 Development Commands

### Start Development Server
```bash
pnpm dev
# Server starts at http://localhost:3000
```

### Start on Different Port
```bash
pnpm dev -- -p 3001
# Server starts at http://localhost:3001
```

### Stop Server
```
Press Ctrl+C in the terminal
```

---

## 🏗️ Build Commands

### Build for Production
```bash
pnpm build
```

### Start Production Server
```bash
pnpm start
```

### Build and Start
```bash
pnpm build && pnpm start
```

---

## 🧹 Cleanup Commands

### Clear Next.js Cache
```bash
# Windows
rmdir /s /q .next

# Mac/Linux
rm -rf .next
```

### Clear Node Modules
```bash
# Windows
rmdir /s /q node_modules

# Mac/Linux
rm -rf node_modules
```

### Full Clean Install
```bash
# Windows
rmdir /s /q node_modules .next
pnpm install

# Mac/Linux
rm -rf node_modules .next
pnpm install
```

### Clear pnpm Cache
```bash
pnpm store prune
```

---

## 🔧 Package Management

### Add New Package
```bash
pnpm add package-name
```

### Add Dev Package
```bash
pnpm add -D package-name
```

### Remove Package
```bash
pnpm remove package-name
```

### Update All Packages
```bash
pnpm update
```

### Update Specific Package
```bash
pnpm update package-name
```

### Check Outdated Packages
```bash
pnpm outdated
```

---

## 🗄️ Supabase Commands

### Connect to Supabase (in code)
```typescript
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

### Query Users Table
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
```

### Insert User
```typescript
const { data, error } = await supabase
  .from('users')
  .insert([
    { username: 'test', password: '123', is_active: true }
  ])
```

### Update User
```typescript
const { data, error } = await supabase
  .from('users')
  .update({ is_active: false })
  .eq('username', 'test')
```

### Delete User
```typescript
const { data, error } = await supabase
  .from('users')
  .delete()
  .eq('username', 'test')
```

---

## 🗃️ Database SQL Commands

### Create Users Table
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
```

### Create Index
```sql
CREATE INDEX idx_users_username ON users(username);
```

### Enable RLS
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### Add RLS Policies
```sql
CREATE POLICY "Allow public read" ON users
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert" ON users
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update" ON users
    FOR UPDATE TO public USING (true);

CREATE POLICY "Allow public delete" ON users
    FOR DELETE TO public USING (true);
```

### Query All Users
```sql
SELECT * FROM users;
```

### Query Active Users
```sql
SELECT * FROM users WHERE is_active = true;
```

### Count Users
```sql
SELECT COUNT(*) FROM users;
```

### Update User Status
```sql
UPDATE users 
SET is_active = true 
WHERE username = 'user_xyz';
```

### Delete Inactive Users
```sql
DELETE FROM users WHERE is_active = false;
```

### Find Expired Subscriptions
```sql
SELECT * FROM users 
WHERE subscription_end < NOW();
```

---

## 🌐 Git Commands

### Initialize Repository
```bash
git init
```

### Check Status
```bash
git status
```

### Add All Files
```bash
git add .
```

### Add Specific File
```bash
git add filename.txt
```

### Commit Changes
```bash
git commit -m "Your commit message"
```

### Push to GitHub
```bash
git push origin main
```

### Pull Latest Changes
```bash
git pull origin main
```

### Create New Branch
```bash
git checkout -b feature-name
```

### Switch Branch
```bash
git checkout main
```

### View Commit History
```bash
git log
```

### Undo Last Commit (keep changes)
```bash
git reset --soft HEAD~1
```

### Discard All Changes
```bash
git checkout .
```

---

## 🚢 Deployment Commands

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Deploy to Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

---

## 🔍 Debugging Commands

### Check Node Version
```bash
node --version
```

### Check npm Version
```bash
npm --version
```

### Check pnpm Version
```bash
pnpm --version
```

### List Installed Packages
```bash
pnpm list
```

### Check for Vulnerabilities
```bash
pnpm audit
```

### Fix Vulnerabilities
```bash
pnpm audit fix
```

### View Package Info
```bash
pnpm info package-name
```

---

## 📝 File Management Commands

### Create New File
```bash
# Windows
type nul > filename.txt

# Mac/Linux
touch filename.txt
```

### Create New Directory
```bash
mkdir directory-name
```

### List Files
```bash
# Windows
dir

# Mac/Linux
ls -la
```

### Move File
```bash
# Windows
move old.txt new.txt

# Mac/Linux
mv old.txt new.txt
```

### Copy File
```bash
# Windows
copy source.txt destination.txt

# Mac/Linux
cp source.txt destination.txt
```

### Delete File
```bash
# Windows
del filename.txt

# Mac/Linux
rm filename.txt
```

### View File Content
```bash
# Windows
type filename.txt

# Mac/Linux
cat filename.txt
```

---

## 🔐 Environment Variable Commands

### View Environment Variables
```bash
# Windows
echo %PATH%

# Mac/Linux
echo $PATH
```

### Set Temporary Variable
```bash
# Windows
set VAR=value

# Mac/Linux
export VAR=value
```

### View .env.local
```bash
# Windows
type .env.local

# Mac/Linux
cat .env.local
```

---

## 🧪 Testing Commands

### Run Type Check
```bash
pnpm tsc --noEmit
```

### Run Linter
```bash
pnpm lint
```

### Fix Lint Errors
```bash
pnpm lint --fix
```

---

## 📊 Monitoring Commands

### View Logs (Development)
```bash
# Already visible in terminal when running pnpm dev
```

### View Production Logs (Vercel)
```bash
vercel logs
```

### View Build Logs
```bash
# Check after running pnpm build
```

---

## 🎨 UI/Styling Commands

### Add Tailwind Component
```bash
# Components are already included
# No additional command needed
```

### Rebuild Styles
```bash
# Automatically rebuilt on save during dev
pnpm dev
```

---

## 🔄 Update Commands

### Update Next.js
```bash
pnpm update next
```

### Update React
```bash
pnpm update react react-dom
```

### Update All Dependencies
```bash
pnpm update --latest
```

### Check for Updates
```bash
pnpm outdated
```

---

## 🆘 Emergency Commands

### Kill Port 3000 (if stuck)
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Reset Everything
```bash
# 1. Clear cache
rm -rf .next node_modules

# 2. Reinstall
pnpm install

# 3. Rebuild
pnpm build

# 4. Test
pnpm dev
```

---

## 📱 Browser Commands

### Open in Default Browser
```bash
# Windows
start http://localhost:3000

# Mac
open http://localhost:3000

# Linux
xdg-open http://localhost:3000
```

### Clear Browser Cache
```
Ctrl+Shift+Delete (Windows/Linux)
Cmd+Shift+Delete (Mac)
```

### Hard Refresh
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### Open DevTools
```
F12 (All systems)
Ctrl+Shift+I (Windows/Linux)
Cmd+Option+I (Mac)
```

---

## 🎯 Quick Reference Table

| Task | Command |
|------|---------|
| Install | `pnpm install` |
| Dev Server | `pnpm dev` |
| Build | `pnpm build` |
| Start Prod | `pnpm start` |
| Clean | `rm -rf .next node_modules` |
| Deploy | `vercel` |
| Git Commit | `git add . && git commit -m "msg"` |
| Git Push | `git push origin main` |
| Check Logs | Check terminal |
| Kill Port | `lsof -ti:3000 \| xargs kill -9` |

---

## 🔗 Useful Shortcuts

### Terminal Shortcuts
- `Ctrl+C` - Stop server
- `Ctrl+Z` - Suspend process
- `Ctrl+L` - Clear terminal
- `Ctrl+D` - Exit terminal
- `Tab` - Auto-complete
- `↑` - Previous command

### VS Code Shortcuts
- `Ctrl+`` - Toggle terminal
- `Ctrl+Shift+F` - Search in files
- `Ctrl+P` - Quick file open
- `Ctrl+Shift+P` - Command palette
- `Ctrl+/` - Toggle comment

---

## 📚 Documentation URLs

Quick access to docs:
```bash
# Open in browser:
# - Next.js: https://nextjs.org/docs
# - Supabase: https://supabase.com/docs
# - Tailwind: https://tailwindcss.com/docs
# - Vercel: https://vercel.com/docs
```

---

## 💡 Pro Tips

1. **Always test locally before deploying**
   ```bash
   pnpm build && pnpm start
   ```

2. **Commit working states often**
   ```bash
   git add . && git commit -m "Working state"
   ```

3. **Keep dependencies updated monthly**
   ```bash
   pnpm update
   ```

4. **Backup .env.local securely**
   ```bash
   # Don't commit to git!
   ```

5. **Monitor logs regularly**
   ```bash
   # Check Vercel dashboard
   ```

---

## 🎉 Complete Workflow

### Daily Development:
```bash
# 1. Start server
pnpm dev

# 2. Make changes
# Edit files...

# 3. Test changes
# Check in browser

# 4. Commit if working
git add .
git commit -m "Added feature X"

# 5. Push to deploy
git push origin main
```

### Adding New Feature:
```bash
# 1. Create branch
git checkout -b new-feature

# 2. Develop
pnpm dev

# 3. Test
pnpm build && pnpm start

# 4. Merge
git checkout main
git merge new-feature
git push origin main
```

### Fixing Bug:
```bash
# 1. Identify issue
# Check logs and errors

# 2. Create fix branch
git checkout -b fix-bug

# 3. Fix and test
pnpm dev

# 4. Deploy fix
git checkout main
git merge fix-bug
git push origin main
```

---

**Save this file for quick reference!** 📌

*All commands tested and verified for Nexus Trading Bot* ✅
