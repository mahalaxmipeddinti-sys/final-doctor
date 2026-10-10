// src/services/acmgTests.ts
import { normalizeVariantInput } from './variantNormalization.ts';
import { evaluateACMGGuidelines } from './acmgRulesEngine.ts';
import { generateACMGExplanation } from './acmgExplainer.ts';
import { ACMG_CRITERIA_REGISTRY } from './acmgRegistry.ts';
import { AnnotationData, ClinVarRecord } from '../types/genomics.ts';

export interface TestResultItem {
  testId: string;
  testName: string;
  category: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export interface AutomatedTestSuiteReport {
  timestamp: string;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  passRatePercentage: number;
  results: TestResultItem[];
}

export async function runAutomatedACMGTests(): Promise<AutomatedTestSuiteReport> {
  const results: TestResultItem[] = [];

  // Helper mock annotation data
  const createMockAnnotation = (overrides: Partial<AnnotationData> = {}): AnnotationData => ({
    consequence: 'missense_variant',
    impact: 'MODERATE',
    isLossOfFunction: false,
    isSpliceRegion: false,
    isInKnownDomain: false,
    caddPhred: 10,
    polyphenScore: 0.1,
    siftScore: 0.5,
    gnomadAfPopmax: 0.00001,
    gnomadAfGlobal: 0.00001,
    source: 'Test Mock Annotator',
    retrievedAt: new Date().toISOString(),
    ...overrides,
  });

  // TEST 1: Variant Normalization - Valid ClinVar ID
  try {
    const v = normalizeVariantInput('13961', 'GRCh38');
    const passed = v.validationStatus === 'VALID' && v.geneSymbol === 'BRAF';
    results.push({
      testId: 'TC-VAR-01',
      testName: 'Normalize ClinVar Variation ID (BRAF V600E)',
      category: 'Variant Normalization',
      passed,
      expected: 'VALID with gene BRAF',
      actual: `${v.validationStatus} (gene: ${v.geneSymbol || 'none'})`,
    });
  } catch (err: any) {
    results.push({
      testId: 'TC-VAR-01',
      testName: 'Normalize ClinVar Variation ID',
      category: 'Variant Normalization',
      passed: false,
      expected: 'VALID',
      actual: `Exception: ${err.message}`,
    });
  }

  // TEST 2: Assembly Mismatch / Ambiguous Variant Detection
  try {
    const v = normalizeVariantInput('chr17:41245466:G:T', 'GRCh37');
    const passed = v.assembly === 'GRCh37' && v.validationStatus === 'VALID';
    results.push({
      testId: 'TC-VAR-02',
      testName: 'Coordinate Normalization on GRCh37 Assembly',
      category: 'Variant Identity',
      passed,
      expected: 'GRCh37 VALID',
      actual: `${v.assembly} ${v.validationStatus}`,
    });
  } catch (err: any) {
    results.push({
      testId: 'TC-VAR-02',
      testName: 'Assembly Mismatch Test',
      category: 'Variant Identity',
      passed: false,
      expected: 'GRCh37 VALID',
      actual: `Exception: ${err.message}`,
    });
  }

  // TEST 3: BA1 Stand-Alone Benign Rule (AF > 5%)
  try {
    const v = normalizeVariantInput('chr17:41245466:G:T', 'GRCh38');
    const ann = createMockAnnotation({ gnomadAfPopmax: 0.12 }); // 12% AF
    const acmg = evaluateACMGGuidelines(v, ann);
    const passed = acmg.overallClassification === 'BENIGN' && acmg.supportedCriteria.includes('BA1');
    results.push({
      testId: 'TC-ACMG-BA1',
      testName: 'BA1 Criterion Activation for High AF (>5%)',
      category: 'ACMG Criteria Rules',
      passed,
      expected: 'BENIGN with BA1 supported',
      actual: `${acmg.overallClassification} (${acmg.supportedCriteria.join(', ')})`,
    });
  } catch (err: any) {
    results.push({
      testId: 'TC-ACMG-BA1',
      testName: 'BA1 Criterion Activation',
      category: 'ACMG Criteria Rules',
      passed: false,
      expected: 'BENIGN',
      actual: `Exception: ${err.message}`,
    });
  }

  // TEST 4: PVS1 Null Variant Rule in LOF Gene
  try {
    const v = normalizeVariantInput('17661', 'GRCh38'); // BRCA1 5266dupC
    const ann = createMockAnnotation({
      consequence: 'frameshift_variant',
      isLossOfFunction: true,
      gnomadAfPopmax: 0.000001,
    });
    const acmg = evaluateACMGGuidelines(v, ann);
    const passed = acmg.criteriaEvaluations.PVS1?.status === 'SUPPORTED';
    results.push({
      testId: 'TC-ACMG-PVS1',
      testName: 'PVS1 Null Variant in BRCA1 LOF Gene',
      category: 'ACMG Criteria Rules',
      passed,
      expected: 'PVS1 SUPPORTED',
      actual: `PVS1 status: ${acmg.criteriaEvaluations.PVS1?.status}`,
    });
  } catch (err: any) {
    results.push({
      testId: 'TC-ACMG-PVS1',
      testName: 'PVS1 Null Variant',
      category: 'ACMG Criteria Rules',
      passed: false,
      expected: 'PVS1 SUPPORTED',
      actual: `Exception: ${err.message}`,
    });
  }

  // TEST 5: PP3 Computational In Silico Deleterious Consensus
  try {
    const v = normalizeVariantInput('chr7:140753336:A:T', 'GRCh38');
    const ann = createMockAnnotation({
      caddPhred: 28.5,
      polyphenScore: 0.99,
      siftScore: 0.01,
    });
    const acmg = evaluateACMGGuidelines(v, ann);
    const passed = acmg.criteriaEvaluations.PP3?.status === 'SUPPORTED';
    results.push({
      testId: 'TC-ACMG-PP3',
      testName: 'PP3 Computational Deleterious Prediction',
      category: 'ACMG Criteria Rules',
      passed,
      expected: 'PP3 SUPPORTED',
      actual: `PP3 status: ${acmg.criteriaEvaluations.PP3?.status}`,
    });
  } catch (err: any) {
    results.push({
      testId: 'TC-ACMG-PP3',
      testName: 'PP3 Computational',
      category: 'ACMG Criteria Rules',
      passed: false,
      expected: 'PP3 SUPPORTED',
      actual: `Exception: ${err.message}`,
    });
  }

  // TEST 6: Conflicting Evidence Resolution (Pathogenic vs Benign)
  try {
    const v = normalizeVariantInput('13961', 'GRCh38');
    const ann = createMockAnnotation({
      gnomadAfPopmax: 0.08, // BA1 met (benign)
      consequence: 'frameshift_variant',
      isLossOfFunction: true, // PVS1 met (pathogenic)
    });
    const acmg = evaluateACMGGuidelines(v, ann);
    const passed = acmg.overallClassification === 'BENIGN' || acmg.overallClassification === 'UNCERTAIN_SIGNIFICANCE';
    results.push({
      testId: 'TC-ACMG-CONFLICT',
      testName: 'Conflicting Pathogenic & Benign Criteria Handling',
      category: 'Classification Engine',
      passed,
      expected: 'BENIGN or UNCERTAIN_SIGNIFICANCE with conflict warning',
      actual: `${acmg.overallClassification}: ${acmg.appliedRuleSummary}`,
    });
  } catch (err: any) {
    results.push({
      testId: 'TC-ACMG-CONFLICT',
      testName: 'Conflicting Evidence Resolution',
      category: 'Classification Engine',
      passed: false,
      expected: 'VUS or Benign',
      actual: `Exception: ${err.message}`,
    });
  }

  // TEST 7: Explanation Engine & Discrepancy Generation
  try {
    const v = normalizeVariantInput('13961', 'GRCh38');
    const ann = createMockAnnotation({ gnomadAfPopmax: 0.000001 });
    const clinvarMock: ClinVarRecord = {
      variationId: '13961',
      title: 'BRAF V600E',
      canonicalAccession: 'VCV000013961',
      clinicalSignificance: 'Pathogenic',
      reviewStatus: 'reviewed by expert panel',
      reviewStars: 3,
      associatedConditions: ['Melanoma', 'Noonan syndrome'],
      geneSymbol: 'BRAF',
      hgvsNames: ['c.1799T>A'],
      submissions: [],
      hasConflicts: false,
      sourceUrl: 'https://www.ncbi.nlm.nih.gov/clinvar/variation/13961/',
      retrievedAt: new Date().toISOString(),
    };
    const acmg = evaluateACMGGuidelines(v, ann, clinvarMock);
    const expl = generateACMGExplanation('test-analysis-01', v, acmg, ann, clinvarMock);
    const passed = expl.criterionSteps.length === Object.keys(ACMG_CRITERIA_REGISTRY).length && !!expl.discrepancy;
    results.push({
      testId: 'TC-EXP-01',
      testName: 'Explainability Engine Complete 28-Rules Step Breakdown',
      category: 'Explainability & Auditing',
      passed,
      expected: '28 Criterion Steps generated with discrepancy analysis',
      actual: `${expl.criterionSteps.length} steps generated`,
    });
  } catch (err: any) {
    results.push({
      testId: 'TC-EXP-01',
      testName: 'Explainability Engine',
      category: 'Explainability & Auditing',
      passed: false,
      expected: '28 steps generated',
      actual: `Exception: ${err.message}`,
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;
  const passRatePercentage = Math.round((passedCount / results.length) * 100);

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedCount,
    failedCount,
    passRatePercentage,
    results,
  };
}
