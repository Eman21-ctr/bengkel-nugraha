-- Migration: Add storage bucket for logos
-- Run this in your Supabase SQL editor

-- Create a storage bucket for store logos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public Logo Access" ON storage.objects
FOR SELECT
USING (bucket_id = 'logos');

-- Allow authenticated users to upload
CREATE POLICY "Auth users can upload logos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'logos');

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "Auth users can update logos" ON storage.objects  
FOR UPDATE TO authenticated
USING (bucket_id = 'logos');

CREATE POLICY "Auth users can delete logos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'logos');
