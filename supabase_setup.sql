-- ==============================================================================
-- FIRST LOOK PLATFORM - SUPABASE BACKEND SCHEMA & RLS POLICIES FOR SCORE UPDATES
-- ==============================================================================
-- Run this SQL in your Supabase Dashboard -> SQL Editor (or migrations).
-- This fixes the issue where the `score` column is not updating in the backend
-- due to Row-Level Security (RLS) or missing columns.
-- ==============================================================================

-- 1. Ensure `posts` table has the required score and tracking columns
DO $$ 
BEGIN
  -- Add `score` column if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'score'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN score numeric DEFAULT 0;
  END IF;

  -- Add `liked_by` array column if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'liked_by'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN liked_by text[] DEFAULT '{}';
  END IF;

  -- Add `downvoted_by` array column if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'downvoted_by'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN downvoted_by text[] DEFAULT '{}';
  END IF;

  -- Add `comments` json column if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'comments'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN comments jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add `solutions` json column if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'solutions'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN solutions jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add `resolved` boolean column if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'resolved'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN resolved boolean DEFAULT false;
  END IF;
END $$;

-- 2. ROW-LEVEL SECURITY (RLS) POLICIES FOR `posts`
-- In Supabase, if RLS is enabled, non-author and anon users are blocked from
-- updating the score of posts by default. The policies below allow public
-- voting and solution submissions while preserving read/write access.

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if needed (safe recreation)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.posts;
DROP POLICY IF EXISTS "Enable insert for authenticated and anon users" ON public.posts;
DROP POLICY IF EXISTS "Enable update for all users" ON public.posts;
DROP POLICY IF EXISTS "Allow public read on posts" ON public.posts;
DROP POLICY IF EXISTS "Allow public insert on posts" ON public.posts;
DROP POLICY IF EXISTS "Allow public update on posts" ON public.posts;
DROP POLICY IF EXISTS "Allow public delete on posts" ON public.posts;

-- Allow everyone (anon and authenticated) to view all posts
CREATE POLICY "Allow public read on posts" 
ON public.posts 
FOR SELECT 
USING (true);

-- Allow everyone to create problems
CREATE POLICY "Allow public insert on posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (true);

-- CRITICAL: Allow updating posts for voting (score), solutions, and comments
-- Without this policy, Supabase silently rejects updates to the `score` column (0 rows affected)
CREATE POLICY "Allow public update on posts" 
ON public.posts 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Allow deletion
CREATE POLICY "Allow public delete on posts" 
ON public.posts 
FOR DELETE 
USING (true);

-- 3. OPTIONAL: STORED PROCEDURE FOR ATOMIC VOTING (BYPASSES RLS VIA SECURITY DEFINER)
-- This function can be called directly via `supabase.rpc('vote_post', ...)`
CREATE OR REPLACE FUNCTION public.vote_post(
  p_post_id bigint,
  p_score numeric,
  p_voter_id text,
  p_direction text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  UPDATE public.posts
  SET score = p_score
  WHERE id = p_post_id
  RETURNING to_jsonb(posts.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execution permissions on the RPC function
GRANT EXECUTE ON FUNCTION public.vote_post(bigint, numeric, text, text) TO anon, authenticated, service_role;

-- 4. Quick verification: ensure sample posts have initial score if null
UPDATE public.posts 
SET score = 0 
WHERE score IS NULL;
