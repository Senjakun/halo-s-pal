-- Drop existing RLS policies for emails
DROP POLICY IF EXISTS "Users can view their own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can insert their own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can update their own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can delete their own emails" ON public.emails;

-- Create new public access policies for emails (no auth required)
-- Anyone can view emails based on to_email address
CREATE POLICY "Anyone can view emails by recipient" 
ON public.emails 
FOR SELECT 
USING (true);

-- Anyone can insert emails (for receiving external emails)
CREATE POLICY "Anyone can insert emails" 
ON public.emails 
FOR INSERT 
WITH CHECK (true);

-- Anyone can update emails (mark as read, star, etc.)
CREATE POLICY "Anyone can update emails" 
ON public.emails 
FOR UPDATE 
USING (true);

-- Anyone can delete emails
CREATE POLICY "Anyone can delete emails" 
ON public.emails 
FOR DELETE 
USING (true);

-- Drop existing attachment policies
DROP POLICY IF EXISTS "Users can view attachments for their emails" ON public.email_attachments;
DROP POLICY IF EXISTS "Users can insert attachments for their emails" ON public.email_attachments;
DROP POLICY IF EXISTS "Users can delete attachments for their emails" ON public.email_attachments;

-- Create public access policies for attachments
CREATE POLICY "Anyone can view attachments" 
ON public.email_attachments 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert attachments" 
ON public.email_attachments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete attachments" 
ON public.email_attachments 
FOR DELETE 
USING (true);

-- Make user_id nullable in emails table (since we no longer require auth)
ALTER TABLE public.emails ALTER COLUMN user_id DROP NOT NULL;