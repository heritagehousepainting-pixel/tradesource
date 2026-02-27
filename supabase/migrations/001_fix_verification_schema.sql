-- Migration: Fix Verification Schema Issues
-- Addresses database schema problems found in profile verification

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_documents jsonb;

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false);

-- Storage policies for verification documents
CREATE POLICY "Users can upload their own verification docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'verification-docs' 
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can view their own verification docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verification-docs' 
    AND (
      auth.uid()::text = (string_to_array(name, '/'))[1]
      OR EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.is_admin = true
      )
    )
  );

CREATE POLICY "Users can update their own verification docs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'verification-docs' 
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can delete their own verification docs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'verification-docs' 
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Create admin policy for users table (admins can update verification status)
CREATE POLICY "Admins can update verification status" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid() 
      AND admin_user.is_admin = true
    )
  );

-- Update the existing users RLS policy to allow admins to see all users
DROP POLICY IF EXISTS "Users can read all users" ON users;
CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);

-- Add index for faster verification status queries
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(is_admin) WHERE is_admin = true;

-- Insert Jack as admin (replace with actual user ID after signup)
-- This should be run after Jack signs up for the first time
-- UPDATE users SET is_admin = true WHERE email LIKE '%heritagehousepainting%' OR email LIKE '%jack%';

COMMENT ON TABLE users IS 'Updated with verification_documents JSONB field and is_admin flag';
COMMENT ON COLUMN users.verification_documents IS 'Stores file paths for uploaded verification documents: {driver_license, pa_license, insurance_cert, w9_form, submitted_at}';
COMMENT ON COLUMN users.is_admin IS 'Allows user to approve/reject contractor verifications';