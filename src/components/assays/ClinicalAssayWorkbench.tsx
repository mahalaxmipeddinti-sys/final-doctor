// src/components/assays/ClinicalAssayWorkbench.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
  getGeneContext,
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
  Edit3,
  RefreshCw,
  CheckCircle2,
  Filter,
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

  // Base variant from props or default
  const initialVariant = propVariant || activeResult?.normalizedVariant;

  // Interactive Editable Variant State
  const [inputGene, setInputGene] = useState<string>(
    initialVariant?.geneSymbol || activeResult?.clinvarRecord?.geneSymbol || 'BRCA1'
  );
  const [inputHgvs, setInputHgvs] = useState<string>(
    initialVariant?.hgvsc || 'c.5266dupC'
  );
  const [inputChr, setInputChr] = useState<string>(
    initialVariant?.chromosome || '17'
  );
  const [inputPos, setInputPos] = useState<number>(
    initialVariant?.position || 43044295
  );
  const [inputRef, setInputRef] = useState<string>(
    initialVariant?.referenceAllele || 'C'
  );
  const [inputAlt, setInputAlt] = useState<string>(
    initialVariant?.alternateAllele || 'CC'
  );
  const [inputZygosity, setInputZygosity] = useState<'Heterozygous' | 'Homozygous Alt' | 'Wildtype Ref'>(
    'Heterozygous'
  );

  // Modality-Specific Parameter Controls
  const [pcrAmpliconLen, setPcrAmpliconLen] = useState<number>(285);
  const [pcrAnnealingTemp, setPcrAnnealingTemp] = useState<number>(58.5);
  const [pcrCycles, setPcrCycles] = useState<number>(35);

  const [ngsVafPercent, setNgsVafPercent] = useState<number>(48);
  const [ngsDepth, setNgsDepth] = useState<number>(148);

  const [cmaCopyRatio, setCmaCopyRatio] = useState<number>(-0.88);
  const [karyotypeFormula, setKaryotypeFormula] = useState<string>('46,XY');

  // Sync internal state when propVariant changes from parent search
  useEffect(() => {
    if (propVariant) {
      setInputGene(propVariant.geneSymbol || 'BRCA1');
      setInputHgvs(propVariant.hgvsc || 'c.5266dupC');
      setInputChr(propVariant.chromosome || '17');
      setInputPos(propVariant.position || 43044295);
      setInputRef(propVariant.referenceAllele || 'C');
      setInputAlt(propVariant.alternateAllele || 'CC');

      // Update PCR amplicon default for known gene
      const ctx = getGeneContext(propVariant);
      setPcrAmpliconLen(ctx.ampliconLen);
    }
  }, [propVariant]);

  // Compute effective variant object reflecting user inputs & sample role
  const effectiveVariant = useMemo<
    NormalizedVariant & { vaf: number; zygosity: string; clinvarId?: string }
  >(() => {
    let roleVaf = ngsVafPercent / 100;
    let roleZygosity = inputZygosity;

    if (activeSample === 'mother') {
      roleVaf = 0.50;
      roleZygosity = 'Heterozygous';
    } else if (activeSample === 'father') {
      roleVaf = 0.00;
      roleZygosity = 'Wildtype Ref';
    }

    const geneClean = (inputGene || 'BRCA1').trim().toUpperCase();
    const refClean = (inputRef || 'N').trim().toUpperCase();
    const altClean = (inputAlt || 'N').trim().toUpperCase();

    return {
      originalInput: `${geneClean} ${inputHgvs}`,
      inputType: 'hgvs' as const,
      normalizedRepresentation: `chr${inputChr}:${inputPos} ${refClean}>${altClean}`,
      assembly: 'GRCh38' as const,
      chromosome: inputChr.replace(/^chr/i, ''),
      position: Number(inputPos) || 43044295,
      referenceAllele: refClean,
      alternateAllele: altClean,
      geneSymbol: geneClean,
      hgvsc: inputHgvs,
      hgvsp: `p.${geneClean}Var`,
      dbsnpRsid: initialVariant?.dbsnpRsid || 'rs80357906',
      validationStatus: 'VALID' as const,
      validationWarnings: [],
      zygosity: roleZygosity,
      vaf: roleVaf,
      clinvarId: (initialVariant as any)?.clinvarId || '17661',
    };
  }, [inputGene, inputHgvs, inputChr, inputPos, inputRef, inputAlt, inputZygosity, activeSample, ngsVafPercent, initialVariant]);

  // Generate simulated assay datasets bound directly to effectiveVariant and parameters
  const pcrData = useMemo<PcrData>(() => {
    const base = simulatePcrData(effectiveVariant);
    return {
      ...base,
      ampliconLengthBp: pcrAmpliconLen,
      gelBandSizeBp: pcrAmpliconLen,
      annealingTempC: pcrAnnealingTemp,
      cycles: pcrCycles,
    };
  }, [effectiveVariant, pcrAmpliconLen, pcrAnnealingTemp, pcrCycles]);

  const sangerData = useMemo<SangerData>(() => {
    return simulateSangerData(effectiveVariant);
  }, [effectiveVariant]);

  const ngsData = useMemo<NgsData>(() => {
    const base = simulateNgsData(effectiveVariant);
    const totalR = ngsDepth;
    const altR = Math.round(totalR * effectiveVariant.vaf);
    return {
      ...base,
      meanDepth: ngsDepth,
      totalReads: totalR,
      altReads: altR,
      refReads: totalR - altR,
      vaf: Number(effectiveVariant.vaf.toFixed(3)),
    };
  }, [effectiveVariant, ngsDepth]);

  const wesData = useMemo<WesData>(() => simulateWesData(effectiveVariant), [effectiveVariant]);
  const wgsData = useMemo<WgsData>(() => simulateWgsData(effectiveVariant), [effectiveVariant]);

  const microarrayData = useMemo<MicroarrayData>(() => {
    const base = simulateMicroarrayData(effectiveVariant);
    return {
      ...base,
      candidateGeneRatio: cmaCopyRatio,
    };
  }, [effectiveVariant, cmaCopyRatio]);

  const cmaData = useMemo<CmaData>(() => {
    const base = simulateCmaData(effectiveVariant);
    const updatedProbes = base.probes.map((p) => {
      if (p.isAbnormal) {
        return { ...p, log2Ratio: cmaCopyRatio };
      }
      return p;
    });
    return {
      ...base,
      abnormalityType:
        cmaCopyRatio < -0.3
          ? 'Copy Number Loss (Microdeletion)'
          : cmaCopyRatio > +0.3
          ? 'Copy Number Gain (Duplication)'
          : 'Normal Copy Number',
      probes: updatedProbes,
    };
  }, [effectiveVariant, cmaCopyRatio]);

  const genotypingData = useMemo<GenotypingData>(() => {
    return simulateGenotypingData(effectiveVariant);
  }, [effectiveVariant]);

  const karyotypingData = useMemo<KaryotypingData>(() => {
    const base = simulateKaryotypingData(effectiveVariant);
    return {
      ...base,
      karyotypeIscn: karyotypeFormula,
    };
  }, [effectiveVariant, karyotypeFormula]);

  const activeMeta = ASSAY_METADATA_LIST.find((m) => m.id === selectedAssay) || ASSAY_METADATA_LIST[0];

  // Preset Controls Loader
  const handleLoadPreset = (preset: {
    gene: string;
    hgvs: string;
    chr: string;
    pos: number;
    ref: string;
    alt: string;
    amplicon: number;
    vaf: number;
    cmaRatio: number;
    karyo: string;
    clinvarId?: string;
  }) => {
    setInputGene(preset.gene);
    setInputHgvs(preset.hgvs);
    setInputChr(preset.chr);
    setInputPos(preset.pos);
    setInputRef(preset.ref);
    setInputAlt(preset.alt);
    setPcrAmpliconLen(preset.amplicon);
    setNgsVafPercent(preset.vaf);
    setCmaCopyRatio(preset.cmaRatio);
    setKaryotypeFormula(preset.karyo);

    if (preset.clinvarId && onSelectVariant) {
      onSelectVariant(preset.clinvarId);
    }
  };

  const PRESETS = [
    {
      label: 'BRCA1 c.5266dupC',
      gene: 'BRCA1',
      hgvs: 'c.5266dupC',
      chr: '17',
      pos: 43044295,
      ref: 'C',
      alt: 'CC',
      amplicon: 285,
      vaf: 48,
      cmaRatio: -0.88,
      karyo: '46,XY',
      clinvarId: '17661',
    },
    {
      label: 'CFTR p.Phe508del',
      gene: 'CFTR',
      hgvs: 'c.1521_1523delCTT',
      chr: '7',
      pos: 117559590,
      ref: 'CTT',
      alt: '-',
      amplicon: 98,
      vaf: 50,
      cmaRatio: 0.02,
      karyo: '46,XX',
      clinvarId: '7105',
    },
    {
      label: 'BRAF p.Val600Glu',
      gene: 'BRAF',
      hgvs: 'c.1799T>A',
      chr: '7',
      pos: 140753336,
      ref: 'T',
      alt: 'A',
      amplicon: 224,
      vaf: 35,
      cmaRatio: 0.45,
      karyo: '46,XY',
      clinvarId: '13961',
    },
    {
      label: 'TP53 p.Arg175His',
      gene: 'TP53',
      hgvs: 'c.524G>A',
      chr: '17',
      pos: 7675088,
      ref: 'G',
      alt: 'A',
      amplicon: 288,
      vaf: 52,
      cmaRatio: -0.65,
      karyo: '46,XX',
      clinvarId: '12374',
    },
    {
      label: 'HBB c.20A>T (Sickle Cell)',
      gene: 'HBB',
      hgvs: 'c.20A>T',
      chr: '11',
      pos: 5227002,
      ref: 'A',
      alt: 'T',
      amplicon: 190,
      vaf: 98,
      cmaRatio: 0.01,
      karyo: '46,XY',
    },
    {
      label: 'Trisomy 21 (Down)',
      gene: 'DSCR1',
      hgvs: 'chr21_trisomy',
      chr: '21',
      pos: 15000000,
      ref: 'N',
      alt: '+21',
      amplicon: 450,
      vaf: 66,
      cmaRatio: +0.58,
      karyo: '47,XX,+21',
    },
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

          {/* Active Target Indicator & Quick Preset Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-950/90 border border-teal-500/40 rounded-xl px-3.5 py-2 flex items-center gap-3 shadow-inner">
              <div className="text-right">
                <span className="text-[10px] text-teal-400 font-mono block font-bold uppercase">
                  Active Simulation Target
                </span>
                <span className="text-xs font-bold text-slate-100 font-mono">
                  {effectiveVariant.geneSymbol} • {effectiveVariant.hgvsc}
                </span>
              </div>
              <span className="px-2 py-1 rounded bg-teal-500/20 text-teal-300 text-xs font-mono font-bold border border-teal-500/30">
                Chr{effectiveVariant.chromosome}:{effectiveVariant.position}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Clinical Presets Switcher Bar */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Preset Control:</span>
          </span>
          {PRESETS.map((p) => {
            const isMatch = inputGene === p.gene && inputHgvs === p.hgvs;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => handleLoadPreset(p)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all border ${
                  isMatch
                    ? 'bg-teal-600 text-white font-bold border-teal-400 shadow'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-teal-300 hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Family Member Sample Switcher (Child, Mother, Father, Trio) */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
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
            Selected Modality: <strong className="text-teal-300 uppercase">{activeMeta.name}</strong> •{' '}
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
      </div>

      {/* Interactive Input Parameters & Assay Tuning Panel */}
      <div className="bg-slate-900/90 border border-teal-500/30 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
              Interactive Input &amp; Assay Parameter Control Panel
            </h3>
          </div>
          <span className="text-[10px] font-mono text-teal-300 bg-teal-950/60 px-2.5 py-0.5 rounded border border-teal-500/40">
            Real-Time 2D &amp; 3D Propagation
          </span>
        </div>

        {/* Input Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Target Gene */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-semibold block">Target Gene Symbol</label>
            <input
              type="text"
              value={inputGene}
              onChange={(e) => setInputGene(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono font-bold focus:border-teal-400 focus:outline-none"
              placeholder="e.g. BRCA1"
            />
          </div>

          {/* cDNA / Mutation */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-semibold block">cDNA / HGVS Variant</label>
            <input
              type="text"
              value={inputHgvs}
              onChange={(e) => setInputHgvs(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:border-teal-400 focus:outline-none"
              placeholder="e.g. c.5266dupC"
            />
          </div>

          {/* Chromosome */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-semibold block">Chromosome</label>
            <select
              value={inputChr}
              onChange={(e) => setInputChr(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:border-teal-400 focus:outline-none"
            >
              {Array.from({ length: 22 }, (_, i) => String(i + 1))
                .concat(['X', 'Y'])
                .map((chr) => (
                  <option key={chr} value={chr}>
                    Chr {chr}
                  </option>
                ))}
            </select>
          </div>

          {/* Position */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-semibold block">Genomic Position (GRCh38)</label>
            <input
              type="number"
              value={inputPos}
              onChange={(e) => setInputPos(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:border-teal-400 focus:outline-none"
            />
          </div>

          {/* Ref / Alt Alleles */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-semibold block">Ref / Alt Allele</label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={inputRef}
                onChange={(e) => setInputRef(e.target.value.toUpperCase())}
                className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 font-mono text-center focus:border-teal-400 focus:outline-none"
                placeholder="Ref"
              />
              <span className="text-slate-500 font-bold">&gt;</span>
              <input
                type="text"
                value={inputAlt}
                onChange={(e) => setInputAlt(e.target.value.toUpperCase())}
                className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 font-mono text-center focus:border-teal-400 focus:outline-none"
                placeholder="Alt"
              />
            </div>
          </div>

          {/* Zygosity */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase font-semibold block">Genotype Zygosity</label>
            <select
              value={inputZygosity}
              onChange={(e) => setInputZygosity(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:border-teal-400 focus:outline-none"
            >
              <option value="Heterozygous">Heterozygous (0/1)</option>
              <option value="Homozygous Alt">Homozygous Alt (1/1)</option>
              <option value="Wildtype Ref">Wildtype Ref (0/0)</option>
            </select>
          </div>
        </div>

        {/* Modality-Specific Fine-Tuning Controls */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {selectedAssay === 'pcr' && (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Amplicon Size</span>
                  <span className="text-teal-300 font-bold">{pcrAmpliconLen} bp</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="10"
                  value={pcrAmpliconLen}
                  onChange={(e) => setPcrAmpliconLen(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Annealing Temp</span>
                  <span className="text-teal-300 font-bold">{pcrAnnealingTemp}°C</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="68"
                  step="0.5"
                  value={pcrAnnealingTemp}
                  onChange={(e) => setPcrAnnealingTemp(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Thermal Cycles</span>
                  <span className="text-teal-300 font-bold">{pcrCycles} cycles</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="40"
                  step="1"
                  value={pcrCycles}
                  onChange={(e) => setPcrCycles(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>
            </>
          )}

          {(selectedAssay === 'ngs' || selectedAssay === 'wes' || selectedAssay === 'wgs') && (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Variant Allele Frequency (VAF)</span>
                  <span className="text-teal-300 font-bold">{ngsVafPercent}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={ngsVafPercent}
                  onChange={(e) => setNgsVafPercent(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Mean Read Depth</span>
                  <span className="text-teal-300 font-bold">{ngsDepth}x</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="500"
                  step="10"
                  value={ngsDepth}
                  onChange={(e) => setNgsDepth(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>
            </>
          )}

          {(selectedAssay === 'microarray' || selectedAssay === 'cma') && (
            <div className="space-y-1 col-span-2">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Copy Number Log2 Ratio</span>
                <span className="text-teal-300 font-bold">
                  {cmaCopyRatio > 0 ? `+${cmaCopyRatio}` : cmaCopyRatio} (
                  {cmaCopyRatio < -0.3 ? 'Microdeletion' : cmaCopyRatio > 0.3 ? 'Duplication' : 'Normal Diploid'}
                  )
                </span>
              </div>
              <input
                type="range"
                min="-1.5"
                max="1.5"
                step="0.05"
                value={cmaCopyRatio}
                onChange={(e) => setCmaCopyRatio(Number(e.target.value))}
                className="w-full accent-teal-400 cursor-pointer"
              />
            </div>
          )}

          {selectedAssay === 'karyotyping' && (
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] text-slate-400 uppercase font-semibold block">
                ISCN Cytogenetic Formula
              </label>
              <input
                type="text"
                value={karyotypeFormula}
                onChange={(e) => setKaryotypeFormula(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-teal-300 font-mono font-bold focus:border-teal-400 focus:outline-none text-xs"
              />
            </div>
          )}
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
                targetGene={effectiveVariant.geneSymbol}
                variantInput={effectiveVariant.hgvsc}
                currentVariant={effectiveVariant}
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
              targetGene={effectiveVariant.geneSymbol}
              variantInput={effectiveVariant.hgvsc}
              currentVariant={effectiveVariant}
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
