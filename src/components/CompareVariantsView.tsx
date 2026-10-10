// src/components/CompareVariantsView.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { FullAnalysisResult, ACMGCriterionEvaluation } from '../types/genomics.ts';
import { BENCHMARK_VARIANTS } from '../services/benchmarkVariants.ts';
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

// Clean clinical display label formatter for dropdowns
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
  const [historyItems, setHistoryItems] = useState<FullAnalysisResult[]>([]);
  const [variantA, setVariantA] = useState<FullAnalysisResult | null>(preselectedA || null);
  const [variantB, setVariantB] = useState<FullAnalysisResult | null>(preselectedB || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [diffFilter, setDiffFilter] = useState<'DIVERGENT' | 'ALL' | 'CONCORDANT' | 'PATHOGENIC' | 'BENIGN'>('DIVERGENT');
  const [copiedMd, setCopiedMd] = useState(false);

  // Load history from API
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

      // If Variant A or B not selected, pick defaults
      if (!variantA) {
        if (items.length > 0) {
          setVariantA(items[0]);
        } else {
          const defA = await fetchVariantAnalysis('17661');
          if (defA) setVariantA(defA);
        }
      }

      if (!variantB) {
        if (items.length > 1) {
          setVariantB(items[1]);
        } else {
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

  // Deduplicate historical runs by unique representation or variant input
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

  // Helper colors
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

  // Criteria codes
  const criteriaCodes = variantA?.acmgEvaluation
    ? Object.keys(variantA.acmgEvaluation.criteriaEvaluations)
    : variantB?.acmgEvaluation
    ? Object.keys(variantB.acmgEvaluation.criteriaEvaluations)
    : [];

  // Filter criteria according to diff mode
  const filteredCriteria = criteriaCodes.filter((code) => {
    const evA = variantA?.acmgEvaluation?.criteriaEvaluations?.[code];
    const evB = variantB?.acmgEvaluation?.criteriaEvaluations?.[code];
    const aSupported = evA?.status === 'SUPPORTED';
    const bSupported = evB?.status === 'SUPPORTED';
    const category = evA?.category || evB?.category;

    if (diffFilter === 'DIVERGENT') {
      return aSupported !== bSupported;
    }
    if (diffFilter === 'CONCORDANT') {
      return aSupported && bSupported;
    }
    if (diffFilter === 'PATHOGENIC') {
      return category === 'PATHOGENIC';
    }
    if (diffFilter === 'BENIGN') {
      return category === 'BENIGN';
    }
    return true; // ALL
  });

  // Calculate quantitative deltas
  const scoreA = variantA?.acmgEvaluation?.bayesianScore ?? 0;
  const scoreB = variantB?.acmgEvaluation?.bayesianScore ?? 0;
  const deltaScore = scoreA - scoreB;

  const mlProbA = variantA?.mlPrediction?.calibratedProbability ?? 0;
  const mlProbB = variantB?.mlPrediction?.calibratedProbability ?? 0;
  const deltaMl = Math.abs(mlProbA - mlProbB);

  const tierA = variantA?.acmgEvaluation?.overallClassification;
  const tierB = variantB?.acmgEvaluation?.overallClassification;
  const isTierConcordant = tierA && tierB && tierA === tierB;

  // Direct CSV Export Generator
  const handleExportCsv = () => {
    if (!variantA || !variantB) return;

    const labelA = `${variantA.normalizedVariant.geneSymbol || 'VarA'}_${variantA.normalizedVariant.hgvsc || variantA.normalizedVariant.originalInput}`;
    const labelB = `${variantB.normalizedVariant.geneSymbol || 'VarB'}_${variantB.normalizedVariant.hgvsc || variantB.normalizedVariant.originalInput}`;

    const headers = ['Criterion Code', 'Description', 'Category', 'Assigned Strength', `Variant A (${labelA}) Status`, `Variant A Rationale`, `Variant B (${labelB}) Status`, `Variant B Rationale`, 'Diff State'];
    const rows = criteriaCodes.map((code) => {
      const evA = variantA.acmgEvaluation?.criteriaEvaluations?.[code];
      const evB = variantB.acmgEvaluation?.criteriaEvaluations?.[code];
      const aSup = evA?.status === 'SUPPORTED' ? 'SUPPORTED' : 'NOT MET';
      const bSup = evB?.status === 'SUPPORTED' ? 'SUPPORTED' : 'NOT MET';
      const diffState = aSup === bSup ? (aSup === 'SUPPORTED' ? 'Shared Both' : 'Neither') : aSup === 'SUPPORTED' ? 'A Only' : 'B Only';

      return [
        code,
        `"${(evA?.shortDescription || '').replace(/"/g, '""')}"`,
        evA?.category || 'PATHOGENIC',
        evA?.assignedStrength || 'STANDARD',
        aSup,
        `"${(evA?.rationale || '').replace(/"/g, '""')}"`,
        bSup,
        `"${(evB?.rationale || '').replace(/"/g, '""')}"`,
        diffState,
      ].join(',');
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

  // Direct Markdown Export Generator
  const handleExportMarkdown = () => {
    if (!variantA || !variantB) return;

    const labelA = `${variantA.normalizedVariant.geneSymbol || 'VarA'} ${variantA.normalizedVariant.hgvsc || variantA.normalizedVariant.originalInput}`;
    const labelB = `${variantB.normalizedVariant.geneSymbol || 'VarB'} ${variantB.normalizedVariant.hgvsc || variantB.normalizedVariant.originalInput}`;

    let md = `# DNA DOCTOR SIDE-BY-SIDE ACMG VARIANT COMPARISON REPORT\n\n`;
    md += `**Date:** ${new Date().toUTCString()}\n`;
    md += `**Variant A:** ${labelA} | ACMG: ${variantA.acmgEvaluation?.overallClassification} | Bayesian Score: ${scoreA} pts | ML: ${(mlProbA * 100).toFixed(1)}%\n`;
    md += `**Variant B:** ${labelB} | ACMG: ${variantB.acmgEvaluation?.overallClassification} | Bayesian Score: ${scoreB} pts | ML: ${(mlProbB * 100).toFixed(1)}%\n`;
    md += `**Concordance:** ${isTierConcordant ? 'CONCORDANT' : 'DIVERGENT'} (Score Delta: ${deltaScore > 0 ? '+' : ''}${deltaScore} pts)\n\n`;
    md += `## CRITERIA COMPARISON MATRIX\n\n`;
    md += `| Code | Strength | Variant A Status | Variant B Status | Diff |\n`;
    md += `|---|---|---|---|---|\n`;

    criteriaCodes.forEach((code) => {
      const evA = variantA.acmgEvaluation?.criteriaEvaluations?.[code];
      const evB = variantB.acmgEvaluation?.criteriaEvaluations?.[code];
      const aSup = evA?.status === 'SUPPORTED';
      const bSup = evB?.status === 'SUPPORTED';
      const diffState = aSup && bSup ? 'Shared' : aSup ? 'A Only' : bSup ? 'B Only' : 'Neither';
      md += `| ${code} | ${evA?.assignedStrength} | ${aSup ? 'SUPPORTED' : 'NOT MET'} | ${bSup ? 'SUPPORTED' : 'NOT MET'} | ${diffState} |\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Top Banner & Quick Presets with mt-4 top margin to eliminate header overlap */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center space-x-2">
              <Scale className="h-4 w-4 text-teal-400" />
              <span>Comparative Variant Analysis &amp; ACMG Dissonance Matrix</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select two variants from your database history or benchmark controls to evaluate side-by-side differences in evidence criteria.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={!variantA || !variantB}
              className="px-2.5 py-1.5 text-xs font-medium rounded bg-teal-950 hover:bg-teal-900 text-teal-200 border border-teal-800/80 flex items-center space-x-1 transition-colors"
              title="Export Diff to CSV Spreadsheet"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-teal-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportMarkdown}
              disabled={!variantA || !variantB}
              className="px-2.5 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1 transition-colors"
              title="Copy Markdown Comparison"
            >
              {copiedMd ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <FileText className="h-3.5 w-3.5" />}
              <span>{copiedMd ? 'Copied MD' : 'Copy MD'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1 transition-colors"
              title="Print Side-by-Side Comparison Sheet"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={handleSwap}
              className="px-2.5 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1 transition-colors"
              title="Swap Variant A and Variant B"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 text-teal-400" />
              <span>Swap (A ⇄ B)</span>
            </button>
          </div>
        </div>

        {/* 1-Click Comparison Presets */}
        <div className="mt-3">
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center space-x-1">
            <Sparkles className="h-3 w-3 text-teal-400" />
            <span>Recommended Clinical Comparison Pairs:</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => {
                handleSelectA('17661');
                handleSelectB('41662');
              }}
              className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center space-x-1.5"
            >
              <span>BRCA1 Frameshift (Pathogenic) vs Synonymous (Benign)</span>
            </button>
            <button
              onClick={() => {
                handleSelectA('13961');
                handleSelectB('7105');
              }}
              className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center space-x-1.5"
            >
              <span>BRAF V600E (Kinase Hotspot) vs CFTR F508del (In-frame Indel)</span>
            </button>
            <button
              onClick={() => {
                handleSelectA('12374');
                handleSelectB('200923');
              }}
              className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center space-x-1.5"
            >
              <span>TP53 R175H (Li-Fraumeni) vs LDLR P685L (Familial Hypercholesterolemia)</span>
            </button>
          </div>
        </div>

        {/* Deduplicated, Formatted Selectors for Variant A and Variant B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800">
          {/* Selector A */}
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <label className="text-xs font-semibold text-teal-400 block mb-1">
              Primary Variant (Variant A):
            </label>
            <select
              value={variantA?.analysisId || variantA?.normalizedVariant?.originalInput || ''}
              onChange={(e) => handleSelectA(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-teal-500 font-mono"
            >
              <optgroup label="Recent Database Analyses (Deduplicated)">
                {deduplicatedHistory.map((item) => (
                  <option key={item.analysisId} value={item.analysisId}>
                    {formatVariantDropdownLabel(item)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Benchmark Clinical Controls">
                {BENCHMARK_VARIANTS.map((b) => (
                  <option key={b.id} value={b.clinvarId}>
                    {b.geneSymbol} {b.hgvs.split(':').pop()} (ClinVar: {b.clinvarId}) — {b.expectedClinVar.split('(')[0]}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Selector B */}
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
            <label className="text-xs font-semibold text-blue-400 block mb-1">
              Comparative Variant (Variant B):
            </label>
            <select
              value={variantB?.analysisId || variantB?.normalizedVariant?.originalInput || ''}
              onChange={(e) => handleSelectB(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 font-mono"
            >
              <optgroup label="Recent Database Analyses (Deduplicated)">
                {deduplicatedHistory.map((item) => (
                  <option key={item.analysisId} value={item.analysisId}>
                    {formatVariantDropdownLabel(item)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Benchmark Clinical Controls">
                {BENCHMARK_VARIANTS.map((b) => (
                  <option key={b.id} value={b.clinvarId}>
                    {b.geneSymbol} {b.hgvs.split(':').pop()} (ClinVar: {b.clinvarId}) — {b.expectedClinVar.split('(')[0]}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Delta Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* ACMG Concordance Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-slate-400 block text-[11px]">ACMG Concordance:</span>
          <span
            className={`font-bold mt-1 inline-flex items-center space-x-1 ${
              isTierConcordant ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {isTierConcordant ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Concordant Tier</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Divergent Tiers</span>
              </>
            )}
          </span>
        </div>

        {/* Bayesian Score Delta (Tavtigian Harmonized) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-slate-400 block text-[11px]">Bayesian Point Delta (Δ):</span>
          <span className="font-mono font-bold text-slate-100 mt-1 block">
            {deltaScore > 0 ? `+${deltaScore}` : deltaScore} points
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            A: {scoreA > 0 ? `+${scoreA}` : scoreA} vs B: {scoreB > 0 ? `+${scoreB}` : scoreB} (Assigned Strengths)
          </span>
        </div>

        {/* In Silico ML Probability Delta */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-slate-400 block text-[11px]">ML Pathogenicity Delta:</span>
          <span className="font-mono font-bold text-teal-300 mt-1 block">
            {(deltaMl * 100).toFixed(1)}% difference
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            A: {(mlProbA * 100).toFixed(1)}% vs B: {(mlProbB * 100).toFixed(1)}%
          </span>
        </div>

        {/* Triggered Criteria Difference */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <span className="text-slate-400 block text-[11px]">Active Criteria Difference:</span>
          <span className="font-mono font-bold text-slate-200 mt-1 block">
            {variantA?.acmgEvaluation?.supportedCriteria.length ?? 0} vs{' '}
            {variantB?.acmgEvaluation?.supportedCriteria.length ?? 0}
          </span>
          <span className="text-[10px] text-slate-500">
            {Math.abs((variantA?.acmgEvaluation?.supportedCriteria.length ?? 0) - (variantB?.acmgEvaluation?.supportedCriteria.length ?? 0))} discordant criteria
          </span>
        </div>
      </div>

      {/* Side-by-Side Executive Cards with ClinVar Star Weighting Caution Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card for Variant A */}
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

              <button
                onClick={() => onLoadVariantInWorkbench(variantA)}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center space-x-1"
                title="Inspect in Workbench"
              >
                <span>Open</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* ClinVar Star Rating Caution Badge if 0 or 1 star */}
            {variantA.clinvarRecord && variantA.clinvarRecord.reviewStars <= 1 && (
              <div className="my-2.5 bg-amber-950/70 border border-amber-600/50 rounded p-2 text-[11px] text-amber-300 flex items-start space-x-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-200">Low-Confidence ClinVar Record ({variantA.clinvarRecord.reviewStars}/4 ★):</strong>
                  <span>Single submitter / missing assertion criteria. Evaluate ACMG and in-silico evidence with caution.</span>
                </div>
              </div>
            )}

            {/* Tri-Pillar Badges */}
            <div className="grid grid-cols-3 gap-2 my-3 text-xs">
              {/* ClinVar */}
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">ClinVar</span>
                <span className="font-bold text-slate-200 mt-0.5 block truncate">
                  {variantA.clinvarRecord?.clinicalSignificance || 'No record'}
                </span>
                <div className="flex items-center text-amber-400 mt-0.5">
                  {[1, 2, 3, 4].map((s) => (
                    <Star
                      key={s}
                      className={`h-2.5 w-2.5 ${s <= (variantA.clinvarRecord?.reviewStars ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                    />
                  ))}
                  <span className="text-[10px] text-slate-400 ml-1 font-mono">{variantA.clinvarRecord?.reviewStars ?? 0}★</span>
                </div>
              </div>

              {/* ML */}
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">ML Score</span>
                <span className="font-mono font-bold text-teal-300 mt-0.5 block">
                  {((variantA.mlPrediction?.calibratedProbability ?? 0) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400 truncate block">
                  {variantA.mlPrediction?.classificationCategory?.replace(/_/g, ' ') || 'N/A'}
                </span>
              </div>

              {/* ACMG */}
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">ACMG 2015</span>
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${getACMGColor(
                    variantA.acmgEvaluation?.overallClassification
                  )}`}
                >
                  {variantA.acmgEvaluation?.overallClassification?.replace(/_/g, ' ') || 'VUS'}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {variantA.acmgEvaluation?.bayesianScore ?? 0} pts
                </span>
              </div>
            </div>

            {/* Details Table */}
            <dl className="grid grid-cols-2 gap-2 text-xs bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              <div>
                <dt className="text-slate-500">Coordinate:</dt>
                <dd className="font-mono text-slate-200 text-[11px] truncate">
                  {variantA.normalizedVariant.normalizedRepresentation}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Consequence:</dt>
                <dd className="font-semibold text-teal-300 text-[11px]">
                  {variantA.annotationData?.consequence?.replace(/_/g, ' ') || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">gnomAD PopMax:</dt>
                <dd className="font-mono text-slate-200 text-[11px]">
                  {typeof variantA.annotationData?.gnomadAfPopmax === 'number'
                    ? variantA.annotationData.gnomadAfPopmax.toExponential(2)
                    : typeof variantA.annotationData?.gnomadAfGlobal === 'number'
                    ? variantA.annotationData.gnomadAfGlobal.toExponential(2)
                    : '<1e-6'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">CADD Phred:</dt>
                <dd className="font-mono text-slate-200 text-[11px]">
                  {variantA.annotationData?.caddPhred?.toFixed(1) || 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Card for Variant B */}
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

              <button
                onClick={() => onLoadVariantInWorkbench(variantB)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                title="Inspect in Workbench"
              >
                <span>Open</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* ClinVar Star Rating Caution Badge if 0 or 1 star */}
            {variantB.clinvarRecord && variantB.clinvarRecord.reviewStars <= 1 && (
              <div className="my-2.5 bg-amber-950/70 border border-amber-600/50 rounded p-2 text-[11px] text-amber-300 flex items-start space-x-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-200">Low-Confidence ClinVar Record ({variantB.clinvarRecord.reviewStars}/4 ★):</strong>
                  <span>Single submitter / missing assertion criteria. Evaluate ACMG and in-silico evidence with caution.</span>
                </div>
              </div>
            )}

            {/* Tri-Pillar Badges */}
            <div className="grid grid-cols-3 gap-2 my-3 text-xs">
              {/* ClinVar */}
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">ClinVar</span>
                <span className="font-bold text-slate-200 mt-0.5 block truncate">
                  {variantB.clinvarRecord?.clinicalSignificance || 'No record'}
                </span>
                <div className="flex items-center text-amber-400 mt-0.5">
                  {[1, 2, 3, 4].map((s) => (
                    <Star
                      key={s}
                      className={`h-2.5 w-2.5 ${s <= (variantB.clinvarRecord?.reviewStars ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                    />
                  ))}
                  <span className="text-[10px] text-slate-400 ml-1 font-mono">{variantB.clinvarRecord?.reviewStars ?? 0}★</span>
                </div>
              </div>

              {/* ML */}
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">ML Score</span>
                <span className="font-mono font-bold text-blue-300 mt-0.5 block">
                  {((variantB.mlPrediction?.calibratedProbability ?? 0) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400 truncate block">
                  {variantB.mlPrediction?.classificationCategory?.replace(/_/g, ' ') || 'N/A'}
                </span>
              </div>

              {/* ACMG */}
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">ACMG 2015</span>
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${getACMGColor(
                    variantB.acmgEvaluation?.overallClassification
                  )}`}
                >
                  {variantB.acmgEvaluation?.overallClassification?.replace(/_/g, ' ') || 'VUS'}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {variantB.acmgEvaluation?.bayesianScore ?? 0} pts
                </span>
              </div>
            </div>

            {/* Details Table */}
            <dl className="grid grid-cols-2 gap-2 text-xs bg-slate-950/70 p-3 rounded-lg border border-slate-800">
              <div>
                <dt className="text-slate-500">Coordinate:</dt>
                <dd className="font-mono text-slate-200 text-[11px] truncate">
                  {variantB.normalizedVariant.normalizedRepresentation}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Consequence:</dt>
                <dd className="font-semibold text-blue-300 text-[11px]">
                  {variantB.annotationData?.consequence?.replace(/_/g, ' ') || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">gnomAD PopMax:</dt>
                <dd className="font-mono text-slate-200 text-[11px]">
                  {typeof variantB.annotationData?.gnomadAfPopmax === 'number'
                    ? variantB.annotationData.gnomadAfPopmax.toExponential(2)
                    : typeof variantB.annotationData?.gnomadAfGlobal === 'number'
                    ? variantB.annotationData.gnomadAfGlobal.toExponential(2)
                    : '<1e-6'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">CADD Phred:</dt>
                <dd className="font-mono text-slate-200 text-[11px]">
                  {variantB.annotationData?.caddPhred?.toFixed(1) || 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* ACMG 28-Criteria Side-by-Side Diff Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>ACMG/AMP Evidence Criteria Comparison Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Detailed breakdown of why each criterion fired or failed between Variant A and Variant B with Tavtigian et al. point weights.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setDiffFilter('DIVERGENT')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                diffFilter === 'DIVERGENT'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Only Differences ({criteriaCodes.filter((c) => (variantA?.acmgEvaluation?.criteriaEvaluations?.[c]?.status === 'SUPPORTED') !== (variantB?.acmgEvaluation?.criteriaEvaluations?.[c]?.status === 'SUPPORTED')).length})
            </button>
            <button
              onClick={() => setDiffFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                diffFilter === 'ALL'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All 28 Criteria
            </button>
            <button
              onClick={() => setDiffFilter('CONCORDANT')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                diffFilter === 'CONCORDANT'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Shared Active
            </button>
          </div>
        </div>

        {/* Counter and status banner */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
          <span>
            Showing <strong className="text-teal-300">{filteredCriteria.length}</strong> of 28 criteria
            {filteredCriteria.length < 28 && ` (${28 - filteredCriteria.length} criteria hidden by '${diffFilter}' filter)`}
          </span>
          {filteredCriteria.length < 28 && (
            <button
              onClick={() => setDiffFilter('ALL')}
              className="text-teal-400 hover:underline text-[11px]"
            >
              Show all 28 criteria
            </button>
          )}
        </div>

        {/* Diff Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold w-24">Criterion</th>
                <th className="py-3 px-4 font-semibold w-36">Strength &amp; Weight</th>
                <th className="py-3 px-4 font-semibold w-1/3">
                  <span className="text-teal-300 font-bold">Variant A Evidence</span>
                </th>
                <th className="py-3 px-4 font-semibold w-1/3">
                  <span className="text-blue-300 font-bold">Variant B Evidence</span>
                </th>
                <th className="py-3 px-4 font-semibold text-center w-28">Diff State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCriteria.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    No criteria match the '{diffFilter}' filter.
                  </td>
                </tr>
              ) : (
                filteredCriteria.map((code) => {
                  const evA = variantA?.acmgEvaluation?.criteriaEvaluations?.[code];
                  const evB = variantB?.acmgEvaluation?.criteriaEvaluations?.[code];
                  const aSup = evA?.status === 'SUPPORTED';
                  const bSup = evB?.status === 'SUPPORTED';
                  const isPath = evA?.category === 'PATHOGENIC' || evB?.category === 'PATHOGENIC';

                  return (
                    <tr
                      key={code}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        aSup !== bSup ? 'bg-slate-850/40' : ''
                      }`}
                    >
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            isPath ? 'text-rose-300 bg-rose-950/80 border border-rose-800/50' : 'text-emerald-300 bg-emerald-950/80 border border-emerald-800/50'
                          }`}
                        >
                          {code}
                        </span>
                      </td>

                      {/* Category & Strength */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-200 block">
                          {evA?.assignedStrength || evB?.assignedStrength}
                          {evA?.assignedStrength !== evA?.defaultStrength && (
                            <span className="text-[10px] text-amber-400 ml-1">(Modified)</span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {evA?.category || evB?.category} • {evA?.pointsAwarded !== undefined && evA.pointsAwarded !== 0 ? `${evA.pointsAwarded > 0 ? '+' : ''}${evA.pointsAwarded} pts` : ''}
                        </span>
                      </td>

                      {/* Variant A Evidence */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5 mb-1">
                          {aSup ? (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>SUPPORTED ({evA?.pointsAwarded ? `${evA.pointsAwarded > 0 ? '+' : ''}${evA.pointsAwarded} pts` : ''})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[10px] text-slate-500 bg-slate-950 border border-slate-850">
                              <XCircle className="h-3 w-3" />
                              <span>NOT MET</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {evA?.rationale || 'Criterion not evaluated'}
                        </p>
                      </td>

                      {/* Variant B Evidence */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5 mb-1">
                          {bSup ? (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>SUPPORTED ({evB?.pointsAwarded ? `${evB.pointsAwarded > 0 ? '+' : ''}${evB.pointsAwarded} pts` : ''})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[10px] text-slate-500 bg-slate-950 border border-slate-850">
                              <XCircle className="h-3 w-3" />
                              <span>NOT MET</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {evB?.rationale || 'Criterion not evaluated'}
                        </p>
                      </td>

                      {/* Diff Status Indicator */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {aSup && bSup && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Shared Both
                          </span>
                        )}
                        {aSup && !bSup && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-950 text-teal-300 border border-teal-800">
                            A Only
                          </span>
                        )}
                        {!aSup && bSup && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                            B Only
                          </span>
                        )}
                        {!aSup && !bSup && (
                          <span className="text-[10px] text-slate-600 font-mono">
                            Neither
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
