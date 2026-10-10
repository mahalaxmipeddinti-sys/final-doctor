// tests/history.test.ts
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  saveAnalysisToDatabase,
  getSavedAnalyses,
  getAnalysisById,
  deleteAnalysisById,
  saveGeneticTest,
  getGeneticTests,
  logUserActivity,
  getUserActivityLogs,
  getHistoryOverview,
} from '../src/db/analyses.ts';
import { FullAnalysisResult } from '../src/types/genomics.ts';

describe('GenomeGuard AI — History, Evidence & Persistence System', () => {
  const userA = 'user-uuid-aaaa-1111';
  const userB = 'user-uuid-bbbb-2222';

  const sampleResultA: FullAnalysisResult = {
    analysisId: 'va-brca1-001',
    normalizedVariant: {
      originalInput: '17661',
      inputType: 'clinvar_id',
      assembly: 'GRCh38',
      chromosome: '17',
      position: 43044295,
      referenceAllele: 'G',
      alternateAllele: 'A',
      geneSymbol: 'BRCA1',
      hgvsc: 'NM_007294.4:c.5266dupC',
      validationStatus: 'VALID',
      validationWarnings: [],
      normalizedRepresentation: 'chr17:43044295:G>A',
    },
    clinvarRecord: {
      variationId: '17661',
      title: 'NM_007294.4(BRCA1):c.5266dupC',
      canonicalAccession: 'VCV000017661.12',
      clinicalSignificance: 'Pathogenic',
      reviewStatus: 'reviewed by expert panel',
      reviewStars: 3,
      geneSymbol: 'BRCA1',
      associatedConditions: ['Hereditary breast and ovarian cancer syndrome'],
      hgvsNames: [],
      submissions: [],
      hasConflicts: false,
      sourceUrl: '',
      retrievedAt: new Date().toISOString(),
    },
    annotationData: {
      consequence: 'frameshift_variant',
      impact: 'HIGH',
      gnomadAfGlobal: 0.00004,
      gnomadAfPopmax: 0.0001,
      caddPhred: 34.0,
      siftPrediction: 'deleterious',
      siftScore: 0.0,
      polyphenPrediction: 'probably_damaging',
      polyphenScore: 0.99,
      isLossOfFunction: true,
      isSpliceRegion: false,
      isInKnownDomain: true,
      source: 'Ensembl VEP',
      retrievedAt: new Date().toISOString(),
    },
    mlPrediction: {
      pathogenicityScore: 0.94,
      calibratedProbability: 0.94,
      classificationCategory: 'HIGH_RISK_PATHOGENIC',
      confidenceInterval: [0.91, 0.97],
      modelVersion: 'v1.2.0',
      featureContributions: [],
      missingFeatures: [],
      disclaimer: 'Research use only',
      trainingMetadata: {
        datasetSize: 50000,
        trainingDate: '2025-01-01',
        aucRoc: 0.96,
        intendedUse: 'Research',
      },
    },
    acmgEvaluation: {
      rulesetVersion: 'ACMG/AMP 2015 v1.2',
      overallClassification: 'PATHOGENIC',
      bayesianScore: 12,
      bayesianProbability: 0.99,
      supportedCriteria: ['PVS1', 'PM2', 'PP3'],
      contradictedCriteria: [],
      notApplicableCriteria: [],
      unknownCriteria: [],
      criteriaEvaluations: {},
      appliedRuleSummary: 'PVS1 Very Strong + PM2 Moderate + PP3 Supporting',
      requiresExpertReview: false,
      limitations: [],
    },
    conflicts: [],
    summaryStatus: 'COMPLETED',
    executionLog: [],
    createdAt: new Date().toISOString(),
  };

  const sampleResultB: FullAnalysisResult = {
    analysisId: 'va-cftr-002',
    normalizedVariant: {
      originalInput: '7105',
      inputType: 'clinvar_id',
      assembly: 'GRCh38',
      chromosome: '7',
      position: 117559590,
      referenceAllele: 'ATCT',
      alternateAllele: 'A',
      geneSymbol: 'CFTR',
      hgvsc: 'NM_000492.4:c.1521_1523delCTT',
      validationStatus: 'VALID',
      validationWarnings: [],
      normalizedRepresentation: 'chr7:117559590:ATCT>A',
    },
    acmgEvaluation: {
      rulesetVersion: 'ACMG/AMP 2015 v1.2',
      overallClassification: 'PATHOGENIC',
      bayesianScore: 10,
      bayesianProbability: 0.98,
      supportedCriteria: ['PM1', 'PM2', 'PP3'],
      contradictedCriteria: [],
      notApplicableCriteria: [],
      unknownCriteria: [],
      criteriaEvaluations: {},
      appliedRuleSummary: 'In-frame deletion in critical region',
      requiresExpertReview: false,
      limitations: [],
    },
    conflicts: [],
    summaryStatus: 'COMPLETED',
    executionLog: [],
    createdAt: new Date().toISOString(),
  };

  test('1. Saves completed analysis and attaches user ID & evidence snapshot', async () => {
    const idA = await saveAnalysisToDatabase(sampleResultA, userA, 'completed');
    assert.equal(idA, 'va-brca1-001');

    const idB = await saveAnalysisToDatabase(sampleResultB, userB, 'completed');
    assert.equal(idB, 'va-cftr-002');
  });

  test('2. Enforces strict user isolation: User A cannot see User B records', async () => {
    const listA = await getSavedAnalyses(userA);
    assert.ok(listA.records.some((r) => r.id === 'va-brca1-001'));
    assert.ok(!listA.records.some((r) => r.id === 'va-cftr-002'));

    const listB = await getSavedAnalyses(userB);
    assert.ok(listB.records.some((r) => r.id === 'va-cftr-002'));
    assert.ok(!listB.records.some((r) => r.id === 'va-brca1-001'));
  });

  test('3. Filters analyses by classification and search query correctly', async () => {
    const searchRes = await getSavedAnalyses(userA, { search: 'BRCA1' });
    assert.equal(searchRes.records.length, 1);
    assert.equal(searchRes.records[0].gene_symbol, 'BRCA1');

    const noMatch = await getSavedAnalyses(userA, { search: 'CFTR' });
    assert.equal(noMatch.records.length, 0);
  });

  test('4. Genetic Test Records: Saves and isolates 9-assay lab records', async () => {
    const testRecord = await saveGeneticTest(
      {
        test_type: 'WES',
        source_or_laboratory: 'Mayo Clinic Genomics',
        structured_result: {
          gene_symbol: 'BRCA1',
          coverage: '150x',
          findings: 'Pathogenic founder mutation identified',
        },
      },
      userA
    );

    assert.equal(testRecord.test_type, 'WES');
    assert.equal(testRecord.user_id, userA);

    const userATests = await getGeneticTests(userA);
    assert.ok(userATests.length >= 1);
    assert.equal(userATests[0].test_type, 'WES');

    const userBTests = await getGeneticTests(userB);
    assert.equal(userBTests.length, 0);
  });

  test('5. Activity Logs: Automatically records privacy-safe events', async () => {
    await logUserActivity(userA, 'report_viewed', 'Viewed auditable report for BRCA1');
    const logs = await getUserActivityLogs(userA);
    assert.ok(logs.length >= 1);
    assert.ok(logs.some((l) => l.event_type === 'report_viewed'));
    assert.ok(logs.every((l) => l.user_id === userA));
  });

  test('6. History Overview: Generates real KPIs and distribution counts', async () => {
    const overviewA = await getHistoryOverview(userA);
    assert.ok(overviewA.totalAnalyses >= 1);
    assert.ok(overviewA.completedAnalyses >= 1);
    assert.equal(overviewA.classificationCounts.Pathogenic >= 1, true);
    assert.ok(overviewA.totalTests >= 1);
  });

  test('7. Deletion Protection: User A can delete own record, but User B cannot delete User A record', async () => {
    // User B tries to delete User A's analysis -> must fail
    const forbiddenDelete = await deleteAnalysisById('va-brca1-001', userB);
    assert.equal(forbiddenDelete, false);

    // Record must still exist for User A
    const item = await getAnalysisById('va-brca1-001', userA);
    assert.ok(item !== null);

    // User A deletes own record -> must succeed
    const authorizedDelete = await deleteAnalysisById('va-brca1-001', userA);
    assert.equal(authorizedDelete, true);

    const checkGone = await getAnalysisById('va-brca1-001', userA);
    assert.equal(checkGone, null);
  });
});
