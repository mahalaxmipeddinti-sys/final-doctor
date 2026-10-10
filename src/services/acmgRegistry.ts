// src/services/acmgRegistry.ts
import { ACMGEvidenceStrength } from '../types/genomics.ts';

export type ACMGCriterionStatus =
  | 'MET'
  | 'NOT_MET'
  | 'NOT_EVALUATED'
  | 'CONFLICTING'
  | 'NOT_APPLICABLE'
  | 'UNSUPPORTED';

export type ACMGCategory = 'PATHOGENIC' | 'BENIGN';

export interface ACMGCriterionDefinition {
  code: string;
  category: ACMGCategory;
  name: string;
  defaultStrength: ACMGEvidenceStrength;
  permittedStrengths: ACMGEvidenceStrength[];
  clinGenSviModified?: boolean;
  applicabilityScope: string;
  requiredFields: string[];
  exclusions: string[];
  guidelineSource: string;
  clingenUrl?: string;
  explanationTemplate: {
    met: string;
    notMet: string;
    notEvaluated: string;
  };
}

export const ACMG_RULESET_VERSION = 'ACMG/AMP 2015 + ClinGen SVI Guidelines v2.0';
export const GUIDELINE_REF_URL = 'https://www.nature.com/articles/gim201530';
export const CLINGEN_REGISTRY_URL = 'https://cspec.genome.network/';

export const ACMG_CRITERIA_REGISTRY: Record<string, ACMGCriterionDefinition> = {
  // --- PATHOGENIC VERY STRONG ---
  PVS1: {
    code: 'PVS1',
    category: 'PATHOGENIC',
    name: 'Null variant in a gene where loss-of-function is an established disease mechanism',
    defaultStrength: 'VERY_STRONG',
    permittedStrengths: ['VERY_STRONG', 'STRONG', 'MODERATE', 'SUPPORTING'],
    clinGenSviModified: true,
    applicabilityScope: 'Nonsense, frameshift, canonical splice site (+/-1,2), initiation codon, or exon deletion in LOF genes.',
    requiredFields: ['geneSymbol', 'isLossOfFunction', 'consequence'],
    exclusions: ['Genes where LOF is not a known mechanism', 'Truncal variants in last exon prone to NMD escape without functional loss'],
    guidelineSource: 'ACMG/AMP 2015 & ClinGen SVI PVS1 Decision Tree (Tayoun et al. 2018)',
    clingenUrl: 'https://www.clinicalgenome.org/working-groups/sequence-variant-interpretation/pvs1-working-group/',
    explanationTemplate: {
      met: 'Predicted null variant (nonsense, frameshift, or canonical splice) in a gene where LOF is an established disease mechanism and nonsense-mediated decay (NMD) is expected.',
      notMet: 'Variant does not alter reading frame, initiation codon, or canonical splice junction, or occurs in a gene where LOF is not a confirmed disease mechanism.',
      notEvaluated: 'Transcript structure or disease mechanism for gene cannot be confirmed.',
    },
  },

  // --- PATHOGENIC STRONG ---
  PS1: {
    code: 'PS1',
    category: 'PATHOGENIC',
    name: 'Same amino acid change as a previously established pathogenic variant',
    defaultStrength: 'STRONG',
    permittedStrengths: ['STRONG', 'MODERATE'],
    applicabilityScope: 'Missense change identical in protein consequence to an established pathogenic variant regardless of nucleotide change.',
    requiredFields: ['proteinChange', 'geneSymbol'],
    exclusions: ['Splice-altering nucleotide changes where amino acid prediction does not reflect primary mechanism'],
    guidelineSource: 'ACMG/AMP 2015 PS1 Specification',
    explanationTemplate: {
      met: 'Identical amino acid substitution previously established as Pathogenic/Likely Pathogenic by clinical consensus.',
      notMet: 'No previously established pathogenic variant causes this identical amino acid substitution.',
      notEvaluated: 'Protein position or codon comparison data unavailable.',
    },
  },

  PS2: {
    code: 'PS2',
    category: 'PATHOGENIC',
    name: 'De novo variant (both maternity and paternity confirmed)',
    defaultStrength: 'STRONG',
    permittedStrengths: ['VERY_STRONG', 'STRONG', 'MODERATE'],
    clinGenSviModified: true,
    applicabilityScope: 'Patient with disease and no family history; maternity and paternity genetically confirmed.',
    requiredFields: ['trioData', 'inheritancePattern'],
    exclusions: ['Unconfirmed biological paternity or maternity (use PM6 instead)'],
    guidelineSource: 'ACMG/AMP 2015 & ClinGen De Novo Workgroup',
    explanationTemplate: {
      met: 'Confirmed de novo inheritance in proband with confirmed maternity and paternity.',
      notMet: 'Variant is inherited from a parent or pedigree parental confirmation is negative.',
      notEvaluated: 'Parental sequencing data not provided.',
    },
  },

  PS3: {
    code: 'PS3',
    category: 'PATHOGENIC',
    name: 'Well-established in vitro or in vivo functional studies supportive of damaging effect',
    defaultStrength: 'STRONG',
    permittedStrengths: ['VERY_STRONG', 'STRONG', 'MODERATE', 'SUPPORTING'],
    clinGenSviModified: true,
    applicabilityScope: 'Validated assays reflecting biological disease mechanism (enzymatic, trafficking, electrophysiology).',
    requiredFields: ['functionalAssayResult'],
    exclusions: ['Non-validated high-throughput assays or computational proxies'],
    guidelineSource: 'ACMG/AMP 2015 & ClinGen SVI Functional Assay Guidance (Brnich et al. 2019)',
    explanationTemplate: {
      met: 'Validated in vitro or in vivo functional assay demonstrates severe loss/disruption of protein function or splicing.',
      notMet: 'Functional studies show normal or near-normal activity, or assays do not meet ClinGen validation thresholds.',
      notEvaluated: 'Experimental functional assay data not supplied.',
    },
  },

  PS4: {
    code: 'PS4',
    category: 'PATHOGENIC',
    name: 'Prevalence in affected individuals significantly increased compared with controls',
    defaultStrength: 'STRONG',
    permittedStrengths: ['STRONG', 'MODERATE', 'SUPPORTING'],
    applicabilityScope: 'Case-control cohort studies showing statistically significant odds ratio (OR > 5.0, p < 0.05).',
    requiredFields: ['caseControlOddsRatio'],
    exclusions: ['Small case reports without control population frequency comparison'],
    guidelineSource: 'ACMG/AMP 2015 PS4 Specification',
    explanationTemplate: {
      met: 'Statistically significant enrichment in disease case cohorts compared to gnomAD/control populations.',
      notMet: 'Variant frequency in case cohorts is not significantly elevated above population controls.',
      notEvaluated: 'Case-control enrichment data unavailable.',
    },
  },

  // --- PATHOGENIC MODERATE ---
  PM1: {
    code: 'PM1',
    category: 'PATHOGENIC',
    name: 'Located in a mutational hotspot and/or critical functional domain',
    defaultStrength: 'MODERATE',
    permittedStrengths: ['MODERATE', 'SUPPORTING'],
    applicabilityScope: 'Well-established catalytic site, binding pocket, or mutational hotspot without benign variation.',
    requiredFields: ['isInKnownDomain', 'domainName'],
    exclusions: ['Domains tolerant to non-pathogenic missense variants'],
    guidelineSource: 'ACMG/AMP 2015 PM1 Specification',
    explanationTemplate: {
      met: 'Located in a critical functional domain or mutational hotspot devoid of benign variation.',
      notMet: 'Variant lies outside known critical functional domains or in a region with frequent benign variation.',
      notEvaluated: 'Protein domain map unavailable.',
    },
  },

  PM2: {
    code: 'PM2',
    category: 'PATHOGENIC',
    name: 'Absent or extremely low frequency in population databases (gnomAD)',
    defaultStrength: 'MODERATE',
    permittedStrengths: ['MODERATE', 'SUPPORTING'],
    clinGenSviModified: true, // ClinGen recommends downgrading PM2 to SUPPORTING in rare mendelian contexts
    applicabilityScope: 'Absent or PopMax AF < 0.00002 (0.002%) in gnomAD exomes and genomes.',
    requiredFields: ['gnomadAfPopmax', 'gnomadAfGlobal'],
    exclusions: ['Common variants (AF > 0.001) or poorly covered genomic regions'],
    guidelineSource: 'ClinGen SVI Recommendation for PM2 (Downgraded to PM2_Supporting for most autosomal dominant conditions)',
    explanationTemplate: {
      met: 'Absent or observed at extremely low allele frequency (< 0.002%) in gnomAD population datasets.',
      notMet: 'Observed at frequency above rare disease threshold in population controls.',
      notEvaluated: 'Population database coverage insufficient.',
    },
  },

  PM3: {
    code: 'PM3',
    category: 'PATHOGENIC',
    name: 'For recessive disorders, detected in trans with a pathogenic variant',
    defaultStrength: 'MODERATE',
    permittedStrengths: ['STRONG', 'MODERATE', 'SUPPORTING'],
    applicabilityScope: 'Autosomal recessive disease proband confirmed compound heterozygous in trans.',
    requiredFields: ['trioData', 'transPathogenicVariant'],
    exclusions: ['Variants in cis on the same allele'],
    guidelineSource: 'ACMG/AMP 2015 & ClinGen SVI PM3 Working Group',
    explanationTemplate: {
      met: 'Confirmed in trans with a pathogenic or likely pathogenic variant in an autosomal recessive disorder.',
      notMet: 'Not detected in compound heterozygous state or co-occurs in cis with pathogenic variant.',
      notEvaluated: 'Phase/parental haplotype data not available.',
    },
  },

  PM4: {
    code: 'PM4',
    category: 'PATHOGENIC',
    name: 'Protein length changes due to in-frame indels or stop-loss variants',
    defaultStrength: 'MODERATE',
    permittedStrengths: ['MODERATE', 'SUPPORTING'],
    applicabilityScope: 'In-frame deletions/insertions or stop-loss in non-repeat regions altering protein structure.',
    requiredFields: ['consequence', 'proteinChange'],
    exclusions: ['In-frame indels in highly variable, non-conserved repeat regions'],
    guidelineSource: 'ACMG/AMP 2015 PM4 Specification',
    explanationTemplate: {
      met: 'In-frame insertion/deletion or stop-loss altering protein length in a non-repeat conserved region.',
      notMet: 'Indel occurs in a repetitive region or does not alter protein length.',
      notEvaluated: 'Repeat region mask unavailable.',
    },
  },

  PM5: {
    code: 'PM5',
    category: 'PATHOGENIC',
    name: 'Novel missense change at an amino acid residue where a different missense change is pathogenic',
    defaultStrength: 'MODERATE',
    permittedStrengths: ['MODERATE', 'SUPPORTING'],
    applicabilityScope: 'Missense substitution at a position where a different amino acid change is established pathogenic.',
    requiredFields: ['proteinPosition', 'geneSymbol'],
    exclusions: ['Same amino acid substitution (use PS1 instead)'],
    guidelineSource: 'ACMG/AMP 2015 PM5 Specification',
    explanationTemplate: {
      met: 'Novel missense change at an amino acid position where a distinct missense alteration is pathogenic.',
      notMet: 'No pathogenic missense variants established at this codon position.',
      notEvaluated: 'Codon positional variation database not checked.',
    },
  },

  PM6: {
    code: 'PM6',
    category: 'PATHOGENIC',
    name: 'Assumed de novo, but without genetic confirmation of paternity/maternity',
    defaultStrength: 'MODERATE',
    permittedStrengths: ['MODERATE', 'SUPPORTING'],
    applicabilityScope: 'De novo reported in patient without formal maternity/paternity identity testing.',
    requiredFields: ['unconfirmedDeNovoStatus'],
    exclusions: ['Genetically confirmed de novo (use PS2 instead)'],
    guidelineSource: 'ACMG/AMP 2015 PM6 Specification',
    explanationTemplate: {
      met: 'Reported de novo in patient with disease, but biological paternity and maternity are unconfirmed.',
      notMet: 'Parental testing confirmed inheritance or verified biological relationship.',
      notEvaluated: 'Family history uninformative.',
    },
  },

  // --- PATHOGENIC SUPPORTING ---
  PP1: {
    code: 'PP1',
    category: 'PATHOGENIC',
    name: 'Co-segregation with disease in multiple affected family members',
    defaultStrength: 'SUPPORTING',
    permittedStrengths: ['STRONG', 'MODERATE', 'SUPPORTING'],
    applicabilityScope: 'Pedigree segregation in affected family members across multiple generations.',
    requiredFields: ['segregationLogLOD'],
    exclusions: ['Single family member observations without segregation LOD score'],
    guidelineSource: 'ACMG/AMP 2015 & ClinGen SVI Segregation Guidance (Jarvik et al. 2019)',
    explanationTemplate: {
      met: 'Demonstrated co-segregation with disease across multiple affected family members (LOD > 1.5).',
      notMet: 'Lack of segregation or uninformative pedigree.',
      notEvaluated: 'Extended pedigree segregation data not provided.',
    },
  },

  PP2: {
    code: 'PP2',
    category: 'PATHOGENIC',
    name: 'Missense variant in a gene with low rate of benign missense variation',
    defaultStrength: 'SUPPORTING',
    permittedStrengths: ['SUPPORTING'],
    applicabilityScope: 'Gene constrained against missense variation (gnomAD z-score > 3.0 or oe < 0.35) where missense is primary disease mechanism.',
    requiredFields: ['consequence', 'geneSymbol'],
    exclusions: ['Genes tolerant to missense variation'],
    guidelineSource: 'ACMG/AMP 2015 PP2 Specification',
    explanationTemplate: {
      met: 'Missense variant in a gene intolerant to missense variation where missense is an established disease mechanism.',
      notMet: 'Gene is not constrained against missense variation or truncations are primary mechanism.',
      notEvaluated: 'Gene missense constraint scores not available.',
    },
  },

  PP3: {
    code: 'PP3',
    category: 'PATHOGENIC',
    name: 'Multiple lines of computational evidence support a deleterious effect',
    defaultStrength: 'SUPPORTING',
    permittedStrengths: ['SUPPORTING'],
    applicabilityScope: 'Concordant predictions from multiple independent algorithm families (e.g. CADD >= 20, PolyPhen-2 >= 0.85, SIFT <= 0.05, REVEL >= 0.75).',
    requiredFields: ['caddPhred', 'polyphenScore', 'siftScore'],
    exclusions: ['Discordant in silico tools or when functional data (PS3) is applied'],
    guidelineSource: 'ACMG/AMP 2015 & ClinGen In Silico SVI Working Group',
    explanationTemplate: {
      met: 'Concordant high-confidence computational tools (CADD, PolyPhen-2, SIFT, Phylop) predict damaging effect on protein structure/function.',
      notMet: 'Computational predictions are discordant, neutral, or below threshold.',
      notEvaluated: 'In silico prediction scores missing.',
    },
  },

  PP4: {
    code: 'PP4',
    category: 'PATHOGENIC',
    name: 'Patient phenotype or family history is highly specific for a single genetic etiology',
    defaultStrength: 'SUPPORTING',
    permittedStrengths: ['STRONG', 'MODERATE', 'SUPPORTING'],
    applicabilityScope: 'Pathognomonic clinical phenotype (e.g. Tuberous Sclerosis, Huntington, Fabry disease).',
    requiredFields: ['phenotypeHpoTerms'],
    exclusions: ['Nonspecific or heterogeneous phenotypes (e.g. general developmental delay)'],
    guidelineSource: 'ACMG/AMP 2015 PP4 Specification',
    explanationTemplate: {
      met: 'Patient presents with a pathognomonic phenotype highly specific for this gene.',
      notMet: 'Phenotype is broad, non-specific, or genetically heterogeneous.',
      notEvaluated: 'Detailed clinical phenotype unavailable.',
    },
  },

  PP5: {
    code: 'PP5',
    category: 'PATHOGENIC',
    name: 'Reputable source recently reports variant as pathogenic (External Assertion)',
    defaultStrength: 'SUPPORTING',
    permittedStrengths: ['SUPPORTING'],
    clinGenSviModified: true, // ClinGen SVI recommends NOT using PP5/BP6 as primary criteria when raw evidence is directly evaluable
    applicabilityScope: 'ClinVar 3/4-star expert panel or consensus assertion where underlying evidence is not directly available.',
    requiredFields: ['clinvarReviewStars', 'clinvarSignificance'],
    exclusions: ['Do not apply if independent criteria (PVS1, PS1, PM2, etc.) can be evaluated directly from underlying evidence.'],
    guidelineSource: 'ClinGen SVI Recommendation on PP5/BP6 Usage (Biesecker et al. 2018)',
    explanationTemplate: {
      met: 'External assertion from a reputable expert panel (ClinVar 3-4 stars) reports pathogenic without conflicting evidence.',
      notMet: 'No expert panel consensus assertion available or submissions are conflicting.',
      notEvaluated: 'External ClinVar expert panel records not searched.',
    },
  },

  // --- BENIGN STAND-ALONE ---
  BA1: {
    code: 'BA1',
    category: 'BENIGN',
    name: 'Allele frequency is >5% in population databases (gnomAD)',
    defaultStrength: 'STAND_ALONE',
    permittedStrengths: ['STAND_ALONE'],
    applicabilityScope: 'gnomAD PopMax or global allele frequency > 0.05 (5%) in any major population.',
    requiredFields: ['gnomadAfPopmax', 'gnomadAfGlobal'],
    exclusions: ['Populations with founder effects in severe early-onset recessive disease where high carrier frequency is documented'],
    guidelineSource: 'ACMG/AMP 2015 & ClinGen BA1 Guidance (Ghosh et al. 2018)',
    explanationTemplate: {
      met: 'Population allele frequency in gnomAD exceeds 5% threshold for stand-alone benign polymorphism.',
      notMet: 'Allele frequency is <= 5% in population controls.',
      notEvaluated: 'Population allele frequency data missing.',
    },
  },

  // --- BENIGN STRONG ---
  BS1: {
    code: 'BS1',
    category: 'BENIGN',
    name: 'Allele frequency is greater than expected for disorder',
    defaultStrength: 'STRONG',
    permittedStrengths: ['STRONG'],
    applicabilityScope: 'PopMax AF > disease prevalence / penetrance threshold (typically > 0.001 - 0.01 depending on disease).',
    requiredFields: ['gnomadAfPopmax'],
    exclusions: ['Diseases with low penetrance or variable expressivity'],
    guidelineSource: 'ACMG/AMP 2015 & Whiffin et al. 2017 Allele Frequency Threshold Calculator',
    explanationTemplate: {
      met: 'Allele frequency in gnomAD is significantly higher than expected for a penetrant Mendelian disorder.',
      notMet: 'Allele frequency is within expected range for pathogenic variants.',
      notEvaluated: 'Disease incidence and penetrance threshold not specified.',
    },
  },

  BS2: {
    code: 'BS2',
    category: 'BENIGN',
    name: 'Observed in a healthy adult individual for a fully penetrant dominant disorder',
    defaultStrength: 'STRONG',
    permittedStrengths: ['STRONG'],
    applicabilityScope: 'Homozygous in gnomAD for recessive disease or heterozygous in healthy control for fully penetrant dominant disease.',
    requiredFields: ['gnomadHomCount', 'isFullyPenetrant'],
    exclusions: ['Incomplete penetrance or late-onset disorders'],
    guidelineSource: 'ACMG/AMP 2015 BS2 Specification',
    explanationTemplate: {
      met: 'Observed in multiple healthy adult controls or homozygous state in population database for a fully penetrant condition.',
      notMet: 'Not observed in healthy controls or condition has age-dependent/incomplete penetrance.',
      notEvaluated: 'Control cohort phenotype details not available.',
    },
  },

  BS3: {
    code: 'BS3',
    category: 'BENIGN',
    name: 'Well-established in vitro or in vivo functional studies show no damaging effect',
    defaultStrength: 'STRONG',
    permittedStrengths: ['STRONG', 'SUPPORTING'],
    applicabilityScope: 'Validated functional assay showing normal wildtype-level protein function or splice integrity.',
    requiredFields: ['functionalAssayResult'],
    exclusions: ['Non-validated assays or assays that do not evaluate primary disease mechanism'],
    guidelineSource: 'ACMG/AMP 2015 & ClinGen SVI Functional Assay Guidance',
    explanationTemplate: {
      met: 'Validated in vitro or in vivo functional studies demonstrate normal wildtype activity or splicing.',
      notMet: 'Functional assays show abnormal function or ambiguous result.',
      notEvaluated: 'Functional assay data missing.',
    },
  },

  BS4: {
    code: 'BS4',
    category: 'BENIGN',
    name: 'Lack of segregation in affected members of a family',
    defaultStrength: 'STRONG',
    permittedStrengths: ['STRONG'],
    applicabilityScope: 'Variant absent in affected family members or present in non-penetrant individuals where non-penetrance is excluded.',
    requiredFields: ['pedigreeNonSegregation'],
    exclusions: ['Phenocopies or age-dependent penetrance confounding pedigree interpretation'],
    guidelineSource: 'ACMG/AMP 2015 BS4 Specification',
    explanationTemplate: {
      met: 'Demonstrated non-segregation in affected family members (variant absent in affected relative).',
      notMet: 'Variant co-segregates with disease or pedigree is uninformative.',
      notEvaluated: 'Pedigree non-segregation data unavailable.',
    },
  },

  // --- BENIGN SUPPORTING ---
  BP1: {
    code: 'BP1',
    category: 'BENIGN',
    name: 'Missense variant in a gene for which primarily truncating variants cause disease',
    defaultStrength: 'SUPPORTING',
    permittedStrengths: ['SUPPORTING'],
    applicabilityScope: 'Gene where loss-of-function/truncations are the only established mechanism and missense variants are non-pathogenic.',
    requiredFields: ['consequence', 'geneSymbol'],
    exclusions: ['Genes where missense variants are known pathogenic mechanisms'],
    guidelineSource: 'ACMG/AMP 2015 BP1 Specification',
    explanationTemplate: {
      met: 'Missense change in a gene where truncation/LOF is the sole mechanism of pathogenicity.',
      notMet: 'Missense alterations in this gene are established disease mechanisms.',
      notEvaluated: 'Gene pathogenic mechanism spectrum uncharacterized.',
    },
  },

  BP2: {
    code: 'BP2',
    category: 'BENIGN',
    name: 'Observed in trans with a pathogenic variant for a dominant gene or in cis in any mode',
    defaultStrength: 'SUPPORTING',
    permittedStrengths: ['SUPPORTING'],
    applicabilityScope: 'Co-occurs in cis with a pathogenic variant or in trans for a dominant disease.',
    requiredFields: ['coOccurringVariantPhase'],
    exclusions: ['Recessive compound heterozygous state (use PM3 instead)'],
    guidelineSource: 'ACMG/AMP 2015 BP2 Specification',
    explanationTemplate: {
      met: 'Observed in cis with a known pathogenic variant or in trans for a fully penetrant dominant disorder.',
      notMet: 'Not observed in cis with pathogenic variant.',
      notEvaluated: 'Phased co-occurrence data missing.',
    },
  },

  BP3: {
    code: 'BP3',
    category: 'BENIGN',
    name: 'In-frame deletions/insertions in a repetitive region without known function',
    defaultStrength: 'SUPPORTING',
    permittedStrengths: ['SUPPORTING'],
    applicabilityScope: 'In-frame indel occurring within a non-conserved, highly polymorphic tandem repeat region.',
    requiredFields: ['consequence', 'isRepeatRegion'],
    exclusions: ['Indels in conserved functional domains'],
    guidelineSource: 'ACMG/AMP 2015 BP3 Specification',
    explanationTemplate: {
      met: 'In-frame length alteration located within a non-conserved, highly repetitive region.',
      notMet: 'Indel occurs in a conserved non-repeat region.',
      notEvaluated: 'Repeat mask annotation missing.',
    },
  },

  BP4: {
    code: 'BP4',
    category: 'BENIGN',
    name: 'Multiple lines of computational evidence suggest no impact on gene or product',
    defaultStrength: 'SUPPORTING',
    permittedStrengths: ['SUPPORTING'],
    applicabilityScope: 'Concordant predictions from multiple algorithms (CADD < 12, PolyPhen-2 < 0.15, SIFT > 0.25).',
    requiredFields: ['caddPhred', 'polyphenScore', 'siftScore'],
    exclusions: ['Discordant predictions or when functional evidence (BS3) is met'],
    guidelineSource: 'ACMG/AMP 2015 & ClinGen SVI In Silico Group',
    explanationTemplate: {
      met: 'Multiple independent computational algorithms concordantly predict benign/tolerated effect.',
      notMet: 'Computational predictions suggest damaging impact or are discordant.',
      notEvaluated: 'In silico prediction scores missing.',
    },
  },

  BP5: {
    code: 'BP5',
    category: 'BENIGN',
    name: 'Variant found in a case with an alternate molecular basis for disease',
    defaultStrength: 'SUPPORTING',
    permittedStrengths: ['SUPPORTING'],
    applicabilityScope: 'Proband carries an independent pathogenic variant that fully explains the clinical phenotype.',
    requiredFields: ['alternateMolecularExplanation'],
    exclusions: ['Diseases with dual diagnosis, oligogenic inheritance, or overlapping phenotypes'],
    guidelineSource: 'ACMG/AMP 2015 BP5 Specification',
    explanationTemplate: {
      met: 'Proband carries a distinct confirmed pathogenic variant fully explaining the clinical phenotype.',
      notMet: 'No alternate pathogenic variant identified or phenotype is unexplained.',
      notEvaluated: 'Full exome/genome panel for proband unavailable.',
    },
  },

  BP6: {
    code: 'BP6',
    category: 'BENIGN',
    name: 'Reputable source recently reports variant as benign (External Assertion)',
    defaultStrength: 'SUPPORTING',
    permittedStrengths: ['SUPPORTING'],
    clinGenSviModified: true,
    applicabilityScope: 'ClinVar 3/4-star expert panel assertion reporting benign without conflicting submissions.',
    requiredFields: ['clinvarReviewStars', 'clinvarSignificance'],
    exclusions: ['Do not apply if independent primary evidence is available to perform evaluation.'],
    guidelineSource: 'ClinGen SVI Recommendation on BP6 Usage',
    explanationTemplate: {
      met: 'External assertion from a reputable expert panel (ClinVar 3-4 stars) reports benign.',
      notMet: 'No expert panel consensus assertion reporting benign.',
      notEvaluated: 'ClinVar expert panel assertions not searched.',
    },
  },

  BP7: {
    code: 'BP7',
    category: 'BENIGN',
    name: 'A synonymous variant for which splicing prediction algorithms predict no impact',
    defaultStrength: 'SUPPORTING',
    permittedStrengths: ['SUPPORTING'],
    applicabilityScope: 'Synonymous nucleotide substitution with no disruption of canonical splice sites or creation of cryptic splice sites.',
    requiredFields: ['consequence', 'isSpliceRegion'],
    exclusions: ['Synonymous variants affecting splice donor/acceptor or exonic splice enhancers'],
    guidelineSource: 'ACMG/AMP 2015 BP7 Specification',
    explanationTemplate: {
      met: 'Synonymous variant with no predicted impact on canonical splice sites or exonic splice enhancers.',
      notMet: 'Variant alters amino acid sequence or disrupts splice region.',
      notEvaluated: 'Splice site prediction algorithms missing.',
    },
  },
};
