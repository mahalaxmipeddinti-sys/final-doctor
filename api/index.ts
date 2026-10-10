// api/index.ts - Vercel Serverless Function entry point
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { normalizeVariantInput } from '../src/services/variantNormalization.ts';
import { fetchClinVarRecord } from '../src/services/clinvarClient.ts';
import { annotateVariant } from '../src/services/annotationService.ts';
import { runMLPathogenicityInference } from '../src/services/mlPredictor.ts';
import { evaluateACMGGuidelines } from '../src/services/acmgRulesEngine.ts';
import { ACMG_CRITERIA_REGISTRY, ACMG_RULESET_VERSION } from '../src/services/acmgRegistry.ts';
import { generateACMGExplanation } from '../src/services/acmgExplainer.ts';
import { runAutomatedACMGTests } from '../src/services/acmgTests.ts';
import { executeVariantAnalysis } from '../src/services/analysisPipeline.ts';
import { generateMarkdownReport, generateJsonExport } from '../src/services/reportGenerator.ts';
import { getRecentAnalyses, getAnalysisById, deleteAnalysisById } from '../src/db/analyses.ts';
import { BENCHMARK_VARIANTS } from '../src/services/benchmarkVariants.ts';
import { extractVariantFromReportText } from '../src/services/trioService.ts';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '15mb' }));

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://placeholder-project.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'placeholder';

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function optionalAuth(req: Request, res: Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    if (token) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          (req as any).user = user;
        }
      } catch {
        // Continue
      }
    }
  }
  next();
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Benchmark variants
app.get('/api/benchmark-variants', (req, res) => {
  res.json(BENCHMARK_VARIANTS);
});

// Normalize variant
app.post('/api/normalize', (req, res) => {
  try {
    const { input, assembly } = req.body;
    const normalized = normalizeVariantInput(input, assembly || 'GRCh38');
    res.json(normalized);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Execute variant analysis
app.post('/api/analyze', optionalAuth, async (req, res) => {
  try {
    const { input, assembly, overrides, customVariantDetails, trioInput } = req.body;
    const authenticatedUserId = (req as any).user?.id || 'anonymous';
    const result = await executeVariantAnalysis(input, assembly || 'GRCh38', overrides || {}, {
      customVariantDetails,
      trioInput,
      authenticatedUserId,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// Analyses history
app.get('/api/analyses', optionalAuth, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user?.id || 'anonymous';
    const analyses = await getRecentAnalyses(20, authenticatedUserId);
    res.json(analyses);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve analyses' });
  }
});

app.get('/api/analyses/:id', optionalAuth, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user?.id || 'anonymous';
    const analysis = await getAnalysisById(req.params.id, authenticatedUserId);
    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch analysis' });
  }
});

export default app;
