-- Supabase Database Migration File: 01_initial_schema.sql
-- Project: PS-10 Genomic Variant Pathogenicity Predictor & ACMG Guideline Compliance Classifier

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. PROFILES TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT DEFAULT 'Clinical Geneticist',
  institution TEXT DEFAULT 'Genomics Medical Center',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profile RLS Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

--------------------------------------------------------------------------------
-- 2. AUTOMATIC PROFILE CREATION TRIGGER
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, institution)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Clinical Analyst'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    'Clinical Geneticist',
    'Genomics Research Hospital'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

--------------------------------------------------------------------------------
-- 3. VARIANT ANALYSES PERSISTENCE TABLE
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

-- Index for high-performance user isolation queries
CREATE INDEX IF NOT EXISTS idx_variant_analyses_user_id ON public.variant_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_variant_analyses_gene ON public.variant_analyses(gene_symbol);

-- Enable RLS on Variant Analyses
ALTER TABLE public.variant_analyses ENABLE ROW LEVEL SECURITY;

-- Row Level Security (RLS) Policies for Variant Analyses
CREATE POLICY "Users can select own variant analyses"
  ON public.variant_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own variant analyses"
  ON public.variant_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own variant analyses"
  ON public.variant_analyses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own variant analyses"
  ON public.variant_analyses FOR DELETE
  USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 4. TRIO FAMILY PEDIGREE ANALYSES TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trio_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proband_id TEXT NOT NULL,
  mother_id TEXT,
  father_id TEXT,
  inheritance_pattern TEXT NOT NULL, -- e.g., 'De Novo', 'Autosomal Recessive', 'Maternal', 'Paternal'
  shared_variants_count INTEGER DEFAULT 0,
  trio_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for Trio Analyses
CREATE INDEX IF NOT EXISTS idx_trio_analyses_user_id ON public.trio_analyses(user_id);

-- Enable RLS on Trio Analyses
ALTER TABLE public.trio_analyses ENABLE ROW LEVEL SECURITY;

-- Trio Analyses RLS Policies
CREATE POLICY "Users can select own trio analyses"
  ON public.trio_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trio analyses"
  ON public.trio_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trio analyses"
  ON public.trio_analyses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trio analyses"
  ON public.trio_analyses FOR DELETE
  USING (auth.uid() = user_id);
