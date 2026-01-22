-- Users Table Schema for Quotex Trading Bot
-- Run this SQL in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    subscription_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_subscription_end ON public.users(subscription_end);

-- Disable Row Level Security for testing (enable in production with proper policies)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed for your setup)
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;

-- Optional: Insert a default admin user (uncomment to use)
-- INSERT INTO public.users (username, password, is_admin, is_active, subscription_end)
-- VALUES ('admin@admin.com', 'admin123', true, true, NOW() + INTERVAL '10 years')
-- ON CONFLICT (username) DO NOTHING;

-- Optional: View to check user subscriptions
CREATE OR REPLACE VIEW public.active_users AS
SELECT 
    id,
    username,
    is_admin,
    subscription_end,
    created_at,
    (subscription_end > NOW()) as has_valid_subscription
FROM public.users
WHERE is_active = true;

COMMENT ON TABLE public.users IS 'User accounts with subscription management';
COMMENT ON COLUMN public.users.username IS 'User email address or unique username';
COMMENT ON COLUMN public.users.password IS 'Plain text password (should be hashed in production)';
COMMENT ON COLUMN public.users.is_admin IS 'Admin access flag';
COMMENT ON COLUMN public.users.is_active IS 'Active subscription status';
COMMENT ON COLUMN public.users.subscription_end IS 'Subscription expiry date';
