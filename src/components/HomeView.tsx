// src/components/HomeView.tsx
import React, { useState } from 'react';
import {
  Search,
  ArrowRight,
  Dna,
  ShieldCheck,
  Cpu,
  Database,
  Scale,
  History,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileText,
  Activity,
  FlaskConical,
} from 'lucide-react';
import { GenomeAssembly, FullAnalysisResult, TrioMemberInput } from '../types/genomics.ts';
import { BENCHMARK_VARIANTS, BenchmarkVariantPreset } from '../services/benchmarkVariants.ts';
import { TrioInputSection } from './TrioInputSection.tsx';

interface HomeViewProps {
  onSearch: (
    input: string,
    assembly: GenomeAssembly,
    trioInput?: { child: TrioMemberInput; mother: TrioMemberInput; father: TrioMemberInput }
  ) => void;
  onNavigateTab: (tab: 'workbench' | 'matrix' | 'compare' | 'history' | 'methodology' | 'assays') => void;
  isAnalyzing: boolean;
  historyCount: number;
  recentAnalyses: FullAnalysisResult[];
  onLoadRecent: (analysis: FullAnalysisResult) => void;
  onCompareWithRecent: (analysis: FullAnalysisResult) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSearch,
  onNavigateTab,
  isAnalyzing,
  historyCount,
  recentAnalyses,
  onLoadRecent,
  onCompareWithRecent,
}) => {
  const [analysisMode, setAnalysisMode] = useState<'trio' | 'single'>('trio');
  const [singleInput, setSingleInput] = useState<string>('17661');
  const [assembly, setAssembly] = useState<GenomeAssembly>('GRCh38');
  const [familyId, setFamilyId] = useState<string>('FAM-2025-01');

  // Trio State
  const [childInput, setChildInput] = useState<TrioMemberInput>({
    relationship: 'child',
    label: 'Proband (Child)',
    sampleId: 'CH-2025-01',
    variantInput: '17661',
    zygosity: 'HETEROZYGOUS',
    isAffected: true,
  });

  const [motherInput, setMotherInput] = useState<TrioMemberInput>({
    relationship: 'mother',
    label: 'Mother (Maternal)',
    sampleId: 'MO-2025-01',
    variantInput: '',
    zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
    isAffected: false,
  });

  const [fatherInput, setFatherInput] = useState<TrioMemberInput>({
    relationship: 'father',
    label: 'Father (Paternal)',
    sampleId: 'FA-2025-01',
    variantInput: '',
    zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
    isAffected: false,
  });

  const handleApplyTrioPreset = (presetKey: 'denovo' | 'recessive' | 'maternal') => {
    if (presetKey === 'denovo') {
      setFamilyId('FAM-2025-DN');
      setChildInput({
        relationship: 'child',
        label: 'Proband (Child)',
        sampleId: 'CH-2025-DN',
        variantInput: '17661', // BRCA1 c.5266dupC
        zygosity: 'HETEROZYGOUS',
        isAffected: true,
      });
      setMotherInput({
        relationship: 'mother',
        label: 'Mother (Maternal)',
        sampleId: 'MO-2025-DN',
        variantInput: '',
        zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
        isAffected: false,
      });
      setFatherInput({
        relationship: 'father',
        label: 'Father (Paternal)',
        sampleId: 'FA-2025-DN',
        variantInput: '',
        zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
        isAffected: false,
      });
    } else if (presetKey === 'recessive') {
      setFamilyId('FAM-2025-REC');
      setChildInput({
        relationship: 'child',
        label: 'Proband (Child)',
        sampleId: 'CH-2025-REC',
        variantInput: '7105', // CFTR F508del
        zygosity: 'HOMOZYGOUS_ALT',
        isAffected: true,
      });
      setMotherInput({
        relationship: 'mother',
        label: 'Mother (Maternal)',
        sampleId: 'MO-2025-REC',
        variantInput: '7105',
        zygosity: 'HETEROZYGOUS',
        isAffected: false,
      });
      setFatherInput({
        relationship: 'father',
        label: 'Father (Paternal)',
        sampleId: 'FA-2025-REC',
        variantInput: '7105',
        zygosity: 'HETEROZYGOUS',
        isAffected: false,
      });
    } else if (presetKey === 'maternal') {
      setFamilyId('FAM-2025-MAT');
      setChildInput({
        relationship: 'child',
        label: 'Proband (Child)',
        sampleId: 'CH-2025-MAT',
        variantInput: '13961', // BRAF V600E
        zygosity: 'HETEROZYGOUS',
        isAffected: true,
      });
      setMotherInput({
        relationship: 'mother',
        label: 'Mother (Maternal)',
        sampleId: 'MO-2025-MAT',
        variantInput: '13961',
        zygosity: 'HETEROZYGOUS',
        isAffected: true,
      });
      setFatherInput({
        relationship: 'father',
        label: 'Father (Paternal)',
        sampleId: 'FA-2025-MAT',
        variantInput: '',
        zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
        isAffected: false,
      });
    }
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleInput.trim()) return;
    onSearch(singleInput.trim(), assembly);
  };

  const handleTrioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childInput.variantInput.trim()) return;
    onSearch(childInput.variantInput.trim(), assembly, {
      child: childInput,
      mother: motherInput,
      father: fatherInput,
    });
  };

  const handleSelectPreset = (preset: BenchmarkVariantPreset) => {
    setSingleInput(preset.clinvarId);
    setChildInput((prev) => ({ ...prev, variantInput: preset.clinvarId }));
    onSearch(preset.clinvarId, assembly);
  };

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium">
          <Dna className="w-3.5 h-3.5 text-teal-400" />
          <span>Genomic Intelligence &amp; Clinical Curation Console</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100 text-balance">
          DNA Doctor
        </h1>

        <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto text-balance">
          Unifies curated <span className="text-slate-200 font-medium">NCBI ClinVar consensus</span>, calibrated{' '}
          <span className="text-slate-200 font-medium">machine learning pathogenicity scoring</span>, and the 28-rule{' '}
          <span className="text-slate-200 font-medium">ACMG/AMP 2015 framework</span> with{' '}
          <span className="text-teal-300 font-medium">Family Trio (Child • Mother • Father)</span> segregation analysis.
        </p>

        {/* Mode Selector Tabs: Family Trio vs Single Variant */}
        <div className="pt-2 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl inline-flex gap-1 shadow-lg">
            <button
              type="button"
              onClick={() => setAnalysisMode('trio')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                analysisMode === 'trio'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Family Trio Analysis (Child • Mother • Father)</span>
            </button>
            <button
              type="button"
              onClick={() => setAnalysisMode('single')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                analysisMode === 'single'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Single Variant Search</span>
            </button>
          </div>
        </div>

        {/* Trio Mode Form */}
        {analysisMode === 'trio' ? (
          <form
            onSubmit={handleTrioSubmit}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur space-y-5 text-left max-w-4xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-400" />
                  <span>ClinVar ID &amp; Genetic Report Inputs (Child • Mother • Father)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Input ClinVar IDs / variant coordinates and attach clinical reports (PDF or Image) for Child (Proband), Mother, and Father.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Assembly:</label>
                <select
                  value={assembly}
                  onChange={(e) => setAssembly(e.target.value as GenomeAssembly)}
                  className="bg-slate-950 border border-slate-800 text-xs font-mono text-teal-300 rounded-lg px-2.5 py-1.5 focus:border-teal-500 focus:outline-none"
                >
                  <option value="GRCh38">GRCh38</option>
                  <option value="GRCh37">GRCh37</option>
                </select>
              </div>
            </div>

            {/* The 3 Inputs: Child, Mother, Father with PDF/Image Upload */}
            <TrioInputSection
              childInput={childInput}
              motherInput={motherInput}
              fatherInput={fatherInput}
              onChangeChild={(d) => setChildInput((prev) => ({ ...prev, ...d }))}
              onChangeMother={(d) => setMotherInput((prev) => ({ ...prev, ...d }))}
              onChangeFather={(d) => setFatherInput((prev) => ({ ...prev, ...d }))}
              onApplyTrioPreset={handleApplyTrioPreset}
              familyId={familyId}
              onFamilyIdChange={setFamilyId}
              assembly={assembly}
            />

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={isAnalyzing || !childInput.variantInput.trim()}
                className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-900/40"
              >
                <span>{isAnalyzing ? 'Executing Trio Pipeline...' : 'Run Trio Analysis (Child • Mother • Father)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* Single Mode Form */
          <div className="pt-2 max-w-2xl mx-auto">
            <form
              onSubmit={handleSingleSubmit}
              className="bg-slate-900/90 border border-slate-800 hover:border-teal-500/40 focus-within:border-teal-500/60 rounded-2xl p-2.5 shadow-2xl backdrop-blur transition-all"
            >
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1 flex items-center min-w-0">
                  <Search className="w-5 h-5 text-slate-500 ml-3 shrink-0" />
                  <input
                    type="text"
                    value={singleInput}
                    onChange={(e) => setSingleInput(e.target.value)}
                    placeholder="ClinVar ID (17661), HGVS, or gene..."
                    className="w-full bg-transparent border-none text-slate-100 placeholder:text-slate-500 text-sm sm:text-base px-3 py-2.5 focus:outline-none font-mono min-w-0"
                  />
                </div>

                <div className="flex items-center gap-2 justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <select
                    value={assembly}
                    onChange={(e) => setAssembly(e.target.value as GenomeAssembly)}
                    className="bg-slate-950 border border-slate-800 text-xs font-mono text-teal-300 rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-teal-500 focus:outline-none shrink-0"
                  >
                    <option value="GRCh38">GRCh38</option>
                    <option value="GRCh37">GRCh37</option>
                  </select>

                  <button
                    type="submit"
                    disabled={isAnalyzing || !singleInput.trim()}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 shrink-0"
                  >
                    <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Variant'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Benchmark Presets */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-500 font-medium mr-1">Clinical Presets:</span>
              {BENCHMARK_VARIANTS.slice(0, 5).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-teal-300 border border-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <span className="font-semibold text-teal-400">{preset.geneSymbol}</span>
                  <span className="font-mono text-slate-400 text-[11px]">{preset.hgvs.split(':').pop() || preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feature Interconnection Hub */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Integrated Diagnostic Suites</h2>
            <p className="text-xs text-slate-400">Seamlessly move data and findings between each clinical module.</p>
          </div>
          <span className="text-xs font-mono text-slate-500">Family Trio &amp; 4 Engines</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Card 1: Clinical Workbench */}
          <div
            onClick={() => onNavigateTab('workbench')}
            className="group cursor-pointer bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/40 rounded-xl p-5 transition-all shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
                <Dna className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                Clinical Workbench
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Complete multi-evidence variant breakdown with ClinVar assertions, Ensembl VEP annotations, and gnomAD population frequencies.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-medium text-teal-400 group-hover:text-teal-300">
              <span>Open Workbench</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Diagnostic Assay Lab (2D & 3D) */}
          <div
            onClick={() => onNavigateTab('assays')}
            className="group cursor-pointer bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/40 rounded-xl p-5 transition-all shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-300 group-hover:scale-105 transition-transform">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                  Assay Lab (2D/3D)
                </h3>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                  9 ASSAYS
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                PCR, Sanger, NGS, WES, WGS, Microarray, CMA, Genotyping/SNP &amp; Karyotyping simulation with interactive 2D traces and 3D WebGL models.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-medium text-teal-300 group-hover:text-teal-200">
              <span>Launch Simulator</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: ACMG 28-Rules Matrix */}
          <div
            onClick={() => onNavigateTab('matrix')}
            className="group cursor-pointer bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-5 transition-all shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                ACMG 28-Rules
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Richards et al. 2015 criteria auditor with Tavtigian et al. Bayesian point calculations and clinician functional assay overrides.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-medium text-emerald-400 group-hover:text-emerald-300">
              <span>Inspect Rules</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Compare Variants */}
          <div
            onClick={() => onNavigateTab('compare')}
            className="group cursor-pointer bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/40 rounded-xl p-5 transition-all shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                Variant Comparator
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Side-by-side differential analysis of two historical runs, criteria divergence matrix, Bayesian score delta, and PDF/CSV export.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-medium text-sky-400 group-hover:text-sky-300">
              <span>Compare Variants</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: History */}
          <div
            onClick={() => onNavigateTab('history')}
            className="group cursor-pointer bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-5 transition-all shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <History className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                  Audit History
                </h3>
                {historyCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                    {historyCount} runs
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Persistent storage of variant runs. Instant reload into the workbench or two-click side-by-side comparison setup.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-medium text-indigo-400 group-hover:text-indigo-300">
              <span>Browse Archive</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* The Tri-Pillar Separation Architecture */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>The Tri-Pillar Separation Paradigm</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              DNA Doctor enforces clear epistemological boundaries between existing clinical records, ML inferences, and guideline rules.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('methodology')}
            className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Read Clinical Methodology</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-300 uppercase tracking-wider">
              <Database className="w-4 h-4 text-teal-400" />
              <span>Pillar 1: Database Consensus</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Curated Clinical Records</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time NCBI E-utilities queries retrieve ClinVar submitter assertions, review stars (0–4 stars), and conflict warnings without assumptions.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-300 uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>Pillar 2: Machine Learning</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Calibrated Pathogenicity</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Random forest statistical predictor outputs continuous calibrated probabilities (0.0 to 1.0) with SHAP-like feature contributions (CADD, PolyPhen, SIFT).
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Pillar 3: Guidelines Engine</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-200">ACMG/AMP 2015 28 Rules</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic rule firing across PVS1, PS1–4, PM1–6, PP1–5, BA1, BS1–4, BP1–7 with Tavtigian Bayesian log-odds points and clinician curation overrides.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Analyses Quick Row */}
      {recentAnalyses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-teal-400" />
              <span>Recent Historical Analyses</span>
            </h3>
            <button
              onClick={() => onNavigateTab('history')}
              className="text-xs text-teal-400 hover:underline"
            >
              View all ({historyCount})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentAnalyses.slice(0, 3).map((item) => {
              const gene = item.normalizedVariant?.geneSymbol || item.clinvarRecord?.geneSymbol || 'Gene';
              const hgvs = item.normalizedVariant?.hgvsc || item.normalizedVariant?.originalInput;
              const tier = item.acmgEvaluation?.overallClassification || 'Analyzed';
              return (
                <div
                  key={item.analysisId}
                  className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-lg p-3 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="font-semibold text-slate-200 truncate">
                      {gene} <span className="font-mono text-slate-400 text-[11px]">{hgvs}</span>
                    </div>
                    <div className="text-[10px] text-teal-400 font-medium">{tier.replace(/_/g, ' ')}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onLoadRecent(item)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                      title="Load in Workbench"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => onCompareWithRecent(item)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-medium transition-colors"
                      title="Select for Comparison"
                    >
                      Compare
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
