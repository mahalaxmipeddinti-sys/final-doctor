// api/index.ts - Complete Vercel Serverless Function entry point
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
import {
  getSavedAnalyses,
  getAnalysisById,
  deleteAnalysisById,
  getHistoryOverview,
  getGeneticTests,
  saveGeneticTest,
  getEvidenceByAnalysisId,
  getUserActivityLogs,
} from '../src/db/analyses.ts';
import { BENCHMARK_VARIANTS } from '../src/services/benchmarkVariants.ts';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '15mb' }));

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://nvxuuradeoxznbhipaer.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_0rrORMBosLIL4q2u5Pc9Ew_VvU91jtt';

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

async function requireAuth(req: Request, res: Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization bearer token' });
  }
  const token = authHeader.split('Bearer ')[1].trim();
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session token' });
    }
    (req as any).user = user;
    next();
  } catch (err: any) {
    res.status(500).json({ error: 'Authentication verification failure' });
  }
}

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Benchmark variants
router.get('/benchmark-variants', (req, res) => {
  res.json(BENCHMARK_VARIANTS);
});

router.get('/benchmarks', (req, res) => {
  res.json(BENCHMARK_VARIANTS);
});

// Normalize variant
router.post('/normalize', (req, res) => {
  try {
    const { input, assembly } = req.body;
    const normalized = normalizeVariantInput(input, assembly || 'GRCh38');
    res.json(normalized);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/variants/validate', (req, res) => {
  try {
    const { input, assembly = 'GRCh38' } = req.body;
    if (!input) return res.status(400).json({ error: 'Variant input string is required' });
    const normalized = normalizeVariantInput(input, assembly);
    res.json(normalized);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Validation failed' });
  }
});

router.post('/variants/lookup', async (req, res) => {
  try {
    const { variant } = req.body;
    if (!variant) return res.status(400).json({ error: 'Normalized variant object is required' });
    const record = await fetchClinVarRecord(variant);
    if (!record) return res.status(404).json({ message: 'No ClinVar record found for variant', record: null });
    res.json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'ClinVar lookup failed' });
  }
});

router.post('/variants/annotate', async (req, res) => {
  try {
    const { variant } = req.body;
    if (!variant) return res.status(400).json({ error: 'Normalized variant object is required' });
    const annotation = await annotateVariant(variant);
    res.json(annotation);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Annotation failed' });
  }
});

router.post('/predict', (req, res) => {
  try {
    const { variant, annotation } = req.body;
    if (!variant || !annotation) return res.status(400).json({ error: 'Variant and annotation are required' });
    const prediction = runMLPathogenicityInference(variant, annotation);
    res.json(prediction);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Inference failed' });
  }
});

router.get('/acmg/registry', (req, res) => {
  res.json({
    rulesetVersion: ACMG_RULESET_VERSION,
    totalCriteria: Object.keys(ACMG_CRITERIA_REGISTRY).length,
    registry: ACMG_CRITERIA_REGISTRY,
  });
});

router.post('/acmg/evaluate', (req, res) => {
  try {
    const { variant, annotation, clinvar, userOverrides } = req.body;
    if (!variant || !annotation) return res.status(400).json({ error: 'Variant and annotation are required' });
    const evaluation = evaluateACMGGuidelines(variant, annotation, clinvar, userOverrides);
    res.json(evaluation);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'ACMG evaluation failed' });
  }
});

router.post('/acmg/explain', (req, res) => {
  try {
    const { analysisId = 'exp-01', variant, acmgResult, annotation, clinvar, mlPrediction } = req.body;
    if (!variant || !acmgResult) return res.status(400).json({ error: 'Variant and acmgResult are required' });
    const explanation = generateACMGExplanation(analysisId, variant, acmgResult, annotation, clinvar, mlPrediction);
    res.json(explanation);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'ACMG explanation generation failed' });
  }
});

router.get('/acmg/run-tests', async (req, res) => {
  try {
    const report = await runAutomatedACMGTests();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Automated test suite execution failed' });
  }
});

// Execute variant analysis
router.post('/analyze', optionalAuth, async (req, res) => {
  try {
    const { input, assembly = 'GRCh38', userOverrides, overrides, trioInput } = req.body;
    const authenticatedUserId = (req as any).user?.id || req.body.userId || 'anonymous';
    if (!input) {
      return res.status(400).json({ error: 'Variant input is required' });
    }
    const result = await executeVariantAnalysis(
      input,
      assembly,
      authenticatedUserId,
      userOverrides || overrides || {},
      trioInput
    );
    res.json(result);
  } catch (err: any) {
    console.error('Analysis error in api/index.ts:', err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// --- HISTORY ENDPOINTS ---
router.get('/history/overview', optionalAuth, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user?.id || req.query.userId as string || 'anonymous';
    const overview = await getHistoryOverview(authenticatedUserId);
    res.json(overview);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch history overview' });
  }
});

router.get('/history/analyses', optionalAuth, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user?.id || req.query.userId as string || 'anonymous';
    const { page, limit, search, classification, status } = req.query;
    const data = await getSavedAnalyses(authenticatedUserId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search: search as string,
      classification: classification as string,
      status: status as string,
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch analyses history' });
  }
});

router.get('/history/analyses/:id', optionalAuth, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user?.id || req.query.userId as string || 'anonymous';
    const record = await getAnalysisById(req.params.id, authenticatedUserId);
    if (!record) return res.status(404).json({ error: 'Analysis record not found' });
    res.json(record);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch analysis' });
  }
});

router.delete('/history/analyses/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const deleted = await deleteAnalysisById(req.params.id, authenticatedUserId);
    if (!deleted) return res.status(404).json({ error: 'Analysis record not found or unauthorized' });
    res.json({ success: true, message: 'Analysis record deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete analysis' });
  }
});

router.get('/history/tests', optionalAuth, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user?.id || req.query.userId as string || 'anonymous';
    const testType = req.query.testType as string;
    const tests = await getGeneticTests(authenticatedUserId, testType);
    res.json(tests);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch genetic test records' });
  }
});

router.post('/history/tests', requireAuth, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user.id;
    const saved = await saveGeneticTest(req.body, authenticatedUserId);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save genetic test record' });
  }
});

router.get('/history/activity', optionalAuth, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user?.id || req.query.userId as string || 'anonymous';
    const limit = req.query.limit ? Number(req.query.limit) : 25;
    const logs = await getUserActivityLogs(authenticatedUserId, limit);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch activity logs' });
  }
});

// Backward-compatible routes
router.get('/analyses', optionalAuth, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user?.id || 'anonymous';
    const history = await getSavedAnalyses(authenticatedUserId, { limit: 30 });
    res.json(history.records);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch history' });
  }
});

router.get('/analyses/:id', optionalAuth, async (req, res) => {
  try {
    const authenticatedUserId = (req as any).user?.id || 'anonymous';
    const analysis = await getAnalysisById(req.params.id, authenticatedUserId);
    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch analysis' });
  }
});

// Mount router on both /api and / to handle all routing conventions
app.use('/api', router);
app.use('/', router);

export default app;
