// src/services/assayService.ts
// Generates clinical-grade simulation data for all 9 diagnostic assays

import {
  AssayType,
  AssayMeta,
  PcrData,
  SangerData,
  NgsData,
  WesData,
  WgsData,
  MicroarrayData,
  CmaData,
  GenotypingData,
  KaryotypingData,
} from '../types/assays.ts';
import { NormalizedVariant } from '../types/genomics.ts';

export const ASSAY_METADATA_LIST: AssayMeta[] = [
  {
    id: 'pcr',
    name: 'PCR',
    fullName: 'Polymerase Chain Reaction & Agarose Gel Electrophoresis',
    category: 'Molecular Diagnostics',
    resolution: 'Amplicon length (±5-10 bp)',
    turnaroundTime: '2 - 4 Hours',
    clinicalUtility: 'Targeted mutation screening, size-based insertion/deletion detection, qPCR copy quantitation.',
    costBracket: '$',
    targetAnalytes: 'Specific genomic amplicons, DNA fragment size variants',
  },
  {
    id: 'sanger',
    name: 'Sanger',
    fullName: 'Sanger Dideoxy Capillary Electrophoresis Sequencing',
    category: 'Molecular Diagnostics',
    resolution: 'Single nucleotide (1 bp, Gold Standard)',
    turnaroundTime: '24 - 48 Hours',
    clinicalUtility: 'Orthogonal confirmation of NGS candidate variants, familial targeted cascade testing.',
    costBracket: '$$',
    targetAnalytes: 'Targeted single-exon sequencing (up to 800 bp read length)',
  },
  {
    id: 'ngs',
    name: 'NGS Panel',
    fullName: 'Targeted Next-Generation Sequencing Panel (Illumina SBS)',
    category: 'Next-Gen Sequencing',
    resolution: 'Single nucleotide & small indels (<50 bp) at high depth',
    turnaroundTime: '1 - 2 Weeks',
    clinicalUtility: 'Multi-gene disease panels (hereditary cancer, cardiomyopathy, epilepsy, ataxia).',
    costBracket: '$$$',
    targetAnalytes: 'Dozens to hundreds of disease-associated genes simultaneously',
  },
  {
    id: 'wes',
    name: 'WES',
    fullName: 'Whole Exome Sequencing (Target-Enriched Coding Genome)',
    category: 'Next-Gen Sequencing',
    resolution: '~20,000 protein-coding genes (~1.5% of human genome)',
    turnaroundTime: '2 - 4 Weeks',
    clinicalUtility: 'Undiagnosed rare genetic syndromes, neurodevelopmental delays, trio proband-parent analysis.',
    costBracket: '$$$',
    targetAnalytes: 'All known human protein-coding exons and CCDS splice junctions',
  },
  {
    id: 'wgs',
    name: 'WGS',
    fullName: 'Whole Genome Sequencing (Complete 3.2 Gb Nuclear & Mitochondrial Genome)',
    category: 'Next-Gen Sequencing',
    resolution: 'Base-pair resolution across non-coding, deep intronic, regulatory & structural SVs',
    turnaroundTime: '3 - 6 Weeks',
    clinicalUtility: 'Complex genomic rearrangements, non-coding regulatory alterations, rapid neonatal ICU diagnostics.',
    costBracket: '$$$$',
    targetAnalytes: 'Entire nuclear genome + mtDNA, copy number variations, balanced translocations',
  },
  {
    id: 'microarray',
    name: 'Microarray',
    fullName: 'High-Density DNA Hybridization Microarray (Gene Expression / Target Arrays)',
    category: 'Cytogenomics & Arrays',
    resolution: '10,000 - 50,000 gene probe spots',
    turnaroundTime: '3 - 5 Days',
    clinicalUtility: 'Transcriptome expression profiling, oncological gene signatures, biomarker discovery.',
    costBracket: '$$',
    targetAnalytes: 'Fluorescently hybridized cDNA/mRNA targets vs reference control',
  },
  {
    id: 'cma',
    name: 'CMA / aCGH',
    fullName: 'Chromosomal Microarray Analysis (Oligo-SNP Array / Array CGH)',
    category: 'Cytogenomics & Arrays',
    resolution: 'Submicroscopic CNVs (10 kb - 50 kb resolution, 100x finer than karyotype)',
    turnaroundTime: '1 - 2 Weeks',
    clinicalUtility: 'First-tier diagnostic test for unexplained developmental delay, autism spectrum, multiple anomalies.',
    costBracket: '$$$',
    targetAnalytes: 'Copy number variations (microdeletions, duplications, LOH, AOH uniparental disomy)',
  },
  {
    id: 'genotyping',
    name: 'Genotyping / SNP',
    fullName: 'TaqMan & BeadArray High-Throughput SNP Genotyping Cluster Analysis',
    category: 'Cytogenomics & Arrays',
    resolution: 'Targeted single-nucleotide polymorphisms (SNPs) across Cartesian clusters',
    turnaroundTime: '1 - 3 Days',
    clinicalUtility: 'Pharmacogenomics (CYP2C19, CYP2D6), polygenic risk scores, population carrier screening.',
    costBracket: '$',
    targetAnalytes: 'Allele-specific fluorescent discrimination (FAM vs VIC / Allele A vs B)',
  },
  {
    id: 'karyotyping',
    name: 'Karyotyping',
    fullName: 'Classical Cytogenetics & Metaphase G-Banding Karyotype',
    category: 'Cytogenomics & Arrays',
    resolution: 'Macro-chromosomal (5 Mb - 10 Mb, 400-550 band resolution)',
    turnaroundTime: '1 - 3 Weeks (cell culture required)',
    clinicalUtility: 'Aneuploidies (Down, Turner, Klinefelter), balanced translocations, recurrent miscarriage evaluation.',
    costBracket: '$$',
    targetAnalytes: 'Full metaphase chromosomal spread and structural integrity of 23 chromosome pairs',
  },
];

// Helper to get simulated PCR data
export function simulatePcrData(variant?: NormalizedVariant): PcrData {
  const gene = variant?.geneSymbol || 'BRCA1';
  const isIndel = variant?.alternateAllele && variant.alternateAllele.length !== (variant.referenceAllele?.length || 1);
  const ampliconLength = isIndel ? 312 : 285;

  return {
    targetGene: gene,
    ampliconLengthBp: ampliconLength,
    forwardPrimer: `5'-TGCCCAAAACTCTGCCGTTT-3' (Tm: 59.8°C)`,
    reversePrimer: `5'-ACAGAGGAAGCCTTCAGCCA-3' (Tm: 60.2°C)`,
    annealingTempC: 58.5,
    cycles: 35,
    meltingCurveTmC: 84.6,
    cycleThresholdCt: 22.4,
    isPositive: true,
    gelBandSizeBp: ampliconLength,
    controlBandSizeBp: 500, // Beta-actin internal control
    amplificationEfficiency: 98.4,
  };
}

// Helper to get simulated Sanger chromatogram traces
export function simulateSangerData(variant?: NormalizedVariant): SangerData {
  const gene = variant?.geneSymbol || 'BRCA1';
  const ref = (variant?.referenceAllele || 'G').toUpperCase();
  const alt = (variant?.alternateAllele || 'A').toUpperCase();

  // 15 bases surrounding variant site
  const prefix = ['A', 'C', 'T', 'G', 'G', 'C', 'A'];
  const suffix = ['T', 'T', 'C', 'G', 'A', 'A', 'C'];
  const sequenceContext = [...prefix, ref, ...suffix];
  const variantIndex = prefix.length; // index 7

  const calls = sequenceContext.map((base, idx) => {
    const isVar = idx === variantIndex;
    return {
      position: idx + 1,
      calledBase: isVar ? (alt.length === 1 ? `${ref}/${alt}` : `${alt}`) : base,
      confidenceScore: isVar ? 52 : Math.floor(45 + Math.random() * 10),
      isVariantSite: isVar,
      referenceBase: isVar ? ref : undefined,
      alternateBase: isVar ? alt : undefined,
      isHeterozygous: isVar,
    };
  });

  // Generate smooth Gaussian trace peaks
  const pointsPerBase = 12;
  const traces = [];
  const totalPoints = sequenceContext.length * pointsPerBase;

  for (let i = 0; i < totalPoints; i++) {
    const baseIdx = Math.floor(i / pointsPerBase);
    const center = baseIdx * pointsPerBase + pointsPerBase / 2;
    const dist = i - center;
    const gaussian = Math.exp(-(dist * dist) / 14);

    const currentBase = sequenceContext[baseIdx];
    const isVar = baseIdx === variantIndex;

    let aVal = 4 + Math.random() * 4;
    let cVal = 4 + Math.random() * 4;
    let gVal = 4 + Math.random() * 4;
    let tVal = 4 + Math.random() * 4;

    if (isVar) {
      // Split peak for heterozygous variant
      const peakHeight = 85 * gaussian;
      if (ref === 'A') aVal += peakHeight * 0.52;
      if (ref === 'C') cVal += peakHeight * 0.52;
      if (ref === 'G') gVal += peakHeight * 0.52;
      if (ref === 'T') tVal += peakHeight * 0.52;

      if (alt === 'A') aVal += peakHeight * 0.48;
      if (alt === 'C') cVal += peakHeight * 0.48;
      if (alt === 'G') gVal += peakHeight * 0.48;
      if (alt === 'T') tVal += peakHeight * 0.48;
    } else {
      const peakHeight = 92 * gaussian;
      if (currentBase === 'A') aVal += peakHeight;
      if (currentBase === 'C') cVal += peakHeight;
      if (currentBase === 'G') gVal += peakHeight;
      if (currentBase === 'T') tVal += peakHeight;
    }

    traces.push({
      index: i,
      A: Math.round(aVal),
      C: Math.round(cVal),
      G: Math.round(gVal),
      T: Math.round(tVal),
    });
  }

  return {
    targetGene: gene,
    exon: 'Exon 20',
    transcript: 'NM_007294.4',
    variantCoord: variant?.normalizedRepresentation || `chr17:${variant?.position || 43044295}`,
    traces,
    calls,
    variantSiteIndex: variantIndex,
    qualityMeanPhred: 54.2,
  };
}

// Helper to get simulated NGS pileup reads
export function simulateNgsData(variant?: NormalizedVariant): NgsData {
  const gene = variant?.geneSymbol || 'BRCA1';
  const ref = (variant?.referenceAllele || 'G').toUpperCase();
  const alt = (variant?.alternateAllele || 'A').toUpperCase();

  const totalReads = 148;
  const altReads = 71; // ~48% VAF
  const refReads = totalReads - altReads;

  // Generate 24 representative aligned reads for the visualization pileup
  const reads = [];
  const readTemplates = [
    'ACTTGGCAATTCGAACGTTC',
    'TTGGCAATTCGAACGTTCCA',
    'GGCAATTCGAACGTTCCATG',
    'AATTCGAACGTTCCATGACG',
    'TTCGAACGTTCCATGACGTC',
  ];

  for (let i = 0; i < 22; i++) {
    const isAlt = i % 2 === 0;
    const strand: '+' | '-' = i % 3 === 0 ? '-' : '+';
    const offset = Math.floor(Math.random() * 5);
    const template = readTemplates[i % readTemplates.length];

    reads.push({
      id: `READ_SIM_${i + 1}`,
      strand,
      startOffset: offset,
      sequence: template,
      cigar: '150M',
      hasMismatch: isAlt,
      mismatchPos: 7,
      mismatchBase: isAlt ? alt : undefined,
      mappingQuality: 60,
    });
  }

  return {
    gene,
    region: `chr${variant?.chromosome || '17'}:${(variant?.position || 43044295) - 100}-${(variant?.position || 43044295) + 100}`,
    meanDepth: 148,
    vaf: Number((altReads / totalReads).toFixed(3)),
    totalReads,
    altReads,
    refReads,
    reads,
    coverageProfile: [110, 122, 134, 142, 148, 150, 148, 145, 138, 125, 115],
    flowCellTile: 'HWI-ST1288:1:1101:1425:2184',
  };
}

// Helper for WES simulation
export function simulateWesData(variant?: NormalizedVariant): WesData {
  const gene = variant?.geneSymbol || 'BRCA1';
  return {
    gene,
    ccdsExonsTargeted: 24,
    onTargetPercent: 86.4,
    meanTargetCoverage: 118,
    percentExomeAbove20x: 97.2,
    targetBaitKit: 'Twist Human Core Exome v2.0 (36.8 Mb target)',
    exons: [
      { exonNumber: 18, sizeBp: 154, meanDepth: 124, containsVariant: false },
      { exonNumber: 19, sizeBp: 218, meanDepth: 112, containsVariant: false },
      { exonNumber: 20, sizeBp: 342, meanDepth: 138, containsVariant: true },
      { exonNumber: 21, sizeBp: 188, meanDepth: 104, containsVariant: false },
      { exonNumber: 22, sizeBp: 290, meanDepth: 119, containsVariant: false },
    ],
  };
}

// Helper for WGS simulation
export function simulateWgsData(variant?: NormalizedVariant): WgsData {
  return {
    genomeAssembly: variant?.assembly || 'GRCh38',
    meanAutosomalCoverage: 34.6,
    percentGenomeAbove15x: 99.1,
    gcBiasScore: 1.02,
    structuralVariantsCount: 14,
    svCalls: [
      {
        chr: variant?.chromosome || '17',
        start: 43044000,
        end: 43045000,
        type: 'DEL',
        sizeKb: 1.0,
        genesInvolved: [variant?.geneSymbol || 'BRCA1'],
      },
      {
        chr: '7',
        start: 117559000,
        end: 117561000,
        type: 'DUP',
        sizeKb: 2.0,
        genesInvolved: ['CFTR'],
      },
    ],
  };
}

// Helper for DNA Microarray simulation
export function simulateMicroarrayData(variant?: NormalizedVariant): MicroarrayData {
  const gene = variant?.geneSymbol || 'BRCA1';
  const spots = [];

  const controlGenes = [
    'GAPDH', 'ACTB', 'BRCA1', 'TP53', 'MYC', 'EGFR', 'PTEN', 'VEGFA',
    'CDKN2A', 'ERBB2', 'PIK3CA', 'ESR1', 'ATM', 'CHEK2', 'PALB2', 'RAD51D',
  ];

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const idx = r * 4 + c;
      const g = controlGenes[idx] || `PROBE_${idx}`;
      const isTarget = g === gene;

      const cy3 = Math.floor(400 + Math.random() * 400); // Green (Reference)
      const cy5 = isTarget
        ? Math.floor(cy3 * 0.42) // Downregulated in tumor / loss of function
        : Math.floor(cy3 * (0.8 + Math.random() * 0.4)); // Balanced

      const ratio = Number(Math.log2(cy5 / cy3).toFixed(2));

      spots.push({
        row: r,
        col: c,
        gene: g,
        cy3Intensity: cy3,
        cy5Intensity: cy5,
        ratioLog2: ratio,
        pValue: isTarget ? 0.0004 : Number((0.08 + Math.random() * 0.4).toFixed(3)),
        isSignificantlyExpressed: isTarget,
      });
    }
  }

  return {
    arrayPlatform: 'Agilent SurePrint G3 Human Gene Expression 8x60K v2',
    totalProbes: 16,
    spots,
    candidateGeneRatio: -1.25,
    candidateGeneSymbol: gene,
  };
}

// Helper for CMA simulation
export function simulateCmaData(variant?: NormalizedVariant): CmaData {
  const chr = variant?.chromosome || '17';
  const probes = [];

  // 40 probe coordinates across the chromosome arm
  for (let i = 0; i < 40; i++) {
    const posMb = 41.0 + i * 0.15;
    const isAnomalyRegion = i >= 18 && i <= 24;

    // Log2 ratio: normal is ~0 with noise. Anomaly is -0.92 (deletion) or +0.55 (duplication)
    const log2 = isAnomalyRegion
      ? -0.88 + (Math.random() - 0.5) * 0.15 // Microdeletion
      : (Math.random() - 0.5) * 0.12; // Normal diploid

    // BAF: normal is 0, 0.5, 1.0. In deletion, heterozygous 0.5 disappears!
    let baf = 0.5;
    const rand = Math.random();
    if (isAnomalyRegion) {
      baf = rand > 0.5 ? 0.98 : 0.02; // Loss of heterozygosity (LOH)
    } else {
      baf = rand < 0.33 ? 0.02 : rand < 0.66 ? 0.5 : 0.98;
    }

    probes.push({
      id: `SNP_A-${749200 + i}`,
      chromosome: `chr${chr}`,
      genomicPositionMb: Number(posMb.toFixed(2)),
      log2Ratio: Number(log2.toFixed(3)),
      bAlleleFrequency: Number(baf.toFixed(3)),
      cytoband: `${chr}q21.31`,
      isAbnormal: isAnomalyRegion,
    });
  }

  return {
    platform: 'Oligo-SNP Chromosomal Microarray (750K)',
    chromosome: `chr${chr}`,
    abnormalityType: 'Copy Number Loss (Microdeletion)',
    genomicSpan: `chr${chr}:43.70Mb-44.60Mb (~900 kb)`,
    probes,
    criticalGenes: [variant?.geneSymbol || 'BRCA1', 'NBR1', 'ARL4D'],
    clinicalSignificance: 'Pathogenic CNV',
  };
}

// Helper for Genotyping / SNP simulation
export function simulateGenotypingData(variant?: NormalizedVariant): GenotypingData {
  const gene = variant?.geneSymbol || 'BRCA1';
  const ref = (variant?.referenceAllele || 'G').toUpperCase();
  const alt = (variant?.alternateAllele || 'A').toUpperCase();

  const clusterPoints = [];

  // AA cluster (Homozygous Ref)
  for (let i = 0; i < 20; i++) {
    clusterPoints.push({
      id: `REF_AA_${i}`,
      sampleType: 'Reference' as const,
      normIntensityX: 0.85 + (Math.random() - 0.5) * 0.1,
      normIntensityY: 0.08 + (Math.random() - 0.5) * 0.06,
      call: 'AA (Homozygous Ref)' as const,
    });
  }

  // AB cluster (Heterozygous)
  for (let i = 0; i < 20; i++) {
    clusterPoints.push({
      id: `REF_AB_${i}`,
      sampleType: 'HapMap Control' as const,
      normIntensityX: 0.55 + (Math.random() - 0.5) * 0.1,
      normIntensityY: 0.55 + (Math.random() - 0.5) * 0.1,
      call: 'AB (Heterozygous)' as const,
    });
  }

  // BB cluster (Homozygous Alt)
  for (let i = 0; i < 20; i++) {
    clusterPoints.push({
      id: `REF_BB_${i}`,
      sampleType: 'Reference' as const,
      normIntensityX: 0.08 + (Math.random() - 0.5) * 0.06,
      normIntensityY: 0.85 + (Math.random() - 0.5) * 0.1,
      call: 'BB (Homozygous Alt)' as const,
    });
  }

  // The Patient Proband Point (Heterozygous AB)
  clusterPoints.push({
    id: 'PATIENT_SAMPLE',
    sampleType: 'Patient Proband' as const,
    normIntensityX: 0.56,
    normIntensityY: 0.54,
    call: 'AB (Heterozygous)' as const,
  });

  return {
    markerRsid: variant?.dbsnpRsid || 'rs80357906',
    gene,
    alleleRef: ref,
    alleleAlt: alt,
    callRatePercent: 99.8,
    patientCall: 'AB (Heterozygous)',
    clusterPoints,
  };
}

// Helper for Karyotyping simulation
export function simulateKaryotypingData(variant?: NormalizedVariant): KaryotypingData {
  const chromosomes = [];

  for (let i = 1; i <= 22; i++) {
    chromosomes.push({
      number: String(i),
      label: `Chr ${i}`,
      type: 'autosome' as const,
      bands: [
        { name: 'p22', stain: 'gpos50' as const, pStart: 0, pEnd: 25 },
        { name: 'p11', stain: 'gneg' as const, pStart: 25, pEnd: 45 },
        { name: 'cen', stain: 'acen' as const, pStart: 45, pEnd: 55 },
        { name: 'q12', stain: 'gpos75' as const, pStart: 55, pEnd: 75 },
        { name: 'q24', stain: 'gneg' as const, pStart: 75, pEnd: 100 },
      ],
    });
  }

  // Sex chromosomes
  chromosomes.push({
    number: 'X',
    label: 'Chr X',
    type: 'sex' as const,
    bands: [
      { name: 'p22', stain: 'gpos75' as const, pStart: 0, pEnd: 30 },
      { name: 'cen', stain: 'acen' as const, pStart: 30, pEnd: 45 },
      { name: 'q21', stain: 'gneg' as const, pStart: 45, pEnd: 100 },
    ],
  });

  chromosomes.push({
    number: 'Y',
    label: 'Chr Y',
    type: 'sex' as const,
    bands: [
      { name: 'p11', stain: 'gneg' as const, pStart: 0, pEnd: 35 },
      { name: 'cen', stain: 'acen' as const, pStart: 35, pEnd: 50 },
      { name: 'q12', stain: 'gpos100' as const, pStart: 50, pEnd: 100 },
    ],
  });

  return {
    karyotypeIscn: '46,XY',
    resolutionBands: 550,
    mitoticIndexPercent: 8.4,
    cellsAnalyzed: 20,
    chromosomes,
    cytogeneticDiagnosis: 'Normal male constitutional karyotype (46,XY). No gross numerical or structural aneuploidies detectable at 550-band resolution (>5-10 Mb limit of detection).',
  };
}
