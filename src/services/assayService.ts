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

// Curated gene metrics to provide instant realism for clinical presets and user inputs
export const GENE_SPECIFIC_METRICS: Record<
  string,
  {
    chromosome: string;
    cytoband: string;
    transcript: string;
    targetExon: number;
    exonCount: number;
    forwardPrimer: string;
    reversePrimer: string;
    ampliconLen: number;
    dbsnp: string;
    flankingGenes: string[];
    omimDisease: string;
  }
> = {
  BRCA1: {
    chromosome: '17',
    cytoband: '17q21.31',
    transcript: 'NM_007294.4',
    targetExon: 20,
    exonCount: 24,
    forwardPrimer: "5'-TGCCCAAAACTCTGCCGTTT-3' (Tm: 59.8°C)",
    reversePrimer: "5'-ACAGAGGAAGCCTTCAGCCA-3' (Tm: 60.2°C)",
    ampliconLen: 285,
    dbsnp: 'rs80357906',
    flankingGenes: ['NBR1', 'NBR2', 'ARL4D'],
    omimDisease: 'Hereditary Breast and Ovarian Cancer Syndrome',
  },
  CFTR: {
    chromosome: '7',
    cytoband: '7q31.2',
    transcript: 'NM_000492.4',
    targetExon: 11,
    exonCount: 27,
    forwardPrimer: "5'-GTTTTCCTGGATTATGCCTGGCA-3' (Tm: 60.1°C)",
    reversePrimer: "5'-GTTGGCATGCTTTGATGACGCT-3' (Tm: 59.9°C)",
    ampliconLen: 98,
    dbsnp: 'rs113993960',
    flankingGenes: ['ASZ1', 'CTTNBP2', 'WNT2'],
    omimDisease: 'Cystic Fibrosis, Autosomal Recessive',
  },
  BRAF: {
    chromosome: '7',
    cytoband: '7q34',
    transcript: 'NM_004333.6',
    targetExon: 15,
    exonCount: 18,
    forwardPrimer: "5'-TCATAATGCTTGCTCTGATAGGA-3' (Tm: 58.7°C)",
    reversePrimer: "5'-GGCCAAAAATTTAATCAGTGGA-3' (Tm: 59.2°C)",
    ampliconLen: 224,
    dbsnp: 'rs113488022',
    flankingGenes: ['PARP12', 'MKRN1', 'AKAP9'],
    omimDisease: 'Cardiofaciocutaneous Syndrome / Somatic Melanoma',
  },
  TP53: {
    chromosome: '17',
    cytoband: '17p13.1',
    transcript: 'NM_000546.6',
    targetExon: 5,
    exonCount: 11,
    forwardPrimer: "5'-TTCCTCTTCCTGCAGTACTC-3' (Tm: 59.4°C)",
    reversePrimer: "5'-GCCCCAATTGCAGGTAAAAC-3' (Tm: 59.8°C)",
    ampliconLen: 288,
    dbsnp: 'rs28934578',
    flankingGenes: ['WRAP53', 'EFNB3', 'SHBG'],
    omimDisease: 'Li-Fraumeni Syndrome 1',
  },
  LDLR: {
    chromosome: '19',
    cytoband: '19p13.2',
    transcript: 'NM_000527.5',
    targetExon: 14,
    exonCount: 18,
    forwardPrimer: "5'-CCCTCTGTGTCCTACTGTC-3' (Tm: 59.1°C)",
    reversePrimer: "5'-GAGACACGGATCACCACTC-3' (Tm: 59.6°C)",
    ampliconLen: 216,
    dbsnp: 'rs121908027',
    flankingGenes: ['SMARCA4', 'CARM1', 'MYO9B'],
    omimDisease: 'Familial Hypercholesterolemia',
  },
  HFE: {
    chromosome: '6',
    cytoband: '6p22.2',
    transcript: 'NM_000410.4',
    targetExon: 4,
    exonCount: 7,
    forwardPrimer: "5'-ACATGGTTAAGGCCTGTTGC-3' (Tm: 59.3°C)",
    reversePrimer: "5'-GCCACATCTGGCTTGAAATT-3' (Tm: 59.7°C)",
    ampliconLen: 388,
    dbsnp: 'rs1800562',
    flankingGenes: ['HIST1H4A', 'HFE2', 'ZNRD1'],
    omimDisease: 'Hereditary Hemochromatosis Type 1',
  },
};

export function getGeneContext(variant?: NormalizedVariant) {
  const symbol = (variant?.geneSymbol || 'BRCA1').toUpperCase();
  const known = GENE_SPECIFIC_METRICS[symbol];
  if (known) {
    return {
      gene: symbol,
      chromosome: variant?.chromosome || known.chromosome,
      cytoband: known.cytoband,
      transcript: known.transcript,
      targetExon: known.targetExon,
      exonCount: known.exonCount,
      forwardPrimer: known.forwardPrimer,
      reversePrimer: known.reversePrimer,
      ampliconLen: known.ampliconLen,
      dbsnp: variant?.dbsnpRsid || known.dbsnp,
      flankingGenes: known.flankingGenes,
      omimDisease: known.omimDisease,
    };
  }

  // Smart fallback for custom or unlisted genes
  const chr = variant?.chromosome || '1';
  return {
    gene: symbol,
    chromosome: chr,
    cytoband: `${chr}q21.1`,
    transcript: `NM_${String(Math.abs((symbol.charCodeAt(0) * 12345) % 900000) + 100000)}.1`,
    targetExon: Math.max(1, ((variant?.position || 1000) % 18) + 1),
    exonCount: 20,
    forwardPrimer: `5'-ACGTGC${symbol.slice(0, 3)}TTCAGTG-3' (Tm: 59.5°C)`,
    reversePrimer: `5'-TGCAAG${symbol.slice(0, 3)}GTTCCAA-3' (Tm: 60.1°C)`,
    ampliconLen: 250 + (variant?.position ? variant.position % 100 : 35),
    dbsnp: variant?.dbsnpRsid || `rs${Math.abs((variant?.position || 100000) % 90000000)}`,
    flankingGenes: [`${symbol}_AS1`, `${symbol}P1`, 'FAM120A'],
    omimDisease: `${symbol}-Related Genetic Phenotype`,
  };
}

// 1. PCR Simulation Function (Reacts dynamically to variant)
export function simulatePcrData(variant?: NormalizedVariant): PcrData {
  const ctx = getGeneContext(variant);
  const isIndel = variant?.alternateAllele && variant.alternateAllele.length !== (variant.referenceAllele?.length || 1);
  const ampliconLength = isIndel ? ctx.ampliconLen + 27 : ctx.ampliconLen;

  return {
    targetGene: ctx.gene,
    ampliconLengthBp: ampliconLength,
    forwardPrimer: ctx.forwardPrimer,
    reversePrimer: ctx.reversePrimer,
    annealingTempC: 58.5,
    cycles: 35,
    meltingCurveTmC: 84.6,
    cycleThresholdCt: 22.4,
    isPositive: true,
    gelBandSizeBp: ampliconLength,
    controlBandSizeBp: 500, // GAPDH internal control
    amplificationEfficiency: 98.4,
  };
}

// 2. Sanger Simulation Function (Reacts dynamically to variant)
export function simulateSangerData(variant?: NormalizedVariant): SangerData {
  const ctx = getGeneContext(variant);
  const ref = (variant?.referenceAllele || 'G').toUpperCase().slice(0, 1) || 'G';
  const alt = (variant?.alternateAllele || 'A').toUpperCase().slice(0, 1) || 'A';

  // 15 bases surrounding variant site
  const prefix = ['A', 'C', 'T', 'G', 'G', 'C', 'A'];
  const suffix = ['T', 'T', 'C', 'G', 'A', 'A', 'C'];
  const sequenceContext = [...prefix, ref, ...suffix];
  const variantIndex = prefix.length; // index 7

  const calls = sequenceContext.map((base, idx) => {
    const isVar = idx === variantIndex;
    return {
      position: (variant?.position || 1000) - variantIndex + idx,
      calledBase: isVar ? `${ref}/${alt}` : base,
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
    targetGene: ctx.gene,
    exon: `Exon ${ctx.targetExon}`,
    transcript: ctx.transcript,
    variantCoord: variant?.normalizedRepresentation || `chr${ctx.chromosome}:${variant?.position || 43044295}`,
    traces,
    calls,
    variantSiteIndex: variantIndex,
    qualityMeanPhred: 54.2,
  };
}

// 3. NGS Panel Simulation Function (Reacts dynamically to variant)
export function simulateNgsData(variant?: NormalizedVariant): NgsData {
  const ctx = getGeneContext(variant);
  const alt = (variant?.alternateAllele || 'A').toUpperCase().slice(0, 1) || 'A';

  const totalReads = 148;
  const altReads = 71; // ~48% VAF
  const refReads = totalReads - altReads;

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
      id: `READ_${ctx.gene.slice(0, 4)}_${i + 1}`,
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

  const pos = variant?.position || 43044295;

  return {
    gene: ctx.gene,
    region: `chr${ctx.chromosome}:${pos - 100}-${pos + 100}`,
    meanDepth: 148,
    vaf: Number((altReads / totalReads).toFixed(3)),
    totalReads,
    altReads,
    refReads,
    reads,
    coverageProfile: [110, 122, 134, 142, 148, 150, 148, 145, 138, 125, 115],
    flowCellTile: `HWI-ST1288:1:1101:${(pos % 8000) + 1000}:2184`,
  };
}

// 4. WES Simulation Function (Reacts dynamically to variant)
export function simulateWesData(variant?: NormalizedVariant): WesData {
  const ctx = getGeneContext(variant);
  const targetExon = ctx.targetExon;

  const exons = [
    { exonNumber: Math.max(1, targetExon - 2), sizeBp: 154, meanDepth: 124, containsVariant: false },
    { exonNumber: Math.max(1, targetExon - 1), sizeBp: 218, meanDepth: 112, containsVariant: false },
    { exonNumber: targetExon, sizeBp: 342, meanDepth: 138, containsVariant: true },
    { exonNumber: targetExon + 1, sizeBp: 188, meanDepth: 104, containsVariant: false },
    { exonNumber: targetExon + 2, sizeBp: 290, meanDepth: 119, containsVariant: false },
  ];

  return {
    gene: ctx.gene,
    ccdsExonsTargeted: ctx.exonCount,
    onTargetPercent: 86.4,
    meanTargetCoverage: 118,
    percentExomeAbove20x: 97.2,
    targetBaitKit: 'Twist Human Core Exome v2.0 (36.8 Mb target)',
    exons,
  };
}

// 5. WGS Simulation Function (Reacts dynamically to variant)
export function simulateWgsData(variant?: NormalizedVariant): WgsData {
  const ctx = getGeneContext(variant);
  const pos = variant?.position || 43044000;

  return {
    genomeAssembly: variant?.assembly || 'GRCh38',
    meanAutosomalCoverage: 34.6,
    percentGenomeAbove15x: 99.1,
    gcBiasScore: 1.02,
    structuralVariantsCount: 14,
    svCalls: [
      {
        chr: ctx.chromosome,
        start: pos - 500,
        end: pos + 500,
        type: 'DEL',
        sizeKb: 1.0,
        genesInvolved: [ctx.gene, ...ctx.flankingGenes.slice(0, 1)],
      },
      {
        chr: ctx.chromosome === '7' ? '17' : '7',
        start: 117559000,
        end: 117561000,
        type: 'DUP',
        sizeKb: 2.0,
        genesInvolved: [ctx.chromosome === '7' ? 'TP53' : 'CFTR'],
      },
    ],
  };
}

// 6. DNA Microarray Simulation Function (Reacts dynamically to variant)
export function simulateMicroarrayData(variant?: NormalizedVariant): MicroarrayData {
  const ctx = getGeneContext(variant);
  const spots = [];

  const controlGenes = [
    'GAPDH', 'ACTB', ctx.gene, 'TP53', 'MYC', 'EGFR', 'PTEN', 'VEGFA',
    'CDKN2A', 'ERBB2', 'PIK3CA', 'ESR1', 'ATM', 'CHEK2', 'PALB2', 'RAD51D',
  ];

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const idx = r * 4 + c;
      const g = controlGenes[idx] || `PROBE_${idx}`;
      const isTarget = g === ctx.gene;

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
    candidateGeneSymbol: ctx.gene,
  };
}

// 7. CMA Simulation Function (Reacts dynamically to variant)
export function simulateCmaData(variant?: NormalizedVariant): CmaData {
  const ctx = getGeneContext(variant);
  const probes = [];
  const basePosMb = ((variant?.position || 43000000) / 1000000) - 2.0;

  for (let i = 0; i < 40; i++) {
    const posMb = basePosMb + i * 0.12;
    const isAnomalyRegion = i >= 18 && i <= 24;

    const log2 = isAnomalyRegion
      ? -0.88 + (Math.random() - 0.5) * 0.15
      : (Math.random() - 0.5) * 0.12;

    let baf = 0.5;
    const rand = Math.random();
    if (isAnomalyRegion) {
      baf = rand > 0.5 ? 0.98 : 0.02;
    } else {
      baf = rand < 0.33 ? 0.02 : rand < 0.66 ? 0.5 : 0.98;
    }

    probes.push({
      id: `SNP_A-${749200 + i}`,
      chromosome: `chr${ctx.chromosome}`,
      genomicPositionMb: Number(posMb.toFixed(2)),
      log2Ratio: Number(log2.toFixed(3)),
      bAlleleFrequency: Number(baf.toFixed(3)),
      cytoband: ctx.cytoband,
      isAbnormal: isAnomalyRegion,
    });
  }

  return {
    platform: 'Oligo-SNP Chromosomal Microarray (750K)',
    chromosome: `chr${ctx.chromosome}`,
    abnormalityType: 'Copy Number Loss (Microdeletion)',
    genomicSpan: `chr${ctx.chromosome}:${(basePosMb + 18 * 0.12).toFixed(2)}Mb-${(basePosMb + 24 * 0.12).toFixed(2)}Mb (~720 kb)`,
    probes,
    criticalGenes: [ctx.gene, ...ctx.flankingGenes],
    clinicalSignificance: 'Pathogenic CNV',
  };
}

// 8. Genotyping / SNP Simulation Function (Reacts dynamically to variant)
export function simulateGenotypingData(variant?: NormalizedVariant): GenotypingData {
  const ctx = getGeneContext(variant);
  const ref = (variant?.referenceAllele || 'G').toUpperCase().slice(0, 1) || 'G';
  const alt = (variant?.alternateAllele || 'A').toUpperCase().slice(0, 1) || 'A';

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

  // Patient Proband Point
  clusterPoints.push({
    id: 'PATIENT_SAMPLE',
    sampleType: 'Patient Proband' as const,
    normIntensityX: 0.56,
    normIntensityY: 0.54,
    call: 'AB (Heterozygous)' as const,
  });

  return {
    markerRsid: ctx.dbsnp,
    gene: ctx.gene,
    alleleRef: ref,
    alleleAlt: alt,
    callRatePercent: 99.8,
    patientCall: 'AB (Heterozygous)',
    clusterPoints,
  };
}

// 9. Karyotyping Simulation Function (Reacts dynamically to variant)
export function simulateKaryotypingData(variant?: NormalizedVariant): KaryotypingData {
  const ctx = getGeneContext(variant);
  const chromosomes = [];

  for (let i = 1; i <= 22; i++) {
    const isTargetChr = String(i) === ctx.chromosome;
    chromosomes.push({
      number: String(i),
      label: `Chr ${i}`,
      type: 'autosome' as const,
      hasStructuralAnomaly: isTargetChr,
      anomalyDescription: isTargetChr ? `${ctx.cytoband} locus of ${ctx.gene}` : undefined,
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
    cytogeneticDiagnosis: `Normal male constitutional karyotype (46,XY). Targeted molecular analysis verifies ${ctx.gene} locus at ${ctx.cytoband} without macro-aberrations >5 Mb.`,
  };
}
