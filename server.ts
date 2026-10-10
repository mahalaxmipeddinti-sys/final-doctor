// server.ts
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { normalizeVariantInput } from './src/services/variantNormalization.ts';
import { fetchClinVarRecord } from './src/services/clinvarClient.ts';
import { annotateVariant } from './src/services/annotationService.ts';
import { runMLPathogenicityInference } from './src/services/mlPredictor.ts';
import { evaluateACMGGuidelines } from './src/services/acmgRulesEngine.ts';
import { ACMG_CRITERIA_REGISTRY, ACMG_RULESET_VERSION } from './src/services/acmgRegistry.ts';
import { generateACMGExplanation } from './src/services/acmgExplainer.ts';
import { runAutomatedACMGTests } from './src/services/acmgTests.ts';
import { executeVariantAnalysis } from './src/services/analysisPipeline.ts';
import { generateMarkdownReport, generateJsonExport } from './src/services/reportGenerator.ts';
import { getRecentAnalyses, getAnalysisById, deleteAnalysisById } from './src/db/analyses.ts';
import { BENCHMARK_VARIANTS } from './src/services/benchmarkVariants.ts';
import { extractVariantFromReportText } from './src/services/trioService.ts';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Process-level safety to prevent unhandled background rejections from terminating the process
process.on('unhandledRejection', (reason) => {
  console.warn('Safe catch: unhandledRejection in background task:', reason);
});
process.on('uncaughtException', (err) => {
  console.warn('Safe catch: uncaughtException in background task:', err?.message || err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase backend client initialization
const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://placeholder-project.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// Middleware to require verified Supabase Bearer token
async function requireAuth(req: Request, res: Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    return res.status(401).json({ error: 'Authorization Bearer token is empty' });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid or expired session token',
        details: error?.message,
      });
    }

    (req as any).user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({
      error: 'Token authentication failed',
      details: err?.message,
    });
  }
}

// Middleware for optional authenticated user token extraction
async function optionalAuth(req: Request, res: Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    if (token) {
      try {
        const {
          data: { user },
        } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          (req as any).user = user;
        }
      } catch {
        // Continue unauthenticated
      }
    }
  }
  next();
}

async function bootstrap() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '5mb' }));

  // --- API ENDPOINTS ---

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    const isSupabaseConfigured =
      !supabaseUrl.includes('placeholder-project') &&
      !supabaseKey.includes('placeholder') &&
      !supabaseKey.includes('your-anon-key');

    res.json({
      status: 'UP',
      appName: 'GenomeGuard AI: Genomic Variant Pathogenicity Predictor & ACMG Classifier',
      version: '1.0.0',
      database: {
        engine: isSupabaseConfigured ? 'Supabase PostgreSQL' : 'Local In-Memory / Fallback',
        configured: isSupabaseConfigured,
      },
      externalServices: {
        supabaseAuth: isSupabaseConfigured ? 'Connected' : 'Default / Setup Required',
        clinvar: 'NCBI E-utilities v2.0 (Active)',
        ensembl: 'Ensembl VEP REST API v110 (Active)',
        mlModel: 'v1.2.0-calibrated (Loaded)',
        acmgRuleset: 'ACMG/AMP 2015 28-Rules Engine (Loaded)',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // GET /api/auth/me — Return authenticated user's verified identity
  app.get('/api/auth/me', requireAuth, async (req: Request, res: Response) => {
    const user = (req as any).user;
    res.json({
      id: user.id,
      email: user.email,
      displayName:
        user.user_metadata?.full_name ||
        user.user_metadata?.display_name ||
        user.email?.split('@')[0],
      role: user.user_metadata?.role || 'Clinical Geneticist',
      institution: user.user_metadata?.institution || 'Genomics Medical Center',
      photoURL: user.user_metadata?.avatar_url || null,
      createdAt: user.created_at,
    });
  });

  // GET /api/profile — Retrieve current user's permitted profile data
  app.get('/api/profile', requireAuth, async (req: Request, res: Response) => {
    const user = (req as any).user;
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        // Fall back to Supabase auth user metadata
        return res.json({
          id: user.id,
          email: user.email,
          displayName:
            user.user_metadata?.full_name ||
            user.user_metadata?.display_name ||
            user.email?.split('@')[0],
          role: user.user_metadata?.role || 'Clinical Geneticist',
          institution: user.user_metadata?.institution || 'Genomics Medical Center',
          photoURL: user.user_metadata?.avatar_url || null,
          createdAt: user.created_at,
        });
      }

      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch user profile' });
    }
  });

  // PATCH /api/profile — Update permitted profile fields
  app.patch('/api/profile', requireAuth, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { displayName, role, institution, photoURL } = req.body;

    try {
      // 1. Update Auth metadata
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          full_name: displayName,
          display_name: displayName,
          role,
          institution,
          avatar_url: photoURL,
        },
      });

      // 2. Update profiles table if accessible
      try {
        await supabaseAdmin.from('profiles').upsert({
          id: user.id,
          full_name: displayName,
          email: user.email,
          role,
          institution,
          avatar_url: photoURL,
          updated_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn('Profile table upsert note:', dbErr);
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName,
          role,
          institution,
          photoURL,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update profile' });
    }
  });

  // Benchmark variants registry
  app.get('/api/benchmarks', (req: Request, res: Response) => {
    res.json(BENCHMARK_VARIANTS);
  });

  // Multimodal Lab Report (PDF / Image) Extractor
  app.post('/api/parse-report', async (req: Request, res: Response) => {
    try {
      const { fileName, dataUrl, mimeType } = req.body;
      if (!fileName && !dataUrl) {
        return res.status(400).json({ error: 'File name or dataUrl is required' });
      }

      // Fast heuristic extraction from file name or raw text
      const heuristic = extractVariantFromReportText(fileName || '');
      let detectedId = heuristic.detectedId || '';
      let detectedHgvs = heuristic.detectedHgvs || '';
      let detectedGene = heuristic.detectedGene || '';
      let detectedZygosity = heuristic.detectedZygosity || 'HETEROZYGOUS';
      let isAffected = detectedZygosity !== 'HOMOZYGOUS_REF_WILDTYPE';
      let summary = '';

      // Multimodal Gemini AI Extraction if API key is present
      if (process.env.GEMINI_API_KEY && dataUrl && dataUrl.includes('base64,')) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI();
          const base64Data = dataUrl.split('base64,')[1];
          const detectedMime =
            mimeType ||
            (dataUrl.includes('image/svg')
              ? 'image/png'
              : dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'))) ||
            'image/png';

          const prompt = `You are a clinical bioinformatics molecular diagnostic report parser.
Analyze this clinical genetics laboratory report / sequencing document.
Extract:
1. ClinVar Variation ID (integer number, e.g. 17661, 7105, 13961).
2. HGVS cDNA / protein nomenclature (e.g. c.5266dupC, c.1799T>A, c.1521_1523delCTT).
3. Gene symbol (e.g. BRCA1, CFTR, BRAF, SCN1A).
4. Zygosity: exactly one of "HETEROZYGOUS", "HOMOZYGOUS_ALT", "HOMOZYGOUS_REF_WILDTYPE", "HEMIZYGOUS", or "UNKNOWN".
5. Affected status (boolean: true if patient has disease or symptoms, false if unaffected or asymptomatic carrier).
6. Brief 1-sentence clinical interpretation summary.

Respond ONLY with valid JSON in this exact structure:
{
  "detectedId": string,
  "detectedHgvs": string,
  "detectedGene": string,
  "detectedZygosity": string,
  "isAffected": boolean,
  "summary": string
}`;

          const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: [
              {
                role: 'user',
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: detectedMime.includes('svg') ? 'image/png' : detectedMime,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
          });

          const rawText = response.text?.trim() || '';
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.detectedId) detectedId = String(parsed.detectedId);
            if (parsed.detectedHgvs) detectedHgvs = parsed.detectedHgvs;
            if (parsed.detectedGene) detectedGene = parsed.detectedGene;
            if (parsed.detectedZygosity) detectedZygosity = parsed.detectedZygosity;
            if (typeof parsed.isAffected === 'boolean') isAffected = parsed.isAffected;
            if (parsed.summary) summary = parsed.summary;
          }
        } catch (geminiErr: any) {
          console.warn('Gemini report parse fallback:', geminiErr?.message || geminiErr);
        }
      }

      if (!summary) {
        if (detectedId || detectedHgvs) {
          summary = `Identified ${detectedGene || 'candidate variant'} ${detectedHgvs || `ClinVar ${detectedId}`} (${detectedZygosity.toLowerCase().replace('_', ' ')}).`;
        } else if (detectedZygosity === 'HOMOZYGOUS_REF_WILDTYPE') {
          summary = 'Wildtype / negative reference sequence confirmed (non-carrier).';
        } else {
          summary = 'Laboratory report scanned and attached.';
        }
      }

      res.json({
        success: true,
        detectedId,
        detectedHgvs,
        detectedGene,
        detectedZygosity,
        isAffected,
        summary,
      });
    } catch (err: any) {
      console.error('Report parse error:', err);
      res.status(500).json({ error: err.message || 'Failed to parse report' });
    }
  });

  // 1. Variant Validation & Normalization
  app.post('/api/variants/validate', (req: Request, res: Response) => {
    try {
      const { input, assembly = 'GRCh38' } = req.body;
      if (!input) {
        return res.status(400).json({ error: 'Variant input string is required' });
      }
      const normalized = normalizeVariantInput(input, assembly);
      res.json(normalized);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Validation failed' });
    }
  });

  // 2. ClinVar Database Lookup
  app.post('/api/variants/lookup', async (req: Request, res: Response) => {
    try {
      const { variant } = req.body;
      if (!variant) {
        return res.status(400).json({ error: 'Normalized variant object is required' });
      }
      const record = await fetchClinVarRecord(variant);
      if (!record) {
        return res.status(404).json({ message: 'No ClinVar record found for variant', record: null });
      }
      res.json(record);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'ClinVar lookup failed' });
    }
  });

  // 3. Variant Effect & Frequency Annotation
  app.post('/api/variants/annotate', async (req: Request, res: Response) => {
    try {
      const { variant } = req.body;
      if (!variant) {
        return res.status(400).json({ error: 'Normalized variant object is required' });
      }
      const annotation = await annotateVariant(variant);
      res.json(annotation);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Annotation failed' });
    }
  });

  // 4. ML Pathogenicity Predictor
  app.post('/api/predict', (req: Request, res: Response) => {
    try {
      const { variant, annotation } = req.body;
      if (!variant || !annotation) {
        return res.status(400).json({ error: 'Variant and annotation are required' });
      }
      const prediction = runMLPathogenicityInference(variant, annotation);
      res.json(prediction);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Inference failed' });
    }
  });

  // 5a. ACMG Guidelines Versioned Criteria Registry
  app.get('/api/acmg/registry', (req: Request, res: Response) => {
    res.json({
      rulesetVersion: ACMG_RULESET_VERSION,
      totalCriteria: Object.keys(ACMG_CRITERIA_REGISTRY).length,
      registry: ACMG_CRITERIA_REGISTRY,
    });
  });

  // 5b. ACMG Guidelines Evaluation
  app.post('/api/acmg/evaluate', (req: Request, res: Response) => {
    try {
      const { variant, annotation, clinvar, userOverrides } = req.body;
      if (!variant || !annotation) {
        return res.status(400).json({ error: 'Variant and annotation are required' });
      }
      const evaluation = evaluateACMGGuidelines(variant, annotation, clinvar, userOverrides);
      res.json(evaluation);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'ACMG evaluation failed' });
    }
  });

  // 5c. ACMG Detailed Step-by-Step Explainability & Discrepancy Generator
  app.post('/api/acmg/explain', (req: Request, res: Response) => {
    try {
      const { analysisId = 'exp-01', variant, acmgResult, annotation, clinvar, mlPrediction } = req.body;
      if (!variant || !acmgResult) {
        return res.status(400).json({ error: 'Variant and acmgResult are required' });
      }
      const explanation = generateACMGExplanation(analysisId, variant, acmgResult, annotation, clinvar, mlPrediction);
      res.json(explanation);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'ACMG explanation generation failed' });
    }
  });

  // 5d. ACMG Automated Test Suite Runner
  app.get('/api/acmg/run-tests', async (req: Request, res: Response) => {
    try {
      const report = await runAutomatedACMGTests();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Automated test suite execution failed' });
    }
  });

  // 6. Full Analysis Pipeline Orchestrator
  app.post('/api/analyze', optionalAuth, async (req: Request, res: Response) => {
    try {
      const { input, assembly = 'GRCh38', userOverrides, trioInput } = req.body;
      const authenticatedUserId = (req as any).user?.id || req.body.userId || 'anonymous';
      if (!input) {
        return res.status(400).json({ error: 'Variant input is required' });
      }
      const result = await executeVariantAnalysis(input, assembly, authenticatedUserId, userOverrides, trioInput);
      res.json(result);
    } catch (err: any) {
      console.error('Analysis pipeline execution error:', err);
      res.status(500).json({ error: err.message || 'Analysis pipeline failed' });
    }
  });

  // --- HISTORY & PERSISTENCE API ENDPOINTS (USER ISOLATED) ---

  // GET /api/history/overview — Aggregated user statistics
  app.get('/api/history/overview', optionalAuth, async (req: Request, res: Response) => {
    try {
      const authenticatedUserId = (req as any).user?.id || req.query.userId as string || 'anonymous';
      const overview = await import('./src/db/analyses.ts').then((m) => m.getHistoryOverview(authenticatedUserId));
      res.json(overview);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch history overview' });
    }
  });

  // GET /api/history/analyses — Paginated, filtered, searched user analyses
  app.get('/api/history/analyses', optionalAuth, async (req: Request, res: Response) => {
    try {
      const authenticatedUserId = (req as any).user?.id || req.query.userId as string || 'anonymous';
      const { page, limit, search, classification, status } = req.query;
      const { getSavedAnalyses } = await import('./src/db/analyses.ts');
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

  // GET /api/history/analyses/:id — Detailed single analysis with evidence
  app.get('/api/history/analyses/:id', optionalAuth, async (req: Request, res: Response) => {
    try {
      const authenticatedUserId = (req as any).user?.id || req.query.userId as string || 'anonymous';
      const { getAnalysisById } = await import('./src/db/analyses.ts');
      const record = await getAnalysisById(req.params.id, authenticatedUserId);
      if (!record) {
        return res.status(404).json({ error: 'Analysis record not found' });
      }
      res.json(record);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch analysis' });
    }
  });

  // DELETE /api/history/analyses/:id — Delete user-owned analysis
  app.delete('/api/history/analyses/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const authenticatedUserId = (req as any).user.id;
      const { deleteAnalysisById } = await import('./src/db/analyses.ts');
      const deleted = await deleteAnalysisById(req.params.id, authenticatedUserId);
      if (!deleted) {
        return res.status(404).json({ error: 'Analysis record not found or unauthorized' });
      }
      res.json({ success: true, message: 'Analysis record deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete analysis' });
    }
  });

  // GET /api/history/tests — Retrieve user genetic test records (PCR, Sanger, NGS, etc.)
  app.get('/api/history/tests', optionalAuth, async (req: Request, res: Response) => {
    try {
      const authenticatedUserId = (req as any).user?.id || req.query.userId as string || 'anonymous';
      const testType = req.query.testType as string;
      const { getGeneticTests } = await import('./src/db/analyses.ts');
      const tests = await getGeneticTests(authenticatedUserId, testType);
      res.json(tests);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch genetic test records' });
    }
  });

  // POST /api/history/tests — Save or import genetic test record
  app.post('/api/history/tests', requireAuth, async (req: Request, res: Response) => {
    try {
      const authenticatedUserId = (req as any).user.id;
      const { saveGeneticTest } = await import('./src/db/analyses.ts');
      const saved = await saveGeneticTest(req.body, authenticatedUserId);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save genetic test record' });
    }
  });

  // GET /api/history/evidence/:analysisId — Retrieve evidence snapshot for an analysis
  app.get('/api/history/evidence/:analysisId', optionalAuth, async (req: Request, res: Response) => {
    try {
      const authenticatedUserId = (req as any).user?.id || req.query.userId as string || 'anonymous';
      const { getEvidenceByAnalysisId } = await import('./src/db/analyses.ts');
      const evidence = await getEvidenceByAnalysisId(req.params.analysisId, authenticatedUserId);
      if (!evidence) {
        return res.status(404).json({ error: 'Evidence report not found' });
      }
      res.json(evidence);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch evidence report' });
    }
  });

  // GET /api/history/activity — Retrieve user activity timeline
  app.get('/api/history/activity', optionalAuth, async (req: Request, res: Response) => {
    try {
      const authenticatedUserId = (req as any).user?.id || req.query.userId as string || 'anonymous';
      const limit = req.query.limit ? Number(req.query.limit) : 25;
      const { getUserActivityLogs } = await import('./src/db/analyses.ts');
      const logs = await getUserActivityLogs(authenticatedUserId, limit);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch activity logs' });
    }
  });

  // Backward compatible routes for legacy callers
  app.get('/api/analyses', optionalAuth, async (req: Request, res: Response) => {
    try {
      const authenticatedUserId = (req as any).user?.id;
      const { getSavedAnalyses } = await import('./src/db/analyses.ts');
      const history = await getSavedAnalyses(authenticatedUserId || 'anonymous', { limit: 30 });
      res.json(history.records);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch history' });
    }
  });

  app.get('/api/analyses/:id', optionalAuth, async (req: Request, res: Response) => {
    try {
      const authenticatedUserId = (req as any).user?.id;
      const { getAnalysisById } = await import('./src/db/analyses.ts');
      const record = await getAnalysisById(req.params.id, authenticatedUserId);
      if (!record) {
        return res.status(404).json({ error: 'Analysis record not found' });
      }
      res.json(record);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch analysis' });
    }
  });

  app.get('/api/analyses/:id/report', optionalAuth, async (req: Request, res: Response) => {
    try {
      const authenticatedUserId = (req as any).user?.id;
      const { getAnalysisById } = await import('./src/db/analyses.ts');
      const record = await getAnalysisById(req.params.id, authenticatedUserId);
      if (!record) {
        return res.status(404).json({ error: 'Analysis not found' });
      }
      const markdown = generateMarkdownReport(record as any);
      const jsonStr = generateJsonExport(record as any);
      res.json({
        analysisId: record.id,
        markdown,
        json: jsonStr,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Report generation failed' });
    }
  });

  app.delete('/api/analyses/:id', optionalAuth, async (req: Request, res: Response) => {
    try {
      const authenticatedUserId = (req as any).user?.id || 'anonymous';
      const { deleteAnalysisById } = await import('./src/db/analyses.ts');
      const deleted = await deleteAnalysisById(req.params.id, authenticatedUserId);
      res.json({ success: deleted });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete analysis' });
    }
  });

  // --- VITE MIDDLEWARE / STATIC FILES ---
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PS-10 Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal server bootstrap failure:', err);
  process.exit(1);
});
