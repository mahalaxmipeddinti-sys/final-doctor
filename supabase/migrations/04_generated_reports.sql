-- ============================================================================
-- GENOMEGUARD AI: GENERATED PDF REPORTS MIGRATION
-- MIGRATION: 04_generated_reports.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.generated_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.variant_analyses(id) ON DELETE SET NULL,
  report_title TEXT NOT NULL,
  report_status TEXT NOT NULL DEFAULT 'generated' CHECK (report_status IN ('generating', 'generated', 'failed', 'archived')),
  report_schema_version TEXT DEFAULT 'v1.0.0',
  summary_findings TEXT,
  pdf_filename TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_reports_user_id ON public.generated_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_analysis_id ON public.generated_reports(analysis_id);

ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'generated_reports' AND policyname = 'Users can view own generated reports') THEN
    CREATE POLICY "Users can view own generated reports" ON public.generated_reports FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'generated_reports' AND policyname = 'Users can insert own generated reports') THEN
    CREATE POLICY "Users can insert own generated reports" ON public.generated_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'generated_reports' AND policyname = 'Users can delete own generated reports') THEN
    CREATE POLICY "Users can delete own generated reports" ON public.generated_reports FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
