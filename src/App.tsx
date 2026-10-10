// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { HomeView } from './components/HomeView.tsx';
import { DnaBackgroundCanvas } from './components/DnaBackgroundCanvas.tsx';
import { BenchmarkBar } from './components/BenchmarkBar.tsx';
import { AnalysisProgress } from './components/AnalysisProgress.tsx';
import { TriPillarSummary } from './components/TriPillarSummary.tsx';
import { ConflictCard } from './components/ConflictCard.tsx';
import { VariantDetailsTab } from './components/VariantDetailsTab.tsx';
import { ClinVarSubmissionsTab } from './components/ClinVarSubmissionsTab.tsx';
import { AnnotationTab } from './components/AnnotationTab.tsx';
import { MLExplainabilityTab } from './components/MLExplainabilityTab.tsx';
import { ACMGMatrixTab } from './components/ACMGMatrixTab.tsx';
import { ReportTab } from './components/ReportTab.tsx';
import { HistoryView } from './components/HistoryView.tsx';
import { MethodologyView } from './components/MethodologyView.tsx';
import { CompareVariantsView } from './components/CompareVariantsView.tsx';
import { FullAnalysisResult, GenomeAssembly, TrioMemberInput } from './types/genomics.ts';
import { BENCHMARK_VARIANTS, BenchmarkVariantPreset } from './services/benchmarkVariants.ts';
import { TrioPedigreeCard } from './components/TrioPedigreeCard.tsx';
import { TrioInputSection } from './components/TrioInputSection.tsx';
import { ClinicalAssayWorkbench } from './components/assays/ClinicalAssayWorkbench.tsx';
import {
  Search,
  ArrowRight,
  Database,
  Layers,
  Dna,
  Cpu,
  ShieldCheck,
  FileText,
  AlertCircle,
  Scale,
  ArrowLeft,
  Sparkles,
  Users,
  Activity,
} from 'lucide-react';

interface StepItem {
  label: string;
  subtext: string;
  status: 'pending' | 'running' | 'completed' | 'warning' | 'error';
}

export default function App() {
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'workbench' | 'matrix' | 'compare' | 'history' | 'methodology' | 'assays'>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [variantInput, setVariantInput] = useState<string>('17661'); // Default: BRCA1 founder
  const [assembly, setAssembly] = useState<GenomeAssembly>('GRCh38');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeResult, setActiveResult] = useState<FullAnalysisResult | null>(null);
  const [compareVariantA, setCompareVariantA] = useState<FullAnalysisResult | null>(null);
  const [compareVariantB, setCompareVariantB] = useState<FullAnalysisResult | null>(null);
  const [resultTab, setResultTab] = useState<'details' | 'trio' | 'clinvar' | 'annotation' | 'ml' | 'acmg' | 'assays' | 'report'>('details');
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [recentAnalyses, setRecentAnalyses] = useState<FullAnalysisResult[]>([]);
  const [userOverrides, setUserOverrides] = useState<Record<string, any>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Workbench Trio Mode State (Default Trio: Child, Mother, Father)
  const [workbenchInputMode, setWorkbenchInputMode] = useState<'single' | 'trio'>('trio');
  const [wbFamilyId, setWbFamilyId] = useState<string>('FAM-2025-01');
  const [wbChildInput, setWbChildInput] = useState<TrioMemberInput>({
    relationship: 'child',
    label: 'Proband (Child)',
    sampleId: 'CH-2025-01',
    variantInput: '17661',
    zygosity: 'HETEROZYGOUS',
    isAffected: true,
  });
  const [wbMotherInput, setWbMotherInput] = useState<TrioMemberInput>({
    relationship: 'mother',
    label: 'Mother (Maternal)',
    sampleId: 'MO-2025-01',
    variantInput: '',
    zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
    isAffected: false,
  });
  const [wbFatherInput, setWbFatherInput] = useState<TrioMemberInput>({
    relationship: 'father',
    label: 'Father (Paternal)',
    sampleId: 'FA-2025-01',
    variantInput: '',
    zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
    isAffected: false,
  });

  // Stepped progress tracking
  const [progressSteps, setProgressSteps] = useState<StepItem[]>([
    { label: 'Validation', subtext: 'Format & coordinates', status: 'pending' },
    { label: 'ClinVar Record', subtext: 'NCBI E-utilities', status: 'pending' },
    { label: 'Annotation', subtext: 'VEP & gnomAD', status: 'pending' },
    { label: 'ML Predictor', subtext: 'Feature calibration', status: 'pending' },
    { label: 'ACMG Engine', subtext: '28 Guideline rules', status: 'pending' },
    { label: 'Synthesis', subtext: 'Conflict detection', status: 'pending' },
  ]);

  // Initial data loading
  useEffect(() => {
    refreshHistory();
  }, []);

  const refreshHistory = async () => {
    try {
      const res = await fetch('/api/analyses');
      if (res.ok) {
        const data: FullAnalysisResult[] = await res.json();
        setHistoryCount(data.length);
        setRecentAnalyses(data);
      }
    } catch {
      // quiet fail
    }
  };

  const runAnalysis = async (
    inputStr: string,
    chosenAssembly: GenomeAssembly,
    overrides: Record<string, any> = {},
    targetTab: 'workbench' | 'matrix' | 'assays' = 'workbench',
    trioInput?: {
      child: TrioMemberInput;
      mother: TrioMemberInput;
      father: TrioMemberInput;
    }
  ) => {
    if (!inputStr.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    setActiveNavTab(targetTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Reset progress steps
    setProgressSteps([
      { label: 'Validation', subtext: 'Format & coordinates', status: 'running' },
      { label: 'ClinVar Record', subtext: 'NCBI E-utilities', status: 'pending' },
      { label: 'Annotation', subtext: 'VEP & gnomAD', status: 'pending' },
      { label: 'ML Predictor', subtext: 'Feature calibration', status: 'pending' },
      { label: 'ACMG Engine', subtext: '28 Guideline rules', status: 'pending' },
      { label: 'Synthesis', subtext: 'Conflict detection', status: 'pending' },
    ]);

    try {
      // Small simulated step pulse for responsive UI feedback
      setTimeout(() => {
        setProgressSteps((prev) => [
          { ...prev[0], status: 'completed' },
          { ...prev[1], status: 'running' },
          ...prev.slice(2),
        ]);
      }, 200);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: inputStr,
          assembly: chosenAssembly,
          userId: 'local-session',
          userOverrides: overrides,
          trioInput,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Analysis failed with HTTP status ${res.status}`);
      }

      const result: FullAnalysisResult = await res.json();
      setActiveResult(result);
      setVariantInput(inputStr);
      if (result.trioData) {
        setResultTab('trio');
      }

      // Complete progress steps
      setProgressSteps([
        { label: 'Validation', subtext: 'Format & coordinates', status: 'completed' },
        { label: 'ClinVar Record', subtext: 'NCBI E-utilities', status: result.clinvarRecord ? 'completed' : 'warning' },
        { label: 'Annotation', subtext: 'VEP & gnomAD', status: 'completed' },
        { label: 'ML Predictor', subtext: 'Feature calibration', status: 'completed' },
        { label: 'ACMG Engine', subtext: '28 Guideline rules', status: 'completed' },
        { label: 'Synthesis', subtext: 'Conflict detection', status: 'completed' },
      ]);

      refreshHistory();
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMsg(err.message || 'Error occurred during variant processing pipeline.');
      setProgressSteps((prev) => prev.map((s) => ({ ...s, status: 'error' })));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBenchmarkSelect = (preset: BenchmarkVariantPreset) => {
    setVariantInput(preset.clinvarId);
    runAnalysis(preset.clinvarId, assembly);
  };

  const handleApplyWbTrioPreset = (presetKey: 'denovo' | 'recessive' | 'maternal') => {
    if (presetKey === 'denovo') {
      setWbFamilyId('FAM-2025-DN');
      setWbChildInput({ relationship: 'child', label: 'Proband (Child)', sampleId: 'CH-2025-DN', variantInput: '17661', zygosity: 'HETEROZYGOUS', isAffected: true });
      setWbMotherInput({ relationship: 'mother', label: 'Mother (Maternal)', sampleId: 'MO-2025-DN', variantInput: '', zygosity: 'HOMOZYGOUS_REF_WILDTYPE', isAffected: false });
      setWbFatherInput({ relationship: 'father', label: 'Father (Paternal)', sampleId: 'FA-2025-DN', variantInput: '', zygosity: 'HOMOZYGOUS_REF_WILDTYPE', isAffected: false });
    } else if (presetKey === 'recessive') {
      setWbFamilyId('FAM-2025-REC');
      setWbChildInput({ relationship: 'child', label: 'Proband (Child)', sampleId: 'CH-2025-REC', variantInput: '7105', zygosity: 'HOMOZYGOUS_ALT', isAffected: true });
      setWbMotherInput({ relationship: 'mother', label: 'Mother (Maternal)', sampleId: 'MO-2025-REC', variantInput: '7105', zygosity: 'HETEROZYGOUS', isAffected: false });
      setWbFatherInput({ relationship: 'father', label: 'Father (Paternal)', sampleId: 'FA-2025-REC', variantInput: '7105', zygosity: 'HETEROZYGOUS', isAffected: false });
    } else if (presetKey === 'maternal') {
      setWbFamilyId('FAM-2025-MAT');
      setWbChildInput({ relationship: 'child', label: 'Proband (Child)', sampleId: 'CH-2025-MAT', variantInput: '13961', zygosity: 'HETEROZYGOUS', isAffected: true });
      setWbMotherInput({ relationship: 'mother', label: 'Mother (Maternal)', sampleId: 'MO-2025-MAT', variantInput: '13961', zygosity: 'HETEROZYGOUS', isAffected: true });
      setWbFatherInput({ relationship: 'father', label: 'Father (Paternal)', sampleId: 'FA-2025-MAT', variantInput: '', zygosity: 'HOMOZYGOUS_REF_WILDTYPE', isAffected: false });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserOverrides({});
    if (workbenchInputMode === 'trio') {
      runAnalysis(
        wbChildInput.variantInput,
        assembly,
        {},
        'workbench',
        {
          child: wbChildInput,
          mother: wbMotherInput,
          father: wbFatherInput,
        }
      );
    } else {
      runAnalysis(variantInput, assembly);
    }
  };

  const handleOverrideCriterion = async (code: string, newStatus: any) => {
    const updated = {
      ...userOverrides,
      [code]: {
        status: newStatus,
        rationale: `Manual clinician override: status set to ${newStatus}.`,
      },
    };
    setUserOverrides(updated);
    if (activeResult) {
      runAnalysis(variantInput, assembly, updated, activeNavTab === 'matrix' ? 'matrix' : 'workbench');
    }
  };

  const handleLoadFromHistory = (historicalItem: FullAnalysisResult) => {
    setActiveResult(historicalItem);
    setVariantInput(historicalItem.normalizedVariant.originalInput);
    setActiveNavTab('workbench');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartComparisonWith = (itemA: FullAnalysisResult) => {
    setCompareVariantA(itemA);
    setActiveNavTab('compare');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased selection:bg-teal-500/30 relative">
      {/* 3D Animated DNA Double Helix Background Canvas */}
      <DnaBackgroundCanvas />

      {/* Persistent Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        analysisCount={historyCount}
        onNewAnalysis={() => {
          setActiveNavTab('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        onSelectBenchmark={(presetClinvarId) => {
          setVariantInput(presetClinvarId);
          runAnalysis(presetClinvarId, assembly);
        }}
      />

      {/* Main Content Viewport Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header with three-bar toggle and breadcrumbs */}
        <Header
          activeTab={activeNavTab}
          setActiveTab={setActiveNavTab}
          analysisCount={historyCount}
          onNewAnalysis={() => {
            setActiveNavTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onToggleSidebar={() => {
            if (window.innerWidth >= 768) {
              setIsSidebarCollapsed((prev) => !prev);
            } else {
              setIsMobileSidebarOpen((prev) => !prev);
            }
          }}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* NAV TAB 0: CLEAN HOME VIEW */}
        {activeNavTab === 'home' && (
          <HomeView
            onSearch={(input, chosenAssembly, trioInput) => {
              setAssembly(chosenAssembly);
              runAnalysis(input, chosenAssembly, {}, 'workbench', trioInput);
            }}
            onNavigateTab={(tab) => {
              setActiveNavTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isAnalyzing={isAnalyzing}
            historyCount={historyCount}
            recentAnalyses={recentAnalyses}
            onLoadRecent={handleLoadFromHistory}
            onCompareWithRecent={handleStartComparisonWith}
          />
        )}

        {/* NAV TAB 1: WORKBENCH */}
        {activeNavTab === 'workbench' && (
          <div className="space-y-6">
            {/* 1-Click Benchmark Controls Bar */}
            <BenchmarkBar onSelect={handleBenchmarkSelect} selectedId={variantInput} />

            {/* Input Search & Assembly Selector Panel */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-md backdrop-blur space-y-4">
              {/* Mode Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setWorkbenchInputMode('trio')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      workbenchInputMode === 'trio'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Family Trio Inputs (Child • Mother • Father)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkbenchInputMode('single')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      workbenchInputMode === 'single'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Single Variant Search</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  <label className="text-xs text-slate-400 font-medium">Assembly:</label>
                  <select
                    value={assembly}
                    onChange={(e) => setAssembly(e.target.value as GenomeAssembly)}
                    className="bg-slate-950 border border-slate-800 text-xs font-mono text-teal-300 rounded px-2.5 py-1 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="GRCh38">GRCh38 (Default)</option>
                    <option value="GRCh37">GRCh37 (hg19)</option>
                  </select>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {workbenchInputMode === 'trio' ? (
                  <div className="space-y-4">
                    <TrioInputSection
                      childInput={wbChildInput}
                      motherInput={wbMotherInput}
                      fatherInput={wbFatherInput}
                      onChangeChild={(d) => setWbChildInput((prev) => ({ ...prev, ...d }))}
                      onChangeMother={(d) => setWbMotherInput((prev) => ({ ...prev, ...d }))}
                      onChangeFather={(d) => setWbFatherInput((prev) => ({ ...prev, ...d }))}
                      onApplyTrioPreset={handleApplyWbTrioPreset}
                      familyId={wbFamilyId}
                      onFamilyIdChange={setWbFamilyId}
                      assembly={assembly}
                    />

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={isAnalyzing || !wbChildInput.variantInput.trim()}
                        className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-2 shadow-md shadow-teal-900/30"
                      >
                        <span>{isAnalyzing ? 'Analyzing Family Trio...' : 'Execute Trio Analysis'}</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={variantInput}
                          onChange={(e) => setVariantInput(e.target.value)}
                          placeholder="e.g. 17661, NM_007294.4:c.5266dupC, chr7:140753336:T>A, or BRAF V600E"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm font-mono text-slate-100 rounded-lg pl-3.5 pr-20 py-2.5 outline-none transition-all placeholder:text-slate-600"
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {assembly}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isAnalyzing || !variantInput.trim()}
                        className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center space-x-2 shadow-sm flex-shrink-0"
                      >
                        <span>{isAnalyzing ? 'Analyzing Pipeline...' : 'Analyze Variant'}</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Accepts ClinVar ID (17661), HGVS (NM_007294.4:c.5266dupC), or coordinates (chr17:43044295:G&gt;A).
                    </p>
                  </div>
                )}
              </form>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div className="bg-rose-950/40 border border-rose-800/80 rounded-lg p-3 text-xs text-rose-300 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* Progress Stepper (Active during analysis or recently completed) */}
            {(isAnalyzing || activeResult) && (
              <AnalysisProgress steps={progressSteps} currentStepIndex={0} />
            )}

            {/* Active Analysis Results Display */}
            {activeResult && (
              <div className="space-y-5">
                {/* Cross-Feature Contextual Action Toolbar */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-semibold text-slate-200">Active Variant:</span>
                    <span className="font-bold text-teal-300">
                      {activeResult.normalizedVariant.geneSymbol || 'Gene'}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {activeResult.normalizedVariant.hgvsc || activeResult.normalizedVariant.originalInput}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Compare with another variant */}
                    <button
                      onClick={() => handleStartComparisonWith(activeResult)}
                      className="px-3 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-200 border border-sky-800/80 text-xs font-medium flex items-center space-x-1.5 transition-colors"
                      title="Pre-select this variant in Compare tab"
                    >
                      <Scale className="w-3.5 h-3.5 text-sky-400" />
                      <span>Compare with Another</span>
                    </button>

                    {/* Inspect in 28 Rules matrix */}
                    <button
                      onClick={() => {
                        setActiveNavTab('matrix');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-800/80 text-xs font-medium flex items-center space-x-1.5 transition-colors"
                      title="Inspect full 28-criteria rule matrix"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Inspect 28 Rules</span>
                    </button>

                    {/* Test in 9-Assay Lab (2D/3D) */}
                    <button
                      onClick={() => setResultTab('assays')}
                      className="px-3 py-1.5 rounded-lg bg-teal-950/80 hover:bg-teal-900 text-teal-200 border border-teal-800/80 text-xs font-medium flex items-center space-x-1.5 transition-colors"
                      title="Test all 9 diagnostic assays (PCR, Sanger, NGS, WES, WGS, Microarray, CMA, Genotyping, Karyotyping) in 2D & 3D"
                    >
                      <Activity className="w-3.5 h-3.5 text-teal-400" />
                      <span>Test 9 Assays (2D/3D)</span>
                    </button>

                    {/* Quick switch to report tab */}
                    <button
                      onClick={() => setResultTab('report')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-colors"
                      title="View auditable clinical report"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-400" />
                      <span>Clinical Report</span>
                    </button>
                  </div>
                </div>

                {/* 1. Flagship Tri-Pillar Visual Banner */}
                <TriPillarSummary result={activeResult} />

                {/* 2. Detected Conflicts / Dissonance Alert */}
                <ConflictCard conflicts={activeResult.conflicts} />

                {/* 3. Deep-Dive Tab Navigation */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-md backdrop-blur">
                  <div className="border-b border-slate-800 bg-slate-950/60 px-4 flex items-center space-x-1 overflow-x-auto">
                    <button
                      onClick={() => setResultTab('details')}
                      className={`px-3 py-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-all whitespace-nowrap ${
                        resultTab === 'details'
                          ? 'border-teal-400 text-teal-300'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Dna className="h-3.5 w-3.5" />
                      <span>Variant Identity</span>
                    </button>

                    <button
                      onClick={() => setResultTab('clinvar')}
                      className={`px-3 py-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-all whitespace-nowrap ${
                        resultTab === 'clinvar'
                          ? 'border-teal-400 text-teal-300'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Database className="h-3.5 w-3.5" />
                      <span>ClinVar Submissions ({activeResult.clinvarRecord?.submissions.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setResultTab('annotation')}
                      className={`px-3 py-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-all whitespace-nowrap ${
                        resultTab === 'annotation'
                          ? 'border-teal-400 text-teal-300'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Annotation &amp; gnomAD</span>
                    </button>

                    <button
                      onClick={() => setResultTab('ml')}
                      className={`px-3 py-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-all whitespace-nowrap ${
                        resultTab === 'ml'
                          ? 'border-teal-400 text-teal-300'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Cpu className="h-3.5 w-3.5" />
                      <span>ML Explainability</span>
                    </button>

                    <button
                      onClick={() => setResultTab('acmg')}
                      className={`px-3 py-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-all whitespace-nowrap ${
                        resultTab === 'acmg'
                          ? 'border-teal-400 text-teal-300'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>ACMG 28-Rules ({activeResult.acmgEvaluation?.supportedCriteria.length || 0})</span>
                    </button>

                    {activeResult.trioData && (
                      <button
                        onClick={() => setResultTab('trio')}
                        className={`px-3 py-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-all whitespace-nowrap ${
                          resultTab === 'trio'
                            ? 'border-purple-400 text-purple-300'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Users className="h-3.5 w-3.5 text-purple-400" />
                        <span>Family Trio Pedigree</span>
                        <span className="text-[10px] font-mono px-1 rounded bg-purple-500/20 text-purple-300 ml-1">
                          TRIO
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => setResultTab('assays')}
                      className={`px-3 py-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-all whitespace-nowrap ${
                        resultTab === 'assays'
                          ? 'border-teal-400 text-teal-300'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Activity className="h-3.5 w-3.5 text-teal-400" />
                      <span>Assay Lab (2D/3D)</span>
                      <span className="text-[10px] font-mono px-1 rounded bg-teal-500/20 text-teal-300 font-bold ml-1">
                        9 ASSAYS
                      </span>
                    </button>

                    <button
                      onClick={() => setResultTab('report')}
                      className={`px-3 py-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-all whitespace-nowrap ${
                        resultTab === 'report'
                          ? 'border-teal-400 text-teal-300'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Clinical Report &amp; Export</span>
                    </button>
                  </div>

                  {/* Active Tab Body */}
                  <div className="p-5">
                    {resultTab === 'details' && (
                      <VariantDetailsTab
                        variant={activeResult.normalizedVariant}
                        annotation={activeResult.annotationData}
                      />
                    )}

                    {resultTab === 'trio' && activeResult.trioData && (
                      <TrioPedigreeCard trioData={activeResult.trioData} />
                    )}

                    {resultTab === 'clinvar' && (
                      <ClinVarSubmissionsTab clinvar={activeResult.clinvarRecord} />
                    )}

                    {resultTab === 'annotation' && (
                      <AnnotationTab annotation={activeResult.annotationData} />
                    )}

                    {resultTab === 'ml' && (
                      <MLExplainabilityTab prediction={activeResult.mlPrediction} />
                    )}

                    {resultTab === 'acmg' && (
                      <ACMGMatrixTab
                        evaluation={activeResult.acmgEvaluation}
                        onOverrideCriterion={handleOverrideCriterion}
                      />
                    )}

                    {resultTab === 'assays' && (
                      <ClinicalAssayWorkbench
                        activeResult={activeResult}
                        currentVariant={activeResult.normalizedVariant}
                        childInput={wbChildInput}
                        motherInput={wbMotherInput}
                        fatherInput={wbFatherInput}
                        onSelectVariant={(id) => runAnalysis(id, assembly, {}, 'workbench')}
                      />
                    )}

                    {resultTab === 'report' && <ReportTab result={activeResult} />}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NAV TAB 2: ACMG 28-RULES MATRIX DIRECT */}
        {activeNavTab === 'matrix' && (
          <div className="space-y-4">
            {activeResult?.acmgEvaluation ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 backdrop-blur">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-400">Inspecting Variant:</span>
                    <strong className="text-teal-300">
                      {activeResult.normalizedVariant.geneSymbol || 'Gene'}
                    </strong>
                    <span className="font-mono text-slate-400">
                      {activeResult.normalizedVariant.hgvsc || activeResult.normalizedVariant.originalInput}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setActiveNavTab('workbench')}
                      className="text-xs text-teal-400 hover:text-teal-300 flex items-center space-x-1"
                    >
                      <span>Open Full Workbench</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <ACMGMatrixTab
                  evaluation={activeResult.acmgEvaluation}
                  onOverrideCriterion={handleOverrideCriterion}
                />
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-10 text-center space-y-4 backdrop-blur">
                <ShieldCheck className="w-10 h-10 text-teal-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-200">No Variant Analyzed Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Run an analysis or select one of the clinical benchmark controls to view the active 28-rule ACMG guideline matrix and Bayesian point scores.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <button
                    onClick={() => runAnalysis('17661', 'GRCh38', {}, 'matrix')}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold"
                  >
                    Load BRCA1 c.5266dupC
                  </button>
                  <button
                    onClick={() => runAnalysis('13961', 'GRCh38', {}, 'matrix')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                  >
                    Load BRAF V600E
                  </button>
                  <button
                    onClick={() => runAnalysis('7105', 'GRCh38', {}, 'matrix')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                  >
                    Load CFTR F508del
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NAV TAB 3: COMPARE VARIANTS (SIDE-BY-SIDE DIFF) */}
        {activeNavTab === 'compare' && (
          <CompareVariantsView
            onLoadVariantInWorkbench={(analysis) => {
              setActiveResult(analysis);
              setVariantInput(analysis.normalizedVariant.originalInput);
              setActiveNavTab('workbench');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            preselectedA={compareVariantA}
            preselectedB={compareVariantB}
          />
        )}

        {/* NAV TAB 4: HISTORY (Cloud SQL PostgreSQL) */}
        {activeNavTab === 'history' && (
          <HistoryView
            onLoadAnalysis={handleLoadFromHistory}
            onCompareAnalyses={(itemA, itemB) => {
              setCompareVariantA(itemA);
              setCompareVariantB(itemB);
              setActiveNavTab('compare');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* NAV TAB 5: METHODOLOGY */}
        {activeNavTab === 'methodology' && <MethodologyView />}

        {/* NAV TAB 6: DIAGNOSTIC ASSAY LAB (2D & 3D SIMULATOR) */}
        {activeNavTab === 'assays' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 backdrop-blur gap-2">
              <div className="flex items-center space-x-2 text-xs flex-wrap">
                <span className="text-slate-400">Target Subject:</span>
                <strong className="text-teal-300">
                  {activeResult?.normalizedVariant.geneSymbol || 'BRCA1'}
                </strong>
                <span className="font-mono text-slate-400">
                  {activeResult?.normalizedVariant.hgvsc || 'c.5266dupC'}
                </span>
                {wbChildInput.sampleId && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                    Child ID: {wbChildInput.sampleId}
                  </span>
                )}
                {wbMotherInput.sampleId && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    Mother ID: {wbMotherInput.sampleId}
                  </span>
                )}
                {wbFatherInput.sampleId && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                    Father ID: {wbFatherInput.sampleId}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setActiveNavTab('workbench');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs text-teal-400 hover:text-teal-300 flex items-center space-x-1"
                >
                  <span>Open Clinical Workbench</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <ClinicalAssayWorkbench
              activeResult={activeResult}
              currentVariant={activeResult?.normalizedVariant}
              childInput={wbChildInput}
              motherInput={wbMotherInput}
              fatherInput={wbFatherInput}
              onSelectVariant={(id) => runAnalysis(id, assembly, {}, 'assays')}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/90 py-4 text-center text-[11px] text-slate-500 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-400">
            DNA Doctor — Clinical Genomic Variant Pathogenicity Predictor &amp; ACMG Classifier
          </span>
          <span className="font-mono text-slate-600">
            PostgreSQL Backend • NCBI E-utilities • Ensembl VEP REST • Richards et al. 2015
          </span>
          <span className="text-amber-500/80 font-medium">Research &amp; Educational Diagnostic Console</span>
        </div>
      </footer>
      </div>
    </div>
  );
}
