// src/types/assays.ts
// Clinical Molecular and Cytogenomic Diagnostic Assay Modalities

export type AssayType =
  | 'pcr'
  | 'sanger'
  | 'ngs'
  | 'wes'
  | 'wgs'
  | 'microarray'
  | 'cma'
  | 'genotyping'
  | 'karyotyping';

export interface AssayMeta {
  id: AssayType;
  name: string;
  fullName: string;
  category: 'Molecular Diagnostics' | 'Next-Gen Sequencing' | 'Cytogenomics & Arrays';
  resolution: string;
  turnaroundTime: string;
  clinicalUtility: string;
  costBracket: '$' | '$$' | '$$$' | '$$$$';
  targetAnalytes: string;
}

export interface PcrData {
  targetGene: string;
  ampliconLengthBp: number;
  forwardPrimer: string;
  reversePrimer: string;
  annealingTempC: number;
  cycles: number;
  meltingCurveTmC: number;
  cycleThresholdCt: number;
  isPositive: boolean;
  gelBandSizeBp: number;
  controlBandSizeBp: number;
  amplificationEfficiency: number;
}

export interface SangerTracePoint {
  index: number;
  A: number;
  C: number;
  G: number;
  T: number;
}

export interface SangerCall {
  position: number;
  calledBase: string;
  confidenceScore: number;
  isVariantSite?: boolean;
  referenceBase?: string;
  alternateBase?: string;
  isHeterozygous?: boolean;
}

export interface SangerData {
  targetGene: string;
  exon: string;
  transcript: string;
  variantCoord: string;
  traces: SangerTracePoint[];
  calls: SangerCall[];
  variantSiteIndex: number;
  qualityMeanPhred: number;
}

export interface NgsRead {
  id: string;
  strand: '+' | '-';
  startOffset: number;
  sequence: string;
  cigar: string;
  hasMismatch: boolean;
  mismatchPos?: number;
  mismatchBase?: string;
  mappingQuality: number;
}

export interface NgsData {
  gene: string;
  region: string;
  meanDepth: number;
  vaf: number; // Variant Allele Frequency (0.0 to 1.0)
  totalReads: number;
  altReads: number;
  refReads: number;
  reads: NgsRead[];
  coverageProfile: number[];
  flowCellTile: string;
}

export interface WesData {
  gene: string;
  ccdsExonsTargeted: number;
  onTargetPercent: number;
  meanTargetCoverage: number;
  percentExomeAbove20x: number;
  targetBaitKit: string;
  exons: {
    exonNumber: number;
    sizeBp: number;
    meanDepth: number;
    containsVariant: boolean;
  }[];
}

export interface WgsData {
  genomeAssembly: 'GRCh38' | 'GRCh37';
  meanAutosomalCoverage: number;
  percentGenomeAbove15x: number;
  gcBiasScore: number;
  structuralVariantsCount: number;
  svCalls: {
    chr: string;
    start: number;
    end: number;
    type: 'DEL' | 'DUP' | 'INV' | 'TRA';
    sizeKb: number;
    genesInvolved: string[];
  }[];
}

export interface MicroarraySpot {
  row: number;
  col: number;
  gene: string;
  cy3Intensity: number; // green (Control)
  cy5Intensity: number; // red (Test)
  ratioLog2: number;
  pValue: number;
  isSignificantlyExpressed: boolean;
}

export interface MicroarrayData {
  arrayPlatform: string;
  totalProbes: number;
  spots: MicroarraySpot[];
  candidateGeneRatio: number;
  candidateGeneSymbol: string;
}

export interface CmaProbe {
  id: string;
  chromosome: string;
  genomicPositionMb: number;
  log2Ratio: number; // ~0 normal, <-0.5 del, >+0.3 dup
  bAlleleFrequency: number; // 0, 0.5, 1.0
  cytoband: string;
  isAbnormal: boolean;
}

export interface CmaData {
  platform: 'Oligo-SNP Chromosomal Microarray (750K)';
  chromosome: string;
  abnormalityType: 'Copy Number Loss (Microdeletion)' | 'Copy Number Gain (Duplication)' | 'Normal Copy Number' | 'Loss of Heterozygosity (LOH)';
  genomicSpan: string;
  probes: CmaProbe[];
  criticalGenes: string[];
  clinicalSignificance: 'Pathogenic CNV' | 'Variant of Uncertain Significance (VOUS)' | 'Benign Polymorphism';
}

export interface SnpClusterPoint {
  id: string;
  sampleType: 'Reference' | 'HapMap Control' | 'Patient Proband' | 'Mother' | 'Father';
  normIntensityX: number; // Allele A
  normIntensityY: number; // Allele B
  call: 'AA (Homozygous Ref)' | 'AB (Heterozygous)' | 'BB (Homozygous Alt)' | 'No Call';
}

export interface GenotypingData {
  markerRsid: string;
  gene: string;
  alleleRef: string;
  alleleAlt: string;
  callRatePercent: number;
  patientCall: 'AA (Homozygous Ref)' | 'AB (Heterozygous)' | 'BB (Homozygous Alt)';
  clusterPoints: SnpClusterPoint[];
}

export interface ChromosomeBand {
  name: string;
  stain: 'gneg' | 'gpos25' | 'gpos50' | 'gpos75' | 'gpos100' | 'acen';
  pStart: number;
  pEnd: number;
}

export interface ChromosomeItem {
  number: string;
  label: string;
  type: 'autosome' | 'sex';
  isAneuploid?: boolean;
  hasStructuralAnomaly?: boolean;
  anomalyDescription?: string;
  bands: ChromosomeBand[];
}

export interface KaryotypingData {
  karyotypeIscn: string; // e.g. "46,XY", "47,XX,+21", "46,XX,del(17)(q21.31)"
  resolutionBands: number; // e.g. 550 bands
  mitoticIndexPercent: number;
  cellsAnalyzed: number;
  chromosomes: ChromosomeItem[];
  cytogeneticDiagnosis: string;
}
