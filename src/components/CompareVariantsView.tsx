// src/components/CompareVariantsView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  FullAnalysisResult,
  ACMGCriterionEvaluation,
  TrioMemberInput,
  TrioZygosity,
  InheritancePattern,
} from '../types/genomics.ts';
import { BENCHMARK_VARIANTS } from '../services/benchmarkVariants.ts';
import { Trio3DVisualizer, Trio3DMemberData } from './Trio3DVisualizer.tsx';
import {
  Scale,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Download,
  Filter,
  Sparkles,
  Layers,
  Activity,
  Dna,
  ShieldCheck,
  Cpu,
  Database,
  ArrowUpRight,
  FileSpreadsheet,
  FileText,
  Printer,
  Star,
  Check,
  Users,
  User,
  GitCommit,
  GitBranch,
  Info,
  HelpCircle,
  RefreshCw,
  Box,
} from 'lucide-react';

async function fetchVariantAnalysis(input: string): Promise<FullAnalysisResult | null> {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, assembly: 'GRCh38' }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to analyze variant via API:', err);
  }
  return null;
}

// Format variant dropdown label
export function formatVariantDropdownLabel(item: any): string {
  const nv = item.normalizedVariant;
  const cv = item.clinvarRecord;
  const acmg = item.acmgEvaluation;

  const gene = nv?.geneSymbol || cv?.geneSymbol || '';
  const hgvs = nv?.hgvsc || cv?.hgvsNames?.[0] || nv?.normalizedRepresentation || item.variantInput || '';
  const clinvarId = cv?.variationId || (nv?.inputType === 'clinvar_id' ? nv.originalInput : null);

  let tier = 'Analyzed';
  if (acmg?.overallClassification) {
    if (acmg.overallClassification === 'UNCERTAIN_SIGNIFICANCE') tier = 'VUS';
    else if (acmg.overallClassification === 'LIKELY_PATHOGENIC') tier = 'Likely Pathogenic';
    else if (acmg.overallClassification === 'PATHOGENIC') tier = 'Pathogenic';
    else if (acmg.overallClassification === 'LIKELY_BENIGN') tier = 'Likely Benign';
    else if (acmg.overallClassification === 'BENIGN') tier = 'Benign';
    else tier = 'Unresolved';
  } else if (cv?.clinicalSignificance) {
    tier = cv.clinicalSignificance;
  }

  if (gene && hgvs) {
    const cleanHgvs = hgvs.includes(':') ? hgvs.split(':').pop() : hgvs;
    const idStr = clinvarId ? ` (ClinVar: ${clinvarId})` : '';
    return `${gene} ${cleanHgvs}${idStr} — ${tier}`;
  }

  return `${nv?.normalizedRepresentation || item.variantInput || 'Variant'} — ${tier}`;
}

interface CompareVariantsViewProps {
  onLoadVariantInWorkbench: (analysis: FullAnalysisResult) => void;
  preselectedA?: FullAnalysisResult | null;
  preselectedB?: FullAnalysisResult | null;
}

export const CompareVariantsView: React.FC<CompareVariantsViewProps> = ({
  onLoadVariantInWorkbench,
  preselectedA,
  preselectedB,
}) => {
  // Top Level View Mode: Dual Variant vs Family Trio
  const [viewMode, setViewMode] = useState<'dual' | 'trio'>('trio');

  // --- State for Dual Mode ---
  const [historyItems, setHistoryItems] = useState<FullAnalysisResult[]>([]);
  const [variantA, setVariantA] = useState<FullAnalysisResult | null>(preselectedA || null);
  const [variantB, setVariantB] = useState<FullAnalysisResult | null>(preselectedB || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [diffFilter, setDiffFilter] = useState<'DIVERGENT' | 'ALL' | 'CONCORDANT' | 'PATHOGENIC' | 'BENIGN'>('DIVERGENT');
  const [copiedMd, setCopiedMd] = useState(false);

  // --- State for Family Trio Mode ---
  const [trioGene, setTrioGene] = useState<string>('BRCA1');
  const [trioHgvs, setTrioHgvs] = useState<string>('c.5266dupC');
  const [trioClinVarId, setTrioClinVarId] = useState<string>('17661');

  const [trioChild, setTrioChild] = useState<Trio3DMemberData>({
    relationship: 'child',
    label: 'Proband (Child)',
    sampleId: 'CH-2026-01',
    geneSymbol: 'BRCA1',
    variantInput: 'c.5266dupC',
    zygosity: 'HETEROZYGOUS',
    isAffected: true,
    vaf: 49.8,
  });

  const [trioMother, setTrioMother] = useState<Trio3DMemberData>({
    relationship: 'mother',
    label: 'Mother (Maternal)',
    sampleId: 'MO-2026-01',
    geneSymbol: 'BRCA1',
    variantInput: 'Reference Wildtype',
    zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
    isAffected: false,
    vaf: 0.0,
  });

  const [trioFather, setTrioFather] = useState<Trio3DMemberData>({
    relationship: 'father',
    label: 'Father (Paternal)',
    sampleId: 'FA-2026-01',
    geneSymbol: 'BRCA1',
    variantInput: 'Reference Wildtype',
    zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
    isAffected: false,
    vaf: 0.0,
  });

  // Fetch initial history
  useEffect(() => {
    fetchHistoryAndDefaults();
  }, []);

  const fetchHistoryAndDefaults = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analyses');
      let items: FullAnalysisResult[] = [];
      if (res.ok) {
        items = await res.json();
      }
      setHistoryItems(items);

      if (!variantA) {
        if (items.length > 0) setVariantA(items[0]);
        else {
          const defA = await fetchVariantAnalysis('17661');
          if (defA) setVariantA(defA);
        }
      }

      if (!variantB) {
        if (items.length > 1) setVariantB(items[1]);
        else {
          const defB = await fetchVariantAnalysis('41662');
          if (defB) setVariantB(defB);
        }
      }
    } catch (err) {
      console.error('Error fetching variants for comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const deduplicatedHistory = useMemo(() => {
    const seen = new Set<string>();
    const unique: FullAnalysisResult[] = [];

    for (const item of historyItems) {
      const key = (
        item.normalizedVariant?.normalizedRepresentation ||
        item.normalizedVariant?.originalInput ||
        (item as any).variantInput ||
        item.analysisId
      ).toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }
    return unique;
  }, [historyItems]);

  const handleSelectA = async (idOrInput: string) => {
    const existing = historyItems.find((h) => h.analysisId === idOrInput || h.normalizedVariant.originalInput === idOrInput);
    if (existing) {
      setVariantA(existing);
    } else {
      setLoading(true);
      try {
        const generated = await fetchVariantAnalysis(idOrInput);
        if (generated) setVariantA(generated);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectB = async (idOrInput: string) => {
    const existing = historyItems.find((h) => h.analysisId === idOrInput || h.normalizedVariant.originalInput === idOrInput);
    if (existing) {
      setVariantB(existing);
    } else {
      setLoading(true);
      try {
        const generated = await fetchVariantAnalysis(idOrInput);
        if (generated) setVariantB(generated);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSwap = () => {
    const temp = variantA;
    setVariantA(variantB);
    setVariantB(temp);
  };

  // --- Family Trio Presets Loader ---
  const loadTrioPreset = (presetKey: 'de_novo' | 'recessive' | 'benign_normal' | 'maternal' | 'wildtype_ref') => {
    if (presetKey === 'de_novo') {
      setTrioGene('BRCA1');
      setTrioHgvs('c.5266dupC (p.Gln1756Profs*74)');
      setTrioClinVarId('17661');

      setTrioChild({
        relationship: 'child',
        label: 'Proband (Child)',
        sampleId: 'CH-2026-DN',
        geneSymbol: 'BRCA1',
        variantInput: 'c.5266dupC',
        zygosity: 'HETEROZYGOUS',
        isAffected: true,
        vaf: 50.1,
      });
      setTrioMother({
        relationship: 'mother',
        label: 'Mother (Maternal)',
        sampleId: 'MO-2026-DN',
        geneSymbol: 'BRCA1',
        variantInput: 'Reference Wildtype',
        zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
        isAffected: false,
        vaf: 0.0,
      });
      setTrioFather({
        relationship: 'father',
        label: 'Father (Paternal)',
        sampleId: 'FA-2026-DN',
        geneSymbol: 'BRCA1',
        variantInput: 'Reference Wildtype',
        zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
        isAffected: false,
        vaf: 0.0,
      });
    } else if (presetKey === 'recessive') {
      setTrioGene('CFTR');
      setTrioHgvs('c.1521_1523delCTT (p.Phe508del)');
      setTrioClinVarId('7105');

      setTrioChild({
        relationship: 'child',
        label: 'Proband (Child)',
        sampleId: 'CH-2026-CF',
        geneSymbol: 'CFTR',
        variantInput: 'p.Phe508del',
        zygosity: 'HOMOZYGOUS_ALT',
        isAffected: true,
        vaf: 99.4,
      });
      setTrioMother({
        relationship: 'mother',
        label: 'Mother (Maternal)',
        sampleId: 'MO-2026-CF',
        geneSymbol: 'CFTR',
        variantInput: 'p.Phe508del (Carrier)',
        zygosity: 'HETEROZYGOUS',
        isAffected: false,
        vaf: 48.9,
      });
      setTrioFather({
        relationship: 'father',
        label: 'Father (Paternal)',
        sampleId: 'FA-2026-CF',
        geneSymbol: 'CFTR',
        variantInput: 'p.Phe508del (Carrier)',
        zygosity: 'HETEROZYGOUS',
        isAffected: false,
        vaf: 51.2,
      });
    } else if (presetKey === 'benign_normal') {
      setTrioGene('BRCA1');
      setTrioHgvs('c.3548A>G (p.Lys1183Arg)');
      setTrioClinVarId('41662');

      setTrioChild({
        relationship: 'child',
        label: 'Proband (Child)',
        sampleId: 'CH-2026-NORM',
        geneSymbol: 'BRCA1',
        variantInput: 'c.3548A>G',
        zygosity: 'HETEROZYGOUS',
        isAffected: false,
        vaf: 49.5,
      });
      setTrioMother({
        relationship: 'mother',
        label: 'Mother (Maternal)',
        sampleId: 'MO-2026-NORM',
        geneSymbol: 'BRCA1',
        variantInput: 'c.3548A>G',
        zygosity: 'HETEROZYGOUS',
        isAffected: false,
        vaf: 50.2,
      });
      setTrioFather({
        relationship: 'father',
        label: 'Father (Paternal)',
        sampleId: 'FA-2026-NORM',
        geneSymbol: 'BRCA1',
        variantInput: 'c.3548A>G',
        zygosity: 'HOMOZYGOUS_ALT',
        isAffected: false,
        vaf: 98.7,
      });
    } else if (presetKey === 'maternal') {
      setTrioGene('BRAF');
      setTrioHgvs('c.1799T>A (p.Val600Glu)');
      setTrioClinVarId('13961');

      setTrioChild({
        relationship: 'child',
        label: 'Proband (Child)',
        sampleId: 'CH-2026-MAT',
        geneSymbol: 'BRAF',
        variantInput: 'p.Val600Glu',
        zygosity: 'HETEROZYGOUS',
        isAffected: true,
        vaf: 48.7,
      });
      setTrioMother({
        relationship: 'mother',
        label: 'Mother (Maternal)',
        sampleId: 'MO-2026-MAT',
        geneSymbol: 'BRAF',
        variantInput: 'p.Val600Glu',
        zygosity: 'HETEROZYGOUS',
        isAffected: true,
        vaf: 51.0,
      });
      setTrioFather({
        relationship: 'father',
        label: 'Father (Paternal)',
        sampleId: 'FA-2026-MAT',
        geneSymbol: 'BRAF',
        variantInput: 'Reference Wildtype',
        zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
        isAffected: false,
        vaf: 0.0,
      });
    } else if (presetKey === 'wildtype_ref') {
      setTrioGene('HBB');
      setTrioHgvs('Reference Normal Genotype');
      setTrioClinVarId('WT-001');

      setTrioChild({
        relationship: 'child',
        label: 'Proband (Child)',
        sampleId: 'CH-2026-WT',
        geneSymbol: 'HBB',
        variantInput: 'Reference Wildtype (0/0)',
        zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
        isAffected: false,
        vaf: 0.0,
      });
      setTrioMother({
        relationship: 'mother',
        label: 'Mother (Maternal)',
        sampleId: 'MO-2026-WT',
        geneSymbol: 'HBB',
        variantInput: 'Reference Wildtype (0/0)',
        zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
        isAffected: false,
        vaf: 0.0,
      });
      setTrioFather({
        relationship: 'father',
        label: 'Father (Paternal)',
        sampleId: 'FA-2026-WT',
        geneSymbol: 'HBB',
        variantInput: 'Reference Wildtype (0/0)',
        zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
        isAffected: false,
        vaf: 0.0,
      });
    }
  };

  // Compute Mendelian Inheritance Call & Pathogenicity Verdict for Family Trio
  const trioAnalysisResult = useMemo(() => {
    const cHet = trioChild.zygosity === 'HETEROZYGOUS';
    const cHomAlt = trioChild.zygosity === 'HOMOZYGOUS_ALT';
    const cWild = trioChild.zygosity === 'HOMOZYGOUS_REF_WILDTYPE';

    const mHet = trioMother.zygosity === 'HETEROZYGOUS';
    const mHomAlt = trioMother.zygosity === 'HOMOZYGOUS_ALT';
    const mWild = trioMother.zygosity === 'HOMOZYGOUS_REF_WILDTYPE';

    const fHet = trioFather.zygosity === 'HETEROZYGOUS';
    const fHomAlt = trioFather.zygosity === 'HOMOZYGOUS_ALT';
    const fWild = trioFather.zygosity === 'HOMOZYGOUS_REF_WILDTYPE';

    // 1. Check if it's a known Benign / Common Normal Variant (e.g. preset or non-affected common variant)
    const isBenignPolymorphism = trioClinVarId === '41662' || trioHgvs.includes('c.3548A>G') || trioHgvs.includes('synonymous');

    if (cWild) {
      return {
        inheritanceCall: 'NORMAL REFERENCE GENOTYPE',
        pathogenicityVerdict: 'NORMAL_WILDTYPE' as const,
        verdictTitle: 'Normal Reference Result — No Genetic Mutation Detected',
        verdictDescription:
          'The proband carries the homozygous reference allele (0/0) matching the human genome reference assembly. No pathogenic sequence alteration or disease-causing mutation is present.',
        acmgRulesTriggered: ['BA1 (Stand-alone Benign)'],
        isGeneticallyDistinct: false,
        matchStatus: 'FULL_MATCH_NORMAL',
        diseaseStatus: 'Normal / Non-Genetic Disease',
      };
    }

    if (isBenignPolymorphism) {
      return {
        inheritanceCall: 'SHARED FAMILIAL POLYMORPHISM',
        pathogenicityVerdict: 'NORMAL_VARIANT_BENIGN' as const,
        verdictTitle: 'Normal Common Genomic Variant / Non-Disease Polymorphism',
        verdictDescription:
          'This variant is present across the population and shared among family members without clinical pathology. Classified by ClinVar/ACMG as Benign / Likely Benign (Non-disease-causing).',
        acmgRulesTriggered: ['BS1 (High Allele Frequency)', 'BS2 (Observed in Healthy Controls)'],
        isGeneticallyDistinct: false,
        matchStatus: 'SHARED_COMMON_VARIANT',
        diseaseStatus: 'Normal Variant / Benign Non-Disease',
      };
    }

    // 2. De Novo Mutation (Child has variant, both parents wildtype)
    if ((cHet || cHomAlt) && mWild && fWild) {
      return {
        inheritanceCall: 'DE NOVO CONFIRMED (NEW MUTATION)',
        pathogenicityVerdict: 'PATHOGENIC_DE_NOVO' as const,
        verdictTitle: 'Genetically Distinct De Novo Mutation — High Pathogenic Risk',
        verdictDescription:
          'The proband carries a sequence variant that is completely ABSENT in both biological parents (0/0). This represents a newly arisen de novo germline mutation and triggers ACMG Strong evidence criterion PS2 / PM6.',
        acmgRulesTriggered: ['PS2 (De Novo Confirmed with Paternity/Maternity)', 'PM2 (Absent from Population Controls)'],
        isGeneticallyDistinct: true,
        matchStatus: 'NO_PARENTAL_MATCH_DE_NOVO',
        diseaseStatus: 'Genetically Distinct / Pathogenic Disease Risk',
      };
    }

    // 3. Autosomal Recessive Biparental Transmission (Child Hom Alt, both parents Het)
    if (cHomAlt && (mHet || mHomAlt) && (fHet || fHomAlt)) {
      return {
        inheritanceCall: 'BIPARENTAL AUTOSOMAL RECESSIVE TRANSMISSION',
        pathogenicityVerdict: 'INHERITED_PATHOGENIC' as const,
        verdictTitle: 'Inherited Autosomal Recessive Disease State',
        verdictDescription:
          'The proband inherited 1 mutant allele from the mother and 1 mutant allele from the father, establishing biallelic homozygous disease status (triggers ACMG PM3 criterion). Both biological parents are unaffected heterozygous carriers.',
        acmgRulesTriggered: ['PM3 (In Trans with Pathogenic Variant)', 'PVS1/PM2'],
        isGeneticallyDistinct: false,
        matchStatus: 'BIPARENTAL_MATCH_RECESSIVE',
        diseaseStatus: 'Genetically Affected / Recessive Disease',
      };
    }

    // 4. Maternal Transmission
    if ((cHet || cHomAlt) && (mHet || mHomAlt) && fWild) {
      return {
        inheritanceCall: 'MATERNAL TRANSMISSION (INHERITED FROM MOTHER)',
        pathogenicityVerdict: trioChild.isAffected ? ('INHERITED_PATHOGENIC' as const) : ('CARRIER_STATE' as const),
        verdictTitle: trioChild.isAffected ? 'Inherited Maternal Pathogenic Variant' : 'Maternal Heterozygous Variant (Carrier)',
        verdictDescription:
          'Variant allele is shared between proband and mother, while father carries the homozygous wildtype allele. Pathogenicity depends on gene penetrance and autosomal dominant vs carrier state.',
        acmgRulesTriggered: ['PP1 (Familial Co-segregation)'],
        isGeneticallyDistinct: false,
        matchStatus: 'MATERNAL_ONLY_MATCH',
        diseaseStatus: trioChild.isAffected ? 'Inherited Affected State' : 'Carrier State / Non-Manifesting',
      };
    }

    // 5. Paternal Transmission
    if ((cHet || cHomAlt) && mWild && (fHet || fHomAlt)) {
      return {
        inheritanceCall: 'PATERNAL TRANSMISSION (INHERITED FROM FATHER)',
        pathogenicityVerdict: trioChild.isAffected ? ('INHERITED_PATHOGENIC' as const) : ('CARRIER_STATE' as const),
        verdictTitle: trioChild.isAffected ? 'Inherited Paternal Pathogenic Variant' : 'Paternal Heterozygous Variant (Carrier)',
        verdictDescription:
          'Variant allele is shared between proband and father, while mother carries the homozygous wildtype allele. Pathogenicity corresponds to paternal allele co-segregation.',
        acmgRulesTriggered: ['PP1 (Familial Co-segregation)'],
        isGeneticallyDistinct: false,
        matchStatus: 'PATERNAL_ONLY_MATCH',
        diseaseStatus: trioChild.isAffected ? 'Inherited Affected State' : 'Carrier State / Non-Manifesting',
      };
    }

    // Default fallback
    return {
      inheritanceCall: 'INDETERMINATE / SHARED VARIANT',
      pathogenicityVerdict: 'NORMAL_VARIANT_BENIGN' as const,
      verdictTitle: 'Shared Familial Allele — Non-Conclusive Disease Association',
      verdictDescription:
        'Variant is present in proband and one or more parents without meeting classic Mendelian de novo or recessive diagnostic criteria. Evaluate in-silico frequency and ClinVar assertions.',
      acmgRulesTriggered: ['BS2 (Observed in Healthy Controls)'],
      isGeneticallyDistinct: false,
      matchStatus: 'PARTIAL_MATCH',
      diseaseStatus: 'Normal Variant / Benign Polymorphism',
    };
  }, [trioChild, trioMother, trioFather, trioClinVarId, trioHgvs]);

  // Helper colors for dual ACMG comparison
  const getACMGColor = (tier: string = '') => {
    switch (tier) {
      case 'PATHOGENIC':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/80';
      case 'LIKELY_PATHOGENIC':
        return 'text-orange-400 bg-orange-950/60 border-orange-800/80';
      case 'BENIGN':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
      case 'LIKELY_BENIGN':
        return 'text-teal-400 bg-teal-950/60 border-teal-800/80';
      case 'UNCERTAIN_SIGNIFICANCE':
      default:
        return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
    }
  };

  const criteriaCodes = variantA?.acmgEvaluation
    ? Object.keys(variantA.acmgEvaluation.criteriaEvaluations)
    : variantB?.acmgEvaluation
    ? Object.keys(variantB.acmgEvaluation.criteriaEvaluations)
    : [];

  const filteredCriteria = criteriaCodes.filter((code) => {
    const evA = variantA?.acmgEvaluation?.criteriaEvaluations?.[code];
    const evB = variantB?.acmgEvaluation?.criteriaEvaluations?.[code];
    const aSupported = evA?.status === 'SUPPORTED';
    const bSupported = evB?.status === 'SUPPORTED';
    const category = evA?.category || evB?.category;

    if (diffFilter === 'DIVERGENT') return aSupported !== bSupported;
    if (diffFilter === 'CONCORDANT') return aSupported && bSupported;
    if (diffFilter === 'PATHOGENIC') return category === 'PATHOGENIC';
    if (diffFilter === 'BENIGN') return category === 'BENIGN';
    return true;
  });

  const scoreA = variantA?.acmgEvaluation?.bayesianScore ?? 0;
  const scoreB = variantB?.acmgEvaluation?.bayesianScore ?? 0;
  const deltaScore = scoreA - scoreB;

  const mlProbA = variantA?.mlPrediction?.calibratedProbability ?? 0;
  const mlProbB = variantB?.mlPrediction?.calibratedProbability ?? 0;
  const deltaMl = Math.abs(mlProbA - mlProbB);

  const tierA = variantA?.acmgEvaluation?.overallClassification;
  const tierB = variantB?.acmgEvaluation?.overallClassification;
  const isTierConcordant = tierA && tierB && tierA === tierB;

  // CSV Export for Dual or Trio
  const handleExportCsv = () => {
    if (viewMode === 'trio') {
      const headers = ['Family Member', 'Role', 'Sample ID', 'Gene', 'Variant Input', 'Zygosity', 'Clinical Status', 'VAF %'];
      const rows = [
        ['Proband', 'Child', trioChild.sampleId, trioGene, trioHgvs, trioChild.zygosity, trioChild.isAffected ? 'Affected' : 'Unaffected', `${trioChild.vaf}%`],
        ['Mother', 'Maternal', trioMother.sampleId, trioGene, trioMother.variantInput, trioMother.zygosity, trioMother.isAffected ? 'Affected' : 'Unaffected', `${trioMother.vaf}%`],
        ['Father', 'Paternal', trioFather.sampleId, trioGene, trioFather.variantInput, trioFather.zygosity, trioFather.isAffected ? 'Affected' : 'Unaffected', `${trioFather.vaf}%`],
      ];
      const csv = [
        `# DNA DOCTOR FAMILY TRIO VARIANT SEGREGATION REPORT`,
        `Mendelian Call,${trioAnalysisResult.inheritanceCall}`,
        `Verdict,${trioAnalysisResult.verdictTitle}`,
        `Disease Status,${trioAnalysisResult.diseaseStatus}`,
        '',
        headers.join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DNADoctor_FamilyTrio_Segregation_${trioGene}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    if (!variantA || !variantB) return;
    const labelA = `${variantA.normalizedVariant.geneSymbol || 'VarA'}_${variantA.normalizedVariant.hgvsc || variantA.normalizedVariant.originalInput}`;
    const labelB = `${variantB.normalizedVariant.geneSymbol || 'VarB'}_${variantB.normalizedVariant.hgvsc || variantB.normalizedVariant.originalInput}`;

    const headers = ['Criterion Code', 'Description', 'Category', 'Assigned Strength', `Variant A Status`, `Variant B Status`, 'Diff State'];
    const rows = criteriaCodes.map((code) => {
      const evA = variantA.acmgEvaluation?.criteriaEvaluations?.[code];
      const evB = variantB.acmgEvaluation?.criteriaEvaluations?.[code];
      const aSup = evA?.status === 'SUPPORTED' ? 'SUPPORTED' : 'NOT MET';
      const bSup = evB?.status === 'SUPPORTED' ? 'SUPPORTED' : 'NOT MET';
      const diffState = aSup === bSup ? (aSup === 'SUPPORTED' ? 'Shared Both' : 'Neither') : aSup === 'SUPPORTED' ? 'A Only' : 'B Only';
      return [code, `"${(evA?.shortDescription || '').replace(/"/g, '""')}"`, evA?.category || 'PATHOGENIC', evA?.assignedStrength || 'STANDARD', aSup, bSup, diffState].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DNADoctor_ACMG_Comparison_${labelA}_vs_${labelB}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 mt-4">
      {/* View Mode Selector Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Scale className="h-5 w-5 text-teal-400" />
              <span>Comparative Genomic Analysis Workbench</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare family trios (Child vs Mother vs Father) with 3D transmission models, or perform side-by-side ACMG criterion dissonance comparisons.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('trio')}
              className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-2 transition-all ${
                viewMode === 'trio'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Family Trio (Child / Mother / Father)</span>
            </button>

            <button
              onClick={() => setViewMode('dual')}
              className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center space-x-2 transition-all ${
                viewMode === 'dual'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitBranch className="h-4 w-4" />
              <span>Dual Variant Comparison (A vs B)</span>
            </button>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 text-[11px] flex items-center space-x-2">
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            <span>
              {viewMode === 'trio'
                ? 'Active Analysis: Familial Mendelian Segregation & De Novo Differentiation'
                : 'Active Analysis: 28-Criterion ACMG Evidence Dissonance Matrix'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-teal-950 hover:bg-teal-900 text-teal-200 border border-teal-800/80 flex items-center space-x-1 transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-teal-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: FAMILY TRIO GENETIC COMPARISON (CHILD vs MOTHER vs FATHER)         */}
      {/* ========================================================================= */}
      {viewMode === 'trio' && (
        <div className="space-y-6">
          {/* Trio Clinical Presets Loader Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold uppercase text-slate-300 flex items-center space-x-1.5">
              <Sparkles className="h-4 w-4 text-teal-400" />
              <span>1-Click Familial Trio Benchmark Cases:</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => loadTrioPreset('de_novo')}
                className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800/80 flex items-center space-x-1.5 transition-colors font-medium"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                <span>1. De Novo Mutation (BRCA1 - High Disease Risk)</span>
              </button>

              <button
                onClick={() => loadTrioPreset('recessive')}
                className="px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-800/80 flex items-center space-x-1.5 transition-colors font-medium"
              >
                <Users className="h-3.5 w-3.5 text-indigo-400" />
                <span>2. Biparental Recessive (CFTR F508del Hom)</span>
              </button>

              <button
                onClick={() => loadTrioPreset('benign_normal')}
                className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-800/80 flex items-center space-x-1.5 transition-colors font-medium"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>3. Normal Variant / Benign Polymorphism (BRCA1 c.3548A&gt;G)</span>
              </button>

              <button
                onClick={() => loadTrioPreset('maternal')}
                className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-800/80 flex items-center space-x-1.5 transition-colors font-medium"
              >
                <Dna className="h-3.5 w-3.5 text-purple-400" />
                <span>4. Maternal Inherited Pathogenic (BRAF V600E)</span>
              </button>

              <button
                onClick={() => loadTrioPreset('wildtype_ref')}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center space-x-1.5 transition-colors font-medium"
              >
                <Check className="h-3.5 w-3.5 text-teal-400" />
                <span>5. Normal Wildtype Genome (HBB 0/0 No Disease)</span>
              </button>
            </div>
          </div>

          {/* Interactive Trio Input Controls Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center space-x-2">
                <Dna className="h-4 w-4 text-teal-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Target Locus &amp; Member Allele Parameters
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Target Gene:</span>
                <input
                  type="text"
                  value={trioGene}
                  onChange={(e) => {
                    const g = e.target.value.toUpperCase();
                    setTrioGene(g);
                    setTrioChild((prev) => ({ ...prev, geneSymbol: g }));
                    setTrioMother((prev) => ({ ...prev, geneSymbol: g }));
                    setTrioFather((prev) => ({ ...prev, geneSymbol: g }));
                  }}
                  className="bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-teal-300 px-2 py-1 rounded w-24"
                />
                <span className="text-xs text-slate-400 ml-2">cDNA / HGVS:</span>
                <input
                  type="text"
                  value={trioHgvs}
                  onChange={(e) => setTrioHgvs(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 px-2 py-1 rounded w-48"
                />
              </div>
            </div>

            {/* Grid for Child, Mother, Father Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Proband (Child) Controls */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-teal-500/40 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-teal-300 font-mono flex items-center space-x-1">
                    <User className="h-3.5 w-3.5 text-teal-400" />
                    <span>CHILD / PROBAND</span>
                  </span>
                  <label className="flex items-center space-x-1 text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={trioChild.isAffected}
                      onChange={(e) => setTrioChild((prev) => ({ ...prev, isAffected: e.target.checked }))}
                      className="rounded border-slate-800 text-teal-500 focus:ring-teal-500"
                    />
                    <span>Affected</span>
                  </label>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Genotype / Zygosity:</span>
                    <select
                      value={trioChild.zygosity}
                      onChange={(e) => setTrioChild((prev) => ({ ...prev, zygosity: e.target.value as TrioZygosity }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                    >
                      <option value="HETEROZYGOUS">0/1 (Heterozygous Mutant)</option>
                      <option value="HOMOZYGOUS_ALT">1/1 (Homozygous Alt)</option>
                      <option value="HOMOZYGOUS_REF_WILDTYPE">0/0 (Wildtype Normal)</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Variant Allele Fraction (VAF %):</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={trioChild.vaf || 0}
                        onChange={(e) => setTrioChild((prev) => ({ ...prev, vaf: parseFloat(e.target.value) }))}
                        className="w-full accent-teal-400"
                      />
                      <span className="text-xs font-mono text-teal-300 w-10">{trioChild.vaf}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mother Controls */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-purple-500/40 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-purple-300 font-mono flex items-center space-x-1">
                    <User className="h-3.5 w-3.5 text-purple-400" />
                    <span>MOTHER (MATERNAL)</span>
                  </span>
                  <label className="flex items-center space-x-1 text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={trioMother.isAffected}
                      onChange={(e) => setTrioMother((prev) => ({ ...prev, isAffected: e.target.checked }))}
                      className="rounded border-slate-800 text-purple-500 focus:ring-purple-500"
                    />
                    <span>Affected</span>
                  </label>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Genotype / Zygosity:</span>
                    <select
                      value={trioMother.zygosity}
                      onChange={(e) => setTrioMother((prev) => ({ ...prev, zygosity: e.target.value as TrioZygosity }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                    >
                      <option value="HOMOZYGOUS_REF_WILDTYPE">0/0 (Wildtype Normal)</option>
                      <option value="HETEROZYGOUS">0/1 (Heterozygous Carrier)</option>
                      <option value="HOMOZYGOUS_ALT">1/1 (Homozygous Alt)</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Variant Allele Fraction (VAF %):</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={trioMother.vaf || 0}
                        onChange={(e) => setTrioMother((prev) => ({ ...prev, vaf: parseFloat(e.target.value) }))}
                        className="w-full accent-purple-400"
                      />
                      <span className="text-xs font-mono text-purple-300 w-10">{trioMother.vaf}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Father Controls */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-sky-500/40 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-sky-300 font-mono flex items-center space-x-1">
                    <User className="h-3.5 w-3.5 text-sky-400" />
                    <span>FATHER (PATERNAL)</span>
                  </span>
                  <label className="flex items-center space-x-1 text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={trioFather.isAffected}
                      onChange={(e) => setTrioFather((prev) => ({ ...prev, isAffected: e.target.checked }))}
                      className="rounded border-slate-800 text-sky-500 focus:ring-sky-500"
                    />
                    <span>Affected</span>
                  </label>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Genotype / Zygosity:</span>
                    <select
                      value={trioFather.zygosity}
                      onChange={(e) => setTrioFather((prev) => ({ ...prev, zygosity: e.target.value as TrioZygosity }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                    >
                      <option value="HOMOZYGOUS_REF_WILDTYPE">0/0 (Wildtype Normal)</option>
                      <option value="HETEROZYGOUS">0/1 (Heterozygous Carrier)</option>
                      <option value="HOMOZYGOUS_ALT">1/1 (Homozygous Alt)</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Variant Allele Fraction (VAF %):</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={trioFather.vaf || 0}
                        onChange={(e) => setTrioFather((prev) => ({ ...prev, vaf: parseFloat(e.target.value) }))}
                        className="w-full accent-sky-400"
                      />
                      <span className="text-xs font-mono text-sky-300 w-10">{trioFather.vaf}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3D Spatial Representation Canvas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Box className="h-4 w-4 text-teal-400" />
                <span>3D Spatial Family Pedigree &amp; Transmission Canvas</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Interactive WebGL model • Orbit, zoom, and trace transmission particle flows
              </span>
            </div>

            <Trio3DVisualizer
              child={trioChild}
              mother={trioMother}
              father={trioFather}
              geneSymbol={trioGene}
              variantHgvs={trioHgvs}
              inheritanceCall={trioAnalysisResult.inheritanceCall}
              pathogenicityVerdict={trioAnalysisResult.pathogenicityVerdict}
              verdictDescription={trioAnalysisResult.verdictDescription}
            />
          </div>

          {/* Professional Clinical Genetic Verdict Banner */}
          <div
            className={`p-5 rounded-2xl border shadow-xl backdrop-blur ${
              trioAnalysisResult.pathogenicityVerdict === 'PATHOGENIC_DE_NOVO'
                ? 'bg-rose-950/40 border-rose-600/50 text-rose-100'
                : trioAnalysisResult.pathogenicityVerdict === 'INHERITED_PATHOGENIC'
                ? 'bg-amber-950/40 border-amber-600/50 text-amber-100'
                : trioAnalysisResult.pathogenicityVerdict === 'CARRIER_STATE'
                ? 'bg-purple-950/40 border-purple-600/50 text-purple-100'
                : 'bg-emerald-950/40 border-emerald-600/50 text-emerald-100'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border bg-slate-900/80">
                    Clinical Genetic Classification
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {trioGene} {trioHgvs}
                  </span>
                </div>

                <h3 className="text-lg font-bold flex items-center space-x-2">
                  {trioAnalysisResult.pathogenicityVerdict === 'PATHOGENIC_DE_NOVO' ? (
                    <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  )}
                  <span>{trioAnalysisResult.verdictTitle}</span>
                </h3>

                <p className="text-xs leading-relaxed opacity-90">
                  {trioAnalysisResult.verdictDescription}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-300">Triggered ACMG Guidelines:</span>
                  {trioAnalysisResult.acmgRulesTriggered.map((rule, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-teal-300 font-mono text-[11px]"
                    >
                      {rule}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status Badge Box */}
              <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800/80 space-y-1 text-right min-w-[200px]">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Inheritance Call:
                </span>
                <span className="text-xs font-bold font-mono text-teal-300 block">
                  {trioAnalysisResult.inheritanceCall}
                </span>

                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold pt-2">
                  Pathogenicity Category:
                </span>
                <span
                  className={`text-xs font-bold block ${
                    trioAnalysisResult.isGeneticallyDistinct
                      ? 'text-rose-400'
                      : trioAnalysisResult.pathogenicityVerdict === 'NORMAL_VARIANT_BENIGN' || trioAnalysisResult.pathogenicityVerdict === 'NORMAL_WILDTYPE'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {trioAnalysisResult.diseaseStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Familial Segregation & ACMG Dissonance Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-1.5">
                  <Users className="h-4 w-4 text-teal-400" />
                  <span>Familial Genotype &amp; Allele Comparison Matrix</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Side-by-side comparison of Child, Mother, and Father genotypes, read depths, VAFs, and ACMG co-segregation status.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Family Member</th>
                    <th className="py-3 px-4 font-semibold">Sample ID</th>
                    <th className="py-3 px-4 font-semibold">Genotype Call</th>
                    <th className="py-3 px-4 font-semibold">Variant Allele Fraction</th>
                    <th className="py-3 px-4 font-semibold">Clinical Phenotype</th>
                    <th className="py-3 px-4 font-semibold">Parental Match / Origin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {/* Proband Row */}
                  <tr className="bg-teal-950/20 hover:bg-teal-950/30">
                    <td className="py-3 px-4 font-bold text-teal-300 flex items-center space-x-1.5">
                      <User className="h-3.5 w-3.5 text-teal-400" />
                      <span>Proband (Child)</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{trioChild.sampleId}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">
                      {trioChild.zygosity === 'HETEROZYGOUS' ? '0/1 (Heterozygous)' : trioChild.zygosity === 'HOMOZYGOUS_ALT' ? '1/1 (Homozygous Alt)' : '0/0 (Wildtype)'}
                    </td>
                    <td className="py-3 px-4 font-mono text-teal-300">{trioChild.vaf}% VAF</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${trioChild.isAffected ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-400'}`}>
                        {trioChild.isAffected ? 'Affected Phenotype' : 'Unaffected'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-teal-300">
                      {trioAnalysisResult.isGeneticallyDistinct ? 'De Novo (New Mutation)' : 'Shared / Inherited Allele'}
                    </td>
                  </tr>

                  {/* Mother Row */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-purple-300 flex items-center space-x-1.5">
                      <User className="h-3.5 w-3.5 text-purple-400" />
                      <span>Mother (Maternal)</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{trioMother.sampleId}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">
                      {trioMother.zygosity === 'HOMOZYGOUS_REF_WILDTYPE' ? '0/0 (Wildtype)' : trioMother.zygosity === 'HETEROZYGOUS' ? '0/1 (Heterozygous Carrier)' : '1/1 (Homozygous Alt)'}
                    </td>
                    <td className="py-3 px-4 font-mono text-purple-300">{trioMother.vaf}% VAF</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${trioMother.isAffected ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-400'}`}>
                        {trioMother.isAffected ? 'Affected Phenotype' : 'Unaffected / Carrier'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {trioMother.zygosity !== 'HOMOZYGOUS_REF_WILDTYPE' ? 'Transmitted Maternal Allele' : 'Wildtype Reference'}
                    </td>
                  </tr>

                  {/* Father Row */}
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-sky-300 flex items-center space-x-1.5">
                      <User className="h-3.5 w-3.5 text-sky-400" />
                      <span>Father (Paternal)</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{trioFather.sampleId}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">
                      {trioFather.zygosity === 'HOMOZYGOUS_REF_WILDTYPE' ? '0/0 (Wildtype)' : trioFather.zygosity === 'HETEROZYGOUS' ? '0/1 (Heterozygous Carrier)' : '1/1 (Homozygous Alt)'}
                    </td>
                    <td className="py-3 px-4 font-mono text-sky-300">{trioFather.vaf}% VAF</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${trioFather.isAffected ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-400'}`}>
                        {trioFather.isAffected ? 'Affected Phenotype' : 'Unaffected / Carrier'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {trioFather.zygosity !== 'HOMOZYGOUS_REF_WILDTYPE' ? 'Transmitted Paternal Allele' : 'Wildtype Reference'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: DUAL VARIANT COMPARISON (VARIANT A vs VARIANT B)                    */}
      {/* ========================================================================= */}
      {viewMode === 'dual' && (
        <div className="space-y-6">
          {/* Quick Comparison Presets */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center space-x-1">
              <Sparkles className="h-3 w-3 text-teal-400" />
              <span>Recommended Dual Comparison Pairs:</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => {
                  handleSelectA('17661');
                  handleSelectB('41662');
                }}
                className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                <span>BRCA1 Frameshift (Pathogenic) vs Synonymous (Benign)</span>
              </button>
              <button
                onClick={() => {
                  handleSelectA('13961');
                  handleSelectB('7105');
                }}
                className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                <span>BRAF V600E vs CFTR F508del</span>
              </button>
              <button
                onClick={() => {
                  handleSelectA('12374');
                  handleSelectB('200923');
                }}
                className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                <span>TP53 R175H vs LDLR P685L</span>
              </button>
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800">
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <label className="text-xs font-semibold text-teal-400 block mb-1">
                  Primary Variant (Variant A):
                </label>
                <select
                  value={variantA?.analysisId || variantA?.normalizedVariant?.originalInput || ''}
                  onChange={(e) => handleSelectA(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-teal-500 font-mono"
                >
                  <optgroup label="Recent Database Analyses">
                    {deduplicatedHistory.map((item) => (
                      <option key={item.analysisId} value={item.analysisId}>
                        {formatVariantDropdownLabel(item)}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Benchmark Clinical Controls">
                    {BENCHMARK_VARIANTS.map((b) => (
                      <option key={b.id} value={b.clinvarId}>
                        {b.geneSymbol} {b.hgvs.split(':').pop()} (ClinVar: {b.clinvarId})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <label className="text-xs font-semibold text-blue-400 block mb-1">
                  Comparative Variant (Variant B):
                </label>
                <select
                  value={variantB?.analysisId || variantB?.normalizedVariant?.originalInput || ''}
                  onChange={(e) => handleSelectB(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 font-mono"
                >
                  <optgroup label="Recent Database Analyses">
                    {deduplicatedHistory.map((item) => (
                      <option key={item.analysisId} value={item.analysisId}>
                        {formatVariantDropdownLabel(item)}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Benchmark Clinical Controls">
                    {BENCHMARK_VARIANTS.map((b) => (
                      <option key={b.id} value={b.clinvarId}>
                        {b.geneSymbol} {b.hgvs.split(':').pop()} (ClinVar: {b.clinvarId})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          {/* Side by side cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {variantA && (
              <div className="bg-slate-900 border border-teal-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500"></div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 font-mono text-xs font-bold">
                      Variant A
                    </span>
                    <span className="font-bold text-slate-100 text-sm">
                      {variantA.normalizedVariant.geneSymbol || 'Gene'}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {variantA.normalizedVariant.hgvsc || variantA.normalizedVariant.originalInput}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 my-3 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">ClinVar</span>
                    <span className="font-bold text-slate-200 mt-0.5 block truncate">
                      {variantA.clinvarRecord?.clinicalSignificance || 'No record'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">ML Score</span>
                    <span className="font-mono font-bold text-teal-300 mt-0.5 block">
                      {((variantA.mlPrediction?.calibratedProbability ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">ACMG 2015</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${getACMGColor(variantA.acmgEvaluation?.overallClassification)}`}>
                      {variantA.acmgEvaluation?.overallClassification?.replace(/_/g, ' ') || 'VUS'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {variantB && (
              <div className="bg-slate-900 border border-blue-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono text-xs font-bold">
                      Variant B
                    </span>
                    <span className="font-bold text-slate-100 text-sm">
                      {variantB.normalizedVariant.geneSymbol || 'Gene'}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {variantB.normalizedVariant.hgvsc || variantB.normalizedVariant.originalInput}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 my-3 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">ClinVar</span>
                    <span className="font-bold text-slate-200 mt-0.5 block truncate">
                      {variantB.clinvarRecord?.clinicalSignificance || 'No record'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">ML Score</span>
                    <span className="font-mono font-bold text-blue-300 mt-0.5 block">
                      {((variantB.mlPrediction?.calibratedProbability ?? 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">ACMG 2015</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${getACMGColor(variantB.acmgEvaluation?.overallClassification)}`}>
                      {variantB.acmgEvaluation?.overallClassification?.replace(/_/g, ' ') || 'VUS'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACMG Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
            <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>ACMG Evidence Criteria Comparison Matrix</span>
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setDiffFilter('DIVERGENT')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    diffFilter === 'DIVERGENT' ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60' : 'text-slate-400'
                  }`}
                >
                  Only Differences
                </button>
                <button
                  onClick={() => setDiffFilter('ALL')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    diffFilter === 'ALL' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-400'
                  }`}
                >
                  All Criteria
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold w-24">Criterion</th>
                    <th className="py-3 px-4 font-semibold w-36">Strength</th>
                    <th className="py-3 px-4 font-semibold w-1/3 text-teal-300">Variant A Evidence</th>
                    <th className="py-3 px-4 font-semibold w-1/3 text-blue-300">Variant B Evidence</th>
                    <th className="py-3 px-4 font-semibold text-center w-28">Diff State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCriteria.map((code) => {
                    const evA = variantA?.acmgEvaluation?.criteriaEvaluations?.[code];
                    const evB = variantB?.acmgEvaluation?.criteriaEvaluations?.[code];
                    const aSup = evA?.status === 'SUPPORTED';
                    const bSup = evB?.status === 'SUPPORTED';
                    return (
                      <tr key={code} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-bold">{code}</td>
                        <td className="py-3 px-4 font-semibold text-slate-300">{evA?.assignedStrength || evB?.assignedStrength}</td>
                        <td className="py-3 px-4 text-slate-200">{aSup ? 'SUPPORTED' : 'NOT MET'}</td>
                        <td className="py-3 px-4 text-slate-200">{bSup ? 'SUPPORTED' : 'NOT MET'}</td>
                        <td className="py-3 px-4 text-center">
                          {aSup && bSup ? 'Shared' : aSup ? 'A Only' : bSup ? 'B Only' : 'Neither'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
