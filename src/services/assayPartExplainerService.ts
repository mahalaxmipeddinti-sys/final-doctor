// src/services/assayPartExplainerService.ts
// Exhaustive diagnostic knowledge base for EVERY component across all 9 assays in both 2D and 3D.
// Dynamically incorporates the active variant (from Home inputs) into biophysical interpretations.

import { AssayType } from '../types/assays.ts';
import { NormalizedVariant } from '../types/genomics.ts';
import { getGeneContext } from './assayService.ts';

export interface AssayPartExplanation {
  id: string;
  name: string;
  assayType: AssayType;
  category: string;
  dimension: '2D' | '3D' | 'Both';
  technicalTerm: string;
  molecularRole: string;
  biophysicalMechanism: string;
  getVariantObservation: (variant?: NormalizedVariant) => {
    finding: string;
    clinicalImpact: string;
    metrics: Record<string, string>;
  };
  clinicalPitfalls: string[];
  acmgRelevance: string;
  qcStandard: string;
  cameraSettings?: {
    cameraZ: number;
    rotationX: number;
    rotationY: number;
  };
}

export const ASSAY_PART_REGISTRY: Record<string, AssayPartExplanation> = {
  // =========================================================================
  // PCR PARTS
  // =========================================================================
  'pcr-taq': {
    id: 'pcr-taq',
    name: 'Taq DNA Polymerase (5\'-3\' Catalytic Domain)',
    assayType: 'pcr',
    category: 'Thermostable Enzymology',
    dimension: 'Both',
    technicalTerm: 'Thermus aquaticus Recombinant DNA Polymerase I',
    molecularRole: 'Drives magnesium-dependent 5\'-to-3\' enzymatic synthesis of new DNA complementary strands.',
    biophysicalMechanism:
      'Catalyzes nucleophilic attack of the 3\'-hydroxyl group of the annealed primer onto the alpha-phosphate of incoming dNTPs, releasing pyrophosphate. Lacks 3\'-5\' exonuclease proofreading, operating at an extension velocity of ~1,000 nucleotides per minute at 72°C with high processivity.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Processively amplifies a ${ctx.ampliconLen} bp genomic amplicon spanning ${ctx.gene} Exon ${ctx.targetExon}.`,
        clinicalImpact: `Faithfully replicates the ${variant?.hgvsc || 'target'} candidate locus without premature dissociation or stutter artifacts.`,
        metrics: {
          'Enzyme Processivity': '~60 nt before dissociation',
          'Optimum Temp': '72.0°C (Half-life >40 min at 95°C)',
          'Error Rate': '1 × 10^-4 substitutions/bp',
          'Target Amplicon': `${ctx.ampliconLen} bp`,
        },
      };
    },
    clinicalPitfalls: [
      'Magnesium ion (Mg2+) starvation leads to low amplicon yield; excessive Mg2+ lowers stringency, generating non-specific bands.',
      'Enzyme degradation through repeated freeze-thaw cycles leads to false-negative amplification dropouts.',
    ],
    acmgRelevance:
      'Provides high-fidelity nucleic acid material necessary to confirm pathogenic variants under ACMG PS3/PP5 evidence streams.',
    qcStandard: 'Activity ≥ 5 U/µL; absence of non-specific endonuclease and nickase activity.',
    cameraSettings: { cameraZ: 14, rotationX: 0.1, rotationY: 0.4 },
  },

  'pcr-helix': {
    id: 'pcr-helix',
    name: 'DNA Double Helix Template (Genomic Locus)',
    assayType: 'pcr',
    category: 'Nucleic Acid Substrate',
    dimension: 'Both',
    technicalTerm: 'High-Molecular-Weight Patient Genomic Template DNA',
    molecularRole: 'Serves as the template target harboring the patient germline or somatic genetic variant.',
    biophysicalMechanism:
      'Undergoes thermal strand separation at 95°C by disrupting inter-base hydrogen bonding (2 bonds for A-T, 3 for G-C) without cleaving covalent phosphodiester backbones, permitting primer annealing upon cooling to 58-60°C.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Patient genomic DNA containing target locus on chromosome ${ctx.chromosome} (${ctx.cytoband}).`,
        clinicalImpact: `Carries ${ctx.gene} ${variant?.hgvsc || 'candidate variant'} for downstream diagnostic analysis.`,
        metrics: {
          'Template Input': '25-50 ng genomic DNA',
          'Genomic Region': `${ctx.cytoband} (${ctx.gene})`,
          'Melting Temp (Tm)': '84.6°C',
          'GC Content': '44.8%',
        },
      };
    },
    clinicalPitfalls: [
      'Formalin-fixed paraffin-embedded (FFPE) DNA fragmentation below 200 bp may cause PCR failure for larger amplicons.',
      'High GC content (>70%) can cause secondary hairpin structures resistant to denaturation without betaine or DMSO additives.',
    ],
    acmgRelevance: 'Primary template source for evaluating constitutional vs somatic inheritance.',
    qcStandard: 'A260/A280 purity ratio between 1.8 and 2.0; intact high-molecular weight band on agarose gel.',
    cameraSettings: { cameraZ: 16, rotationX: 0, rotationY: 0 },
  },

  'pcr-primers': {
    id: 'pcr-primers',
    name: 'Synthetic Oligo Primer Pair (Forward & Reverse)',
    assayType: 'pcr',
    category: 'Sequence Specificity Matrix',
    dimension: 'Both',
    technicalTerm: 'Exon-Specific 20-mer Deoxyoligonucleotide Primers',
    molecularRole: 'Define precise amplicon boundaries and provide free 3\'-OH terminus for polymerase extension.',
    biophysicalMechanism:
      'Hybridize selectively to complementary flanking intronic/exonic sequences via Watson-Crick base pairing at 58-60°C. Designed to avoid primer-dimer self-complementarity and secondary hairpin formations.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Forward: ${ctx.forwardPrimer} | Reverse: ${ctx.reversePrimer}.`,
        clinicalImpact: `Flanks ${ctx.gene} Exon ${ctx.targetExon} to generate an informative ${ctx.ampliconLen} bp diagnostic fragment.`,
        metrics: {
          'Forward Primer': ctx.forwardPrimer,
          'Reverse Primer': ctx.reversePrimer,
          'Annealing Temp': '58.5°C',
          'Primer-Dimer Delta-G': '-1.8 kcal/mol (Safe)',
        },
      };
    },
    clinicalPitfalls: [
      'Unsuspected single-nucleotide polymorphisms (SNPs) under the 3\' primer binding site can cause complete allele dropout (ADO).',
      'High primer concentrations (>0.5 µM) promote primer-dimer artifacts that deplete dNTP pools.',
    ],
    acmgRelevance: 'Critical for avoiding false-homozygous calls caused by allele dropout.',
    qcStandard: 'HPLC or PAGE purified; MALDI-TOF mass spectrometry confirmed molecular weight.',
    cameraSettings: { cameraZ: 14, rotationX: -0.2, rotationY: 0.6 },
  },

  'pcr-dntp': {
    id: 'pcr-dntp',
    name: 'Free Deoxynucleotide Triphosphates (dNTP Pool)',
    assayType: 'pcr',
    category: 'Substrate Chemistry',
    dimension: 'Both',
    technicalTerm: 'Equimolar dATP, dCTP, dGTP, dTTP Mix (200 µM each)',
    molecularRole: 'Provide substrate building blocks and cleavage energy for daughter DNA synthesis.',
    biophysicalMechanism:
      'Hydrolysis of the high-energy phosphoanhydride bond between alpha and beta phosphates provides Gibbs free energy (ΔG° ≈ -30 kJ/mol) driving non-reversible DNA elongation.',
    getVariantObservation: (variant) => {
      return {
        finding: 'Equimolar 200 µM dNTP concentration buffered at pH 8.3.',
        clinicalImpact: 'Maintains stoichiometric nucleotide availability across all 35 thermocycling cycles.',
        metrics: {
          'Concentration': '200 µM each (800 µM total)',
          'Magnesium Free': 'Coordinated with MgCl2',
          'Purity': '≥99% by HPLC',
        },
      };
    },
    clinicalPitfalls: [
      'Imbalanced dNTP concentrations increase polymerase misincorporation rate by up to 10-fold.',
      'Repeated freeze-thaw cycles cause hydrolytic deamination of dCTP into dUTP, inhibiting polymerase.',
    ],
    acmgRelevance: 'Ensures uniform amplification without introducing false-positive point mutations.',
    qcStandard: 'Free of dUTP and modified bases; negative for bacterial DNA contamination.',
    cameraSettings: { cameraZ: 18, rotationX: 0.4, rotationY: -0.3 },
  },

  'pcr-gel-patient': {
    id: 'pcr-gel-patient',
    name: 'Patient Proband Agarose Gel Band',
    assayType: 'pcr',
    category: 'Electrophoretic Size Sizing',
    dimension: '2D',
    technicalTerm: 'Ethidium Bromide / GelGreen Stained Amplicon Band in Proband Lane',
    molecularRole: 'Reveals molecular weight, purity, and stoichiometric yield of the patient amplicon.',
    biophysicalMechanism:
      'Under electric potential (100 V), negatively charged DNA molecules migrate through the 2.0% agarose sieve matrix towards the positive anode at velocities inversely proportional to log10(molecular weight).',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Sharp single band migrating at exactly ${ctx.ampliconLen} bp for ${ctx.gene}.`,
        clinicalImpact: `Validates robust on-target amplification of ${ctx.gene} Exon ${ctx.targetExon}; ready for Sanger/NGS sequencing.`,
        metrics: {
          'Observed Band Size': `${ctx.ampliconLen} bp`,
          'Relative Intensity': '100% (High Density)',
          'Non-Specific Bands': '0 (Pristine Specificity)',
          'Estimated Yield': '45 ng/µL',
        },
      };
    },
    clinicalPitfalls: [
      'Smearing indicates DNA degradation or excessive cycle numbers leading to over-amplification.',
      'Doublet bands may indicate large insertions/deletions or heteroduplex formation.',
    ],
    acmgRelevance: 'Confirms amplicon specificity before committing to clinical Sanger sequence reads.',
    qcStandard: 'Sharp discrete band; signal-to-noise ratio > 25:1 against background gel lane.',
  },

  'pcr-gel-ntc': {
    id: 'pcr-gel-ntc',
    name: 'No-Template Control (NTC) Gel Lane',
    assayType: 'pcr',
    category: 'Laboratory Quality Control',
    dimension: '2D',
    technicalTerm: 'Reagent Blank Negative Control',
    molecularRole: 'Excludes reagent contamination with airborne or amplicon carryover DNA.',
    biophysicalMechanism:
      'Contains complete PCR master mix (Taq, primers, dNTPs, buffer, water) without genomic template DNA. Must show completely dark lane under UV transillumination.',
    getVariantObservation: () => {
      return {
        finding: 'Zero band fluorescence observed at amplicon size.',
        clinicalImpact: 'Demonstrates complete absence of pre-PCR laboratory contamination.',
        metrics: {
          'Amplicon Band': 'Not Detected (Negative)',
          'Primer-Dimer': 'Minimal faint diffuse smear <50 bp',
          'Contamination Status': 'CLEAR / PASS',
        },
      };
    },
    clinicalPitfalls: [
      'A band in NTC invalidates the entire assay batch, mandating decontamination and re-extraction.',
    ],
    acmgRelevance: 'Mandatory clinical laboratory quality assurance requirement (CAP / CLIA standards).',
    qcStandard: 'Zero optical density at target molecular weight.',
  },

  'pcr-qpcr-curve': {
    id: 'pcr-qpcr-curve',
    name: 'Real-Time qPCR Kinetic Amplification Curve',
    assayType: 'pcr',
    category: 'Fluorescent Real-Time Kinetics',
    dimension: '2D',
    technicalTerm: 'Cycle Threshold (Cq / Ct) Fluorophore Amplification Plot',
    molecularRole: 'Quantifies template copy number exponentially and monitors reaction efficiency.',
    biophysicalMechanism:
      'Intercalating dye (SYBR Green) or hydrolysis probe (TaqMan) fluoresces proportionally to accumulating double-stranded DNA per cycle. Log-linear phase follows formula: Rn = R0 * (1 + E)^n.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Early exponential rise with Cycle Threshold (Ct) at cycle 21.8 for ${ctx.gene}.`,
        clinicalImpact: `High starting copy number with 98.4% reaction efficiency; verifies diploid copy number.`,
        metrics: {
          'Cycle Threshold (Ct)': '21.8 cycles',
          'Reaction Efficiency (E)': '98.4% (Slope: -3.36)',
          'Delta Rn Max': '3.42 Delta-F',
          'Melt Curve Peak (Tm)': '83.2°C',
        },
      };
    },
    clinicalPitfalls: [
      'Ct values >35 suggest severely degraded DNA or sub-inhibitory amounts of PCR inhibitors (heme, heparin).',
      'Shoulders on the dissociation melt curve reveal non-specific secondary amplicons.',
    ],
    acmgRelevance: 'Essential for detecting heterozygous exon-level copy number variations (CNVs).',
    qcStandard: 'Amplification efficiency between 90% and 110%; R2 correlation > 0.99.',
  },

  // =========================================================================
  // SANGER PARTS
  // =========================================================================
  'sanger-capillary': {
    id: 'sanger-capillary',
    name: 'Fused Silica Capillary & POP-7 Polymer Array',
    assayType: 'sanger',
    category: 'Capillary Electrophoresis',
    dimension: 'Both',
    technicalTerm: '50 µm Polyimide-Coated Silica Capillary filled with Performance Optimized Polymer-7',
    molecularRole: 'Provides molecular sieving medium for single-base-resolution DNA separation.',
    biophysicalMechanism:
      'DNA fragments injected electrokinetically migrate through linear polyacrylamide chains under 15 kV voltage at 60°C. Smaller fragments experience fewer reptation entanglements, reaching the optical detector earlier.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Resolves ${ctx.gene} sequencing ladder from base 1 to 650 with >0.9 base spacing precision.`,
        clinicalImpact: `Ensures unambiguous single-nucleotide peak separation at candidate site ${variant?.hgvsc || ''}.`,
        metrics: {
          'Capillary Length': '50 cm (Array of 24 capillaries)',
          'Polymer': 'POP-7 Matrix at 60°C',
          'Run Voltage': '15.0 kV (Current: 110 µA)',
          'Migration Velocity': '2.4 mm/min',
        },
      };
    },
    clinicalPitfalls: [
      'Capillary clogging by salt or protein precipitates causes peak broadening and current dropouts.',
      'Temperature fluctuations (>1°C) alter polymer viscosity, causing peak shifting.',
    ],
    acmgRelevance: 'The gold standard orthogonal validation tool for all candidate clinical NGS variants.',
    qcStandard: 'Base resolution > 1.0 out to 600 bases; current stability within ±5%.',
    cameraSettings: { cameraZ: 15, rotationX: 0.1, rotationY: 0.3 },
  },

  'sanger-ddntp': {
    id: 'sanger-ddntp',
    name: 'Fluorescent Dye-Terminator ddNTPs (BigDye v3.1)',
    assayType: 'sanger',
    category: 'Fluorophore Chain Termination',
    dimension: 'Both',
    technicalTerm: '2\',3\'-Dideoxynucleoside Triphosphate with 4 Distinct Rhodamine Fluorophores',
    molecularRole: 'Competitively terminate DNA elongation at each base position, labeling the 3\' end.',
    biophysicalMechanism:
      'Lack of the 3\'-OH group prevents formation of the next phosphodiester bond. Each of the 4 ddNTPs is covalently linked to a distinct dye (dGTP=Black, dATP=Green, dCTP=Blue, dTTP=Red).',
    getVariantObservation: (variant) => {
      return {
        finding: 'Four-color dye emission spectra resolved across spectral calibration matrix.',
        clinicalImpact: 'Enables simultaneous 4-color base calling in a single capillary injection.',
        metrics: {
          'ddNTP:dNTP Ratio': '1:100 (Balanced termination)',
          'Fluorophore Types': 'dR6G (A), dR110 (G), dTAMRA (C), dROX (T)',
          'Cross-Talk Matrix': 'Condition number < 3.2',
        },
      };
    },
    clinicalPitfalls: [
      'Dye blobs caused by incomplete ethanol precipitation obscure small variant peaks in the first 70 bp.',
    ],
    acmgRelevance: 'Establishes primary peak morphology for distinguishing heterozygous SNVs from baseline noise.',
    qcStandard: 'Signal-to-noise ratio > 40:1; zero unincorporated dye blob artifact peaks.',
    cameraSettings: { cameraZ: 14, rotationX: -0.2, rotationY: 0.5 },
  },

  'sanger-laser': {
    id: 'sanger-laser',
    name: 'Argon-Ion Laser Detector & Optical Window',
    assayType: 'sanger',
    category: 'Optical Detection Suite',
    dimension: 'Both',
    technicalTerm: '488 nm Argon Laser Excitation with Spectrograph CCD Sensor',
    molecularRole: 'Excites migrating fluorophores as they cross the optical detection window.',
    biophysicalMechanism:
      'Laser excites fluorophores near their absorption maxima. A spectrograph disperses the emitted photons across a diffraction grating onto a cooled 16-bit CCD chip.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `CCD collects 4-color emission data at 60 Hz across ${ctx.gene} amplicon.`,
        clinicalImpact: 'Yields sharp, symmetrical Gaussian peak shapes for automated base calling.',
        metrics: {
          'Excitation Wavelength': '488 nm & 505 nm',
          'CCD Integration Time': '35 ms/frame',
          'Dynamic Range': '16-bit (0 - 65,535 RFU)',
          'Signal Baseline': '<50 RFU background',
        },
      };
    },
    clinicalPitfalls: [
      'CCD saturation (>8,000 RFU) causes peak flat-topping and inaccurate base calling.',
      'Low laser power produces weak peaks vulnerable to baseline noise.',
    ],
    acmgRelevance: 'Guarantees reliable signal intensities for clinical heterozygous variant confirmation.',
    qcStandard: 'Fluorescence intensity between 1,000 and 4,000 RFU across all 4 channels.',
    cameraSettings: { cameraZ: 16, rotationX: 0.3, rotationY: -0.2 },
  },

  'sanger-peak-variant': {
    id: 'sanger-peak-variant',
    name: 'Sanger Electropherogram Variant Peak (Target Site)',
    assayType: 'sanger',
    category: 'Chromatogram Peak Inspection',
    dimension: '2D',
    technicalTerm: 'Dual-Color Overlapping Chromatogram Peak / Frameshift Stutter',
    molecularRole: 'Demonstrates physical presence of the pathogenic variant allele in patient genomic DNA.',
    biophysicalMechanism:
      'In heterozygous SNVs, equimolar amounts of wild-type and mutant templates incorporate their respective dye-terminators at the same migration distance, producing two superimposed Gaussian peaks with ~50:50 area ratio. In indels, overlapping out-of-phase traces start at the breakpoint.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Clear dual-trace / variant peak confirmed at ${ctx.gene} ${variant?.hgvsc || 'target locus'}.`,
        clinicalImpact: `Orthogonally proves patient is a heterozygous carrier of ${variant?.hgvsc || 'pathogenic mutation'}.`,
        metrics: {
          'Variant Site': `${ctx.gene} ${variant?.hgvsc || 'c.5266dupC'}`,
          'Peak Height Ratio': '0.94 (Near perfect 1:1 heterozygosity)',
          'Phred Quality Score': 'Q46 (Confidence >99.99%)',
          'Strand Agreement': 'Confirmed on forward and reverse traces',
        },
      };
    },
    clinicalPitfalls: [
      'Polymerase slippage on mononucleotide runs (e.g. poly-A tracts) mimics insertion/deletion frameshifts.',
      'Primer-binding site polymorphism can silence the mutant allele, producing a false-negative wildtype trace.',
    ],
    acmgRelevance: 'Provides unambiguous validation satisfying ACMG PP5 and PS1/PS3 criteria.',
    qcStandard: 'Peak height ratio between 0.4 and 1.6; concordance across forward and reverse sequencing strands.',
  },

  'sanger-quality-track': {
    id: 'sanger-quality-track',
    name: 'Phred Base Quality Score Track (Q-Scores)',
    assayType: 'sanger',
    category: 'Bioinformatic Quality Assessment',
    dimension: '2D',
    technicalTerm: 'Logarithmic Base Call Error Probability Bar (Q = -10 log10 P)',
    molecularRole: 'Quantifies probability of erroneous base identification across the sequencing trace.',
    biophysicalMechanism:
      'KB Basecaller evaluates peak height, peak spacing, peak shape symmetry, and signal-to-noise ratio to compute calibrated Phred scores. Q20 = 1% error; Q30 = 0.1% error; Q40 = 0.01% error.',
    getVariantObservation: () => {
      return {
        finding: 'Mean quality score Q44 across the entire critical diagnostic window.',
        clinicalImpact: 'Extremely high statistical confidence exceeding clinical diagnostic thresholds.',
        metrics: {
          'Mean Q-Score': 'Q44 (99.996% accuracy)',
          'Lowest Q in Window': 'Q38',
          'Window Length': '520 bases',
          'Status': 'CLINICAL GRADE / HIGH CONFIDENCE',
        },
      };
    },
    clinicalPitfalls: [
      'Low Q-scores (<Q20) at the start (<50 bp) or end (>600 bp) of reads should never be used for clinical calls.',
    ],
    acmgRelevance: 'Ensures that reported variants are not artifacts of baseline optical noise.',
    qcStandard: 'Overall trace QV ≥ 30; critical variant base QV ≥ 35.',
  },

  // =========================================================================
  // NGS PARTS
  // =========================================================================
  'ngs-flowcell': {
    id: 'ngs-flowcell',
    name: 'Patterned Flow Cell Nano-Well Surface',
    assayType: 'ngs',
    category: 'Microfluidic Surface Chemistry',
    dimension: 'Both',
    technicalTerm: 'Optically Clear Glass Flow Cell with P5/P7 Oligonucleotide Lawn',
    molecularRole: 'Provides physical substrate for immobilizing and sequencing billions of clonal clusters.',
    biophysicalMechanism:
      'Nano-wells etched with sub-micron precision contain covalently immobilized P5 and P7 capture oligonucleotides. Flow cell microfluidics deliver cyclic enzymatic reagents (polymerase, fluorescent dNTPs, cleavage mix) under laminar flow.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Captures and sequences billions of genomic reads including ${ctx.gene} targeted panels.`,
        clinicalImpact: 'Achieves massive parallel sequencing with high spatial density and zero optical cross-talk.',
        metrics: {
          'Nano-Well Spacing': '0.7 µm pitch',
          'Cluster Density': '1,450 K/mm²',
          'Total Reads': '450 Million paired-end reads',
          'Chemistry': 'Reversible Dye Terminator Sequencing-by-Synthesis',
        },
      };
    },
    clinicalPitfalls: [
      'Over-clustering (>1,600 K/mm²) causes overlapping fluorescent signals and plummeting Q30 scores.',
      'Under-clustering reduces total sequencing output below required diagnostic depth.',
    ],
    acmgRelevance: 'Foundational platform for high-throughput hereditary and somatic mutation screening.',
    qcStandard: 'Cluster density between 1,200 and 1,500 K/mm²; % Passing Filter (%PF) > 85%.',
    cameraSettings: { cameraZ: 16, rotationX: 0.4, rotationY: 0.2 },
  },

  'ngs-cluster': {
    id: 'ngs-cluster',
    name: 'Monoclonal Bridge Amplification Clusters',
    assayType: 'ngs',
    category: 'Isothermal Clonal Amplification',
    dimension: 'Both',
    technicalTerm: 'Solid-Phase Clonal Colony (~1,000 Identical DNA Strands)',
    molecularRole: 'Amplifies single-molecule fluorescent signal into detectable optical bursts.',
    biophysicalMechanism:
      'Single template strand bends over to hybridize to an adjacent P5/P7 oligo ("bridge"). Bst DNA polymerase synthesizes a complementary strand. Cyclical denaturation and synthesis yields ~1,000 identical molecules per cluster.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Generates high-intensity optical colonies covering ${ctx.gene} locus.`,
        clinicalImpact: 'Enables high-depth variant allele frequency (VAF) quantitation with >150x coverage.',
        metrics: {
          'Molecules per Cluster': '~1,000 amplicons',
          'Monoclonality Rate': '>92% (Excludes polyclonal blends)',
          'Average Depth': '165x coverage',
          'VAF Precision': '±1.5%',
        },
      };
    },
    clinicalPitfalls: [
      'Polyclonal clusters (two different templates seeded in one well) cause mixed base calls and low Q-scores.',
    ],
    acmgRelevance: 'Enables quantitative detection of mosaicism and accurate heterozygous calling.',
    qcStandard: 'Monoclonality metric ≥ 90%; signal intensity uniform across flow cell lanes.',
    cameraSettings: { cameraZ: 14, rotationX: 0.1, rotationY: 0.4 },
  },

  'ngs-terminators': {
    id: 'ngs-terminators',
    name: 'Reversible Fluorescent Dye Terminators',
    assayType: 'ngs',
    category: 'Sequencing Chemistry',
    dimension: 'Both',
    technicalTerm: '3\'-O-Azidomethyl dNTPs with Cleavable Fluorophore Linkers',
    molecularRole: 'Ensure exactly one nucleotide is incorporated per sequencing cycle.',
    biophysicalMechanism:
      'The 3\'-O-azidomethyl group acts as a reversible terminator blocking further elongation. Following 4-channel fluorescent imaging, chemical treatment with tris(2-carboxyethyl)phosphine (TCEP) cleaves the fluorophore and regenerates a free 3\'-OH group.',
    getVariantObservation: () => {
      return {
        finding: 'Stepwise single-base incorporation across 150 sequencing cycles.',
        clinicalImpact: 'Completely eliminates homopolymer indel errors characteristic of pyrosequencing.',
        metrics: {
          'Incorporation Efficiency': '>99.2% per cycle',
          'De-blocking Yield': '>99.5%',
          'Cycle Time': '4.5 min per base pair',
        },
      };
    },
    clinicalPitfalls: [
      'Incomplete cleavage causes "phasing" (lagging behind) or "pre-phasing" (incorporating two bases), reducing read quality at cycle >120.',
    ],
    acmgRelevance: 'Provides high sequencing fidelity in GC-rich and repetitive genomic regions.',
    qcStandard: 'Phasing rate < 0.15%; pre-phasing rate < 0.10%.',
    cameraSettings: { cameraZ: 15, rotationX: -0.2, rotationY: 0.5 },
  },

  'ngs-read-alignment': {
    id: 'ngs-read-alignment',
    name: 'BAM Read Alignment Pileup & Mismatch Calls',
    assayType: 'ngs',
    category: 'Bioinformatic Alignment Track',
    dimension: '2D',
    technicalTerm: 'Paired-End 150 bp Alignment Pileup with CIGAR String Evaluation',
    molecularRole: 'Aligns reads against reference genome (GRCh38) and identifies candidate variants.',
    biophysicalMechanism:
      'BWA-MEM aligns reads using Burrows-Wheeler Transform algorithms. Reads showing base mismatches (SNVs) or gaps (indels) are quantified across forward and reverse strands to establish variant allele frequency (VAF).',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `165 total reads spanning ${ctx.gene} locus; 81 reads support ${variant?.hgvsc || 'variant'} (VAF: 49.1%).`,
        clinicalImpact: `Confirms heterozygous germline mutation with balanced forward and reverse strand coverage.`,
        metrics: {
          'Total Depth (DP)': '165x coverage',
          'Variant Allele Depth (AD)': '81 reads',
          'Variant Allele Frequency': '49.1% (Heterozygous)',
          'Strand Bias (FS)': '1.2 (Pristine, no strand bias)',
          'Mapping Quality (MQ)': '60.0 (Unique genomic mapping)',
        },
      };
    },
    clinicalPitfalls: [
      'High strand bias (FS > 60) indicates artificial sequencing errors confined to one read direction.',
      'Pseudogene homology (e.g. PMS2, SMN1) can cause spurious misalignments and false-positive calls.',
    ],
    acmgRelevance: 'Core data source for primary ACMG pathogenicity classification.',
    qcStandard: 'Minimum diagnostic depth ≥ 30x; MQ ≥ 50; Strand odds ratio (SOR) < 3.0.',
  },

  'ngs-coverage-histogram': {
    id: 'ngs-coverage-histogram',
    name: 'Per-Base Read Depth Coverage Histogram',
    assayType: 'ngs',
    category: 'Quality Depth Metrics',
    dimension: '2D',
    technicalTerm: 'BAM Per-Nucleotide Coverage Depth Envelope',
    molecularRole: 'Displays depth distribution across target gene exons to rule out coverage blind spots.',
    biophysicalMechanism:
      'Computes sliding window depth across coding exons. Ensures every single coding nucleotide meets the CLIA/CAP minimum threshold of ≥30x (germline) or ≥500x (somatic) coverage.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `100% of ${ctx.gene} coding bases covered at ≥100x depth.`,
        clinicalImpact: 'Guarantees zero false negatives resulting from sequencing dropouts.',
        metrics: {
          '100x Coverage Breadth': '100.0% of targeted bases',
          'Mean Depth': '165x',
          'Minimum Depth in Exon': '112x',
          'Status': 'CLIA/CAP CERTIFIED COMPLETE',
        },
      };
    },
    clinicalPitfalls: [
      'Coverage dips below 20x in GC-rich first exons can mask clinically actionable mutations.',
    ],
    acmgRelevance: 'Verifies negative test results are true negatives, not coverage dropouts.',
    qcStandard: '≥99% of targeted coding regions covered at ≥30x depth.',
  },

  // =========================================================================
  // WES PARTS
  // =========================================================================
  'wes-beads': {
    id: 'wes-beads',
    name: 'Streptavidin Magnetic Capture Beads',
    assayType: 'wes',
    category: 'Target Enrichment Matrix',
    dimension: 'Both',
    technicalTerm: '1.0 µm Superparamagnetic Beads coated with Recombinant Streptavidin',
    molecularRole: 'Physically isolates biotinylated exome bait hybrids from non-coding genomic DNA.',
    biophysicalMechanism:
      'Streptavidin binds biotin with the highest known non-covalent biological affinity (Kd ≈ 10^-14 M). Rapidly pulled down against the tube wall by a magnetic rack during high-stringency buffer washes.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Selectively captures ${ctx.gene} and 20,000 coding genes representing ~1.5% of genome.`,
        clinicalImpact: 'Enriches all human protein-coding exons while discarding 98.5% non-coding background.',
        metrics: {
          'Binding Affinity (Kd)': '1 × 10^-14 M',
          'Enrichment Fold': '>100-fold exome enrichment',
          'On-Target Capture Rate': '84.6%',
        },
      };
    },
    clinicalPitfalls: [
      'Bead clumping or insufficient washing leaves non-target intronic fragments, lowering on-target yield.',
    ],
    acmgRelevance: 'Standard assay for undiagnosed rare diseases and trios (proband-mother-father).',
    qcStandard: 'On-target enrichment rate ≥ 80%; capture specificity > 99%.',
    cameraSettings: { cameraZ: 15, rotationX: 0.2, rotationY: 0.3 },
  },

  'wes-baits': {
    id: 'wes-baits',
    name: 'Biotinylated cRNA Baits (120-mer Oligos)',
    assayType: 'wes',
    category: 'Hybrid Capture Probes',
    dimension: 'Both',
    technicalTerm: 'Synthetic 120-mer Biotin-Tagged RNA Probes spanning 214,000 Exons',
    molecularRole: 'Selectively hybridize in liquid phase to complementary coding exon genomic fragments.',
    biophysicalMechanism:
      'RNA-DNA hybrids exhibit higher thermodynamic stability than DNA-DNA duplexes. Hybridization performed at 65°C for 16-24 hours in high-salt hybridization buffer.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Bait set includes tiled probes targeting ${ctx.gene} Exon ${ctx.targetExon}.`,
        clinicalImpact: `Ensures robust hybridization capture across the entire ${variant?.hgvsc || 'target'} locus.`,
        metrics: {
          'Bait Length': '120-mer RNA oligonucleotides',
          'Tiling Density': '2x overlapping coverage',
          'Target Exome Space': '39 Megabases (CCDS & RefSeq)',
        },
      };
    },
    clinicalPitfalls: [
      'Exons with extreme GC content (>75%) or homology with pseudogenes show lower capture efficiency.',
    ],
    acmgRelevance: 'Enables unbiased diagnostic screening across all candidate morbid disease genes.',
    qcStandard: 'Zero bait dropouts across ClinVar pathogenic hotspot exons.',
    cameraSettings: { cameraZ: 14, rotationX: -0.3, rotationY: 0.4 },
  },

  'wes-exon-track': {
    id: 'wes-exon-track',
    name: 'Whole Exome BED Map & Splice Junctions',
    assayType: 'wes',
    category: 'Cytogenomic Mapping',
    dimension: '2D',
    technicalTerm: 'Coding Sequence (CDS) & Canonical Splice Site Coverage Map',
    molecularRole: 'Maps read coverage across all coding exons and canonical ±2 bp splice donor/acceptors.',
    biophysicalMechanism:
      'Evaluates exome-wide coverage profiles against RefSeq/Ensembl gene models. Flags non-synonymous missense, nonsense, frameshift, and essential splice-site alterations.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Target exon ${ctx.targetExon} of ${ctx.exonCount} in ${ctx.gene} shows uniform 140x coverage.`,
        clinicalImpact: `Confirms candidate variant ${variant?.hgvsc || ''} within its full exonic context.`,
        metrics: {
          'Gene Model': `${ctx.gene} (${ctx.transcript})`,
          'Target Exon': `Exon ${ctx.targetExon} of ${ctx.exonCount}`,
          'Splice Site Coverage': '100% at canonical GT/AG junctions',
          'Exome-Wide SNVs': '~25,000 variants detected in proband',
        },
      };
    },
    clinicalPitfalls: [
      'Exome sequencing misses deep intronic regulatory mutations situated >20 bp away from splice boundaries.',
    ],
    acmgRelevance: 'Evaluates PVS1 null variant criteria (nonsense, frameshift, canonical splice sites).',
    qcStandard: '≥95% of targeted exons covered at ≥20x depth.',
  },

  // =========================================================================
  // WGS PARTS
  // =========================================================================
  'wgs-chromatin': {
    id: 'wgs-chromatin',
    name: 'Unspooling Chromatin Fiber (Native Genome)',
    assayType: 'wgs',
    category: 'Native Genome Extraction',
    dimension: 'Both',
    technicalTerm: 'Unbiased High-Molecular-Weight Native Chromatin & Intact DNA',
    molecularRole: 'Preserves native stoichiometric ratio across all 3.2 billion base pairs of the human genome.',
    biophysicalMechanism:
      'High-molecular-weight DNA extracted gently without PCR amplification bias. Covaris focused acoustic sonication shears DNA into tight 350-500 bp fragments without GC-dependent dropout.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Native representation across nuclear genome and chromosome ${ctx.chromosome}.`,
        clinicalImpact: 'Enables detection of non-coding promoters, deep intronic variants, and structural SVs.',
        metrics: {
          'Genome Size': '3.2 Billion Base Pairs',
          'Library Type': 'PCR-Free Whole Genome',
          'Insert Size': '380 bp (Tight Gaussian distribution)',
          'GC Bias': 'Zero (PCR-free preparation)',
        },
      };
    },
    clinicalPitfalls: [
      'Inadequate sonication causes broad insert size distributions, degrading structural variant breakpoint resolution.',
    ],
    acmgRelevance: 'Gold standard for comprehensive single-test genomic characterization.',
    qcStandard: 'Mean insert size 350-450 bp; duplication rate < 10%.',
    cameraSettings: { cameraZ: 16, rotationX: 0.2, rotationY: 0.4 },
  },

  'wgs-breakpoint': {
    id: 'wgs-breakpoint',
    name: 'Structural Variant Breakpoint Inspector',
    assayType: 'wgs',
    category: 'Structural Cytogenomics',
    dimension: 'Both',
    technicalTerm: 'Split-Read & Discordant Paired-End Breakpoint Junction',
    molecularRole: 'Pinpoints single-base-pair coordinates of large chromosomal inversions, deletions, and translocations.',
    biophysicalMechanism:
      'Paired-end reads whose alignment distance or orientation departs from the expected insert size identify discordant read pairs. Reads directly overlapping the junction show split alignments (soft-clipping), defining breakend coordinates down to the exact nucleotide.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Analyzes chromosomal structural integrity around ${ctx.gene} on chr${ctx.chromosome}.`,
        clinicalImpact: 'Excludes large cryptic translocations, inversions, and complex chromothripsis events.',
        metrics: {
          'Split Reads': '34 supporting breakend',
          'Discordant Pairs': '42 discordant pairs',
          'Breakpoint Precision': '1 bp exact coordinate',
          'SV Type': 'High-resolution breakpoint check',
        },
      };
    },
    clinicalPitfalls: [
      'Repetitive elements (LINE, SINE, Alu) at breakpoints can cause multi-mapping ambiguities.',
    ],
    acmgRelevance: 'Essential for classifying pathogenic structural variants and gene fusion events.',
    qcStandard: 'Breakends supported by ≥10 independent split reads and concordant discordant pairs.',
    cameraSettings: { cameraZ: 15, rotationX: 0.3, rotationY: -0.3 },
  },

  'wgs-circos-diagram': {
    id: 'wgs-circos-diagram',
    name: 'Circular Genome-Wide Circos Diagram',
    assayType: 'wgs',
    category: 'Genome-Wide Landscape',
    dimension: '2D',
    technicalTerm: 'Circos 24-Chromosome Radial Ideogram & SV Translocation Chords',
    molecularRole: 'Visualizes whole-genome copy number and inter-chromosomal structural rearrangements.',
    biophysicalMechanism:
      'Arranges chromosomes 1-22, X, and Y in a circular radial layout. Outer ring plots GC content and sequencing depth; middle ring plots B-allele frequencies; inner chords depict inter-chromosomal translocations.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Chromosome ${ctx.chromosome} shows balanced diploid copy profile with focus on ${ctx.gene}.`,
        clinicalImpact: 'Confirms genomic stability without large pathogenic aneuploidies or translocations.',
        metrics: {
          'Genome Coverage': '32.4x mean whole-genome depth',
          'Aneuploidy Status': 'Euploid diploid (46 chromosomes)',
          'Translocation Chords': '0 pathogenic inter-chromosomal fusions',
        },
      };
    },
    clinicalPitfalls: [
      'Low coverage whole-genome sequencing (<15x) lacks sensitivity for balanced translocations.',
    ],
    acmgRelevance: 'Provides birds-eye diagnostic confirmation of global genome integrity.',
    qcStandard: 'Uniform 30x minimum depth across ≥90% of the euchromatic genome.',
  },

  // =========================================================================
  // DNA MICROARRAY PARTS
  // =========================================================================
  'microarray-substrate': {
    id: 'microarray-substrate',
    name: 'Silanized Photolithographic Glass Substrate',
    assayType: 'microarray',
    category: 'Array Microfluidics',
    dimension: 'Both',
    technicalTerm: 'High-Density Amino-Silane Coated Microscope Slide Matrix',
    molecularRole: 'Provides solid-phase support for hundreds of thousands of synthesized probe spots.',
    biophysicalMechanism:
      'Covalent attachment of 60-mer single-stranded DNA oligonucleotides via silane coupling chemistry. Probes are synthesized in situ using photolithographic light-directed phosphoramidite chemistry.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Houses probes spanning ${ctx.gene} and 45,000 human genes and transcripts.`,
        clinicalImpact: 'Enables high-throughput comparative transcriptome and copy number analysis.',
        metrics: {
          'Probe Features': '750,000 synthesized spots',
          'Feature Size': '8 µm diameter per spot',
          'Substrate Material': 'Precision low-fluorescence silica glass',
        },
      };
    },
    clinicalPitfalls: [
      'Surface scratches or dust particulates introduce localized fluorescence halos.',
    ],
    acmgRelevance: 'Established tool for gene expression profiling and oncological risk stratification.',
    qcStandard: 'Background optical variance CV < 5% across all 4 quadrants of the slide.',
    cameraSettings: { cameraZ: 16, rotationX: 0.5, rotationY: 0.2 },
  },

  'microarray-spots': {
    id: 'microarray-spots',
    name: 'Dual-Color Hybridization Oligo Spots (Cy3 / Cy5)',
    assayType: 'microarray',
    category: 'Fluorescent Hybridization',
    dimension: 'Both',
    technicalTerm: 'Competitive Hybridization Spots (Patient Cy5 Red vs Reference Cy3 Green)',
    molecularRole: 'Quantifies relative transcript abundance or genomic copy number via dual-color ratios.',
    biophysicalMechanism:
      'Equimolar mixtures of Cy5-labeled patient cDNA (red, 635 nm) and Cy3-labeled reference cDNA (green, 532 nm) hybridize competitively to probe spots. Equal abundance produces yellow fluorescence (ratio = 1.0). Overexpression/duplication yields red; deletion/downregulation yields green.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Target spot for ${ctx.gene} shows balanced yellow hybridization (Cy5:Cy3 = 1.02).`,
        clinicalImpact: 'Demonstrates normal diploid copy status and balanced expression.',
        metrics: {
          'Cy3 Reference Intensity': '8,420 RFU',
          'Cy5 Patient Intensity': '8,588 RFU',
          'Cy5:Cy3 Ratio': '1.02 (Balanced diploid expression)',
          'Log2 Ratio': '+0.03 (Normal)',
        },
      };
    },
    clinicalPitfalls: [
      'Dye bias (Cy5 photobleaching at higher rates than Cy3) mandates dye-swap replication experiments.',
    ],
    acmgRelevance: 'Provides functional expression evidence (ACMG PS3) or copy number confirmation.',
    qcStandard: 'Signal-to-noise ratio > 10:1; feature diameter circularity index > 0.90.',
    cameraSettings: { cameraZ: 14, rotationX: 0.3, rotationY: 0.3 },
  },

  // =========================================================================
  // CMA (CHROMOSOMAL MICROARRAY) PARTS
  // =========================================================================
  'cma-probes': {
    id: 'cma-probes',
    name: 'High-Density Oligo Copy Number Probes',
    assayType: 'cma',
    category: 'Submicroscopic Cytogenomics',
    dimension: 'Both',
    technicalTerm: 'High-Density Oligonucleotide & SNP Probes spaced across Chromosome Arms',
    molecularRole: 'Measures submicroscopic copy number variations (CNVs) at 10-50 kb resolution.',
    biophysicalMechanism:
      'Tiled across the human genome at dense intervals. Fluorescence signals normalized against a baseline reference pool of 100 diploid individuals to calculate Log2 ratios. Log2 ratio 0.0 = diploid; -1.0 = heterozygous deletion; +0.58 = duplication.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Dense oligo probes spanning ${ctx.chromosome}${ctx.cytoband} around ${ctx.gene}.`,
        clinicalImpact: 'Monitors for microdeletions or microduplications encompassing the candidate gene.',
        metrics: {
          'Genomic Locus': `${ctx.cytoband} (${ctx.gene})`,
          'Probe Density': '1 probe every 1.8 kb in coding exons',
          'Current Log2 Ratio': '0.01 (Normal diploid copy number)',
          'CNV Status': 'Normal 2 Copies (No deletion/duplication)',
        },
      };
    },
    clinicalPitfalls: [
      'Wavy baseline artifacts caused by GC% variations in DNA extraction (wave correction algorithms required).',
      'Cannot detect balanced translocations or inversions that do not alter copy number.',
    ],
    acmgRelevance: 'First-tier diagnostic test for developmental delay, autism, and congenital anomalies.',
    qcStandard: 'Median Absolute Pairwise Difference (MAPD) < 0.22; SNP call rate > 98.5%.',
    cameraSettings: { cameraZ: 14, rotationX: 0.2, rotationY: 0.3 },
  },

  'cma-baf-track': {
    id: 'cma-baf-track',
    name: 'B-Allele Frequency (BAF) Allelic Track',
    assayType: 'cma',
    category: 'Allelic Zygosity Analysis',
    dimension: '2D',
    technicalTerm: 'SNP Allele Ratio Plot (AA=1.0, AB=0.5, BB=0.0)',
    molecularRole: 'Distinguishes true copy loss from loss of heterozygosity (LOH) and uniparental disomy (UPD).',
    biophysicalMechanism:
      'Measures normalized intensity of Allele B relative to total Allele A+B signal. Normal diploid regions show 3 distinct bands (0.0, 0.5, 1.0). Deletions collapse to 2 bands (0.0, 1.0). Duplications split the middle band into 4 tracks (0.0, 0.33, 0.67, 1.0).',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Three robust BAF bands (AA, AB, BB) visible across ${ctx.chromosome}${ctx.cytoband}.`,
        clinicalImpact: 'Confirms biparental inheritance and rules out absence of heterozygosity (AOH).',
        metrics: {
          'Heterozygous Band (AB)': 'Centering tightly at 0.50',
          'Homozygous Ref (AA)': '1.00',
          'Homozygous Alt (BB)': '0.00',
          'AOH / LOH Region': 'None detected (<3 Mb baseline)',
        },
      };
    },
    clinicalPitfalls: [
      'Low-level mosaicism (<15%) causes subtle split bands easily missed without automated segmentation.',
    ],
    acmgRelevance: 'Critical for detecting uniparental disomy (UPD) in imprinting disorders (Prader-Willi, Angelman).',
    qcStandard: 'BAF standard deviation < 0.08 in diploid reference regions.',
  },

  // =========================================================================
  // GENOTYPING PARTS
  // =========================================================================
  'genotyping-proband': {
    id: 'genotyping-proband',
    name: 'Patient Proband Genotype Coordinate Point',
    assayType: 'genotyping',
    category: 'Cartesian Cluster Analysis',
    dimension: 'Both',
    technicalTerm: 'Normalized Polar / Cartesian SNP Fluorophore Intensity Point',
    molecularRole: 'Plots patient sample coordinate on Cartesian fluorescence axes to assign genotype call.',
    biophysicalMechanism:
      'Dual-color TaqMan or BeadChip probes for Allele 1 (VIC / X-axis) and Allele 2 (FAM / Y-axis). Normalizes raw fluorescence into Cartesian (X, Y) and polar (Theta, R) coordinates for automated clustering.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Proband coordinate located squarely in the Heterozygous (AB) cluster for ${ctx.gene}.`,
        clinicalImpact: `Confirms patient carries 1 copy of wildtype allele and 1 copy of candidate variant allele.`,
        metrics: {
          'Sample Call': 'Heterozygous (AB)',
          'Allele 1 (VIC/X)': '0.68 RFU',
          'Allele 2 (FAM/Y)': '0.72 RFU',
          'GenCall Quality Score': '0.985 (Confidence >99.9%)',
        },
      };
    },
    clinicalPitfalls: [
      'Adjacent secondary SNPs under probe binding sites shift points between clusters, causing false calls.',
      'DNA concentration variability shifts points along the radial R-axis away from cluster centroids.',
    ],
    acmgRelevance: 'Rapid, cost-effective cascade screening for known familial pathogenic variants.',
    qcStandard: 'GenCall score ≥ 0.25 threshold; distance from centroid < 2 standard deviations.',
    cameraSettings: { cameraZ: 14, rotationX: 0.2, rotationY: 0.3 },
  },

  'genotyping-clusters': {
    id: 'genotyping-clusters',
    name: 'Genotype Centroid Clusters (AA, AB, BB)',
    assayType: 'genotyping',
    category: 'Population Cluster Calibration',
    dimension: 'Both',
    technicalTerm: 'Bivariate Gaussian Ellipsoids for Homozygous Ref, Het, and Homozygous Alt',
    molecularRole: 'Define reference population boundaries for automated allele discrimination.',
    biophysicalMechanism:
      'Constructed from hundreds of verified reference control samples. Cluster separation metric (CS) assesses the geometric distance between clusters relative to their internal variance.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Distinct, well-separated cluster ellipsoids for ${ctx.gene} ${ctx.dbsnp}.`,
        clinicalImpact: 'Permits automated, error-free genotype calling across multi-well plates.',
        metrics: {
          'Homozygous Ref (AA)': 'VIC-dominant (Sky Blue Cluster)',
          'Heterozygous (AB)': 'Equimolar dual-fluorescence (Green Cluster)',
          'Homozygous Alt (BB)': 'FAM-dominant (Rose Red Cluster)',
          'Cluster Separation (CS)': '8.4 (Outstanding separation >4.0)',
        },
      };
    },
    clinicalPitfalls: [
      'Cluster bleeding (poor separation CS < 3.0) mandates manual review or Sanger sequencing.',
    ],
    acmgRelevance: 'Provides population frequency evidence supporting ACMG PM2 / BA1 criteria.',
    qcStandard: 'Overall call rate ≥ 99.0%; Hardy-Weinberg equilibrium p-value > 0.001.',
    cameraSettings: { cameraZ: 15, rotationX: -0.2, rotationY: 0.4 },
  },

  // =========================================================================
  // KARYOTYPING PARTS
  // =========================================================================
  'karyotyping-chromatid': {
    id: 'karyotyping-chromatid',
    name: 'G-Banded Metaphase Sister Chromatid Arms',
    assayType: 'karyotyping',
    category: 'Classical Cytogenetics',
    dimension: 'Both',
    technicalTerm: 'Mitotic Metaphase Chromosome condensed with Condensin & Cohesin',
    molecularRole: 'Allows optical microscopic inspection of gross chromosomal structure and ploidy.',
    biophysicalMechanism:
      'Cell cultures arrested at metaphase using Colcemid spindle inhibitors. Swelled in hypotonic KCl solution, fixed with methanol:acetic acid, dropped onto slides, treated with trypsin, and stained with Giemsa.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Examines Chromosome ${ctx.chromosome} at 550-band resolution (${ctx.cytoband} locus).`,
        clinicalImpact: `Confirms intact chromosomal morphology and excludes gross translocations or aneuploidies.`,
        metrics: {
          'Chromosome Number': `Chromosome ${ctx.chromosome}`,
          'Band Resolution': '550 bands per haploid set',
          'Mitotic Stage': 'Metaphase chromosome spread',
          'Karyotype Formula': '46,XX / 46,XY normal constitutional spread',
        },
      };
    },
    clinicalPitfalls: [
      'Over-trypsinization results in blurred "ghost" bands lacking diagnostic resolution.',
      'Under-trypsinization leaves chromosomes completely dark and unbanded.',
    ],
    acmgRelevance: 'Gold standard for large macro-chromosomal aberrations (>5-10 Mb) and balanced translocations.',
    qcStandard: 'Minimum 20 metaphase spreads analyzed; modal count 46 chromosomes in 100% of cells.',
    cameraSettings: { cameraZ: 15, rotationX: 0.2, rotationY: 0.3 },
  },

  'karyotyping-centromere': {
    id: 'karyotyping-centromere',
    name: 'Primary Centromeric Constriction (Kinetochore Core)',
    assayType: 'karyotyping',
    category: 'Chromosomal Morphology',
    dimension: 'Both',
    technicalTerm: 'Alphoid Satellite Heterochromatin Constriction',
    molecularRole: 'Divides the chromosome into short p-arm and long q-arm; mediates mitotic spindle attachment.',
    biophysicalMechanism:
      'Heterochromatic constriction composed of alpha-satellite tandem DNA repeats bound by CENP proteins. Centromeric index (arm ratio) classifies chromosomes as metacentric, submetacentric, or acrocentric.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Normal centromeric constriction on chromosome ${ctx.chromosome}; demarcates ${ctx.cytoband}.`,
        clinicalImpact: 'Maintains canonical p-to-q arm ratio; excludes dicentric chromosomes or isochromosomes.',
        metrics: {
          'Centromeric Position': `Chromosome ${ctx.chromosome} morphology`,
          'Arm Demarcation': `p-arm (short) / q-arm (long: contains ${ctx.gene})`,
          'Satellite DNA': 'Alphoid repeat integrity verified',
        },
      };
    },
    clinicalPitfalls: [
      'Centromere twisting can obscure pericentric inversions; FISH probes recommended for equivocal calls.',
    ],
    acmgRelevance: 'Defines anatomical reference coordinate for all ISCN cytogenetic nomenclature.',
    qcStandard: 'Unambiguous centromere constriction on all analyzed metaphase plates.',
    cameraSettings: { cameraZ: 13, rotationX: 0, rotationY: 0 },
  },

  'karyotyping-gpos-bands': {
    id: 'karyotyping-gpos-bands',
    name: 'G-Positive Bands (Dark Heterochromatin Bands)',
    assayType: 'karyotyping',
    category: 'Giemsa Banding Pattern',
    dimension: 'Both',
    technicalTerm: 'AT-Rich Late-Replicating Condensed Heterochromatin',
    molecularRole: 'Provide distinctive landmark dark transverse bands for chromosome pair identification.',
    biophysicalMechanism:
      'Giemsa dye (methylene blue / azure / eosin) binds preferentially to AT-rich DNA sequences. Trypsin partially digests histone proteins, allowing hydrophobic Giemsa intercalation into condensed heterochromatin.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Characteristic banding pattern for chromosome ${ctx.chromosome} matching ISCN standards.`,
        clinicalImpact: 'Verifies structural integrity of regional bands flanking the target locus.',
        metrics: {
          'Banding Type': 'G-positive dark bands (AT-rich)',
          'Replication Timing': 'Late S-phase replication',
          'Gene Density': 'Low gene density, structural scaffold',
        },
      };
    },
    clinicalPitfalls: [
      'Subtle interstitial deletions <5 Mb are below the optical resolution limit of G-banding (requires CMA).',
    ],
    acmgRelevance: 'Identifies macro-deletions, duplications, and ring chromosomes.',
    qcStandard: 'Band contrast ratio > 3:1 between adjacent dark and light bands.',
    cameraSettings: { cameraZ: 14, rotationX: -0.2, rotationY: 0.4 },
  },

  'karyotyping-gneg-bands': {
    id: 'karyotyping-gneg-bands',
    name: 'G-Negative Bands (Light Euchromatin Bands)',
    assayType: 'karyotyping',
    category: 'Active Euchromatin Banding',
    dimension: 'Both',
    technicalTerm: 'GC-Rich Early-Replicating Transcriptionally Active Euchromatin',
    molecularRole: 'House high-density protein-coding genes including critical disease loci.',
    biophysicalMechanism:
      'GC-rich regions with high concentrations of CpG islands and active genes. Retain more protein structure after trypsin digestion and bind less Giemsa, appearing light under brightfield microscopy.',
    getVariantObservation: (variant) => {
      const ctx = getGeneContext(variant);
      return {
        finding: `Target gene ${ctx.gene} resides in euchromatic band ${ctx.cytoband}.`,
        clinicalImpact: 'Houses active transcriptional machinery where candidate pathogenic mutation occurs.',
        metrics: {
          'Banding Type': 'G-negative light bands (GC-rich euchromatin)',
          'Gene Content': `High gene density (houses ${ctx.gene})`,
          'Chromatin State': 'Open active transcription state',
        },
      };
    },
    clinicalPitfalls: [
      'Microdeletions in light euchromatic bands require high-resolution CMA or FISH for diagnostic detection.',
    ],
    acmgRelevance: 'Critical for correlating cytogenetic band locations with molecular gene annotations.',
    qcStandard: 'Clear demarcation from adjacent G-positive dark bands.',
    cameraSettings: { cameraZ: 14, rotationX: 0.3, rotationY: -0.3 },
  },
};

/**
 * Returns all explainer parts for a given assay type
 */
export function getPartsForAssay(assayType: AssayType): AssayPartExplanation[] {
  return Object.values(ASSAY_PART_REGISTRY).filter((p) => p.assayType === assayType);
}

/**
 * Finds explanation by part ID or 3D subsystem component ID
 */
export function findPartExplanation(
  partOrSubsystemId: string,
  assayType?: AssayType
): AssayPartExplanation | undefined {
  // Direct ID match
  if (ASSAY_PART_REGISTRY[partOrSubsystemId]) {
    return ASSAY_PART_REGISTRY[partOrSubsystemId];
  }

  // Check prefix match with assay type, e.g. "taq" -> "pcr-taq"
  if (assayType) {
    const combinedKey = `${assayType}-${partOrSubsystemId}`;
    if (ASSAY_PART_REGISTRY[combinedKey]) {
      return ASSAY_PART_REGISTRY[combinedKey];
    }
  }

  // Fuzzy search in all registry entries
  const normalized = partOrSubsystemId.toLowerCase();
  return Object.values(ASSAY_PART_REGISTRY).find(
    (p) =>
      (!assayType || p.assayType === assayType) &&
      (p.id.toLowerCase().includes(normalized) ||
        p.name.toLowerCase().includes(normalized) ||
        p.technicalTerm.toLowerCase().includes(normalized))
  );
}
