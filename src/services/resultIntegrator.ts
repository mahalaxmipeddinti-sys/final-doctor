// src/services/resultIntegrator.ts
import {
  ACMGEvaluationResult,
  ClinVarRecord,
  ConflictRecord,
  FullAnalysisResult,
  MLPrediction,
  NormalizedVariant,
  AnnotationData,
} from '../types/genomics.ts';

export function integrateAnalysisResults(
  analysisId: string,
  normalizedVariant: NormalizedVariant,
  clinvarRecord: ClinVarRecord | null | undefined,
  annotationData: AnnotationData | undefined,
  mlPrediction: MLPrediction | undefined,
  acmgEvaluation: ACMGEvaluationResult | undefined,
  executionLog: FullAnalysisResult['executionLog']
): FullAnalysisResult {
  const conflicts: ConflictRecord[] = [];

  // 1. Conflict Check: ClinVar Consensus vs ACMG Evaluation
  if (clinvarRecord && acmgEvaluation) {
    const clinLower = clinvarRecord.clinicalSignificance.toLowerCase();
    const acmgTier = acmgEvaluation.overallClassification;

    const clinIsPath = clinLower.includes('pathogenic') && !clinLower.includes('benign');
    const clinIsBenign = clinLower.includes('benign') && !clinLower.includes('pathogenic');
    const clinIsVUS = clinLower.includes('uncertain') || clinLower.includes('vus');

    const acmgIsPath = acmgTier === 'PATHOGENIC' || acmgTier === 'LIKELY_PATHOGENIC';
    const acmgIsBenign = acmgTier === 'BENIGN' || acmgTier === 'LIKELY_BENIGN';
    const acmgIsVUS = acmgTier === 'UNCERTAIN_SIGNIFICANCE' || acmgTier === 'UNRESOLVED_INSUFFICIENT_EVIDENCE';

    if (clinIsPath && acmgIsBenign) {
      conflicts.push({
        conflictType: 'DATABASE_VS_ACMG',
        severity: 'HIGH',
        title: 'Severe Discordance: ClinVar Pathogenic vs ACMG Benign',
        description: `ClinVar reports '${clinvarRecord.clinicalSignificance}', but automated ACMG guidelines classify as '${acmgTier}'.`,
        firstSource: `ClinVar (${clinvarRecord.reviewStars} stars)`,
        secondSource: `ACMG Engine (${acmgEvaluation.rulesetVersion})`,
        suggestedAction: 'Manual clinical geneticist re-curation required. Verify if ClinVar assertions rely on historical papers without allele frequency filtering.',
      });
    } else if (clinIsBenign && acmgIsPath) {
      conflicts.push({
        conflictType: 'DATABASE_VS_ACMG',
        severity: 'HIGH',
        title: 'Severe Discordance: ClinVar Benign vs ACMG Pathogenic',
        description: `ClinVar consensus is '${clinvarRecord.clinicalSignificance}', whereas ACMG criteria evaluate to '${acmgTier}'.`,
        firstSource: `ClinVar (${clinvarRecord.reviewStars} stars)`,
        secondSource: `ACMG Engine (${acmgEvaluation.rulesetVersion})`,
        suggestedAction: 'Check for potential sample mix-ups, penetrance modifiers, or somatic vs germline status.',
      });
    } else if (clinIsVUS && acmgIsPath) {
      conflicts.push({
        conflictType: 'DATABASE_VS_ACMG',
        severity: 'MODERATE',
        title: 'ClinVar VUS vs ACMG Pathogenic Potential',
        description: `ClinVar currently maintains '${clinvarRecord.clinicalSignificance}', but sufficient computational and frequency criteria trigger '${acmgTier}'.`,
        firstSource: 'ClinVar (Outdated VUS consensus)',
        secondSource: 'ACMG Engine (Fresh computational criteria met)',
        suggestedAction: 'Consider submitting upgraded evidence to ClinVar panel if supported by clinical segregation.',
      });
    }
  }

  // 2. Conflict Check: Machine Learning Predictor vs ACMG Rules
  if (mlPrediction && acmgEvaluation) {
    const mlProb = mlPrediction.calibratedProbability;
    const acmgTier = acmgEvaluation.overallClassification;

    const acmgIsPath = acmgTier === 'PATHOGENIC' || acmgTier === 'LIKELY_PATHOGENIC';
    const acmgIsBenign = acmgTier === 'BENIGN' || acmgTier === 'LIKELY_BENIGN';

    if (mlProb >= 0.85 && acmgIsBenign) {
      conflicts.push({
        conflictType: 'ML_VS_ACMG',
        severity: 'HIGH',
        title: 'High In-Silico ML Pathogenicity Risk vs Benign ACMG Rules',
        description: `The ML model predicts high pathogenic probability (${(mlProb * 100).toFixed(1)}%), while rule-based ACMG classification yields '${acmgTier}'.`,
        firstSource: `ML Model ${mlPrediction.modelVersion}`,
        secondSource: `ACMG 2015 Engine`,
        suggestedAction: 'Remember that ACMG rules give primacy to population allele frequency (BA1/BS1), which can legitimately overrule high in-silico constraint scores.',
      });
    } else if (mlProb <= 0.15 && acmgIsPath) {
      conflicts.push({
        conflictType: 'ML_VS_ACMG',
        severity: 'MODERATE',
        title: 'Low In-Silico ML Score vs Pathogenic ACMG Rules',
        description: `The ML model predicts benign probability (${(mlProb * 100).toFixed(1)}%), whereas ACMG combination rules evaluate as '${acmgTier}'.`,
        firstSource: `ML Model ${mlPrediction.modelVersion}`,
        secondSource: `ACMG 2015 Engine`,
        suggestedAction: 'Check whether pathogenic mechanism is mediated by splice disruption or non-conserved domain alterations not captured by general ML features.',
      });
    }
  }

  // 3. Conflict Check: ClinVar Submitter-level Discordance
  if (clinvarRecord && clinvarRecord.submissions && clinvarRecord.submissions.length > 1) {
    const distinctClassifications = new Set(
      clinvarRecord.submissions.map((s) => s.clinicalSignificance.toLowerCase().trim())
    );
    const hasPath = Array.from(distinctClassifications).some((c) => c.includes('pathogenic'));
    const hasBenignOrVus = Array.from(distinctClassifications).some(
      (c) => c.includes('benign') || c.includes('uncertain') || c.includes('vus')
    );

    if (hasPath && hasBenignOrVus) {
      conflicts.push({
        conflictType: 'SUBMITTER_DISCORDANCE',
        severity: 'MODERATE',
        title: 'Conflicting Submitter Interpretations in ClinVar',
        description: `Submitting clinical laboratories disagree on classification. Multiple distinct classes found: [${Array.from(distinctClassifications).join(', ')}].`,
        firstSource: clinvarRecord.submissions[0].submitterName,
        secondSource: clinvarRecord.submissions[1].submitterName,
        suggestedAction: 'Inspect individual laboratory assertion criteria, review dates, and supporting evidence.',
      });
    }
  }

  // Determine overall status
  let summaryStatus: FullAnalysisResult['summaryStatus'] = 'COMPLETED';
  if (conflicts.length > 0) {
    summaryStatus = 'CONFLICTS_DETECTED';
  } else if (!clinvarRecord && !annotationData) {
    summaryStatus = 'INSUFFICIENT_EVIDENCE';
  }

  return {
    analysisId,
    normalizedVariant,
    clinvarRecord: clinvarRecord || undefined,
    annotationData,
    mlPrediction,
    acmgEvaluation,
    conflicts,
    summaryStatus,
    executionLog,
    createdAt: new Date().toISOString(),
  };
}
