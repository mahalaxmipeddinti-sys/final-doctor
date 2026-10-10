// src/components/assays/ClinicalAssayWorkbench.tsx
import React, { useState, useMemo } from 'react';
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
} from '../../types/assays.ts';
import {
  ASSAY_METADATA_LIST,
  simulatePcrData,
  simulateSangerData,
  simulateNgsData,
  simulateWesData,
  simulateWgsData,
  simulateMicroarrayData,
  simulateCmaData,
  simulateGenotypingData,
  simulateKaryotypingData,
} from '../../services/assayService.ts';
import { Assay2DVisualizer } from './Assay2DVisualizer.tsx';
import { Assay3DVisualizer } from './Assay3DVisualizer.tsx';
import { NormalizedVariant, FullAnalysisResult, TrioMemberInput } from '../../types/genomics.ts';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Dna,
  Zap,
  Layers,
  Activity,
  Cpu,
  ShieldCheck,
  Search,
  Sliders,
  Maximize2,
  Box,
  Split,
  Eye,
  Clock,
  DollarSign,
  Award,
  ChevronRight,
  HelpCircle,
  Users,
  User,
  FlaskConical,
  TestTube,
} from 'lucide-react';

interface ClinicalAssayWorkbenchProps {
  activeResult?: FullAnalysisResult | null;
  currentVariant?: NormalizedVariant;
  onSelectVariant?: (clinvarId: string) => void;
  childInput?: TrioMemberInput;
  motherInput?: TrioMemberInput;
  fatherInput?: TrioMemberInput;
}

export const ClinicalAssayWorkbench: React.FC<ClinicalAssayWorkbenchProps> = ({
  activeResult,
  currentVariant: propVariant,
  onSelectVariant,
  childInput,
  motherInput,
  fatherInput,
}) => {
  const [selectedAssay, setSelectedAssay] = useState<AssayType>('sanger');
  const [dimensionMode, setDimensionMode] = useState<'2d' | '3d' | 'split'>('split');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [activeSample, setActiveSample] = useState<'child' | 'mother' | 'father' | 'trio'>('child');

  // Sample ID Resolution from Trio Inputs or activeResult
  const childId = childInput?.sampleId || activeResult?.trioData?.child?.sampleId || 'CH-2025-01';
  const motherId = motherInput?.sampleId || activeResult?.trioData?.mother?.sampleId || 'MO-2025-01';
  const fatherId = fatherInput?.sampleId || activeResult?.trioData?.father?.sampleId || 'FA-2025-01';

  // Active Variant context
  const variant = propVariant || activeResult?.normalizedVariant;
  const gene = variant?.geneSymbol || activeResult?.clinvarRecord?.geneSymbol || 'BRCA1';

  // Generate simulated assay datasets based on current variant
  const pcrData = useMemo(() => simulatePcrData(variant), [variant]);
  const sangerData = useMemo(() => simulateSangerData(variant), [variant]);
  const ngsData = useMemo(() => simulateNgsData(variant), [variant]);
  const wesData = useMemo(() => simulateWesData(variant), [variant]);
  const wgsData = useMemo(() => simulateWgsData(variant), [variant]);
  const microarrayData = useMemo(() => simulateMicroarrayData(variant), [variant]);
  const cmaData = useMemo(() => simulateCmaData(variant), [variant]);
  const genotypingData = useMemo(() => simulateGenotypingData(variant), [variant]);
  const karyotypingData = useMemo(() => simulateKaryotypingData(variant), [variant]);

  const activeMeta = ASSAY_METADATA_LIST.find((m) => m.id === selectedAssay) || ASSAY_METADATA_LIST[0];

  // Quick preset variant benchmark tester
  const PRESET_VARIANTS = [
    { id: '17661', gene: 'BRCA1', label: 'c.5266dupC', type: 'Small Indel' },
    { id: '7105', gene: 'CFTR', label: 'p.Phe508del', type: 'In-Frame Del' },
    { id: '13961', gene: 'BRAF', label: 'p.Val600Glu', type: 'SNV Missense' },
    { id: '12374', gene: 'TP53', label: 'p.Arg175His', type: 'Hotspot Missense' },
  ];

  return (
    <div className="space-y-6">
      {/* Flagship Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm border border-teal-500/30">
                <FlaskConical className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2 flex-wrap">
                  <span>Molecular &amp; Cytogenomic Assay Laboratory</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                    2D &amp; 3D SIMULATOR
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    9 ASSAYS
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Orthogonal verification across PCR, Sanger, NGS, WES, WGS, Microarray, CMA, Genotyping, and Karyotyping.
                </p>
              </div>
            </div>
          </div>

          {/* Test Subject & Trio Sample Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono block">Active Target Gene</span>
                <span className="text-xs font-bold text-teal-300 font-mono">
                  {gene} • {variant?.hgvsc || 'c.5266dupC'}
                </span>
              </div>
              <span className="px-2 py-1 rounded bg-teal-500/20 text-teal-300 text-xs font-mono font-bold">
                {variant?.assembly || 'GRCh38'}
              </span>
            </div>

            {/* Quick Benchmark Preset Selectors */}
            {onSelectVariant && (
              <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-800 p-1 rounded-xl">
                <span className="text-[10px] text-slate-400 font-mono px-1.5 hidden sm:inline">Presets:</span>
                {PRESET_VARIANTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectVariant(p.id)}
                    className="px-2 py-1 rounded text-[11px] font-mono text-slate-300 hover:text-teal-300 hover:bg-slate-800 transition-colors"
                    title={`Load ${p.gene} ${p.label}`}
                  >
                    {p.gene}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Family Member Sample Switcher (Child, Mother, Father, Trio) */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Tested Sample Subject:</span>
            </span>
            <div className="inline-flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveSample('child')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  activeSample === 'child'
                    ? 'bg-teal-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>👶 Proband (Child)</span>
                <span className="text-[10px] opacity-80 underline">{childId}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSample('mother')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  activeSample === 'mother'
                    ? 'bg-purple-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>👩 Mother</span>
                <span className="text-[10px] opacity-80 underline">{motherId}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSample('father')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  activeSample === 'father'
                    ? 'bg-sky-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>👨 Father</span>
                <span className="text-[10px] opacity-80 underline">{fatherId}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSample('trio')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  activeSample === 'trio'
                    ? 'bg-amber-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🧬 Trio Cascade</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Selected Assay: <strong className="text-teal-300 uppercase">{activeMeta.name}</strong> •{' '}
            <span className="text-slate-300">{activeMeta.category}</span>
          </div>
        </div>

        {/* 9 Assay Selector Buttons */}
        <div className="pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-2">
            Select Diagnostic Assay Modality:
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 text-xs">
            {ASSAY_METADATA_LIST.map((assay) => {
              const isSelected = selectedAssay === assay.id;
              return (
                <button
                  key={assay.id}
                  type="button"
                  onClick={() => setSelectedAssay(assay.id)}
                  className={`py-2 px-2 rounded-xl text-center font-medium border transition-all flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-teal-600 border-teal-400 text-white font-bold shadow-lg shadow-teal-900/40 scale-105'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-xs uppercase tracking-tight">{assay.name}</span>
                  <span
                    className={`text-[8px] font-mono rounded px-1 ${
                      isSelected ? 'bg-teal-700 text-teal-100' : 'text-slate-500'
                    }`}
                  >
                    {assay.costBracket}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Click Inspection Indicator */}
        <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0" />
            <span className="text-[11px] text-slate-300">
              <strong className="text-teal-300">Interactive Click-to-Inspect Enabled:</strong> Click any gel lane, electropherogram peak, BAM read, exon, SV, array spot, CMA probe, genotype, or chromosome to view full laboratory metrics.
            </span>
          </div>
          <span className="text-[10px] font-mono text-teal-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0">
            2D &amp; 3D Synchronized
          </span>
        </div>
      </div>

      {/* Control Bar: View Dimensions (2D / 3D / Split) & Playback Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Dimension Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setDimensionMode('split')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              dimensionMode === 'split'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>Split 2D / 3D View</span>
          </button>

          <button
            type="button"
            onClick={() => setDimensionMode('2d')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              dimensionMode === '2d'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>2D Instrument View</span>
          </button>

          <button
            type="button"
            onClick={() => setDimensionMode('3d')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              dimensionMode === '3d'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Spatial Model</span>
          </button>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Play / Pause */}
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Animation' : 'Play Animation'}</span>
          </button>

          {/* Speed Controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded ${
                  speed === s ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Animation Display Area */}
      <div className="space-y-4">
        {dimensionMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 2D Panel */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                  <span>2D Diagnostic Flow &amp; Electropherogram / Instrument Traces</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  Subject: {activeSample === 'child' ? childId : activeSample === 'mother' ? motherId : activeSample === 'father' ? fatherId : 'Trio'}
                </span>
              </div>
              <Assay2DVisualizer
                assayType={selectedAssay}
                pcrData={pcrData}
                sangerData={sangerData}
                ngsData={ngsData}
                wesData={wesData}
                wgsData={wgsData}
                microarrayData={microarrayData}
                cmaData={cmaData}
                genotypingData={genotypingData}
                karyotypingData={karyotypingData}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying((p) => !p)}
                speed={speed}
              />
            </div>

            {/* 3D Panel */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                  <Box className="w-4 h-4 text-teal-400" />
                  <span>3D Molecular / Cytogenomic WebGL Spatial Simulator</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Drag to Rotate • Zoom (+/-)</span>
              </div>
              <Assay3DVisualizer
                assayType={selectedAssay}
                targetGene={gene}
                variantInput={variant?.hgvsc || 'c.5266dupC'}
                isPlaying={isPlaying}
                speed={speed}
              />
            </div>
          </div>
        )}

        {dimensionMode === '2d' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                <span>2D Diagnostic Flow &amp; Electropherogram / Instrument Traces</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Full Width View</span>
            </div>
            <Assay2DVisualizer
              assayType={selectedAssay}
              pcrData={pcrData}
              sangerData={sangerData}
              ngsData={ngsData}
              wesData={wesData}
              wgsData={wgsData}
              microarrayData={microarrayData}
              cmaData={cmaData}
              genotypingData={genotypingData}
              karyotypingData={karyotypingData}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              speed={speed}
            />
          </div>
        )}

        {dimensionMode === '3d' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <Box className="w-4 h-4 text-teal-400" />
                <span>3D Molecular / Cytogenomic WebGL Spatial Simulator</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Full Width 3D WebGL</span>
            </div>
            <Assay3DVisualizer
              assayType={selectedAssay}
              targetGene={gene}
              variantInput={variant?.hgvsc || 'c.5266dupC'}
              isPlaying={isPlaying}
              speed={speed}
            />
          </div>
        )}
      </div>

      {/* Clinical Guidance & Assay Specifications Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-slate-100">
              {activeMeta.fullName} — Clinical Specifications &amp; Ordering Criteria
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-bold border border-slate-700">
            {activeMeta.category}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-slate-300">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1 mb-1">
              <Sliders className="w-3 h-3 text-teal-400" /> Resolution Limit
            </span>
            <span className="font-semibold text-slate-100 block">{activeMeta.resolution}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-sky-400" /> Turnaround Time
            </span>
            <span className="font-semibold text-slate-100 block">{activeMeta.turnaroundTime}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-amber-400" /> Cost Tier
            </span>
            <span className="font-semibold text-slate-100 block">{activeMeta.costBracket} Tier</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1 mb-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Target Analytes
            </span>
            <span className="font-semibold text-slate-100 block truncate">{activeMeta.targetAnalytes}</span>
          </div>
        </div>

        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">
            Clinical Diagnostic Utility &amp; Guideline Indication
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            {activeMeta.clinicalUtility}
          </p>
        </div>
      </div>
    </div>
  );
};
