-- ============================================================================
-- GENOMEGUARD AI: COMPREHENSIVE USER HISTORY, EVIDENCE & AUDIT SCHEMA
-- MIGRATION: 03_history_and_evidence_system.sql
-- ============================================================================

-- 1. Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Logical Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'Clinical Geneticist',
  institution TEXT DEFAULT 'Genomics Medical Center',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 3. Logical Table: variant_analyses
CREATE TABLE IF NOT EXISTS public.variant_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant_identifier TEXT,
  gene_symbol TEXT,
  chromosome TEXT,
  position BIGINT,
  reference_allele TEXT,
  alternate_allele TEXT,
  assembly TEXT DEFAULT 'GRCh38',
  input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  prediction_result JSONB DEFAULT NULL,
  acmg_classification TEXT,
  acmg_score NUMERIC(5,2),
  ml_pathogenicity_score NUMERIC(5,4),
  analysis_status TEXT NOT NULL DEFAULT 'completed' CHECK (analysis_status IN ('pending', 'running', 'completed', 'failed')),
  error_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_variant_analyses_user_id ON public.variant_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_variant_analyses_status ON public.variant_analyses(analysis_status);
CREATE INDEX IF NOT EXISTS idx_variant_analyses_created_at ON public.variant_analyses(created_at DESC);

ALTER TABLE public.variant_analyses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'variant_analyses' AND policyname = 'Users can select own variant analyses') THEN
    CREATE POLICY "Users can select own variant analyses" ON public.variant_analyses FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'variant_analyses' AND policyname = 'Users can insert own variant analyses') THEN
    CREATE POLICY "Users can insert own variant analyses" ON public.variant_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'variant_analyses' AND policyname = 'Users can update own variant analyses') THEN
    CREATE POLICY "Users can update own variant analyses" ON public.variant_analyses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'variant_analyses' AND policyname = 'Users can delete own variant analyses') THEN
    CREATE POLICY "Users can delete own variant analyses" ON public.variant_analyses FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. Logical Table: evidence_reports
CREATE TABLE IF NOT EXISTS public.evidence_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES public.variant_analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinvar_evidence JSONB DEFAULT NULL,
  functional_population_evidence JSONB DEFAULT NULL,
  predictor_evidence JSONB DEFAULT NULL,
  acmg_criteria JSONB DEFAULT NULL,
  discordance_summary JSONB DEFAULT NULL,
  source_provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_timestamp TIMESTAMPTZ DEFAULT NOW(),
  schema_version TEXT DEFAULT 'v1.0.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_reports_analysis_id ON public.evidence_reports(analysis_id);
CREATE INDEX IF NOT EXISTS idx_evidence_reports_user_id ON public.evidence_reports(user_id);

ALTER TABLE public.evidence_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'evidence_reports' AND policyname = 'Users can view own evidence reports') THEN
    CREATE POLICY "Users can view own evidence reports" ON public.evidence_reports FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'evidence_reports' AND policyname = 'Users can insert own evidence reports') THEN
    CREATE POLICY "Users can insert own evidence reports" ON public.evidence_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'evidence_reports' AND policyname = 'Users can delete own evidence reports') THEN
    CREATE POLICY "Users can delete own evidence reports" ON public.evidence_reports FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Logical Table: genetic_test_records
CREATE TABLE IF NOT EXISTS public.genetic_test_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL CHECK (test_type IN (
    'PCR', 'Sanger sequencing', 'NGS', 'WES', 'WGS', 
    'DNA microarray', 'CMA', 'genotyping/SNP testing', 'karyotyping'
  )),
  test_date DATE DEFAULT CURRENT_DATE,
  source_or_laboratory TEXT,
  record_status TEXT NOT NULL DEFAULT 'verified' CHECK (record_status IN ('pending', 'verified', 'inconclusive', 'rejected')),
  structured_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  linked_analysis_id UUID REFERENCES public.variant_analyses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_genetic_test_records_user_id ON public.genetic_test_records(user_id);
CREATE INDEX IF NOT EXISTS idx_genetic_test_records_test_type ON public.genetic_test_records(test_type);

ALTER TABLE public.genetic_test_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'genetic_test_records' AND policyname = 'Users can view own genetic test records') THEN
    CREATE POLICY "Users can view own genetic test records" ON public.genetic_test_records FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'genetic_test_records' AND policyname = 'Users can insert own genetic test records') THEN
    CREATE POLICY "Users can insert own genetic test records" ON public.genetic_test_records FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'genetic_test_records' AND policyname = 'Users can update own genetic test records') THEN
    CREATE POLICY "Users can update own genetic test records" ON public.genetic_test_records FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'genetic_test_records' AND policyname = 'Users can delete own genetic test records') THEN
    CREATE POLICY "Users can delete own genetic test records" ON public.genetic_test_records FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 6. Logical Table: activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  event_summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_logs' AND policyname = 'Users can view own activity logs') THEN
    CREATE POLICY "Users can view own activity logs" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_logs' AND policyname = 'Users can insert own activity logs') THEN
    CREATE POLICY "Users can insert own activity logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 7. Trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_genetic_test_records_updated_at ON public.genetic_test_records;
CREATE TRIGGER trg_genetic_test_records_updated_at
BEFORE UPDATE ON public.genetic_test_records
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();
