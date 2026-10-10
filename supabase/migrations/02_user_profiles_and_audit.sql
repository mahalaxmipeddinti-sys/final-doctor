-- Supabase Additive Migration: 02_user_profiles_and_audit.sql
-- Project: GenomeGuard AI — Genomic Variant Pathogenicity Predictor & ACMG Classifier

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked to auth.users.id)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  photo_url TEXT,
  role TEXT DEFAULT 'Clinical Geneticist',
  institution TEXT DEFAULT 'Genomics Medical Center',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backward compatibility view if application queries user_profiles
CREATE OR REPLACE VIEW public.user_profiles AS
  SELECT id, email, COALESCE(display_name, full_name) AS display_name, COALESCE(photo_url, avatar_url) AS photo_url, role, institution, created_at, updated_at
  FROM public.profiles;

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile Row-Level Security Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

--------------------------------------------------------------------------------
-- 2. AUTOMATIC PROFILE CREATION TRIGGER ON USER SIGNUP
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, display_name, email, avatar_url, photo_url, role, institution)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'display_name', 'Clinician'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', 'Clinician'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Clinical Geneticist'),
    COALESCE(NEW.raw_user_meta_data->>'institution', 'Genomics Medical Center')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

--------------------------------------------------------------------------------
-- 3. VARIANT ANALYSES WITH ROW LEVEL SECURITY
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.variant_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gene_symbol TEXT NOT NULL,
  hgvs_c TEXT NOT NULL,
  hgvs_p TEXT,
  chromosome TEXT NOT NULL,
  position BIGINT NOT NULL,
  ref_allele TEXT NOT NULL,
  alt_allele TEXT NOT NULL,
  genome_build TEXT DEFAULT 'GRCh38',
  acmg_classification TEXT NOT NULL,
  pathogenicity_score NUMERIC(5, 4),
  clinvar_accession TEXT,
  annotation_data JSONB,
  acmg_criteria JSONB,
  ml_predictions JSONB,
  report_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variant_analyses_user_id ON public.variant_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_variant_analyses_gene ON public.variant_analyses(gene_symbol);

ALTER TABLE public.variant_analyses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'variant_analyses' AND policyname = 'Users can select own variant analyses'
  ) THEN
    CREATE POLICY "Users can select own variant analyses"
      ON public.variant_analyses FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'variant_analyses' AND policyname = 'Users can insert own variant analyses'
  ) THEN
    CREATE POLICY "Users can insert own variant analyses"
      ON public.variant_analyses FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'variant_analyses' AND policyname = 'Users can update own variant analyses'
  ) THEN
    CREATE POLICY "Users can update own variant analyses"
      ON public.variant_analyses FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'variant_analyses' AND policyname = 'Users can delete own variant analyses'
  ) THEN
    CREATE POLICY "Users can delete own variant analyses"
      ON public.variant_analyses FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
