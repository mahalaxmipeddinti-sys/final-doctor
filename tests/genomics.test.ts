// tests/genomics.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizeVariantInput } from '../src/services/variantNormalization.ts';
import { getReviewStars } from '../src/services/clinvarClient.ts';
import { runMLPathogenicityInference } from '../src/services/mlPredictor.ts';
import { evaluateACMGGuidelines } from '../src/services/acmgRulesEngine.ts';
import { integrateAnalysisResults } from '../src/services/resultIntegrator.ts';

describe('Block 2: Variant Normalization', () => {
  it('correctly normalizes numeric ClinVar Variation ID', () => {
    const res = normalizeVariantInput('17661');
    assert.strictEqual(res.validationStatus, 'VALID');
    assert.strictEqual(res.inputType, 'clinvar_id');
  });

  it('correctly parses genomic coordinates on GRCh38', () => {
    const res = normalizeVariantInput('chr17:43044295:G>A', 'GRCh38');
    assert.strictEqual(res.validationStatus, 'VALID');
    assert.strictEqual(res.chromosome, '17');
    assert.strictEqual(res.position, 43044295);
    assert.strictEqual(res.referenceAllele, 'G');
    assert.strictEqual(res.alternateAllele, 'A');
    assert.strictEqual(res.assembly, 'GRCh38');
  });

  it('flags ambiguous bare gene symbol and rejects unique variant assumption', () => {
    const res = normalizeVariantInput('BRCA1');
    assert.strictEqual(res.validationStatus, 'AMBIGUOUS');
    assert.ok(res.validationWarnings[0].includes('does not uniquely identify a variant'));
  });
});

describe('Block 3: ClinVar Review Stars Calculation', () => {
  it('maps review status to 0-4 stars correctly', () => {
    assert.strictEqual(getReviewStars('practice guideline'), 4);
    assert.strictEqual(getReviewStars('reviewed by expert panel'), 3);
    assert.strictEqual(getReviewStars('criteria provided, multiple submitters, no conflicts'), 2);
    assert.strictEqual(getReviewStars('criteria provided, single submitter'), 1);
    assert.strictEqual(getReviewStars('no assertion criteria provided'), 0);
  });
});

describe('Block 5A: Machine Learning Pathogenicity Inference', () => {
  it('outputs calibrated probability in [0, 1] range', () => {
    const dummyVariant = normalizeVariantInput('chr17:43044295:G>A');
    const dummyAnnotation = {
      consequence: 'missense_variant',
      impact: 'MODERATE' as const,
      caddPhred: 32.5,
      phylop100way: 8.5,
      polyphenScore: 0.99,
      siftScore: 0.0,
      gnomadAfGlobal: 0.000001,
      isLossOfFunction: false,
      isSpliceRegion: false,
      isInKnownDomain: true,
      source: 'Test',
      retrievedAt: new Date().toISOString(),
    };

    const pred = runMLPathogenicityInference(dummyVariant, dummyAnnotation);
    assert.ok(pred.calibratedProbability >= 0.0 && pred.calibratedProbability <= 1.0);
    assert.strictEqual(pred.classificationCategory, 'HIGH_RISK_PATHOGENIC');
    assert.ok(pred.featureContributions.length > 0);
  });
});

describe('Block 5B: ACMG 2015 Guideline Combination Rules', () => {
  it('triggers BA1 Stand-Alone Benign when population AF > 5%', () => {
    const dummyVariant = normalizeVariantInput('chr17:43104928:A>G');
    const dummyAnnotation = {
      consequence: 'synonymous_variant',
      impact: 'LOW' as const,
      gnomadAfGlobal: 0.075, // 7.5% > 5%
      caddPhred: 3.5,
      isLossOfFunction: false,
      isSpliceRegion: false,
      isInKnownDomain: false,
      source: 'Test',
      retrievedAt: new Date().toISOString(),
    };

    const evalResult = evaluateACMGGuidelines(dummyVariant, dummyAnnotation);
    assert.strictEqual(evalResult.overallClassification, 'BENIGN');
    assert.ok(evalResult.supportedCriteria.includes('BA1'));
  });

  it('triggers Pathogenic for PVS1 + PM2 + PP3', () => {
    const dummyVariant = normalizeVariantInput('17661');
    const dummyAnnotation = {
      consequence: 'frameshift_variant',
      impact: 'HIGH' as const,
      gnomadAfGlobal: 0.000001,
      caddPhred: 35.0,
      polyphenScore: 1.0,
      siftScore: 0.0,
      isLossOfFunction: true,
      isSpliceRegion: false,
      isInKnownDomain: true,
      source: 'Test',
      retrievedAt: new Date().toISOString(),
    };

    const evalResult = evaluateACMGGuidelines(dummyVariant, dummyAnnotation);
    assert.ok(evalResult.overallClassification === 'PATHOGENIC' || evalResult.overallClassification === 'LIKELY_PATHOGENIC');
    assert.ok(evalResult.supportedCriteria.includes('PVS1'));
    assert.ok(evalResult.supportedCriteria.includes('PM2'));
  });
});

describe('Block 6: Result Integration & Conflict Detection', () => {
  it('detects discordance between ClinVar and ACMG tier', () => {
    const dummyVariant = normalizeVariantInput('chr1:100:A>T');
    const clinvar = {
      variationId: '999',
      title: 'Test Variant',
      canonicalAccession: 'VCV999',
      clinicalSignificance: 'Pathogenic',
      reviewStatus: 'reviewed by expert panel',
      reviewStars: 3,
      associatedConditions: ['Test Condition'],
      geneSymbol: 'TEST',
      hgvsNames: [],
      submissions: [],
      hasConflicts: false,
      sourceUrl: '',
      retrievedAt: '',
    };
    const acmg: any = {
      rulesetVersion: 'ACMG 2015',
      overallClassification: 'BENIGN',
      bayesianScore: -8,
      bayesianProbability: 0.01,
      supportedCriteria: ['BA1'],
      contradictedCriteria: [],
      notApplicableCriteria: [],
      unknownCriteria: [],
      criteriaEvaluations: {},
      appliedRuleSummary: 'BA1',
      requiresExpertReview: false,
      limitations: [],
    };

    const res = integrateAnalysisResults('test-1', dummyVariant, clinvar, undefined, undefined, acmg, []);
    assert.strictEqual(res.summaryStatus, 'CONFLICTS_DETECTED');
    assert.ok(res.conflicts.some((c) => c.conflictType === 'DATABASE_VS_ACMG'));
  });
});

describe('Block 7: Family Trio Inheritance & Report Extraction', () => {
  it('correctly confirms de novo inheritance and activates ACMG PS2 override', async () => {
    const { determineTrioInheritance } = await import('../src/services/trioService.ts');
    const child = { relationship: 'child' as const, label: 'Child', variantInput: '17661', zygosity: 'HETEROZYGOUS' as const, isAffected: true };
    const mother = { relationship: 'mother' as const, label: 'Mother', variantInput: '', zygosity: 'HOMOZYGOUS_REF_WILDTYPE' as const, isAffected: false };
    const father = { relationship: 'father' as const, label: 'Father', variantInput: '', zygosity: 'HOMOZYGOUS_REF_WILDTYPE' as const, isAffected: false };

    const result = determineTrioInheritance(child, mother, father);
    assert.strictEqual(result.pattern, 'DE_NOVO_CONFIRMED');
    assert.strictEqual(result.overrides.PS2?.status, 'SUPPORTED');
  });

  it('correctly identifies biparental autosomal recessive inheritance', async () => {
    const { determineTrioInheritance } = await import('../src/services/trioService.ts');
    const child = { relationship: 'child' as const, label: 'Child', variantInput: '7105', zygosity: 'HOMOZYGOUS_ALT' as const, isAffected: true };
    const mother = { relationship: 'mother' as const, label: 'Mother', variantInput: '7105', zygosity: 'HETEROZYGOUS' as const, isAffected: false };
    const father = { relationship: 'father' as const, label: 'Father', variantInput: '7105', zygosity: 'HETEROZYGOUS' as const, isAffected: false };

    const result = determineTrioInheritance(child, mother, father);
    assert.strictEqual(result.pattern, 'BIPARENTAL_RECESSIVE');
    assert.strictEqual(result.overrides.PM3?.status, 'SUPPORTED');
  });

  it('extracts ClinVar ID and gene from lab report filename or text', async () => {
    const { extractVariantFromReportText } = await import('../src/services/trioService.ts');
    const extracted = extractVariantFromReportText('Patient_Report_BRCA1_ClinVar_17661_heterozygous.pdf');
    assert.strictEqual(extracted.detectedId, '17661');
    assert.strictEqual(extracted.detectedGene, 'BRCA1');
    assert.strictEqual(extracted.detectedZygosity, 'HETEROZYGOUS');
  });
});

