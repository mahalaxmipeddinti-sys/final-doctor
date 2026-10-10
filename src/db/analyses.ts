// src/db/analyses.ts
import { FullAnalysisResult } from '../types/genomics.ts';
import { supabaseAdmin } from '../../server.ts';

export interface SavedAnalysisRecord {
  id: string;
  user_id: string;
  variant_identifier: string;
  gene_symbol: string | null;
  chromosome: string | null;
  position: number | null;
  reference_allele: string | null;
  alternate_allele: string | null;
  assembly: string;
  input_data: any;
  prediction_result: any;
  acmg_classification: string | null;
  acmg_score: number | null;
  ml_pathogenicity_score: number | null;
  analysis_status: 'pending' | 'running' | 'completed' | 'failed';
  error_summary: string | null;
  created_at: string;
  completed_at: string | null;
  evidence_report?: any;
}

export interface GeneticTestRecord {
  id: string;
  user_id: string;
  test_type: 'PCR' | 'Sanger sequencing' | 'NGS' | 'WES' | 'WGS' | 'DNA microarray' | 'CMA' | 'genotyping/SNP testing' | 'karyotyping';
  test_date: string;
  source_or_laboratory: string;
  record_status: 'pending' | 'verified' | 'inconclusive' | 'rejected';
  structured_result: Record<string, any>;
  notes?: string;
  linked_analysis_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogItem {
  id: string;
  user_id: string;
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  event_summary: string;
  created_at: string;
}

// In-memory fallback caches with user isolation for robust offline operation
const memoryAnalyses = new Map<string, SavedAnalysisRecord>();
const memoryEvidence = new Map<string, any>();
const memoryTestRecords = new Map<string, GeneticTestRecord>();
const memoryActivityLogs: ActivityLogItem[] = [];

/**
 * Log a privacy-safe user activity
 */
export async function logUserActivity(
  userId: string,
  eventType: string,
  eventSummary: string,
  entityType?: string,
  entityId?: string
) {
  if (!userId || userId === 'anonymous') return;

  const logItem: ActivityLogItem = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    event_summary: eventSummary,
    created_at: new Date().toISOString(),
  };

  memoryActivityLogs.unshift(logItem);

  try {
    if (supabaseAdmin) {
      await supabaseAdmin.from('activity_logs').insert({
        user_id: userId,
        event_type: eventType,
        entity_type: entityType,
        entity_id: entityId,
        event_summary: eventSummary,
      });
    }
  } catch (err) {
    // Non-blocking catch
  }
}

/**
 * Save or initialize an analysis record with running or completed status
 */
export async function saveAnalysisToDatabase(
  result: FullAnalysisResult,
  userId: string = 'anonymous',
  status: 'pending' | 'running' | 'completed' | 'failed' = 'completed',
  errorSummary?: string
): Promise<string> {
  const norm = (result.normalizedVariant || {}) as any;
  const gene = norm.geneSymbol || (norm.hgvsc?.split(':')[0]) || null;
  const chr = norm.chromosome || null;
  const pos = norm.position || null;
  const ref = norm.referenceAllele || norm.refAllele || null;
  const alt = norm.alternateAllele || norm.altAllele || null;
  const varId = norm.originalInput || result.analysisId;

  const classification = result.acmgEvaluation?.overallClassification || null;
  const acmgScore = result.acmgEvaluation?.bayesianScore ?? null;
  const mlScore = result.mlPrediction?.calibratedProbability ?? result.mlPrediction?.pathogenicityScore ?? null;

  const analysisRecord: SavedAnalysisRecord = {
    id: result.analysisId,
    user_id: userId,
    variant_identifier: varId,
    gene_symbol: gene,
    chromosome: chr,
    position: pos,
    reference_allele: ref,
    alternate_allele: alt,
    assembly: norm.assembly || 'GRCh38',
    input_data: {
      originalInput: varId,
      assembly: norm.assembly || 'GRCh38',
      trioData: result.trioData || null,
    },
    prediction_result: result.mlPrediction || null,
    acmg_classification: classification,
    acmg_score: acmgScore,
    ml_pathogenicity_score: mlScore,
    analysis_status: status,
    error_summary: errorSummary || null,
    created_at: result.createdAt || new Date().toISOString(),
    completed_at: status === 'completed' ? new Date().toISOString() : null,
  };

  // Structured auditable evidence report snapshot
  const evidenceSnapshot = {
    analysis_id: result.analysisId,
    user_id: userId,
    clinvar_evidence: result.clinvarRecord || null,
    functional_population_evidence: result.annotationData || null,
    predictor_evidence: result.mlPrediction || null,
    acmg_criteria: result.acmgEvaluation?.supportedCriteria || [],
    discordance_summary: result.conflicts || [],
    source_provenance: {
      clinvarSource: 'NCBI ClinVar API (Live Aggregated)',
      vepSource: 'Ensembl VEP REST API v110',
      mlEngine: 'GenomeGuard v1.2.0 Gradient-Calibrated Ensemble',
      acmgEngine: 'ACMG/AMP 2015 28-Rules Standard Ruleset',
      analysisTimestamp: new Date().toISOString(),
    },
    evidence_timestamp: new Date().toISOString(),
    schema_version: 'v1.0.0',
  };

  memoryAnalyses.set(result.analysisId, analysisRecord);
  memoryEvidence.set(result.analysisId, evidenceSnapshot);

  // Attempt database persistence in Supabase
  try {
    if (supabaseAdmin && userId !== 'anonymous') {
      await supabaseAdmin.from('variant_analyses').upsert({
        id: analysisRecord.id,
        user_id: analysisRecord.user_id,
        variant_identifier: analysisRecord.variant_identifier,
        gene_symbol: analysisRecord.gene_symbol,
        chromosome: analysisRecord.chromosome,
        position: analysisRecord.position,
        reference_allele: analysisRecord.reference_allele,
        alternate_allele: analysisRecord.alternate_allele,
        assembly: analysisRecord.assembly,
        input_data: analysisRecord.input_data,
        prediction_result: analysisRecord.prediction_result,
        acmg_classification: analysisRecord.acmg_classification,
        acmg_score: analysisRecord.acmg_score,
        ml_pathogenicity_score: analysisRecord.ml_pathogenicity_score,
        analysis_status: analysisRecord.analysis_status,
        error_summary: analysisRecord.error_summary,
        completed_at: analysisRecord.completed_at,
      });

      if (status === 'completed') {
        await supabaseAdmin.from('evidence_reports').upsert({
          analysis_id: result.analysisId,
          user_id: userId,
          clinvar_evidence: evidenceSnapshot.clinvar_evidence,
          functional_population_evidence: evidenceSnapshot.functional_population_evidence,
          predictor_evidence: evidenceSnapshot.predictor_evidence,
          acmg_criteria: evidenceSnapshot.acmg_criteria,
          discordance_summary: evidenceSnapshot.discordance_summary,
          source_provenance: evidenceSnapshot.source_provenance,
          evidence_timestamp: evidenceSnapshot.evidence_timestamp,
          schema_version: evidenceSnapshot.schema_version,
        });
      }
    }
  } catch (err) {
    console.warn('Database save notice (cached in memory):', err);
  }

  // Log user activity event
  if (status === 'completed') {
    await logUserActivity(
      userId,
      'analysis_completed',
      `Completed variant analysis for ${gene || varId} (${result.acmgEvaluation?.overallClassification || 'Assessed'})`,
      'variant_analyses',
      result.analysisId
    );
  } else if (status === 'failed') {
    await logUserActivity(
      userId,
      'analysis_failed',
      `Analysis failed for ${varId}: ${errorSummary || 'Unknown error'}`,
      'variant_analyses',
      result.analysisId
    );
  }

  return result.analysisId;
}

/**
 * Retrieve paginated, filtered, and sorted analysis records for an authenticated user
 */
export async function getSavedAnalyses(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    classification?: string;
    status?: string;
  } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const from = (page - 1) * limit;

  try {
    if (supabaseAdmin && userId && userId !== 'anonymous') {
      let query = supabaseAdmin
        .from('variant_analyses')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options.classification && options.classification !== 'ALL') {
        query = query.ilike('acmg_classification', `%${options.classification}%`);
      }

      if (options.status && options.status !== 'ALL') {
        query = query.eq('analysis_status', options.status);
      }

      if (options.search && options.search.trim()) {
        const s = `%${options.search.trim()}%`;
        query = query.or(`variant_identifier.ilike.${s},gene_symbol.ilike.${s}`);
      }

      const { data, count, error } = await query.range(from, from + limit - 1);

      if (!error && data) {
        return {
          records: data as SavedAnalysisRecord[],
          total: count || data.length,
          page,
          limit,
          totalPages: Math.ceil((count || data.length) / limit),
        };
      }
    }
  } catch (err) {
    console.warn('Database query fallback to memory:', err);
  }

  // Memory fallback
  let list = Array.from(memoryAnalyses.values()).filter((item) => item.user_id === userId);

  if (options.classification && options.classification !== 'ALL') {
    list = list.filter((item) =>
      item.acmg_classification?.toLowerCase().includes(options.classification!.toLowerCase())
    );
  }
  if (options.status && options.status !== 'ALL') {
    list = list.filter((item) => item.analysis_status === options.status);
  }
  if (options.search && options.search.trim()) {
    const s = options.search.toLowerCase();
    list = list.filter(
      (item) =>
        (item.variant_identifier && item.variant_identifier.toLowerCase().includes(s)) ||
        (item.gene_symbol && item.gene_symbol.toLowerCase().includes(s))
    );
  }
  const total = list.length;
  const paginated = list.slice(from, from + limit);

  const paginatedWithAlias = paginated.map((r) => ({
    ...r,
    analysisId: r.id,
  }));

  return {
    records: paginatedWithAlias,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get full analysis details by ID with ownership enforcement
 */
export async function getAnalysisById(id: string, userId?: string): Promise<SavedAnalysisRecord | null> {
  try {
    if (supabaseAdmin && userId && userId !== 'anonymous') {
      const { data, error } = await supabaseAdmin
        .from('variant_analyses')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        const evidence = await getEvidenceByAnalysisId(id, userId);
        return {
          ...data,
          evidence_report: evidence,
        } as SavedAnalysisRecord;
      }
    }
  } catch (err) {
    // fallback
  }

  const memory = memoryAnalyses.get(id);
  if (memory && (!userId || memory.user_id === userId)) {
    return {
      ...memory,
      evidence_report: memoryEvidence.get(id) || null,
    };
  }
  return null;
}

/**
 * Delete a user-owned analysis record and its child records
 */
export async function deleteAnalysisById(id: string, userId: string): Promise<boolean> {
  if (!userId || userId === 'anonymous') return false;

  try {
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('variant_analyses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (!error) {
        memoryAnalyses.delete(id);
        memoryEvidence.delete(id);
        await logUserActivity(userId, 'analysis_deleted', `Deleted analysis record #${id.substring(0, 8)}`, 'variant_analyses', id);
        return true;
      }
    }
  } catch (err) {
    // fallback
  }

  const mem = memoryAnalyses.get(id);
  if (mem && mem.user_id === userId) {
    memoryAnalyses.delete(id);
    memoryEvidence.delete(id);
    await logUserActivity(userId, 'analysis_deleted', `Deleted analysis record #${id.substring(0, 8)}`, 'variant_analyses', id);
    return true;
  }
  return false;
}

/**
 * Retrieve evidence report snapshot for a specific analysis
 */
export async function getEvidenceByAnalysisId(analysisId: string, userId: string) {
  try {
    if (supabaseAdmin && userId && userId !== 'anonymous') {
      const { data, error } = await supabaseAdmin
        .from('evidence_reports')
        .select('*')
        .eq('analysis_id', analysisId)
        .eq('user_id', userId)
        .single();

      if (!error && data) return data;
    }
  } catch (err) {
    // fallback
  }

  const evidence = memoryEvidence.get(analysisId);
  if (evidence && evidence.user_id === userId) return evidence;
  return null;
}

/**
 * Retrieve user's genetic testing records (PCR, Sanger, NGS, WES, WGS, Microarray, CMA, Genotyping, Karyotyping)
 */
export async function getGeneticTests(userId: string, testType?: string) {
  try {
    if (supabaseAdmin && userId && userId !== 'anonymous') {
      let query = supabaseAdmin
        .from('genetic_test_records')
        .select('*')
        .eq('user_id', userId)
        .order('test_date', { ascending: false });

      if (testType && testType !== 'ALL') {
        query = query.eq('test_type', testType);
      }

      const { data, error } = await query;
      if (!error && data) return data as GeneticTestRecord[];
    }
  } catch (err) {
    // fallback
  }

  let list = Array.from(memoryTestRecords.values()).filter((t) => t.user_id === userId);
  if (testType && testType !== 'ALL') {
    list = list.filter((t) => t.test_type === testType);
  }
  return list;
}

/**
 * Save an entered or imported genetic test record
 */
export async function saveGeneticTest(record: Partial<GeneticTestRecord>, userId: string): Promise<GeneticTestRecord> {
  const id = record.id || `test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const fullRecord: GeneticTestRecord = {
    id,
    user_id: userId,
    test_type: record.test_type || 'NGS',
    test_date: record.test_date || new Date().toISOString().split('T')[0],
    source_or_laboratory: record.source_or_laboratory || 'Clinical Genetics Lab',
    record_status: record.record_status || 'verified',
    structured_result: record.structured_result || {},
    notes: record.notes,
    linked_analysis_id: record.linked_analysis_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryTestRecords.set(id, fullRecord);

  try {
    if (supabaseAdmin && userId !== 'anonymous') {
      await supabaseAdmin.from('genetic_test_records').upsert(fullRecord);
    }
  } catch (err) {
    console.warn('Test record db warning:', err);
  }

  await logUserActivity(
    userId,
    'test_record_created',
    `Added ${fullRecord.test_type} record from ${fullRecord.source_or_laboratory}`,
    'genetic_test_records',
    id
  );

  return fullRecord;
}

/**
 * Retrieve user's privacy-safe activity log timeline
 */
export async function getUserActivityLogs(userId: string, limit: number = 25): Promise<ActivityLogItem[]> {
  try {
    if (supabaseAdmin && userId && userId !== 'anonymous') {
      const { data, error } = await supabaseAdmin
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) return data as ActivityLogItem[];
    }
  } catch (err) {
    // fallback
  }

  return memoryActivityLogs.filter((log) => log.user_id === userId).slice(0, limit);
}

/**
 * Get aggregated overview statistics for the authenticated user's dashboard
 */
export async function getHistoryOverview(userId: string) {
  const defaultOverview = {
    totalAnalyses: 0,
    completedAnalyses: 0,
    failedAnalyses: 0,
    totalTests: 0,
    classificationCounts: {
      Pathogenic: 0,
      Likely_Pathogenic: 0,
      VUS: 0,
      Likely_Benign: 0,
      Benign: 0,
      Other: 0,
    },
    recentAnalyses: [] as SavedAnalysisRecord[],
    recentActivity: [] as ActivityLogItem[],
  };

  if (!userId || userId === 'anonymous') return defaultOverview;

  try {
    if (supabaseAdmin) {
      // 1. Fetch analysis records for counts
      const { data: analysesData } = await supabaseAdmin
        .from('variant_analyses')
        .select('id, acmg_classification, analysis_status, created_at, variant_identifier, gene_symbol, prediction_result, acmg_score, ml_pathogenicity_score')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // 2. Fetch test count
      const { count: testCount } = await supabaseAdmin
        .from('genetic_test_records')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 3. Fetch recent activity
      const { data: activities } = await supabaseAdmin
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (analysesData) {
        const counts = {
          Pathogenic: 0,
          Likely_Pathogenic: 0,
          VUS: 0,
          Likely_Benign: 0,
          Benign: 0,
          Other: 0,
        };

        let completed = 0;
        let failed = 0;

        analysesData.forEach((row: any) => {
          if (row.analysis_status === 'completed') completed++;
          if (row.analysis_status === 'failed') failed++;

          const cls = (row.acmg_classification || '').toUpperCase();
          if (cls === 'PATHOGENIC') counts.Pathogenic++;
          else if (cls.includes('LIKELY PATHOGENIC') || cls === 'LIKELY_PATHOGENIC') counts.Likely_Pathogenic++;
          else if (cls.includes('UNCERTAIN') || cls === 'VUS') counts.VUS++;
          else if (cls.includes('LIKELY BENIGN') || cls === 'LIKELY_BENIGN') counts.Likely_Benign++;
          else if (cls === 'BENIGN') counts.Benign++;
          else counts.Other++;
        });

        return {
          totalAnalyses: analysesData.length,
          completedAnalyses: completed,
          failedAnalyses: failed,
          totalTests: testCount || 0,
          classificationCounts: counts,
          recentAnalyses: (analysesData.slice(0, 5) as unknown) as SavedAnalysisRecord[],
          recentActivity: (activities || []) as ActivityLogItem[],
        };
      }
    }
  } catch (err) {
    console.warn('Overview database calculation notice:', err);
  }

  // Memory fallback
  const userAnalyses = Array.from(memoryAnalyses.values()).filter((a) => a.user_id === userId);
  const userTests = Array.from(memoryTestRecords.values()).filter((t) => t.user_id === userId);
  const userLogs = memoryActivityLogs.filter((l) => l.user_id === userId);

  const counts = {
    Pathogenic: 0,
    Likely_Pathogenic: 0,
    VUS: 0,
    Likely_Benign: 0,
    Benign: 0,
    Other: 0,
  };

  let completed = 0;
  let failed = 0;

  userAnalyses.forEach((row) => {
    if (row.analysis_status === 'completed') completed++;
    if (row.analysis_status === 'failed') failed++;

    const cls = (row.acmg_classification || '').toUpperCase();
    if (cls === 'PATHOGENIC') counts.Pathogenic++;
    else if (cls.includes('LIKELY PATHOGENIC') || cls === 'LIKELY_PATHOGENIC') counts.Likely_Pathogenic++;
    else if (cls.includes('UNCERTAIN') || cls === 'VUS') counts.VUS++;
    else if (cls.includes('LIKELY BENIGN') || cls === 'LIKELY_BENIGN') counts.Likely_Benign++;
    else if (cls === 'BENIGN') counts.Benign++;
    else counts.Other++;
  });

  return {
    totalAnalyses: userAnalyses.length,
    completedAnalyses: completed,
    failedAnalyses: failed,
    totalTests: userTests.length,
    classificationCounts: counts,
    recentAnalyses: userAnalyses.slice(0, 5),
    recentActivity: userLogs.slice(0, 10),
  };
}

// Backward-compatible alias for existing endpoints
export const getRecentAnalyses = async (limit: number = 20, userId?: string) => {
  const res = await getSavedAnalyses(userId || 'anonymous', { limit });
  return res.records;
};
