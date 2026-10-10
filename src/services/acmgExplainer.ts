// src/services/acmgExplainer.ts
import {
  ACMGEvaluationResult,
  AnnotationData,
  ClinVarRecord,
  MLPrediction,
  NormalizedVariant,
} from '../types/genomics.ts';
import { ACMG_CRITERIA_REGISTRY, ACMG_RULESET_VERSION } from './acmgRegistry.ts';

export interface CriterionExplanationStep {
  code: string;
  category: 'PATHOGENIC' | 'BENIGN';
  status: 'MET' | 'NOT_MET' | 'NOT_EVALUATED' | 'CONFLICTING' | 'NOT_APPLICABLE' | 'UNSUPPORTED';
  assignedStrength: string;
  shortDescription: string;
  reasoning: string;
  evidenceObservations?: string;
  sourceProvenance: string;
  citationUrl?: string;
  warnings?: string[];
}

export interface ClassificationDiscrepancy {
  hasDiscrepancy: boolean;
  summary: string;
  acmgTier: string;
  clinvarAssertion?: string;
  mlCategory?: string;
  mlScore?: number;
  explanation: string;
}

export interface MissingEvidenceRecommendation {
  neededForUpgrade: string[];
  suggestedClinicalActions: string[];
}

export interface DetailedACMGExplanation {
  analysisId: string;
  variantIdentity: string;
  assembly: string;
  rulesetVersion: string;
  finalClassification: string;
  appliedRuleSummary: string;
  bayesianPoints: number;
  posteriorProbability: number;
  criterionSteps: CriterionExplanationStep[];
  discrepancy: ClassificationDiscrepancy;
  missingEvidence: MissingEvidenceRecommendation;
  researchDisclaimer: string;
  evaluatedAt: string;
}

export function generateACMGExplanation(
  analysisId: string,
  variant: NormalizedVariant,
  acmgResult: ACMGEvaluationResult,
  annotation?: AnnotationData,
  clinvar?: ClinVarRecord | null,
  mlPrediction?: MLPrediction
): DetailedACMGExplanation {
  const steps: CriterionExplanationStep[] = [];

  for (const [code, ev] of Object.entries(acmgResult.criteriaEvaluations)) {
    const regDef = ACMG_CRITERIA_REGISTRY[code];
    let statusMapped: CriterionExplanationStep['status'] = 'NOT_MET';

    if (ev.status === 'SUPPORTED') {
      statusMapped = 'MET';
    } else if (ev.status === 'NOT_SUPPORTED') {
      statusMapped = 'NOT_MET';
    } else if (ev.status === 'NOT_APPLICABLE') {
      statusMapped = 'NOT_APPLICABLE';
    } else if (ev.status === 'CONFLICTING') {
      statusMapped = 'CONFLICTING';
    } else {
      statusMapped = 'NOT_EVALUATED';
    }

    let reasoningText = ev.rationale;
    if (!reasoningText) {
      if (statusMapped === 'MET') {
        reasoningText = regDef?.explanationTemplate.met || 'Criterion evidence requirements satisfied.';
      } else if (statusMapped === 'NOT_MET') {
        reasoningText = regDef?.explanationTemplate.notMet || 'Evidence thresholds not met.';
      } else {
        reasoningText = regDef?.explanationTemplate.notEvaluated || 'Required input parameters missing for evaluation.';
      }
    }

    const warnings: string[] = [];
    if (regDef?.clinGenSviModified) {
      warnings.push(`ClinGen SVI Modified: Evaluation follows ClinGen updated specification for ${code}.`);
    }

    steps.push({
      code,
      category: ev.category,
      status: statusMapped,
      assignedStrength: ev.assignedStrength,
      shortDescription: ev.shortDescription || regDef?.name || code,
      reasoning: reasoningText,
      evidenceObservations: ev.observationValue,
      sourceProvenance: ev.evidenceSource || regDef?.guidelineSource || 'Automated ACMG Rules Engine',
      citationUrl: ev.citationUrl || regDef?.clingenUrl,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  }

  // --- DISCREPANCY ANALYSIS ---
  let hasDiscrepancy = false;
  let summary = 'Consensus reached across ACMG evidence rules, ClinVar assertions, and ML predictions.';
  const acmgTier = acmgResult.overallClassification;
  const clinvarAssertion = clinvar?.clinicalSignificance || 'No ClinVar Record';
  const mlCategory = mlPrediction?.classificationCategory || 'ML Unavailable';
  const mlScore = mlPrediction?.calibratedProbability;

  const isAcmgPathogenic = acmgTier === 'PATHOGENIC' || acmgTier === 'LIKELY_PATHOGENIC';
  const isAcmgBenign = acmgTier === 'BENIGN' || acmgTier === 'LIKELY_BENIGN';
  const isClinvarPathogenic = clinvarAssertion.toLowerCase().includes('pathogenic');
  const isClinvarBenign = clinvarAssertion.toLowerCase().includes('benign');
  const isMlHighRisk = (mlScore ?? 0) >= 0.70;
  const isMlLowRisk = (mlScore ?? 0) <= 0.30;

  let explanationText = 'All modalities show concordant signal.';

  if (isAcmgPathogenic && isClinvarBenign) {
    hasDiscrepancy = true;
    summary = 'Discrepancy Warning: ACMG evidence engine classifies variant as Pathogenic/Likely Pathogenic, but ClinVar reports Benign.';
    explanationText = 'Direct molecular annotations (e.g. Loss of Function / domain hotspot) meet ACMG rules, whereas ClinVar external submitters assert benign status. Independent laboratory re-curation is recommended.';
  } else if (isAcmgBenign && isClinvarPathogenic) {
    hasDiscrepancy = true;
    summary = 'Discrepancy Warning: ACMG evidence engine classifies variant as Benign/Likely Benign, but ClinVar reports Pathogenic.';
    explanationText = 'High population allele frequency (BA1/BS1) or in silico benign predictions contradict legacy ClinVar submissions. Verify population database filter criteria.';
  } else if (isAcmgPathogenic && isMlLowRisk) {
    hasDiscrepancy = true;
    summary = 'Model Discrepancy: ACMG rules classify as Pathogenic, but ML predictor gives low pathogenicity probability.';
    explanationText = 'Rule-based expert guidelines override statistical ML inference. The ML model may lack features for this specific gene mechanism.';
  } else if (acmgTier === 'UNCERTAIN_SIGNIFICANCE' && isClinvarPathogenic) {
    hasDiscrepancy = true;
    summary = 'Evidence Gap: ClinVar submits Pathogenic, but ACMG rules result in VUS due to missing primary evidence (e.g. segregation or functional assays).';
    explanationText = 'ClinVar submitters may rely on internal, unpublished case data. Local evidence rules require explicit pedigree or assay validation before upgrading from VUS.';
  }

  // --- MISSING EVIDENCE RECOMMENDATIONS ---
  const neededForUpgrade: string[] = [];
  const suggestedClinicalActions: string[] = [];

  if (acmgTier === 'UNCERTAIN_SIGNIFICANCE' || acmgTier === 'UNRESOLVED_INSUFFICIENT_EVIDENCE') {
    neededForUpgrade.push('Pedigree segregation study in affected relatives (PP1 / PS2 de novo testing).');
    neededForUpgrade.push('Validated functional assay evaluating protein/splicing function (PS3 / BS3).');
    neededForUpgrade.push('Extended case-control cohort frequency comparison (PS4).');

    suggestedClinicalActions.push('Collect family pedigree and submit proband parent samples for trio de novo verification.');
    suggestedClinicalActions.push('Search ClinGen Variant Curation Expert Panel (VCEP) registry for gene-specific specifications.');
    suggestedClinicalActions.push('Monitor ClinVar quarterly for updated submitter consensus or new functional evidence.');
  } else {
    suggestedClinicalActions.push('Archive analysis record in institutional genomic database.');
    suggestedClinicalActions.push('Include research disclaimer in clinical report export.');
  }

  return {
    analysisId,
    variantIdentity: variant.normalizedRepresentation,
    assembly: variant.assembly,
    rulesetVersion: acmgResult.rulesetVersion || ACMG_RULESET_VERSION,
    finalClassification: acmgTier,
    appliedRuleSummary: acmgResult.appliedRuleSummary,
    bayesianPoints: acmgResult.bayesianScore,
    posteriorProbability: acmgResult.bayesianProbability,
    criterionSteps: steps,
    discrepancy: {
      hasDiscrepancy,
      summary,
      acmgTier,
      clinvarAssertion,
      mlCategory,
      mlScore,
      explanation: explanationText,
    },
    missingEvidence: {
      neededForUpgrade,
      suggestedClinicalActions,
    },
    researchDisclaimer:
      'CAUTION: This ACMG/AMP variant classification is generated for research, educational, and computational decision-support purposes only. Final clinical diagnosis requires expert review by a certified Medical Geneticist or Molecular Pathologist.',
    evaluatedAt: new Date().toISOString(),
  };
}
