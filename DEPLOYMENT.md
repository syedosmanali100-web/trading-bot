# 🌐 DEPLOYMENT GUIDE

## 🚀 Deploy to Vercel (Recommended - Free)

Vercel is the easiest and fastest way to deploy your Next.js app with zero configuration needed.

### Prerequisites
- GitHub account
- Your code pushed to GitHub repository
- Supabase project set up

### Step-by-Step Deployment

#### 1. Prepare Your Repository

```bash
# Initialize git if you haven't
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create a new repository on GitHub
# Then push your code
git remote add origin https://github.com/yourusername/your-repo.git
git branch -M main
git push -u origin main
```

#### 2. Deploy to Vercel

1. **Go to Vercel**
   - Visit https://vercel.com
   - Click "Sign Up" and authenticate with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your repository from the list
   - Click "Import"

3. **Configure Project**
   - **Framework Preset:** Next.js (should auto-detect)
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `next build` (pre-filled)
   - **Output Directory:** `.next` (pre-filled)

4. **Add Environment Variables**
   
   Click "Environment Variables" and add:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL = your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key
   SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
   ```
   
   Copy these from your `.env.local` file!

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at `https://your-project.vercel.app`

#### 3. Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### Your Live URLs

After deployment, your URLs will be:

- **Login:** `https://your-project.vercel.app/login`
- **Admin:** `https://your-project.vercel.app/admin`
- **Dashboard:** `https://your-project.vercel.app`

## 🔄 Continuous Deployment

Vercel automatically redeploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push
```

Changes will be live in ~2 minutes!

---

## 🌊 Alternative: Deploy to Netlify

### Step-by-Step

1. **Prepare Your Code**
   - Push to GitHub (same as above)

2. **Deploy to Netlify**
   - Go to https://netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select repository
   - **Build command:** `pnpm build` or `npm run build`
   - **Publish directory:** `.next`

3. **Add Environment Variables**
   - Go to Site settings → Build & deploy → Environment
   - Add the same variables as Vercel

4. **Deploy**
   - Click "Deploy site"
   - Live at `https://your-site.netlify.app`

---

## 🐳 Alternative: Docker Deployment

### Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm install -g pnpm && pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Deploy with Docker

```bash
# Build
docker build -t nexus-trading-bot .

# Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  nexus-trading-bot
```

---

## 🔒 Production Checklist

Before going live, ensure:

- [ ] Changed admin password in code
- [ ] Environment variables set correctly
- [ ] Supabase RLS policies active
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (auto with Vercel/Netlify)
- [ ] Test all features in production
- [ ] Backup Supabase database regularly

---

## 📊 Monitoring

### Vercel Analytics (Recommended)

Already included! Check your Vercel dashboard for:
- Page views
- User locations
- Performance metrics
- Error tracking

### Supabase Monitoring

In Supabase dashboard, monitor:
- Database usage
- API requests
- User growth
- Query performance

---

## 🔄 Updating Your Live App

### Method 1: Git Push (Automatic)

```bash
# Make changes to your code
git add .
git commit -m "Your update description"
git push

# Vercel/Netlify will auto-deploy in ~2 minutes
```

### Method 2: Manual Deploy

1. Go to Vercel/Netlify dashboard
2. Click "Deployments"
3. Click "Redeploy" on latest deployment

---

## 🚨 Rollback if Needed

### Vercel Rollback

1. Go to project dashboard
2. Click "Deployments"
3. Find previous working deployment
4. Click "..." → "Promote to Production"

### Netlify Rollback

1. Go to project dashboard
2. Click "Deploys"
3. Find previous deployment
4. Click "Publish deploy"

---

## 💰 Pricing

### Free Tiers (Perfect for Starting)

**Vercel Free:**
- 100 GB bandwidth/month
- Unlimited deployments
- Custom domains
- Perfect for ~10,000 visitors/month

**Supabase Free:**
- 500 MB database
- 2 GB bandwidth/month
- Unlimited API requests
- Perfect for hundreds of users

**When to Upgrade:**
- Vercel Pro ($20/mo): After 10K visitors/month
- Supabase Pro ($25/mo): After 500 MB data or 2GB bandwidth

---

## 🎯 Launch Strategy

### Week 1: Soft Launch
- Deploy to production
- Share with 5-10 beta testers
- Collect feedback
- Fix any issues

### Week 2: Public Launch
- Announce on social media
- Create landing page with pricing
- Set up payment processing
- Start selling subscriptions

### Month 2+: Scale
- Monitor analytics
- Add requested features
- Scale infrastructure if needed
- Optimize based on user behavior

---

## 📈 Monetization Setup

### Recommended Payment Providers

1. **Stripe** (Best for subscriptions)
   - stripe.com
   - Easy integration
   - Recurring billing
   - 2.9% + $0.30 per transaction

2. **PayPal** (Global alternative)
   - paypal.com
   - Wide acceptance
   - Recurring payments
   - Similar fees to Stripe

3. **Razorpay** (For India)
   - razorpay.com
   - Local payment methods
   - 2% + GST per transaction

### Integration Steps

1. Create account with payment provider
2. Get API keys
3. Add payment form to your site
4. On successful payment:
   - Create user in Supabase
   - Set subscription_end date
   - Email credentials to customer

---

## 🎊 You're Live!

Your trading bot is now:
- ✅ Deployed to production
- ✅ Accessible worldwide
- ✅ Running on secure HTTPS
- ✅ Auto-scaling as needed
- ✅ Ready to make money!

### Share Your URLs

- **Main site:** `https://your-domain.com`
- **Login:** `https://your-domain.com/login`
- **Sales page:** Create a landing page to sell subscriptions

---

## 📞 Post-Deployment Support

Monitor these metrics:
- User signups
- Login success rate
- Signal generation
- Error rates
- Page load times

Set up alerts in Vercel/Netlify for:
- Build failures
- High error rates
- Performance issues

---

**Congratulations on your deployment!** 🎉

Now focus on marketing and getting your first customers! 💰

Need help? Check:
- Vercel docs: https://vercel.com/docs
- Netlify docs: https://docs.netlify.com
- Supabase docs: https://supabase.com/docs
