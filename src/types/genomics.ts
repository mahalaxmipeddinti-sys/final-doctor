// src/types/genomics.ts

export type GenomeAssembly = 'GRCh38' | 'GRCh37';

export type InputType = 'clinvar_id' | 'hgvs' | 'coordinates' | 'custom_id';

export interface NormalizedVariant {
  originalInput: string;
  inputType: InputType;
  normalizedRepresentation: string;
  assembly: GenomeAssembly;
  chromosome: string; // e.g., '17'
  position: number;   // 1-based coordinate
  referenceAllele: string;
  alternateAllele: string;
  geneSymbol?: string;
  hgvsc?: string;
  hgvsp?: string;
  dbsnpRsid?: string;
  validationStatus: 'VALID' | 'AMBIGUOUS' | 'INVALID';
  validationWarnings: string[];
}

export interface SubmitterAssertion {
  submitterName: string;
  clinicalSignificance: string;
  reviewStatus: string;
  lastEvaluated?: string;
  assertionCriteria?: string;
  curatorNotes?: string;
}

export interface ClinVarRecord {
  variationId: string;
  title: string;
  canonicalAccession: string;
  clinicalSignificance: string;
  reviewStatus: string;
  reviewStars: number; // 0 to 4 stars
  lastEvaluated?: string;
  associatedConditions: string[];
  geneSymbol: string;
  hgvsNames: string[];
  submissions: SubmitterAssertion[];
  hasConflicts: boolean;
  sourceUrl: string;
  retrievedAt: string;
}

export interface AnnotationData {
  consequence: string; // e.g., 'missense_variant', 'frameshift_variant', 'synonymous_variant'
  impact: 'HIGH' | 'MODERATE' | 'LOW' | 'MODIFIER';
  maneTranscript?: string;
  cdnaChange?: string;
  proteinChange?: string;
  codonChange?: string;
  siftScore?: number;
  siftPrediction?: string; // 'deleterious' | 'tolerated'
  polyphenScore?: number;
  polyphenPrediction?: string; // 'probably_damaging' | 'possibly_damaging' | 'benign'
  caddPhred?: number;
  phylop100way?: number;
  gnomadAfGlobal?: number;
  gnomadAfPopmax?: number;
  exacAf?: number;
  isLossOfFunction: boolean;
  isSpliceRegion: boolean;
  isInKnownDomain: boolean;
  domainName?: string;
  source: string;
  retrievedAt: string;
}

export interface MLFeatureContribution {
  featureName: string;
  featureValue: number | string;
  weight: number;
  contributionDirection: 'PATHOGENIC' | 'BENIGN' | 'NEUTRAL';
  description: string;
}

export interface MLPrediction {
  modelVersion: string;
  pathogenicityScore: number; // 0.000 to 1.000
  calibratedProbability: number;
  classificationCategory: 'HIGH_RISK_PATHOGENIC' | 'MODERATE_RISK_LIKELY_PATHOGENIC' | 'UNCERTAIN' | 'LOW_RISK_LIKELY_BENIGN' | 'VERY_LOW_RISK_BENIGN';
  confidenceInterval: [number, number]; // [lower, upper]
  featureContributions: MLFeatureContribution[];
  missingFeatures: string[];
  disclaimer: string;
  trainingMetadata: {
    datasetSize: number;
    trainingDate: string;
    aucRoc: number;
    intendedUse: string;
  };
}

export type ACMGEvidenceStrength = 'VERY_STRONG' | 'STRONG' | 'MODERATE' | 'SUPPORTING' | 'STAND_ALONE';

export type ACMGEvidenceState = 'SUPPORTED' | 'NOT_SUPPORTED' | 'UNKNOWN' | 'CONFLICTING' | 'NOT_APPLICABLE' | 'MANUAL_REVIEW_REQUIRED';

export interface ACMGCriterionEvaluation {
  code: string; // e.g., 'PVS1', 'PM2', 'BA1'
  category: 'PATHOGENIC' | 'BENIGN';
  defaultStrength: ACMGEvidenceStrength;
  assignedStrength: ACMGEvidenceStrength;
  status: ACMGEvidenceState;
  shortDescription: string;
  rationale: string;
  evidenceSource: string;
  observationValue?: string;
  citationUrl?: string;
  isUserOverridden?: boolean;
  pointsAwarded?: number;
}

export type ACMGClassificationTier =
  | 'PATHOGENIC'
  | 'LIKELY_PATHOGENIC'
  | 'UNCERTAIN_SIGNIFICANCE'
  | 'LIKELY_BENIGN'
  | 'BENIGN'
  | 'UNRESOLVED_INSUFFICIENT_EVIDENCE';

export interface ACMGEvaluationResult {
  rulesetVersion: string; // e.g. 'ACMG/AMP 2015 v1.2'
  overallClassification: ACMGClassificationTier;
  bayesianScore: number; // -10 (benign) to +10 (pathogenic)
  bayesianProbability: number; // 0.0 to 1.0
  bayesianBreakdown?: string[]; // e.g. ["PVS1 (+8 pts)", "PM2 (+2 pts)"]
  supportedCriteria: string[]; // ['PVS1', 'PM2']
  contradictedCriteria: string[];
  notApplicableCriteria: string[];
  unknownCriteria: string[];
  criteriaEvaluations: Record<string, ACMGCriterionEvaluation>;
  appliedRuleSummary: string;
  requiresExpertReview: boolean;
  limitations: string[];
}

export interface ConflictRecord {
  conflictType: 'DATABASE_VS_ACMG' | 'ML_VS_ACMG' | 'SUBMITTER_DISCORDANCE' | 'BENIGN_VS_PATHOGENIC_CRITERIA';
  severity: 'HIGH' | 'MODERATE' | 'LOW';
  title: string;
  description: string;
  firstSource: string;
  secondSource: string;
  suggestedAction: string;
}

export interface FullAnalysisResult {
  analysisId: string;
  normalizedVariant: NormalizedVariant;
  clinvarRecord?: ClinVarRecord;
  annotationData?: AnnotationData;
  mlPrediction?: MLPrediction;
  acmgEvaluation?: ACMGEvaluationResult;
  conflicts: ConflictRecord[];
  summaryStatus: 'COMPLETED' | 'CONFLICTS_DETECTED' | 'INSUFFICIENT_EVIDENCE' | 'EXTERNAL_SERVICE_DEGRADED';
  executionLog: {
    step: string;
    status: 'SUCCESS' | 'WARNING' | 'SKIPPED' | 'FAILED';
    durationMs: number;
    details?: string;
  }[];
  trioData?: TrioAnalysisData;
  createdAt: string;
}

export type TrioZygosity = 'HETEROZYGOUS' | 'HOMOZYGOUS_ALT' | 'HOMOZYGOUS_REF_WILDTYPE' | 'HEMIZYGOUS' | 'UNKNOWN';

export type TrioParentalStatus =
  | 'WILDTYPE_NEGATIVE'
  | 'HETEROZYGOUS_CARRIER'
  | 'HOMOZYGOUS_AFFECTED'
  | 'NOT_TESTED';

export type InheritancePattern =
  | 'DE_NOVO_CONFIRMED'
  | 'MATERNAL_TRANSMISSION'
  | 'PATERNAL_TRANSMISSION'
  | 'BIPARENTAL_RECESSIVE'
  | 'X_LINKED_MATERNAL'
  | 'AUTOSOMAL_DOMINANT'
  | 'UNKNOWN_INHERITANCE';

export interface TrioMemberInput {
  relationship: 'child' | 'mother' | 'father';
  label: string;
  sampleId?: string; // Custom Subject / Sample / Patient ID (e.g. CH-2025-01, PROBAND-01)
  variantInput: string;
  customVariantDetails?: {
    gene?: string;
    chromosome?: string;
    position?: number;
    refAllele?: string;
    altAllele?: string;
    hgvsC?: string;
    hgvsP?: string;
    consequence?: string;
    inHouseNotes?: string;
  };
  zygosity: TrioZygosity;
  isAffected: boolean;
  uploadedReportFileName?: string;
  uploadedReportDataUrl?: string;
  uploadedReportMimeType?: string;
  uploadedReportFileSize?: number;
  uploadedReportExtracted?: {
    detectedId?: string;
    detectedHgvs?: string;
    detectedGene?: string;
    detectedZygosity?: TrioZygosity;
    isAffected?: boolean;
    summary?: string;
  };
  notes?: string;
}

export interface TrioAnalysisData {
  familyId?: string;
  child: TrioMemberInput;
  mother: TrioMemberInput;
  father: TrioMemberInput;
  inheritancePattern: InheritancePattern;
  inheritanceSummary: string;
  acmgImplications: string[];
  pedigreeSummary: {
    childStatus: string;
    motherStatus: string;
    fatherStatus: string;
  };
}
