// src/components/GeneticTechniquesGuide.tsx
import React, { useState } from 'react';
import {
  BookOpen,
  Dna,
  Zap,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  FlaskConical,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Cpu,
  Activity,
  Maximize2,
  Table,
  Sliders,
  Filter,
  Info,
  Microscope,
  FileText,
  Play,
  Pause,
  ListOrdered
} from 'lucide-react';
import { AssayType } from '../types/assays.ts';

interface TechniqueDetail {
  id: AssayType;
  name: string;
  shortName: string;
  tagline: string;
  analytes: string;
  metaphor: string;
  mainPurpose: string;
  resolution: string;
  turnaroundTime: string;
  costBracket: '$' | '$$' | '$$$' | '$$$$';
  steps: {
    stepNumber: number;
    title: string;
    description: string;
    details?: string;
  }[];
  ingredients?: string[];
  whatItDetects: string[];
  advantages: string[];
  limitations: string[];
  clinicalExample: string;
  importantDistinction?: string;
  category: 'Molecular Amplification' | 'Sequencing' | 'Genome-Wide Sequencing' | 'Arrays & Genotyping' | 'Cytogenomics';
}

export const GENETIC_TECHNIQUES_DATA: TechniqueDetail[] = [
  {
    id: 'pcr',
    name: 'Polymerase Chain Reaction (PCR)',
    shortName: 'PCR',
    tagline: 'Targeted In-Vitro Enzymatic Amplification of Specific DNA Regions',
    analytes: 'Targeted DNA region (100–2,000 bp)',
    metaphor: 'Copying a single selected page out of an entire multi-volume encyclopedia millions of times.',
    mainPurpose: 'Makes millions to billions of exact copies of a specific targeted DNA region so it can be detected, visualized, or sequenced.',
    resolution: 'Targeted fragment scale (specific primer-bound region)',
    turnaroundTime: '2 – 4 Hours',
    costBracket: '$',
    category: 'Molecular Amplification',
    ingredients: [
      'Template DNA: Original patient genomic DNA containing target sequence.',
      'Primers: Short synthetic oligonucleotides (18-25 bp) flanking the target region.',
      'DNA Polymerase: Thermostable enzyme (e.g., Taq) that synthesizes new DNA strands.',
      'Nucleotides (dNTPs): Building blocks (dATP, dCTP, dGTP, dTTP) for new strands.',
      'Buffer & Mg2+: Reaction environment maintaining pH and providing essential Mg2+ cofactor for polymerase.'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'DNA Extraction & Purification',
        description: 'DNA is isolated from blood, saliva, or tissue and purified to remove cellular proteins and PCR inhibitors.',
        details: 'Ensures pure template DNA with A260/A280 absorbance ratio of 1.8–2.0.'
      },
      {
        stepNumber: 2,
        title: 'Denaturation (94–98°C)',
        description: 'Reaction mixture is heated to break hydrogen bonds between complementary strands, producing single-stranded DNA templates.',
        details: 'High temperature (~95°C) destabilizes inter-base H-bonds without cleaving phosphodiester backbones.'
      },
      {
        stepNumber: 3,
        title: 'Annealing (50–65°C)',
        description: 'Temperature is lowered to allow forward and reverse primers to specifically bind (hybridize) to complementary sequences flanking the target region.',
        details: 'Annealing temperature depends on primer length and GC content (typically 3-5°C below primer Tm).'
      },
      {
        stepNumber: 4,
        title: 'Extension / Elongation (72°C)',
        description: 'Thermostable Taq DNA polymerase binds to primer-template junctions and synthesizes new complementary strands by adding dNTPs in the 5\' to 3\' direction.',
        details: 'Taq operates at ~1,000 nucleotides per minute at its optimal temperature of 72°C.'
      },
      {
        stepNumber: 5,
        title: 'Thermal Cycling (25–40 Repeats)',
        description: 'Denaturation, annealing, and extension are repeated exponentially, resulting in 2^N fold amplification of target DNA.',
        details: 'After 30 cycles, a single target sequence yields over 1 billion identical copies.'
      },
      {
        stepNumber: 6,
        title: 'Product Analysis',
        description: 'Amplified DNA product is inspected using agarose gel electrophoresis, capillary electrophoresis, or fluorometric quantification.',
        details: 'Confirms correct amplicon size against a molecular weight ladder.'
      }
    ],
    whatItDetects: [
      'Presence or absence of specific pathogen genomes (e.g., viral/bacterial DNA)',
      'Large insertion or deletion variants spanning primer sites',
      'Targeted region availability prior to Sanger sequencing or NGS target capture',
      'Repeat expansions (e.g., Fragile X, Huntington) when combined with fragment analysis'
    ],
    advantages: [
      'Extremely fast, simple, and low-cost procedure',
      'High sensitivity—can amplify trace quantities of DNA',
      'Highly specific to target region when primers are well designed'
    ],
    limitations: [
      'Standard PCR does NOT automatically reveal the exact letter-by-letter DNA sequence.',
      'Requires prior knowledge of surrounding DNA sequence to design primers.',
      'Prone to false negatives if point mutations occur at primer annealing sites.'
    ],
    clinicalExample: 'Amplify Exon 11 of the BRCA1 gene from a patient\'s blood sample to obtain clean DNA material for Sanger sequencing.'
  },
  {
    id: 'sanger',
    name: 'Sanger Chain-Termination Sequencing',
    shortName: 'Sanger Sequencing',
    tagline: 'Gold-Standard Single-Target Letter-by-Letter DNA Base Call Reading',
    analytes: 'Single gene fragment or exon (up to ~800–1,000 bp per reaction)',
    metaphor: 'Reading a specific line or paragraph in a book with a magnifying glass to verify every single letter.',
    mainPurpose: 'Determines the exact nucleotide order (A, T, G, C) of a targeted DNA region with peak accuracy.',
    resolution: 'Single nucleotide position resolution',
    turnaroundTime: '1 – 2 Days',
    costBracket: '$$',
    category: 'Sequencing',
    steps: [
      {
        stepNumber: 1,
        title: 'Target PCR Amplification',
        description: 'Specific region of interest (e.g., exon containing suspected variant) is first amplified using standard PCR.',
        details: 'Cleans and isolates target region from genomic background.'
      },
      {
        stepNumber: 2,
        title: 'Sequencing Reaction Setup',
        description: 'Amplified template is mixed with single sequencing primer, DNA polymerase, standard dNTPs, and fluorescently labeled chain-terminating ddNTPs.',
        details: 'Dideoxynucleotides (ddA, ddT, ddG, ddC) lack 3\'-OH group, terminating strand elongation upon incorporation.'
      },
      {
        stepNumber: 3,
        title: 'Chain Termination Fragment Generation',
        description: 'Random incorporation of labeled ddNTPs produces a mixture of DNA fragments of every possible length, each ending with a base-specific dye.',
        details: 'Dye colors: Adenine (Green), Thymine (Red), Guanine (Black/Yellow), Cytosine (Blue).'
      },
      {
        stepNumber: 4,
        title: 'Capillary Electrophoresis Separation',
        description: 'Fragments are loaded into a polymer-filled capillary tube under high voltage. Smaller fragments travel faster than larger fragments.',
        details: 'Separates fragments differing in length by a single nucleotide.'
      },
      {
        stepNumber: 5,
        title: 'Laser Fluorescence Detection & Chromatogram',
        description: 'As fragments pass a laser detector, fluorescence signals are recorded as colored intensity peaks, producing a chromatogram.',
        details: 'Dual overlapping peaks at 50% height indicate a heterozygous point mutation.'
      },
      {
        stepNumber: 6,
        title: 'Reference Alignment & Base Calling',
        description: 'Software and clinical geneticists compare the patient chromatogram sequence against the reference genome (GRCh38).',
        details: 'Confirms substitution variants, small insertions, or small deletions.'
      }
    ],
    whatItDetects: [
      'Single nucleotide substitutions / point mutations (e.g., C>T)',
      'Small insertions and deletions (indels <50 bp)',
      'Heterozygous vs homozygous germline variant states'
    ],
    advantages: [
      'Gold-standard accuracy (>99.99%) for targeted regions',
      'Direct visual inspection of raw chromatogram trace peaks',
      'Ideal for confirming candidate variants detected by NGS panels or WES/WGS'
    ],
    limitations: [
      'Low throughput—examines only one ~800 bp region per reaction.',
      'Not cost-effective for multi-gene screening or genome-wide discovery.',
      'Low sensitivity for mosaic variants present at <15–20% allele fraction.'
    ],
    clinicalExample: 'A patient suspected of Marfan syndrome undergoes Sanger sequencing of FBN1 Exon 24 to confirm a known familial pathogenic C>T substitution.'
  },
  {
    id: 'ngs',
    name: 'Next-Generation Sequencing (NGS) / Targeted Panels',
    shortName: 'NGS Panels',
    tagline: 'High-Throughput Parallel Sequencing of Millions of DNA Fragments',
    analytes: 'Gene panels (10 to 500+ disease-associated genes simultaneously)',
    metaphor: 'Massive high-speed automated printing press reading millions of snippets of thousands of books simultaneously.',
    mainPurpose: 'Sequences millions of targeted DNA fragments simultaneously in a single run for broad multi-gene diagnostic panels.',
    resolution: 'Single nucleotide base resolution across hundreds of genes',
    turnaroundTime: '1 – 3 Weeks',
    costBracket: '$$$',
    category: 'Sequencing',
    steps: [
      {
        stepNumber: 1,
        title: 'DNA Extraction & Quality Control',
        description: 'High-quality patient genomic DNA is extracted and quantified.',
        details: 'Requires fluorometric concentration measurement (Qubit).'
      },
      {
        stepNumber: 2,
        title: 'DNA Fragmentation & Repair',
        description: 'Genomic DNA is enzymatically or sonically sheared into uniform fragments (typically 200–500 bp).',
        details: 'Fragment ends are repaired and A-tailed for adapter ligation.'
      },
      {
        stepNumber: 3,
        title: 'Library Preparation & Adapter Ligation',
        description: 'Synthetic oligonucleotide adapters containing barcode indices and sequencing flow-cell binding motifs are attached to fragment ends.',
        details: 'Barcodes allow pooling multiple patient samples into a single sequencing run.'
      },
      {
        stepNumber: 4,
        title: 'Target Enrichment / Capture',
        description: 'For panel testing, biotinylated probe hybridization or multiplex PCR captures only the specific disease-associated target genes.',
        details: 'Filters out non-target genomic background to focus sequencing coverage.'
      },
      {
        stepNumber: 5,
        title: 'Flow Cell Clonal Amplification & Sequencing',
        description: 'Libraries bind to flow cell surface and undergo bridge amplification to form clonal clusters, followed by cyclic reversible terminator sequencing by synthesis.',
        details: 'Generates tens to hundreds of millions of short reads (e.g., 2x150 bp) in parallel.'
      },
      {
        stepNumber: 6,
        title: 'Read Alignment & Variant Calling',
        description: 'Bioinformatics pipeline aligns raw sequence reads (FASTQ) to reference genome (BAM/CRAM) and identifies differences (VCF).',
        details: 'Calculates read depth (e.g., 200x) and Variant Allele Frequency (VAF).'
      },
      {
        stepNumber: 7,
        title: 'Clinical Annotation & ACMG Classification',
        description: 'Variants are cross-referenced with ClinVar, gnomAD population frequencies, and in-silico predictors to generate clinical diagnostic report.',
        details: 'Classifies variants as Pathogenic, Likely Pathogenic, VUS, Likely Benign, or Benign.'
      }
    ],
    whatItDetects: [
      'Single nucleotide variants (SNVs) across many genes simultaneously',
      'Small insertions and deletions (indels)',
      'Exonic copy number variations (CNVs) via coverage depth profiling',
      'Somatic low-frequency mutations in tumor samples (high depth >500x)'
    ],
    advantages: [
      'Comprehensive multi-gene analysis in a single clinical test',
      'High analytical sensitivity and scalability',
      'Dramatic reduction in per-gene sequencing cost compared to Sanger'
    ],
    limitations: [
      'Requires specialized bioinformatics pipelines and computational infrastructure.',
      'Difficulties in sequencing GC-rich promoters, repetitive regions, or pseudogenes.',
      'Generates higher numbers of Variants of Uncertain Significance (VUS).'
    ],
    importantDistinction: 'NGS is the core technology platform (sequencing-by-synthesis); Targeted Panels, WES, and WGS are specific application scopes of NGS.',
    clinicalExample: 'Hereditary Cancer Panel sequencing 84 genes (including BRCA1, BRCA2, TP53, PALB2, MSH2) for a patient with family history of breast and ovarian cancer.'
  },
  {
    id: 'wes',
    name: 'Whole Exome Sequencing (WES)',
    shortName: 'Whole Exome (WES)',
    tagline: 'Comprehensive Examination of All ~20,000 Protein-Coding Genes',
    analytes: 'All protein-coding exons (~1–2% of the total human genome, ~30–45 Mb)',
    metaphor: 'Reading the essential highlighted summary chapters of every single book in the library.',
    mainPurpose: 'Sequences almost all ~180,000 protein-coding exons in the genome, where ~85% of known disease-causing variants reside.',
    resolution: 'Exome-wide single nucleotide resolution',
    turnaroundTime: '2 – 6 Weeks',
    costBracket: '$$$',
    category: 'Genome-Wide Sequencing',
    steps: [
      {
        stepNumber: 1,
        title: 'Sample DNA Preparation',
        description: 'Genomic DNA is extracted from blood, saliva, or tissue.',
        details: 'High molecular weight genomic DNA is verified.'
      },
      {
        stepNumber: 2,
        title: 'Fragmentation & Library Prep',
        description: 'DNA is sheared into short fragments and ligated with sequencing adapters and index barcodes.',
        details: 'Enables high-density short-read sequencing.'
      },
      {
        stepNumber: 3,
        title: 'Exome Target Capture (Hybridization)',
        description: 'Biotinylated RNA or DNA bait probes complementary to all known coding exons hybridize with library fragments.',
        details: 'Streptavidin magnetic beads pull down exome fragments, washing away 98% non-coding genomic DNA.'
      },
      {
        stepNumber: 4,
        title: 'High-Throughput NGS Sequencing',
        description: 'Captured exonic library is sequenced on high-capacity NGS platforms (e.g., NovaSeq) to achieve 100x–150x average coverage.',
        details: 'Generates ~30–50 million read pairs per sample.'
      },
      {
        stepNumber: 5,
        title: 'Exome Variant Calling & Filtering',
        description: 'Reads are mapped to GRCh38; variants are called and filtered by rare population frequency (gnomAD AF <0.01) and clinical phenotype correlation.',
        details: 'Uses tools like HPO (Human Phenotype Ontology) matching.'
      },
      {
        stepNumber: 6,
        title: 'Trio / Single Clinical Interpretation',
        description: 'Analyses patient (Proband) and optionally parents (Trio WES) to identify de novo, compound heterozygous, or inherited pathogenic variants.',
        details: 'Trio WES increases diagnostic yield in rare pediatric genetic disorders to ~35–45%.'
      }
    ],
    whatItDetects: [
      'Coding single nucleotide variants (SNVs) across all ~20,000 genes',
      'Coding small insertions/deletions (indels)',
      'Canonical splice-site mutations (+/- 1, 2 bp near exon junctions)',
      'Exonic copy number variations (e.g., single/multi-exon deletions)'
    ],
    advantages: [
      'Unbiased coding-genome interrogation without requiring pre-selected gene panels',
      'Highly effective for undiagnosed rare pediatric or neurodevelopmental conditions',
      'Re-analysis capability: data can be re-queried as new disease genes are discovered'
    ],
    limitations: [
      'Misses non-coding intronic variants, deep splice mutations, and distant regulatory elements.',
      'Uneven capture efficiency in GC-rich exons or extreme sequence complexity.',
      'Higher rate of incidental secondary findings (e.g., unexpected cancer pre-dispositions).'
    ],
    clinicalExample: 'A child with unexplained global developmental delay, seizures, and dysmorphic features undergoes Trio WES, revealing a novel de novo SCN2A pathogenic variant.'
  },
  {
    id: 'wgs',
    name: 'Whole Genome Sequencing (WGS)',
    shortName: 'Whole Genome (WGS)',
    tagline: 'Unbiased Complete Mapping of Nearly the Entire 3 Billion Base Pair Human Genome',
    analytes: 'Entire nuclear and mitochondrial genome (~3.2 billion base pairs, coding + non-coding)',
    metaphor: 'Reading every single letter, space, and punctuation mark in every book across the entire national library.',
    mainPurpose: 'Sequences nearly the entire genome (~100% of coding and non-coding regions) without target capture bias.',
    resolution: 'Genome-wide single nucleotide and structural variant resolution',
    turnaroundTime: '2 – 6 Weeks',
    costBracket: '$$$$',
    category: 'Genome-Wide Sequencing',
    steps: [
      {
        stepNumber: 1,
        title: 'High-Purity Genomic DNA Extraction',
        description: 'Intact, ultra-pure genomic DNA is extracted.',
        details: 'Requires high molecular weight DNA without shear degradation.'
      },
      {
        stepNumber: 2,
        title: 'PCR-Free Library Preparation',
        description: 'DNA is sheared into ~350–500 bp fragments and ligated directly to adapters WITHOUT PCR amplification.',
        details: 'Eliminates PCR amplification bias and GC dropout artifacts.'
      },
      {
        stepNumber: 3,
        title: 'Ultra-High-Throughput Sequencing',
        description: 'Direct sequencing on ultra-high-throughput instruments targeting 30x–60x mean coverage across all 3.2 billion base pairs.',
        details: 'Produces ~1 billion read pairs (~100 gigabases of sequence data) per sample.'
      },
      {
        stepNumber: 4,
        title: 'Comprehensive Alignment & Variant Calling',
        description: 'Bioinformatics pipeline maps reads to GRCh38/T2T and calls SNVs, indels, structural variants (SVs), CNVs, and repeat expansions.',
        details: 'Evaluates coding regions, introns, promoters, enhancers, and intergenic regions.'
      },
      {
        stepNumber: 5,
        title: 'Structural Variant & Breakpoint Resolution',
        description: 'Paired-end read spans and split-read algorithms resolve complex balanced translocations, inversions, and mobile element insertions.',
        details: 'Identifies non-coding breakpoints missed by WES and panel testing.'
      },
      {
        stepNumber: 6,
        title: 'Integrated Clinical Interpretation',
        description: 'Prioritizes functional variants across coding regions and validated non-coding regulatory elements.',
        details: 'Provides the ultimate single-test genomic architecture overview.'
      }
    ],
    whatItDetects: [
      'All coding and non-coding single nucleotide variants (SNVs)',
      'Deep intronic mutations affecting cryptic splicing',
      'Structural Variants (SVs): balanced translocations, inversions, complex rearrangements',
      'Genome-wide Copy Number Variations (CNVs) with precise breakpoint resolution',
      'Mitochondrial genome mutations and short tandem repeat (STR) expansions'
    ],
    advantages: [
      'Most comprehensive genetic test available in clinical medicine',
      'Uniform genome coverage without capture bias or PCR dropout',
      'Single test replaces multiple sequential diagnostic assays (Panel + CMA + Mitochondrial)'
    ],
    limitations: [
      'Highest data storage, compute processing, and sequencing cost.',
      'Interpretation of non-coding variants remains challenging due to limited clinical functional evidence.',
      'Identifies large numbers of Variants of Uncertain Significance (VUS).'
    ],
    clinicalExample: 'A patient with severe intellectual disability and negative WES and CMA testing undergoes WGS, revealing a deep intronic splice-creating mutation in MECP2.'
  },
  {
    id: 'microarray',
    name: 'DNA Microarray / Expression & SNP Arrays',
    shortName: 'DNA Microarray',
    tagline: 'High-Density Surface Hybridization Array for Expression or Genotype Profiling',
    analytes: 'Thousands to millions of specified DNA or RNA target probes',
    metaphor: 'A massive grid of hundreds of thousands of tiny customized keyholes that only open when the exact complementary key inserts.',
    mainPurpose: 'Measures abundance or presence of hundreds of thousands of predefined DNA or RNA sequences simultaneously using fluorescence hybridization.',
    resolution: 'Probe-dependent (target probe loci across genome)',
    turnaroundTime: '2 – 5 Days',
    costBracket: '$$',
    category: 'Arrays & Genotyping',
    steps: [
      {
        stepNumber: 1,
        title: 'Array Chip Surface Fabrication',
        description: 'Solid glass or silicon slide is synthesized with micro-spots containing millions of identical single-stranded DNA oligonucleotide probes.',
        details: 'Probes correspond to specific gene transcripts or genomic loci.'
      },
      {
        stepNumber: 2,
        title: 'Sample Extraction & Fluorescent Labeling',
        description: 'Patient DNA or cDNA synthesized from mRNA is labeled with fluorescent dyes (e.g., Cy3 green or Cy5 red).',
        details: 'Dual-color arrays compare patient cDNA vs reference cDNA.'
      },
      {
        stepNumber: 3,
        title: 'Hybridization',
        description: 'Fluorescein-labeled sample is incubated over the array chip surface, allowing complementary target sequences to bind specifically to immobilized probes.',
        details: 'Stringent temperature and salt conditions ensure exact complementary binding.'
      },
      {
        stepNumber: 4,
        title: 'Washing Non-Bound Targets',
        description: 'Unbound and non-specifically bound nucleic acid fragments are washed away under high-stringency buffer conditions.',
        details: 'Eliminates background noise and non-specific cross-hybridization.'
      },
      {
        stepNumber: 5,
        title: 'Laser Scanning & Intensity Quantification',
        description: 'High-resolution laser scanner excites fluorescent labels; light emission intensity at each grid coordinate is digitized.',
        details: 'Signal brightness correlates with DNA copy number or gene expression level.'
      }
    ],
    whatItDetects: [
      'Gene expression level differences across cellular conditions (RNA expression microarrays)',
      'Pre-selected SNP alleles and genotype calls (SNP microarrays)',
      'Relative genomic gain or loss (Copy Number Profiling)'
    ],
    advantages: [
      'Rapid, highly parallel measurement of thousands of predefined loci simultaneously',
      'Well-established, standardized automated image processing workflows',
      'Cost-effective for high-throughput population cohort screening'
    ],
    limitations: [
      'Cannot discover novel sequence mutations not represented on the probe array chip.',
      'Limited dynamic range compared to RNA-seq or deep NGS.',
      'Cross-hybridization can occur between closely related gene family members.'
    ],
    clinicalExample: 'Tumor gene expression profiling using a 70-gene expression microarray (MammaPrint) to predict breast cancer recurrence risk.'
  },
  {
    id: 'cma',
    name: 'Chromosomal Microarray Analysis (CMA / aCGH & SNP)',
    shortName: 'Chromosomal Microarray (CMA)',
    tagline: 'High-Resolution Genome-Wide Detection of Sub-Microscopic Microdeletions & Duplications',
    analytes: 'Sub-microscopic copy number variations (CNVs) across all 23 chromosome pairs',
    metaphor: 'Inspecting every shelf of a library with a precise electronic scale to verify if any individual volume is missing or duplicated.',
    mainPurpose: 'Detects sub-microscopic chromosomal gains (duplications) and losses (deletions) down to 10–50 kb resolution.',
    resolution: '10 kb – 100 kb genomic resolution (100x higher than G-banded karyotyping)',
    turnaroundTime: '3 – 7 Days',
    costBracket: '$$$',
    category: 'Cytogenomics',
    steps: [
      {
        stepNumber: 1,
        title: 'Patient & Control DNA Labeling',
        description: 'Patient genomic DNA (labeled with Cy5 red dye) and normal control DNA (labeled with Cy3 green dye) are prepared.',
        details: 'Equal quantities of patient and reference DNA are mixed.'
      },
      {
        stepNumber: 2,
        title: 'Co-Hybridization to Genomic Array',
        description: 'The labeled mixture is hybridized to a microarray chip containing probes covering constitutional genomic regions and disease microdeletion loci.',
        details: 'Probes bind patient and control DNA proportionally.'
      },
      {
        stepNumber: 3,
        title: 'Fluorescence Ratio Calculation (Log2 Ratio)',
        description: 'Laser scanner measures red-to-green fluorescence intensity ratio at every genomic coordinate spot.',
        details: 'Ratio = 1.0 (Log2 = 0) -> Normal diploid; Ratio = 0.5 (Log2 = -1) -> Heterozygous deletion; Ratio = 1.5 (Log2 = +0.58) -> Duplication.'
      },
      {
        stepNumber: 4,
        title: 'SNP Array Allele Peak Analysis',
        description: 'For SNP-CMA arrays, B-allele frequency plots evaluate homozygous A/A, heterozygous A/B, and homozygous B/B SNP calls.',
        details: 'Identifies Loss of Heterozygosity (LOH) and Absence of Heterozygosity (AOH).'
      },
      {
        stepNumber: 5,
        title: 'Cytogenomic Mapping & ACMG CNV Calling',
        description: 'Clinical bioinformatician maps CNV boundaries against OMIM disease genes and ClinGen dosage sensitivity curated regions.',
        details: 'Classifies CNVs as Pathogenic, VUS, or Benign.'
      }
    ],
    whatItDetects: [
      'Sub-microscopic microdeletions (e.g., 22q11.2 DiGeorge, 15q11.2 Prader-Willi/Angelman)',
      'Microduplications and unbalanced translocations',
      'Absence of Heterozygosity (AOH) / Loss of Heterozygosity (LOH) indicating Uniparental Disomy (UPD) or consanguinity'
    ],
    advantages: [
      'First-line recommended diagnostic test for developmental delay, autism spectrum disorder, and multiple congenital anomalies',
      'High resolution (10–50 kb) compared to traditional karyotyping (5–10 Mb)',
      'Does not require living culturable cells (works on extracted DNA)'
    ],
    limitations: [
      'BLIND to BALANCED chromosomal rearrangements (e.g., balanced reciprocal translocations, inversions).',
      'Cannot detect single nucleotide point mutations (SNVs) or small indels.',
      'Cannot determine the physical chromosomal location of duplicated segments (e.g., tandem vs inserted).'
    ],
    clinicalExample: 'A toddler with global developmental delay and congenital heart defects undergoes CMA, identifying a 2.5 Mb microdeletion on chromosome 22q11.21.'
  },
  {
    id: 'genotyping',
    name: 'Targeted Genotyping / SNP Array Testing',
    shortName: 'SNP Genotyping',
    tagline: 'Rapid Targeted Allele Calling at Pre-Determined Polymorphic Loci',
    analytes: 'Pre-defined single nucleotide polymorphisms (SNPs) and targeted alleles',
    metaphor: 'Checking specific pre-marked multiple-choice bubbles on a standardized optical mark scan sheet.',
    mainPurpose: 'Rapidly checks specific known genetic positions/variants to determine individual SNP genotypes (e.g., A/A, A/G, G/G).',
    resolution: 'Specific pre-selected SNP loci',
    turnaroundTime: '1 – 3 Days',
    costBracket: '$',
    category: 'Arrays & Genotyping',
    steps: [
      {
        stepNumber: 1,
        title: 'DNA Sample Collection',
        description: 'Genomic DNA is extracted from cheek swab, saliva, or blood sample.',
        details: 'Rapid low-volume DNA extraction.'
      },
      {
        stepNumber: 2,
        title: 'Allele-Specific Primer / Probe Binding',
        description: 'Sample DNA is exposed to allele-specific fluorescent probes or primers complementary to known variant positions.',
        details: 'Distinguishes wild-type allele from mutant allele by single-base extension or differential hybridization.'
      },
      {
        stepNumber: 3,
        title: 'Target Hybridization / Extension',
        description: 'Enzymatic single-base extension incorporates allele-specific fluorophores (e.g., FAM for allele 1, VIC for allele 2).',
        details: 'Highly specific enzymatic discrimination.'
      },
      {
        stepNumber: 4,
        title: 'Fluorescence Readout & Allele Discrimination',
        description: 'Fluorescence plate reader or scanner measures fluorescence intensity for each probe pair.',
        details: 'Clusters samples into homozygous reference, heterozygous, or homozygous alternate.'
      },
      {
        stepNumber: 5,
        title: 'Genotype Assignment',
        description: 'Software converts raw signal clusters into categorical genotype calls.',
        details: 'Generates reports for drug metabolism, risk scores, or direct-to-consumer trait profiles.'
      }
    ],
    whatItDetects: [
      'Targeted known SNPs (Single Nucleotide Polymorphisms)',
      'Pharmacogenomic alleles (e.g., CYP2C19 *2, *3 loss-of-function variants)',
      'Pre-selected disease risk markers and carrier screening alleles'
    ],
    advantages: [
      'Extremely fast, automated, and inexpensive per sample',
      'High accuracy for targeted pre-defined positions',
      'Ideal for population-scale screening and pharmacogenetic point-of-care testing'
    ],
    limitations: [
      'Completely blind to non-targeted genomic positions.',
      'Cannot discover novel variants or rare unknown family mutations.',
      'Does not provide full gene sequencing or structural context.'
    ],
    clinicalExample: 'A cardiology patient prescribed Clopidogrel (Plavix) undergoes CYP2C19 SNP genotyping to confirm normal drug metabolizer status (*1/*1).'
  },
  {
    id: 'karyotyping',
    name: 'G-Banded Metaphase Karyotyping',
    shortName: 'Karyotyping',
    tagline: 'Microscopic Examination of Entire Metaphase Chromosome Architecture and Number',
    analytes: 'All 23 pairs of metaphase chromosomes (whole genome structural scale)',
    metaphor: 'Taking a panoramic aerial photo of a library building to count the total floors and check for major structural collapsed wings.',
    mainPurpose: 'Examines the number, size, and gross structural integrity of metaphase chromosomes under a light microscope.',
    resolution: '5 Mb – 10 Mb (Cytogenetic macroscopic scale)',
    turnaroundTime: '1 – 2 Weeks',
    costBracket: '$$',
    category: 'Cytogenomics',
    steps: [
      {
        stepNumber: 1,
        title: 'Living Cell Culture',
        description: 'Living cells (e.g., peripheral blood lymphocytes, amniotic fluid cells, or bone marrow) are cultured in growth media.',
        details: 'Phytohemagglutinin (PHA) stimulates T-lymphocyte cell division.'
      },
      {
        stepNumber: 2,
        title: 'Mitotic Arrest at Metaphase',
        description: 'Colchicine or Colcemid is added to disrupt the mitotic spindle apparatus, arresting dividing cells at metaphase where chromosomes are most condensed.',
        details: 'Maximizes visibility of condensed chromosome arms.'
      },
      {
        stepNumber: 3,
        title: 'Hypotonic Swelling & Fixation',
        description: 'Cells are exposed to hypotonic potassium chloride (KCl) solution to swell cells, followed by methanol/acetic acid fixation.',
        details: 'Spreads metaphase chromosomes without rupturing individual arms.'
      },
      {
        stepNumber: 4,
        title: 'Trypsin Digestion & Giemsa Staining (G-Banding)',
        description: 'Slide preparations are treated briefly with trypsin enzyme and stained with Giemsa dye, creating characteristic light and dark band patterns.',
        details: 'AT-rich regions stain dark (G-bands); GC-rich euchromatic regions stain light.'
      },
      {
        stepNumber: 5,
        title: 'Microscopic Imaging & Karyogram Arrangement',
        description: 'Cytogeneticist captures metaphase spreads under light microscopy and pairs chromosomes 1 through 22, X, and Y by length, centromere position, and band pattern.',
        details: 'Constructs formal clinical karyogram (e.g., 46,XX or 47,XY,+21).'
      }
    ],
    whatItDetects: [
      'Aneuploidies (e.g., Trisomy 21 Down syndrome, Trisomy 18 Edwards syndrome, 45,X Turner syndrome, 47,XXY Klinefelter syndrome)',
      'Large balanced and unbalanced translocations (e.g., t(9;22) Philadelphia chromosome in CML)',
      'Large inversions, deletions, and duplications (>5–10 Mb)',
      'Gross chromosomal mosaicism'
    ],
    advantages: [
      'Evaluates single individual cells in metaphase spread',
      'Detects BALANCED structural rearrangements (balanced translocations and inversions) missed by CMA and short-read NGS',
      'Provides complete gross genome architecture overview'
    ],
    limitations: [
      'Low spatial resolution (cannot detect microdeletions or mutations <5–10 Mb).',
      'Requires living, actively dividing cells in tissue culture.',
      'Labor-intensive manual expert cytogenetic analysis required.'
    ],
    clinicalExample: 'A couple with recurrent pregnancy loss undergoes parental peripheral blood karyotyping, revealing a balanced reciprocal translocation t(11;22) in one parent.'
  }
];

export const GeneticTechniquesGuide: React.FC<{
  onSelectAssayForSimulation?: (assayId: AssayType) => void;
}> = ({ onSelectAssayForSimulation }) => {
  const [activeTab, setActiveTab] = useState<'concepts' | 'comparison' | 'deepdives' | 'quiz'>('concepts');
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<AssayType>('pcr');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  
  // Interactive Sandbox state for Basic Concepts
  const [sampleSequence, setSampleSequence] = useState<string>('ATG CCT AAG CTT GAC');
  const [mutatedIndex, setMutatedIndex] = useState<number>(7); // letter C to T
  const [mutatedBase, setMutatedBase] = useState<string>('T');

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const activeTechnique = GENETIC_TECHNIQUES_DATA.find((t) => t.id === selectedTechniqueId) || GENETIC_TECHNIQUES_DATA[0];

  const filteredTechniques = GENETIC_TECHNIQUES_DATA.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.mainPurpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.analytes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleQuizOption = (questionIdx: number, option: string) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [questionIdx]: option }));
  };

  const calculateQuizScore = () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) score++;
    });
    return score;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-teal-400 mb-1">
              <BookOpen className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Clinical Genetics Reference &amp; Educational Guide</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              DNA and Genetic Testing Techniques: A Detailed Guide
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Explore the foundational biological concepts and master the nine key molecular diagnostic and cytogenomic techniques
              used in genomic medicine, variant pathogenicity prediction, and ACMG guideline compliance classification.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('concepts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'concepts'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Dna className="h-3.5 w-3.5" />
              <span>1. Basic Concepts</span>
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'comparison'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>2. 9-Techniques Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab('deepdives')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'deepdives'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Microscope className="h-3.5 w-3.5" />
              <span>3. Detailed Deep Dives</span>
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'quiz'
                  ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>4. Clinical Quiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: BASIC CONCEPTS */}
      {activeTab === 'concepts' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center space-x-2 text-teal-400 mb-3">
              <Dna className="h-5 w-5" />
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-100">
                1. Foundational Genetic &amp; Molecular Concepts
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              These nine techniques are used across genetics, medical diagnosis, biotechnology, and clinical research to study DNA,
              identify genetic variants, detect disease, and analyze chromosome changes. They generate the raw variant data behind
              our Genomic Variant Pathogenicity Predictor and ACMG Guideline Compliance Classifier.
            </p>

            {/* Grid of 7 core concepts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 hover:border-teal-500/40 transition-all">
                <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm mb-1">
                  <span className="w-6 h-6 rounded-full bg-teal-500/10 flex items-center justify-center text-xs text-teal-300 border border-teal-500/20">1</span>
                  <span>DNA</span>
                </div>
                <p className="text-xs text-slate-300 font-medium">Deoxyribonucleic Acid</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  The double-stranded helical molecule that stores chemical genetic instructions in our cells using four nitrogenous bases: Adenine (A), Thymine (T), Guanine (G), and Cytosine (C).
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 hover:border-teal-500/40 transition-all">
                <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm mb-1">
                  <span className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-xs text-blue-300 border border-blue-500/20">2</span>
                  <span>Gene</span>
                </div>
                <p className="text-xs text-slate-300 font-medium">Functional Unit of Heredity</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  A specific functional section of DNA containing regulatory sequences and coding exons with precise instructions for making a protein or functional RNA molecule.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 hover:border-teal-500/40 transition-all">
                <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm mb-1">
                  <span className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center text-xs text-purple-300 border border-purple-500/20">3</span>
                  <span>Chromosome</span>
                </div>
                <p className="text-xs text-slate-300 font-medium">Packaged Chromatin Structure</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  A long, continuous DNA molecule tightly packaged with histone proteins into visible structures. Humans typically have 46 chromosomes (23 pairs) in most nucleated body cells.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 hover:border-teal-500/40 transition-all">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm mb-1">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs text-emerald-300 border border-emerald-500/20">4</span>
                  <span>Genome</span>
                </div>
                <p className="text-xs text-slate-300 font-medium">Complete Genetic Material</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  The complete set of genetic material in an organism (~3.2 billion base pairs in human haploid genome, including nuclear chromosomes and mitochondrial DNA).
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 hover:border-amber-500/40 transition-all">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm mb-1">
                  <span className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-xs text-amber-300 border border-amber-500/20">5</span>
                  <span>Genetic Variant</span>
                </div>
                <p className="text-xs text-slate-300 font-medium">Sequence Difference</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  A specific difference or alteration in a patient\'s DNA sequence compared to a reference human genome (GRCh38). Some variants are harmless benign polymorphisms; others cause clinical disease.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 hover:border-rose-500/40 transition-all">
                <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm mb-1">
                  <span className="w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center text-xs text-rose-300 border border-rose-500/20">6</span>
                  <span>SNP</span>
                </div>
                <p className="text-xs text-slate-300 font-medium">Single Nucleotide Polymorphism</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  A specific single-letter variation (substitution) at a single position in DNA that occurs with relatively frequent frequency (&gt;1%) across a human population.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 hover:border-cyan-500/40 transition-all md:col-span-2">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm mb-1">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center text-xs text-cyan-300 border border-cyan-500/20">7</span>
                  <span>Sequencing</span>
                </div>
                <p className="text-xs text-slate-300 font-medium">Determining Exact Nucleotide Order</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  The biochemical and biophysical process of reading the exact sequential order of nitrogenous bases (A, T, G, C) along a DNA strand to pinpoint individual nucleotide variations.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Variant Substitution Visualizer */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center space-x-2 text-amber-400 mb-3">
              <Sparkles className="h-5 w-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                Interactive Concept Example: Single Nucleotide Substitution (C &gt; T)
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              For example, consider an expected reference sequence <code className="bg-slate-950 text-teal-300 px-1.5 py-0.5 rounded font-mono">ATG CCT AAG</code>.
              If a single letter changes at position 6 from <span className="text-emerald-400 font-bold font-mono">C</span> to <span className="text-rose-400 font-bold font-mono">T</span>,
              the sequence becomes <code className="bg-slate-950 text-rose-300 px-1.5 py-0.5 rounded font-mono">ATG CTT AAG</code>.
            </p>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Reference Sequence (GRCh38)
                  </label>
                  <div className="font-mono text-lg font-bold text-teal-300 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 tracking-wider">
                    A T G &nbsp; C <span className="text-emerald-400 underline decoration-2">C</span> T &nbsp; A A G
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Codon 2: CCT (Proline)</p>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Patient Observed Sequence
                  </label>
                  <div className="font-mono text-lg font-bold text-rose-300 bg-slate-900 px-4 py-2 rounded-lg border border-rose-500/30 tracking-wider">
                    A T G &nbsp; C <span className="text-rose-400 underline decoration-2 animate-pulse">T</span> T &nbsp; A A G
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Codon 2: CTT (Leucine) — Missense Variant</p>
                </div>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <strong className="text-teal-400">Clinical Evaluation Note:</strong> Whether this C&gt;T change is harmful depends on its specific location in the gene, its biological effect on protein folding/function, population frequency in gnomAD, and supporting ACMG evidence (e.g., ClinVar entries, computational predictors, family co-segregation).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPARISON MATRIX */}
      {activeTab === 'comparison' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center space-x-2 text-teal-400 mb-1">
                  <Table className="h-5 w-5" />
                  <h2 className="text-base font-bold uppercase tracking-wider text-slate-100">
                    2. Quick Comparison of the Nine Techniques
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  The methods are not all direct alternatives to one another: PCR is often used prior to Sanger sequencing, and WES and WGS are specific targeted applications of NGS technology.
                </p>
              </div>

              {/* Filter Controls */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-1.5 focus:outline-none focus:border-teal-500"
                >
                  <option value="All">All Categories</option>
                  <option value="Molecular Amplification">Molecular Amplification</option>
                  <option value="Sequencing">Targeted Sequencing</option>
                  <option value="Genome-Wide Sequencing">Genome-Wide Sequencing</option>
                  <option value="Arrays & Genotyping">Arrays &amp; Genotyping</option>
                  <option value="Cytogenomics">Cytogenomics</option>
                </select>
              </div>
            </div>

            {/* Comprehensive Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-300 font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 w-48">Technique</th>
                    <th className="p-3.5">What it mainly does</th>
                    <th className="p-3.5 w-48">Target Analytes &amp; Scale</th>
                    <th className="p-3.5 w-32">Turnaround</th>
                    <th className="p-3.5 w-24">Cost</th>
                    <th className="p-3.5 w-28 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                  {filteredTechniques.map((tech) => (
                    <tr
                      key={tech.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        selectedTechniqueId === tech.id ? 'bg-teal-950/20' : ''
                      }`}
                    >
                      <td className="p-3.5 font-bold text-slate-100">
                        <div className="flex items-center space-x-2">
                          <span className="text-teal-400">{tech.shortName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal block">{tech.category}</span>
                      </td>
                      <td className="p-3.5 text-slate-300 leading-relaxed">
                        {tech.mainPurpose}
                      </td>
                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {tech.analytes}
                      </td>
                      <td className="p-3.5 text-slate-300 font-medium">
                        {tech.turnaroundTime}
                      </td>
                      <td className="p-3.5 font-mono text-teal-400 font-bold">
                        {tech.costBracket}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedTechniqueId(tech.id);
                            setActiveTab('deepdives');
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-200 rounded text-[11px] font-semibold transition-all"
                        >
                          Deep Dive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DETAILED DEEP DIVES */}
      {activeTab === 'deepdives' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Technique Selector Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap gap-2">
            {GENETIC_TECHNIQUES_DATA.map((tech) => (
              <button
                key={tech.id}
                onClick={() => setSelectedTechniqueId(tech.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  selectedTechniqueId === tech.id
                    ? 'bg-teal-500 text-slate-950 shadow font-bold'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{tech.shortName}</span>
              </button>
            ))}
          </div>

          {/* Active Technique Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
                  {activeTechnique.category}
                </span>
                <h2 className="text-xl font-black text-white mt-2 tracking-tight">
                  {activeTechnique.name}
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-medium italic">
                  &ldquo;{activeTechnique.tagline}&rdquo;
                </p>
              </div>

              {onSelectAssayForSimulation && (
                <button
                  onClick={() => onSelectAssayForSimulation(activeTechnique.id)}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 self-start md:self-auto"
                >
                  <FlaskConical className="h-4 w-4" />
                  <span>Launch 2D/3D Simulation</span>
                </button>
              )}
            </div>

            {/* Metaphor & Purpose Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Mental Model / Metaphor</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {activeTechnique.metaphor}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <Info className="h-4 w-4" />
                  <span>Main Purpose</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {activeTechnique.mainPurpose}
                </p>
              </div>
            </div>

            {/* Key Ingredients (If Applicable) */}
            {activeTechnique.ingredients && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-3 flex items-center space-x-2">
                  <FlaskConical className="h-4 w-4" />
                  <span>Main Reagents &amp; Ingredients</span>
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                  {activeTechnique.ingredients.map((ing, idx) => (
                    <li key={idx} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Step-by-Step Laboratory Workflow */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center space-x-2">
                <ListOrdered className="h-4 w-4 text-teal-400" />
                <span>Step-by-Step Laboratory &amp; Analytical Workflow</span>
              </h3>

              <div className="space-y-3">
                {activeTechnique.steps.map((st) => (
                  <div key={st.stepNumber} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all">
                    <div className="flex items-center space-x-3">
                      <span className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold text-xs shrink-0">
                        {st.stepNumber}
                      </span>
                      <h4 className="text-xs font-bold text-slate-100">{st.title}</h4>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 ml-10 leading-relaxed">
                      {st.description}
                    </p>
                    {st.details && (
                      <p className="text-[11px] text-teal-400/90 mt-1.5 ml-10 font-mono bg-teal-950/20 px-2.5 py-1 rounded border border-teal-500/10 inline-block">
                        Biophysical detail: {st.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* What it Detects, Advantages & Limitations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>What it Detects</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {activeTechnique.whatItDetects.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <Zap className="h-4 w-4" />
                  <span>Key Advantages</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {activeTechnique.advantages.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-teal-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <XCircle className="h-4 w-4" />
                  <span>Important Limitations</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {activeTechnique.limitations.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Clinical Example Banner */}
            <div className="bg-gradient-to-r from-slate-950 to-teal-950/40 p-4 rounded-xl border border-teal-500/20 text-xs">
              <strong className="text-teal-400 block mb-1 uppercase tracking-wider font-bold">
                Real Clinical Case Example:
              </strong>
              <p className="text-slate-300 leading-relaxed font-medium">
                {activeTechnique.clinicalExample}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CLINICAL QUIZ */}
      {activeTab === 'quiz' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-teal-400">
                <HelpCircle className="h-5 w-5" />
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-100">
                  4. Clinical Technique Selection Knowledge Check
                </h2>
              </div>
              {quizSubmitted && (
                <div className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg text-xs font-bold">
                  Score: {calculateQuizScore()} / {QUIZ_QUESTIONS.length} Correct
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 mb-6">
              Test your clinical judgment on selecting the optimal molecular or cytogenomic assay for specific patient phenotypes and genetic query scenarios.
            </p>

            <div className="space-y-6">
              {QUIZ_QUESTIONS.map((q, idx) => (
                <div key={idx} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-start space-x-2">
                    <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs font-bold text-slate-100 leading-snug">{q.scenario}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-8">
                    {q.options.map((opt) => {
                      const isSelected = quizAnswers[idx] === opt;
                      const isCorrect = opt === q.correctAnswer;
                      let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800';

                      if (quizSubmitted) {
                        if (isCorrect) btnStyle = 'bg-emerald-950 border-emerald-500/50 text-emerald-200 font-bold';
                        else if (isSelected && !isCorrect) btnStyle = 'bg-rose-950 border-rose-500/50 text-rose-200';
                      } else if (isSelected) {
                        btnStyle = 'bg-teal-500/20 border-teal-500 text-teal-200 font-bold';
                      }

                      return (
                        <button
                          key={opt}
                          onClick={() => handleQuizOption(idx, opt)}
                          className={`p-3 rounded-lg border text-xs text-left transition-all ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className="ml-8 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                      <strong className="text-teal-400 block mb-0.5">Clinical Rationale:</strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => {
                  setQuizAnswers({});
                  setQuizSubmitted(false);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset Quiz</span>
              </button>

              {!quizSubmitted ? (
                <button
                  onClick={() => setQuizSubmitted(true)}
                  disabled={Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
                >
                  Submit &amp; Grade Answers
                </button>
              ) : (
                <span className="text-xs text-teal-400 font-bold">Graded! Review rationales above.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QUIZ_QUESTIONS = [
  {
    scenario: 'A 2-year-old child presents with global developmental delay, dysmorphic facial features, and autism spectrum disorder. Normal newborn metabolic screening. What is the first-line recommended diagnostic test?',
    options: [
      'G-banded Karyotyping',
      'Chromosomal Microarray Analysis (CMA)',
      'Single-gene Sanger Sequencing',
      'Standard PCR'
    ],
    correctAnswer: 'Chromosomal Microarray Analysis (CMA)',
    explanation: 'CMA is the first-line recommended genetic diagnostic test for developmental delay and autism because it detects sub-microscopic microdeletions and microduplications (10-50 kb) undetectable by karyotyping.'
  },
  {
    scenario: 'A clinician suspects a patient has a balanced reciprocal translocation t(11;22) causing recurrent miscarriages. Which test can definitively visualize balanced translocations?',
    options: [
      'Chromosomal Microarray Analysis (CMA)',
      'Whole Exome Sequencing (WES)',
      'G-Banded Metaphase Karyotyping',
      'Targeted SNP Genotyping'
    ],
    correctAnswer: 'G-Banded Metaphase Karyotyping',
    explanation: 'CMA and short-read WES are blind to balanced structural rearrangements because there is no copy number gain or loss. Karyotyping directly visualizes metaphase chromosome structures.'
  },
  {
    scenario: 'You need to confirm a specific known candidate C>T missense variant detected by NGS in Exon 11 of BRCA1 with gold-standard >99.99% single-locus accuracy. Which assay is optimal?',
    options: [
      'Sanger Sequencing',
      'RNA Microarray',
      'Karyotyping',
      'Standard PCR without sequencing'
    ],
    correctAnswer: 'Sanger Sequencing',
    explanation: 'Sanger sequencing is the gold-standard orthogonal confirmation method for single-locus targeted nucleotide substitutions.'
  },
  {
    scenario: 'A patient with an undiagnosed rare pediatric condition has negative gene panel testing. You want to examine all ~20,000 protein-coding genes simultaneously. Which test is most appropriate?',
    options: [
      'Whole Exome Sequencing (WES)',
      'G-Banded Karyotyping',
      'Single-Gene PCR',
      'Targeted Pharmacogenomic Array'
    ],
    correctAnswer: 'Whole Exome Sequencing (WES)',
    explanation: 'WES interrogates all ~20,000 protein-coding genes (~1-2% of the genome), where ~85% of known disease-causing variants reside.'
  }
];
