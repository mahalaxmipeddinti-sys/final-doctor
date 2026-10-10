// src/services/trioService.ts
import {
  TrioMemberInput,
  TrioAnalysisData,
  InheritancePattern,
  NormalizedVariant,
} from '../types/genomics.ts';

export function determineTrioInheritance(
  child: TrioMemberInput,
  mother: TrioMemberInput,
  father: TrioMemberInput,
  variant?: NormalizedVariant
): {
  pattern: InheritancePattern;
  summary: string;
  acmgImplications: string[];
  overrides: Record<string, any>;
} {
  const childHasVariant = child.zygosity !== 'HOMOZYGOUS_REF_WILDTYPE';
  const motherHasVariant = mother.zygosity !== 'HOMOZYGOUS_REF_WILDTYPE' && mother.zygosity !== 'UNKNOWN';
  const fatherHasVariant = father.zygosity !== 'HOMOZYGOUS_REF_WILDTYPE' && father.zygosity !== 'UNKNOWN';

  const motherTested = mother.zygosity !== 'UNKNOWN';
  const fatherTested = father.zygosity !== 'UNKNOWN';

  let pattern: InheritancePattern = 'UNKNOWN_INHERITANCE';
  let summary = 'Inheritance pattern could not be definitively established with provided parental genotypes.';
  const acmgImplications: string[] = [];
  const overrides: Record<string, any> = {};

  if (!childHasVariant) {
    pattern = 'UNKNOWN_INHERITANCE';
    summary = 'Proband is homozygous wildtype (does not harbor the candidate variant).';
    return { pattern, summary, acmgImplications, overrides };
  }

  // 1. De Novo Scenario: Child positive, BOTH parents tested negative
  if (motherTested && !motherHasVariant && fatherTested && !fatherHasVariant) {
    pattern = 'DE_NOVO_CONFIRMED';
    summary = 'De novo variant confirmed: Variant is present in proband but absent in both biological parents (confirmed negative maternity & paternity).';
    acmgImplications.push(
      'ACMG PS2 (Strong): Confirmed de novo mutation in patient with disease and confirmed non-carrier parents.',
      'ACMG PM6 (Moderate): De novo classification upgrades overall Bayesian pathogenicity score.'
    );
    overrides.PS2 = {
      status: 'SUPPORTED',
      assignedStrength: 'STRONG',
      rationale: 'Confirmed de novo variant verified against non-carrier biological parents in trio evaluation.',
    };
  }
  // 2. Biparental Autosomal Recessive Scenario: Child Homozygous Alt, both parents Heterozygous Carriers
  else if (
    child.zygosity === 'HOMOZYGOUS_ALT' &&
    mother.zygosity === 'HETEROZYGOUS' &&
    father.zygosity === 'HETEROZYGOUS'
  ) {
    pattern = 'BIPARENTAL_RECESSIVE';
    summary = 'Biparental Autosomal Recessive inheritance: Both parents are asymptomatic heterozygous carriers; proband inherited biallelic copies.';
    acmgImplications.push(
      'ACMG PM3 (Moderate): Recessive disorder variant confirmed in trans from verified carrier parents.',
      'ACMG PP1 (Supporting): Co-segregates with expected recessive Mendelian transmission.'
    );
    overrides.PM3 = {
      status: 'SUPPORTED',
      assignedStrength: 'MODERATE',
      rationale: 'Observed as homozygous biallelic alteration in proband with confirmed heterozygous transmission from both parents.',
    };
  }
  // 3. Maternal Transmission
  else if (motherHasVariant && !fatherHasVariant) {
    if (variant?.chromosome === 'X' || variant?.chromosome === 'chrX') {
      pattern = 'X_LINKED_MATERNAL';
      summary = 'X-Linked Maternal transmission: Proband inherited the X-chromosomal alteration from maternal carrier.';
      acmgImplications.push('ACMG PP1 (Supporting): Segregates with maternal X-chromosome lineage.');
    } else {
      pattern = 'MATERNAL_TRANSMISSION';
      summary = `Maternally inherited: Variant transmitted from mother (${mother.zygosity.toLowerCase().replace('_', ' ')}).`;
      if (!mother.isAffected) {
        acmgImplications.push('Note: Asymptomatic maternal carrier may suggest incomplete penetrance, variable expressivity, or recessive carrier state.');
      }
    }
  }
  // 4. Paternal Transmission
  else if (fatherHasVariant && !motherHasVariant) {
    pattern = 'PATERNAL_TRANSMISSION';
    summary = `Paternally inherited: Variant transmitted from father (${father.zygosity.toLowerCase().replace('_', ' ')}).`;
    if (!father.isAffected) {
      acmgImplications.push('Note: Asymptomatic paternal carrier may indicate incomplete penetrance, variable expressivity, or recessive carrier state.');
    }
  }
  // 5. Both parents carry (and child heterozygous)
  else if (motherHasVariant && fatherHasVariant) {
    pattern = 'AUTOSOMAL_DOMINANT';
    summary = 'Familial transmission: Variant identified in both parental lineages or shared familial dominant susceptibility.';
    acmgImplications.push('ACMG PP1 (Supporting): Co-segregation across familial relatives.');
  }

  return { pattern, summary, acmgImplications, overrides };
}

export function buildTrioAnalysisData(
  child: TrioMemberInput,
  mother: TrioMemberInput,
  father: TrioMemberInput,
  variant?: NormalizedVariant,
  familyId?: string
): TrioAnalysisData {
  const { pattern, summary, acmgImplications } = determineTrioInheritance(child, mother, father, variant);

  const derivedFamilyId =
    familyId ||
    (child.sampleId ? `FAM-${child.sampleId.replace(/[^0-9A-Za-z]/g, '')}` : 'FAM-TRIO-2025');

  return {
    familyId: derivedFamilyId,
    child,
    mother,
    father,
    inheritancePattern: pattern,
    inheritanceSummary: summary,
    acmgImplications,
    pedigreeSummary: {
      childStatus: `${child.zygosity.replace('_', ' ')} • ${child.isAffected ? 'Affected' : 'Unaffected'}`,
      motherStatus: `${mother.zygosity.replace('_', ' ')} • ${mother.isAffected ? 'Affected' : 'Unaffected'}`,
      fatherStatus: `${father.zygosity.replace('_', ' ')} • ${father.isAffected ? 'Affected' : 'Unaffected'}`,
    },
  };
}

export function extractVariantFromReportText(text: string): {
  detectedId?: string;
  detectedHgvs?: string;
  detectedGene?: string;
  detectedZygosity?: 'HETEROZYGOUS' | 'HOMOZYGOUS_ALT' | 'HOMOZYGOUS_REF_WILDTYPE';
} {
  const result: {
    detectedId?: string;
    detectedHgvs?: string;
    detectedGene?: string;
    detectedZygosity?: 'HETEROZYGOUS' | 'HOMOZYGOUS_ALT' | 'HOMOZYGOUS_REF_WILDTYPE';
  } = {};

  // Check for ClinVar variation ID (e.g. ClinVar: 17661, ClinVar_17661, Variation ID 17661, or filename ID 17661)
  const clinvarMatch =
    text.match(/(?:clinvar|variation(?:\s+id)?|vcv)[:#_\s-]*([0-9]{4,8})/i) ||
    text.match(/(?:^|[^0-9])([0-9]{4,8})(?:[^0-9]|$)/);
  if (clinvarMatch) {
    result.detectedId = clinvarMatch[1];
  }

  // Check for HGVS (c.5266dupC, c.1799T>A, p.Val600Glu, etc.)
  const hgvsMatch = text.match(/(?:^|[^a-zA-Z0-9])(c\.[0-9]+[A-Za-z0-9_>+*delinsdup]+|p\.[A-Za-z]{3}[0-9]+[A-Za-z]{3,4})(?:$|[^a-zA-Z0-9])/i);
  if (hgvsMatch) {
    result.detectedHgvs = hgvsMatch[1];
  }

  // Check for common disease genes (accounting for underscores in filenames)
  const geneMatch = text.match(/(?:^|[^a-zA-Z0-9])(BRCA1|BRCA2|CFTR|BRAF|TP53|LDLR|SCN1A|KCNQ1|MYH7|EGFR|KRAS|PALB2|ATM|MLH1|MSH2)(?:$|[^a-zA-Z0-9])/i);
  if (geneMatch) {
    result.detectedGene = geneMatch[1].toUpperCase();
  }

  // Check for zygosity (accounting for underscores in filenames)
  if (/(?:^|[^a-zA-Z0-9])(heterozygous|carrier|het|0\/1)(?:$|[^a-zA-Z0-9])/i.test(text)) {
    result.detectedZygosity = 'HETEROZYGOUS';
  } else if (/(?:^|[^a-zA-Z0-9])(homozygous|hom|1\/1)(?:$|[^a-zA-Z0-9])/i.test(text)) {
    result.detectedZygosity = 'HOMOZYGOUS_ALT';
  } else if (/(?:^|[^a-zA-Z0-9])(wildtype|negative|normal|non-carrier|not detected|0\/0)(?:$|[^a-zA-Z0-9])/i.test(text)) {
    result.detectedZygosity = 'HOMOZYGOUS_REF_WILDTYPE';
  }

  return result;
}
