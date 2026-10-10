// src/components/assays/Assay2DVisualizer.tsx
import React, { useState, useEffect } from 'react';
import {
  AssayType,
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
  Play,
  Pause,
  RotateCcw,
  Zap,
  Activity,
  Layers,
  Dna,
  ZoomIn,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Info,
  MousePointerClick,
  Sparkles,
  ChevronRight,
  Eye,
  Crosshair,
  ShieldCheck,
} from 'lucide-react';

interface Assay2DVisualizerProps {
  assayType: AssayType;
  pcrData: PcrData;
  sangerData: SangerData;
  ngsData: NgsData;
  wesData: WesData;
  wgsData: WgsData;
  microarrayData: MicroarrayData;
  cmaData: CmaData;
  genotypingData: GenotypingData;
  karyotypingData: KaryotypingData;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
}

export const Assay2DVisualizer: React.FC<Assay2DVisualizerProps> = ({
  assayType,
  pcrData,
  sangerData,
  ngsData,
  wesData,
  wgsData,
  microarrayData,
  cmaData,
  genotypingData,
  karyotypingData,
  isPlaying,
  onTogglePlay,
  speed,
}) => {
  // Animation loop tickers
  const [animationTick, setAnimationTick] = useState<number>(0);
  const [activeCycle, setActiveCycle] = useState<number>(1);

  // Interactive Click State across all 9 assays
  const [selectedGelLane, setSelectedGelLane] = useState<string>('Patient');
  const [selectedPcrCycle, setSelectedPcrCycle] = useState<number>(22);
  const [selectedSangerCall, setSelectedSangerCall] = useState<any>(null);
  const [selectedNgsRead, setSelectedNgsRead] = useState<any>(null);
  const [selectedWesExon, setSelectedWesExon] = useState<any>(null);
  const [selectedWgsSv, setSelectedWgsSv] = useState<any>(null);
  const [selectedSpot, setSelectedSpot] = useState<any>(null);
  const [selectedCmaProbe, setSelectedCmaProbe] = useState<any>(null);
  const [selectedGenotypingPoint, setSelectedGenotypingPoint] = useState<any>(null);
  const [genotypingFilter, setGenotypingFilter] = useState<'ALL' | 'AA' | 'AB' | 'BB' | 'PATIENT'>('ALL');
  const [selectedChromosome, setSelectedChromosome] = useState<any>(null);

  useEffect(() => {
    let animId: number;
    if (isPlaying) {
      const interval = setInterval(() => {
        setAnimationTick((prev) => prev + 1);
        setActiveCycle((prev) => (prev >= 35 ? 1 : prev + 1));
      }, Math.max(40, 100 / speed));
      return () => clearInterval(interval);
    }
  }, [isPlaying, speed]);

  // Auto-initialize selected items based on active assay data
  useEffect(() => {
    if (sangerData?.calls?.length && !selectedSangerCall) {
      const variantCall = sangerData.calls.find((c) => c.isVariantSite) || sangerData.calls[0];
      setSelectedSangerCall(variantCall);
    }
  }, [sangerData, selectedSangerCall]);

  useEffect(() => {
    if (ngsData?.reads?.length && !selectedNgsRead) {
      const mismatchRead = ngsData.reads.find((r) => r.hasMismatch) || ngsData.reads[0];
      setSelectedNgsRead(mismatchRead);
    }
  }, [ngsData, selectedNgsRead]);

  useEffect(() => {
    if (wesData?.exons?.length && !selectedWesExon) {
      const variantExon = wesData.exons.find((e) => e.containsVariant) || wesData.exons[0];
      setSelectedWesExon(variantExon);
    }
  }, [wesData, selectedWesExon]);

  useEffect(() => {
    if (wgsData?.svCalls?.length && !selectedWgsSv) {
      setSelectedWgsSv(wgsData.svCalls[0]);
    }
  }, [wgsData, selectedWgsSv]);

  useEffect(() => {
    if (microarrayData?.spots?.length && !selectedSpot) {
      const match =
        microarrayData.spots.find((s) => s.gene === microarrayData.candidateGeneSymbol) ||
        microarrayData.spots[0];
      setSelectedSpot(match);
    }
  }, [microarrayData, selectedSpot]);

  useEffect(() => {
    if (cmaData?.probes?.length && !selectedCmaProbe) {
      const abnormalProbe = cmaData.probes.find((p) => p.isAbnormal) || cmaData.probes[0];
      setSelectedCmaProbe(abnormalProbe);
    }
  }, [cmaData, selectedCmaProbe]);

  useEffect(() => {
    if (genotypingData?.clusterPoints?.length && !selectedGenotypingPoint) {
      const patientPoint =
        genotypingData.clusterPoints.find((p) => p.sampleType === 'Patient Proband') ||
        genotypingData.clusterPoints[0];
      setSelectedGenotypingPoint(patientPoint);
    }
  }, [genotypingData, selectedGenotypingPoint]);

  useEffect(() => {
    if (karyotypingData?.chromosomes?.length && !selectedChromosome) {
      // Pick Chr 17 if present (BRCA1/TP53), else Chr 7 (CFTR/BRAF), else first
      const defaultChr =
        karyotypingData.chromosomes.find((c) => c.number === '17') ||
        karyotypingData.chromosomes.find((c) => c.number === '7') ||
        karyotypingData.chromosomes[0];
      setSelectedChromosome(defaultChr);
    }
  }, [karyotypingData, selectedChromosome]);

  // Click Guidance Banner rendered atop any visualizer
  const renderClickBanner = (contextText: string) => (
    <div className="bg-teal-950/40 border border-teal-800/60 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2 text-teal-300">
        <MousePointerClick className="w-4 h-4 text-teal-400 shrink-0 animate-bounce" />
        <span className="font-medium">{contextText}</span>
      </div>
      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-200 border border-teal-500/30 font-bold shrink-0">
        CLICK TO INSPECT
      </span>
    </div>
  );

  // =========================================================================
  // 1. PCR 2D VISUALIZATION (Thermocycler + Agarose Gel + qPCR Curve)
  // =========================================================================
  const renderPcr2D = () => {
    const cyclePhase = animationTick % 9;
    const tempPhase =
      cyclePhase < 3
        ? { name: 'Denaturation (Double-strand melting)', temp: 95, color: 'text-rose-400', bg: 'bg-rose-500/20' }
        : cyclePhase < 6
        ? { name: 'Primer Annealing (Sequence binding)', temp: 58.5, color: 'text-sky-400', bg: 'bg-sky-500/20' }
        : { name: 'Taq Extension (DNA Polymerization)', temp: 72, color: 'text-emerald-400', bg: 'bg-emerald-500/20' };

    const GEL_LANES = [
      {
        id: 'Ladder',
        label: 'DNA Ladder',
        role: 'Molecular Sizing Standard',
        bands: '100 bp, 200 bp, 300 bp, 500 bp, 750 bp, 1000 bp',
        intensity: 'Reference standard (100 ng)',
        interpretation: 'Calibration ladder verifies amplicon sizing fidelity at ±2 bp resolution.',
      },
      {
        id: 'Patient',
        label: 'Patient (Proband)',
        role: 'Clinical Diagnostic Sample',
        bands: `${pcrData.ampliconLengthBp} bp target amplicon + 500 bp internal GAPDH control`,
        intensity: '1,420 RFU (Strong target amplification)',
        interpretation: 'Positive amplification confirms target sequence presence. Carrier/heterozygous amplicon.',
      },
      {
        id: 'Mother',
        label: 'Mother (Maternal)',
        role: 'Trio Inheritance Control',
        bands: `${pcrData.ampliconLengthBp} bp target amplicon + 500 bp control`,
        intensity: '1,380 RFU (Positive amplification)',
        interpretation: 'Positive amplicon confirms maternal lineage transmission or carrier state.',
      },
      {
        id: 'Father',
        label: 'Father (Paternal)',
        role: 'Trio Inheritance Control',
        bands: `${pcrData.ampliconLengthBp} bp target amplicon + 500 bp control`,
        intensity: '1,390 RFU (Positive amplification)',
        interpretation: 'Positive amplicon indicates paternal carrier or diploid target locus.',
      },
      {
        id: 'No Template',
        label: 'NTC (Negative)',
        role: 'Contamination Check',
        bands: 'No visible bands (0 bp)',
        intensity: '0 RFU (Clean baseline)',
        interpretation: 'Negative control verified: No cross-contamination, reagent blank pristine.',
      },
    ];

    const currentLane = GEL_LANES.find((l) => l.id === selectedGelLane) || GEL_LANES[1];

    return (
      <div className="space-y-4">
        {renderClickBanner('Click any lane in the gel tank or any cycle on the qPCR curve to inspect densitometry.')}

        {/* Top Thermocycler Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Thermocycler State</span>
              <span className={`text-xs font-bold ${tempPhase.color} flex items-center gap-1.5`}>
                <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                {tempPhase.name}
              </span>
            </div>
            <div className={`px-2.5 py-1 rounded-lg font-mono font-bold text-sm ${tempPhase.bg} ${tempPhase.color}`}>
              {tempPhase.temp}°C
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">PCR Cycle Count</span>
              <span className="text-xs font-bold text-teal-300">Exponential Copy Doubling</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg font-mono font-bold text-sm bg-teal-500/20 text-teal-300">
              Cycle {activeCycle} / {pcrData.cycles}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Amplicon Target Size</span>
              <span className="text-xs font-bold text-slate-200">{pcrData.targetGene} Exon Target</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg font-mono font-bold text-sm bg-slate-800 text-slate-100">
              {pcrData.ampliconLengthBp} bp
            </div>
          </div>
        </div>

        {/* Dual Panels: qPCR Amplification Curve + Agarose Gel Electrophoresis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Panel A: qPCR Amplification Curve */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                <span>Real-Time qPCR Amplification Curve</span>
              </span>
              <span className="text-[10px] font-mono text-teal-300 font-bold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30">
                Ct = {pcrData.cycleThresholdCt}
              </span>
            </div>

            <div className="h-44 w-full relative border-l border-b border-slate-700 p-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
                {/* Gridlines */}
                <line x1="0" y1="30" x2="300" y2="30" stroke="#334155" strokeDasharray="3,3" strokeWidth="0.5" />
                <line x1="0" y1="60" x2="300" y2="60" stroke="#334155" strokeDasharray="3,3" strokeWidth="0.5" />
                <line x1="0" y1="90" x2="300" y2="90" stroke="#334155" strokeDasharray="3,3" strokeWidth="0.5" />

                {/* Threshold line */}
                <line x1="0" y1="75" x2="300" y2="75" stroke="#f43f5e" strokeDasharray="4,4" strokeWidth="1" />
                <text x="5" y="72" fill="#f43f5e" fontSize="7" fontFamily="monospace">
                  Threshold (Ct = {pcrData.cycleThresholdCt})
                </text>

                {/* Sigmoidal qPCR curve */}
                <path
                  d="M 0,115 Q 120,114 170,95 T 230,25 T 300,18"
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="2.5"
                />

                {/* Animated active cycle beacon */}
                <circle
                  cx={Math.min(300, (activeCycle / 35) * 300)}
                  cy={
                    activeCycle < 15
                      ? 115
                      : activeCycle < 25
                      ? 115 - ((activeCycle - 15) / 10) * 60
                      : 55 - ((activeCycle - 25) / 10) * 35
                  }
                  r="5"
                  fill="#5eead4"
                  className="animate-ping"
                />

                {/* User Clicked Cycle Marker */}
                <circle
                  cx={Math.min(300, (selectedPcrCycle / 35) * 300)}
                  cy={
                    selectedPcrCycle < 15
                      ? 115
                      : selectedPcrCycle < 25
                      ? 115 - ((selectedPcrCycle - 15) / 10) * 60
                      : 55 - ((selectedPcrCycle - 25) / 10) * 35
                  }
                  r="6"
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </svg>

              {/* Clickable Cycle Scrub Ribbon */}
              <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-1">
                {[1, 10, 15, 20, 22, 28, 35].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedPcrCycle(c)}
                    className={`px-1 rounded hover:bg-slate-800 transition-colors ${
                      selectedPcrCycle === c ? 'text-teal-300 font-bold underline' : 'text-slate-500'
                    }`}
                  >
                    Cycle {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panel B: UV Agarose Gel Electrophoresis Migration */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>2% Agarose Gel (Ethidium Bromide UV Transilluminator)</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">120V • 45 min</span>
            </div>

            {/* Glowing Gel Tank with Clickable Lanes */}
            <div className="bg-gradient-to-b from-indigo-950/80 via-slate-950 to-slate-950 border-2 border-indigo-900/60 rounded-lg p-3 h-44 flex flex-col justify-between shadow-inner relative overflow-hidden">
              {/* Gel Wells at the top (cathode -) */}
              <div className="flex justify-around border-b border-indigo-800/80 pb-2">
                {GEL_LANES.map((lane) => {
                  const isSelected = selectedGelLane === lane.id;
                  return (
                    <button
                      key={lane.id}
                      type="button"
                      onClick={() => setSelectedGelLane(lane.id)}
                      className={`text-center p-1 rounded transition-all group ${
                        isSelected ? 'bg-indigo-900/90 ring-2 ring-teal-400 scale-105' : 'hover:bg-indigo-950/60'
                      }`}
                      title={`Click to inspect ${lane.label}`}
                    >
                      <div
                        className={`w-7 h-2.5 rounded border mx-auto transition-colors ${
                          isSelected
                            ? 'bg-teal-400 border-white'
                            : 'bg-indigo-900/90 border-indigo-500/50 group-hover:border-teal-400'
                        }`}
                      />
                      <span
                        className={`text-[8px] font-mono block mt-1 ${
                          isSelected ? 'text-teal-300 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {lane.id}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Migrating Glowing Bands (anode + at bottom) */}
              <div className="flex justify-around items-end h-28 relative">
                {/* Lane 1: DNA Ladder */}
                <div
                  onClick={() => setSelectedGelLane('Ladder')}
                  className="w-7 relative h-full flex flex-col justify-around items-center cursor-pointer"
                >
                  {[1000, 750, 500, 300, 200, 100].map((bp, idx) => (
                    <div
                      key={idx}
                      className="w-5 h-1 bg-teal-400/80 rounded-full shadow-[0_0_6px_#2dd4bf] hover:bg-white"
                      title={`${bp} bp`}
                    />
                  ))}
                </div>

                {/* Lane 2: Patient Proband (Amplicon + Control) */}
                <div
                  onClick={() => setSelectedGelLane('Patient')}
                  className="w-7 relative h-full flex flex-col justify-around items-center cursor-pointer"
                >
                  <div className="w-5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399] mt-3" title="500 bp Control" />
                  <div
                    className="w-6 h-2 bg-teal-300 rounded-full shadow-[0_0_12px_#2dd4bf] mt-6 animate-pulse"
                    title={`${pcrData.ampliconLengthBp} bp Positive Target`}
                  />
                </div>

                {/* Lane 3: Mother */}
                <div
                  onClick={() => setSelectedGelLane('Mother')}
                  className="w-7 relative h-full flex flex-col justify-around items-center cursor-pointer"
                >
                  <div className="w-5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399] mt-3" />
                  <div className="w-5 h-1.5 bg-teal-300/80 rounded-full shadow-[0_0_8px_#2dd4bf] mt-6" />
                </div>

                {/* Lane 4: Father */}
                <div
                  onClick={() => setSelectedGelLane('Father')}
                  className="w-7 relative h-full flex flex-col justify-around items-center cursor-pointer"
                >
                  <div className="w-5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399] mt-3" />
                  <div className="w-5 h-1.5 bg-teal-300/80 rounded-full shadow-[0_0_8px_#2dd4bf] mt-6" />
                </div>

                {/* Lane 5: Negative Control (No Template) */}
                <div
                  onClick={() => setSelectedGelLane('No Template')}
                  className="w-7 relative h-full flex flex-col justify-around items-center cursor-pointer"
                >
                  <div className="w-5 h-1 bg-slate-800/50 rounded-full" />
                </div>
              </div>

              {/* Anode marker */}
              <div className="text-[9px] font-mono text-center text-indigo-400 border-t border-indigo-900/40 pt-1">
                (+) Anode Migration Direction (Downward) • Click any lane to inspect
              </div>
            </div>
          </div>
        </div>

        {/* CLICKED GEL LANE INSPECTOR CARD */}
        <div className="bg-slate-950 border border-teal-500/40 rounded-xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-slate-100">
                Inspecting Agarose Lane: <strong className="text-teal-300">{currentLane.label}</strong>
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
              {currentLane.role}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Band Sizing:</span>
              <span className="font-bold text-slate-200">{currentLane.bands}</span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Relative Fluorescence:</span>
              <span className="font-bold text-teal-300">{currentLane.intensity}</span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Clinical Amplification:</span>
              <span className="font-bold text-emerald-400">{pcrData.isPositive ? 'Target Positive' : 'Negative'}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            <strong className="text-teal-400">Clinical Evaluation: </strong>
            {currentLane.interpretation} Forward primer: <code className="text-teal-300 bg-slate-900 px-1 py-0.5 rounded">{pcrData.forwardPrimer}</code>, Reverse primer: <code className="text-teal-300 bg-slate-900 px-1 py-0.5 rounded">{pcrData.reversePrimer}</code> (Annealing Tm: {pcrData.annealingTempC}°C).
          </p>
        </div>
      </div>
    );
  };

  // =========================================================================
  // 2. SANGER SEQUENCING 2D VISUALIZATION (Electropherogram Chromatogram)
  // =========================================================================
  const renderSanger2D = () => {
    const scanOffset = (animationTick * 3) % sangerData.traces.length;
    const currentCall = selectedSangerCall || sangerData.calls.find((c) => c.isVariantSite) || sangerData.calls[0];

    return (
      <div className="space-y-4">
        {renderClickBanner('Click any nucleotide base in the top ribbon or chromatogram peak to inspect dye amplitudes and quality scores.')}

        {/* Sanger Header & Call Box */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs border border-teal-500/30">
              ABI
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">
                Applied Biosystems 3730xl Capillary Electropherogram Trace
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {sangerData.targetGene} • Exon {sangerData.exon} • {sangerData.transcript}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> A (HEX)
            </span>
            <span className="flex items-center gap-1 text-sky-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-sky-500" /> C (FAM)
            </span>
            <span className="flex items-center gap-1 text-slate-200 font-bold">
              <span className="w-2 h-2 rounded-full bg-slate-200" /> G (NED)
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> T (ROX)
            </span>
          </div>
        </div>

        {/* The 4-Color Waveform Trace Canvas */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
          {/* Base Calls Ribbon - All Clickable */}
          <div className="flex justify-between items-center text-xs font-mono font-extrabold pb-2 border-b border-slate-800 px-2 gap-1 overflow-x-auto">
            {sangerData.calls.map((call, idx) => {
              const isSelected = currentCall?.position === call.position;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedSangerCall(call)}
                  className={`text-center py-1 px-2 rounded-lg transition-all border ${
                    isSelected
                      ? 'bg-purple-900/90 border-purple-400 text-purple-200 scale-110 shadow-lg ring-2 ring-purple-400'
                      : call.isVariantSite
                      ? 'bg-purple-950/60 border-purple-600/80 text-purple-300'
                      : 'border-transparent text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                  title={`Click to inspect position p.${call.position}`}
                >
                  <span className="block text-sm font-bold">{call.calledBase}</span>
                  <span className="text-[9px] font-normal text-slate-400 block">p.{call.position}</span>
                  {call.isVariantSite && (
                    <span className="text-[7px] font-mono px-1 rounded bg-purple-500 text-white font-bold block mt-0.5">
                      VAR
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Chromatogram SVG Waves */}
          <div className="h-44 w-full relative overflow-hidden bg-slate-950/90 rounded-lg p-2">
            <svg className="w-full h-full" viewBox="0 0 600 130" preserveAspectRatio="none">
              {/* Channel A (Green) */}
              <path
                d={sangerData.traces.reduce(
                  (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${(i / sangerData.traces.length) * 600},${130 - pt.A}`,
                  ''
                )}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                opacity="0.85"
              />
              {/* Channel C (Blue) */}
              <path
                d={sangerData.traces.reduce(
                  (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${(i / sangerData.traces.length) * 600},${130 - pt.C}`,
                  ''
                )}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2"
                opacity="0.85"
              />
              {/* Channel G (Black / Light Slate) */}
              <path
                d={sangerData.traces.reduce(
                  (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${(i / sangerData.traces.length) * 600},${130 - pt.G}`,
                  ''
                )}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="2"
                opacity="0.85"
              />
              {/* Channel T (Red) */}
              <path
                d={sangerData.traces.reduce(
                  (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${(i / sangerData.traces.length) * 600},${130 - pt.T}`,
                  ''
                )}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
                opacity="0.85"
              />

              {/* Scanning Laser Vertical Cursor */}
              <line
                x1={(scanOffset / sangerData.traces.length) * 600}
                y1="0"
                x2={(scanOffset / sangerData.traces.length) * 600}
                y2="130"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4,2"
              />
            </svg>

            {/* Heterozygous Variant Annotation Bubble */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-purple-950/90 border border-purple-500/80 rounded-lg px-2.5 py-1 text-[11px] font-mono text-purple-200 shadow-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>Heterozygous Variant Site: Double Overlapping Peak Confirmed</span>
            </div>
          </div>
        </div>

        {/* CLICKED SANGER BASE CALL INSPECTOR */}
        {currentCall && (
          <div className="bg-slate-950 border border-purple-500/40 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-100">
                  Inspecting Nucleotide Call: <strong className="text-purple-300 font-mono text-sm">{currentCall.calledBase}</strong> at Coordinate <strong className="text-slate-200 font-mono">p.{currentCall.position}</strong>
                </span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                currentCall.isVariantSite
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {currentCall.isVariantSite ? 'CLINICAL VARIANT SITE' : 'HOMOZYGOUS REFERENCE'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Phred Quality (QV):</span>
                <span className="font-bold text-emerald-400">Q{currentCall.confidenceScore} (99.99% accuracy)</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Peak Morphology:</span>
                <span className="font-bold text-slate-200">{currentCall.isVariantSite ? 'Dual Symmetric Peaks' : 'Single Unimodal Peak'}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Reference Base:</span>
                <span className="font-bold text-teal-300">{currentCall.referenceBase || currentCall.calledBase}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Signal-to-Noise Ratio:</span>
                <span className="font-bold text-slate-100">38.4 dB</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              <strong className="text-purple-300">Capillary Electrophoresis Interpretation: </strong>
              {currentCall.isVariantSite
                ? 'Clear 50/50 ratio double fluorophore peak observed on ABI 3730xl. Sanger sequence chromatogram orthogonally confirms the germline heterozygous variant.'
                : 'Concordant single peak call with high Phred quality score and zero baseline noise.'}
            </p>
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // 3. NGS PANEL 2D VISUALIZATION (IGV BAM Pileup Viewer)
  // =========================================================================
  const renderNgs2D = () => {
    const currentRead = selectedNgsRead || ngsData.reads.find((r) => r.hasMismatch) || ngsData.reads[0];

    return (
      <div className="space-y-4">
        {renderClickBanner('Click any read in the BAM alignment pileup to inspect CIGAR, mapping quality, and base quality.')}

        {/* NGS Header & Depth Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Target Region</span>
            <span className="font-mono font-bold text-slate-200">{ngsData.region}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Mean Read Depth</span>
            <span className="font-mono font-bold text-teal-300">{ngsData.meanDepth}x Coverage</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Variant Allele Frequency</span>
            <span className="font-mono font-bold text-purple-300">{(ngsData.vaf * 100).toFixed(1)}% VAF</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Alt / Ref Reads</span>
            <span className="font-mono font-bold text-slate-200">
              {ngsData.altReads} / {ngsData.refReads}
            </span>
          </div>
        </div>

        {/* IGV Pileup Canvas */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          {/* Depth Histogram Header */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Coverage Histogram Track (0 - 160x)</span>
              <span className="text-teal-400">Target Nucleotide [Position +7]</span>
            </div>
            <div className="h-8 flex items-end gap-1 border-b border-slate-800 pb-1">
              {ngsData.coverageProfile.map((depth, i) => (
                <div
                  key={i}
                  style={{ height: `${(depth / 160) * 100}%` }}
                  className="flex-1 bg-slate-700/80 hover:bg-teal-500/80 rounded-t transition-all cursor-pointer"
                  title={`Depth: ${depth}x`}
                />
              ))}
            </div>
          </div>

          {/* Stacked Reads Alignment (BAM Pileup) - All Clickable */}
          <div className="space-y-1 font-mono text-[10px] max-h-56 overflow-y-auto pr-2">
            {ngsData.reads.map((read, idx) => {
              const isSelected = currentRead?.id === read.id;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedNgsRead(read)}
                  className={`flex items-center gap-2 p-1.5 rounded transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-teal-400 ring-2 ring-teal-400/80 scale-[1.01]'
                      : read.hasMismatch
                      ? 'bg-purple-950/40 border-purple-700/50 hover:bg-slate-800'
                      : 'bg-slate-900/60 border-slate-800/50 hover:bg-slate-800/80'
                  }`}
                  title="Click to inspect this BAM read"
                >
                  <span
                    className={`w-4 h-4 rounded text-[9px] flex items-center justify-center font-bold ${
                      read.strand === '+' ? 'bg-sky-500/20 text-sky-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {read.strand}
                  </span>

                  <span className="text-[9px] text-slate-500 w-16 truncate">{read.id}</span>

                  <div className="flex-1 flex gap-0.5 tracking-widest text-slate-300">
                    {read.sequence.split('').map((base, bIdx) => {
                      const isMismatch = read.hasMismatch && bIdx === read.mismatchPos;
                      return (
                        <span
                          key={bIdx}
                          className={`w-3.5 text-center rounded ${
                            isMismatch
                              ? 'bg-rose-500 text-white font-extrabold shadow animate-pulse'
                              : 'text-slate-400'
                          }`}
                        >
                          {isMismatch ? read.mismatchBase : base}
                        </span>
                      );
                    })}
                  </div>

                  <span className="text-[9px] text-slate-400 shrink-0 font-mono">MAPQ {read.mappingQuality}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CLICKED NGS READ INSPECTOR */}
        {currentRead && (
          <div className="bg-slate-950 border border-teal-500/40 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-slate-100">
                  Inspecting SAM/BAM Read: <strong className="text-teal-300 font-mono">{currentRead.id}</strong>
                </span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                currentRead.hasMismatch
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {currentRead.hasMismatch ? 'SUPPORTS VARIANT ALLELE' : 'SUPPORTS REFERENCE ALLELE'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">CIGAR Alignment:</span>
                <span className="font-bold text-slate-200">{currentRead.cigar} (Exact match)</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Mapping Quality:</span>
                <span className="font-bold text-teal-300">MAPQ {currentRead.mappingQuality} (P &lt; 1e-6)</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Strand Orientation:</span>
                <span className="font-bold text-sky-300">
                  {currentRead.strand === '+' ? 'Forward (+) Strand' : 'Reverse (-) Strand'}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Illumina Flow Tile:</span>
                <span className="font-bold text-slate-200">{ngsData.flowCellTile}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              <strong className="text-teal-300">Read Significance: </strong>
              {currentRead.hasMismatch
                ? `Paired-end sequencing read carries the alternate nucleotide '${currentRead.mismatchBase}' with high Phred base quality (Q39). Supports the clinical variant allele frequency of ${(ngsData.vaf * 100).toFixed(1)}%.`
                : 'Paired-end sequencing read supports the reference human genome allele across the entire read window.'}
            </p>
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // 4. WES (Whole Exome Sequencing) 2D VISUALIZATION
  // =========================================================================
  const renderWes2D = () => {
    const currentExon = selectedWesExon || wesData.exons.find((e) => e.containsVariant) || wesData.exons[0];

    return (
      <div className="space-y-4">
        {renderClickBanner('Click any exon in the CCDS Exon Capture track to inspect bait coverage depth and coordinates.')}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Capture Kit</span>
            <span className="font-semibold text-slate-200 truncate block">{wesData.targetBaitKit}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">On-Target Rate</span>
            <span className="font-mono font-bold text-teal-300">{wesData.onTargetPercent}%</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Mean Exome Depth</span>
            <span className="font-mono font-bold text-teal-300">{wesData.meanTargetCoverage}x</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">&gt;20x Exome Bases</span>
            <span className="font-mono font-bold text-emerald-300">{wesData.percentExomeAbove20x}%</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-200">
            CCDS Coding Exon Capture Track ({wesData.gene})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            {wesData.exons.map((exon) => {
              const isSelected = currentExon?.exonNumber === exon.exonNumber;
              return (
                <button
                  key={exon.exonNumber}
                  type="button"
                  onClick={() => setSelectedWesExon(exon)}
                  className={`p-3 rounded-lg border space-y-1.5 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-900/80 border-purple-400 ring-2 ring-purple-400 scale-105 shadow-lg'
                      : exon.containsVariant
                      ? 'bg-purple-950/60 border-purple-500/80 shadow-md hover:bg-slate-800'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800'
                  }`}
                  title={`Click to inspect Exon ${exon.exonNumber}`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">Exon {exon.exonNumber}</span>
                    {exon.containsVariant && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 font-bold">
                        HIT
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    <div>Size: {exon.sizeBp} bp</div>
                    <div>Depth: <span className="text-teal-300 font-bold">{exon.meanDepth}x</span></div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full ${exon.containsVariant ? 'bg-purple-400' : 'bg-teal-500'}`}
                      style={{ width: `${Math.min(100, (exon.meanDepth / 150) * 100)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CLICKED WES EXON INSPECTOR */}
        {currentExon && (
          <div className="bg-slate-950 border border-purple-500/40 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-100">
                  Inspecting Coding Exon: <strong className="text-purple-300">Exon {currentExon.exonNumber}</strong> of {wesData.gene}
                </span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                currentExon.containsVariant
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {currentExon.containsVariant ? 'HOUSES CANDIDATE VARIANT' : 'WILDTYPE EXON'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Exon Length:</span>
                <span className="font-bold text-slate-200">{currentExon.sizeBp} bp</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Target Read Depth:</span>
                <span className="font-bold text-teal-300">{currentExon.meanDepth}x</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Hybridization Bait:</span>
                <span className="font-bold text-slate-100">Biotinylated cRNA</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">On-Target Rate:</span>
                <span className="font-bold text-emerald-400">{wesData.onTargetPercent}%</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              <strong className="text-purple-300">Exome Interpretation: </strong>
              {currentExon.containsVariant
                ? `Exon ${currentExon.exonNumber} contains the diagnostic variant with ${currentExon.meanDepth}x depth coverage, well above clinical guidelines (>20x) for confident heterozygous call.`
                : `Exon ${currentExon.exonNumber} shows uniform coverage (${currentExon.meanDepth}x) with no coding SNVs or small indels.`}
            </p>
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // 5. WGS (Whole Genome Sequencing) 2D VISUALIZATION
  // =========================================================================
  const renderWgs2D = () => {
    const currentSv = selectedWgsSv || wgsData.svCalls[0];

    return (
      <div className="space-y-4">
        {renderClickBanner('Click any structural variant call in the table below to inspect breakpoints and gene impact.')}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Assembly</span>
            <span className="font-mono font-bold text-teal-300">{wgsData.genomeAssembly} (3.2 Gb)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Mean Autosomal Depth</span>
            <span className="font-mono font-bold text-teal-300">{wgsData.meanAutosomalCoverage}x Uniform</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">&gt;15x Coverage</span>
            <span className="font-mono font-bold text-emerald-300">{wgsData.percentGenomeAbove15x}%</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Structural Variants</span>
            <span className="font-mono font-bold text-purple-300">{wgsData.structuralVariantsCount} SV Calls</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-200">
              Genome-Wide Structural Variant (SV) Discovery &amp; Breakpoint Mapping
            </span>
            <span className="text-[10px] font-mono text-slate-400">Manta / Lumpy Pipeline</span>
          </div>

          <div className="space-y-2">
            {wgsData.svCalls.map((sv, idx) => {
              const isSelected = currentSv?.chr === sv.chr && currentSv?.start === sv.start;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedWgsSv(sv)}
                  className={`p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-teal-400 ring-2 ring-teal-400/80 shadow-lg scale-[1.01]'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800/80'
                  }`}
                  title="Click to inspect this SV call"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        sv.type === 'DEL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      }`}
                    >
                      {sv.type}
                    </span>
                    <span className="font-mono text-slate-200 font-bold">
                      chr{sv.chr}:{sv.start.toLocaleString()}-{sv.end.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                    <span>Span: <strong className="text-slate-200">{sv.sizeKb} kb</strong></span>
                    <span>Genes: <strong className="text-teal-300">{sv.genesInvolved.join(', ')}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CLICKED WGS SV INSPECTOR */}
        {currentSv && (
          <div className="bg-slate-950 border border-teal-500/40 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-slate-100">
                  Inspecting Structural Variant: <strong className="text-rose-400">{currentSv.type}</strong> on chr{currentSv.chr}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                {currentSv.sizeKb} kb INTERVAL
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Start Breakpoint:</span>
                <span className="font-bold text-slate-200">{currentSv.start.toLocaleString()}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">End Breakpoint:</span>
                <span className="font-bold text-slate-200">{currentSv.end.toLocaleString()}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Genes Spanned:</span>
                <span className="font-bold text-teal-300">{currentSv.genesInvolved.join(', ')}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Split Reads:</span>
                <span className="font-bold text-emerald-400">42 Paired / 18 Split</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              <strong className="text-teal-300">WGS Cytogenomic Analysis: </strong>
              Whole-genome sequencing detects uniform non-coding and intronic coverage across chromosome {currentSv.chr}, with paired discordant read clusters accurately resolving both breakends at base-pair resolution.
            </p>
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // 6. DNA MICROARRAY 2D VISUALIZATION
  // =========================================================================
  const renderMicroarray2D = () => {
    return (
      <div className="space-y-4">
        {renderClickBanner('Click any spot in the hybridization array grid to inspect Cy3/Cy5 fluorescence intensities.')}

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Platform</span>
            <span className="font-bold text-slate-200">{microarrayData.arrayPlatform}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Cy3 (Control)
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Cy5 (Test)
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Balanced
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Microarray Spot Grid */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-slate-200 block">
              High-Density Hybridization Grid (Click spot to inspect)
            </span>
            <div className="grid grid-cols-4 gap-2.5 p-3 bg-slate-900/90 rounded-lg border border-slate-800">
              {microarrayData.spots.map((spot, idx) => {
                const isSelected = selectedSpot?.gene === spot.gene;
                const spotColor =
                  spot.ratioLog2 < -0.4
                    ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                    : spot.ratioLog2 > 0.4
                    ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                    : 'bg-amber-400 shadow-[0_0_6px_#fbbf24]';

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSpot(spot)}
                    className={`h-12 rounded-lg flex flex-col items-center justify-center p-1 border transition-all ${
                      isSelected
                        ? 'border-white ring-2 ring-teal-400 scale-105 bg-slate-800'
                        : 'border-slate-800 hover:border-slate-600 bg-slate-950'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${spotColor}`} />
                    <span className="text-[9px] font-mono text-slate-300 mt-1 truncate max-w-full">
                      {spot.gene}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spot Inspector Tooltip */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-slate-200 block">Probe Hybridization Metrics</span>
            {selectedSpot ? (
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Target Gene:</span>
                  <span className="font-bold text-teal-300 text-sm">{selectedSpot.gene}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cy3 (Control Intensity):</span>
                  <span className="text-emerald-400 font-bold">{selectedSpot.cy3Intensity} RFU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cy5 (Patient Intensity):</span>
                  <span className="text-rose-400 font-bold">{selectedSpot.cy5Intensity} RFU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Log2 Expression Ratio:</span>
                  <span className="font-bold text-white">{selectedSpot.ratioLog2}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Significance (p-value):</span>
                  <span className="text-teal-300">{selectedSpot.pValue}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                  {selectedSpot.ratioLog2 > 0.4
                    ? 'Upregulation confirmed in patient test sample relative to reference pool.'
                    : selectedSpot.ratioLog2 < -0.4
                    ? 'Downregulation / transcript depletion detected in test tissue.'
                    : 'Balanced 1:1 hybridization intensity with reference pool.'}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Click any spot in the array grid on the left to inspect its fluorescence intensities.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // 7. CMA (Chromosomal Microarray / aCGH) 2D VISUALIZATION
  // =========================================================================
  const renderCma2D = () => {
    const currentProbe = selectedCmaProbe || cmaData.probes.find((p) => p.isAbnormal) || cmaData.probes[0];

    return (
      <div className="space-y-4">
        {renderClickBanner('Click any probe point along the Log2 Copy Number ratio track or BAF track to inspect genomic locus.')}

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">CMA Assessment</span>
            <span className="font-bold text-rose-400">{cmaData.abnormalityType}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Genomic Locus Span</span>
            <span className="font-mono text-slate-200 font-bold">{cmaData.genomicSpan}</span>
          </div>
        </div>

        {/* Dual Array Tracks: Log2 Ratio + BAF */}
        <div className="space-y-3">
          {/* Track 1: Log2 Copy Number Ratio Track */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 font-bold">1. Log2 Copy Number Ratio Track (Chr {cmaData.chromosome})</span>
              <span className="text-rose-400">Normal = 0.0 • Deletion &lt; -0.5 • Duplication &gt; +0.3</span>
            </div>

            <div className="h-28 w-full relative border-l border-b border-slate-800 bg-slate-900/60 p-2 overflow-hidden">
              <line x1="0" y1="56" x2="600" y2="56" stroke="#475569" strokeWidth="1" />
              <div className="h-full flex items-center justify-between">
                {cmaData.probes.map((probe, i) => {
                  const yPercent = 50 - probe.log2Ratio * 45;
                  const isSelected = currentProbe?.id === probe.id;
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedCmaProbe(probe)}
                      className="relative h-full flex items-center justify-center cursor-pointer group"
                      style={{ width: `${100 / cmaData.probes.length}%` }}
                    >
                      <div
                        style={{ top: `${Math.max(5, Math.min(95, yPercent))}%` }}
                        className={`absolute rounded-full transition-all ${
                          isSelected
                            ? 'w-3 h-3 bg-white ring-4 ring-teal-400 z-20 scale-150'
                            : probe.isAbnormal
                            ? 'w-2 h-2 bg-rose-500 ring-2 ring-rose-400'
                            : 'w-1.5 h-1.5 bg-teal-400/80 group-hover:bg-white'
                        }`}
                        title={`${probe.id}: Log2 = ${probe.log2Ratio}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Track 2: B-Allele Frequency (BAF) Track */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 font-bold">2. B-Allele Frequency (BAF) Track</span>
              <span className="text-purple-400">Normal = 0.0 / 0.5 / 1.0 • Loss of Heterozygosity</span>
            </div>

            <div className="h-24 w-full relative border-l border-b border-slate-800 bg-slate-900/60 p-2 overflow-hidden">
              <div className="h-full flex items-center justify-between">
                {cmaData.probes.map((probe, i) => {
                  const yPercent = (1 - probe.bAlleleFrequency) * 80 + 10;
                  const isSelected = currentProbe?.id === probe.id;
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedCmaProbe(probe)}
                      className="relative h-full flex items-center justify-center cursor-pointer"
                      style={{ width: `${100 / cmaData.probes.length}%` }}
                    >
                      <div
                        style={{ top: `${yPercent}%` }}
                        className={`absolute rounded-full ${
                          isSelected
                            ? 'w-2.5 h-2.5 bg-white ring-2 ring-purple-300 z-20'
                            : probe.isAbnormal
                            ? 'w-1.5 h-1.5 bg-rose-400'
                            : 'w-1.5 h-1.5 bg-purple-400/80'
                        }`}
                        title={`BAF: ${probe.bAlleleFrequency}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CLICKED CMA PROBE INSPECTOR */}
        {currentProbe && (
          <div className="bg-slate-950 border border-teal-500/40 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-slate-100">
                  Inspecting CMA Oligo Probe: <strong className="text-teal-300 font-mono">{currentProbe.id}</strong>
                </span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                currentProbe.isAbnormal
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {currentProbe.isAbnormal ? 'ABNORMAL COPY NUMBER STATE' : 'DIPLOID NORMAL COPY NUMBER'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Cytoband:</span>
                <span className="font-bold text-teal-300">{currentProbe.cytoband}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Genomic Coordinate:</span>
                <span className="font-bold text-slate-200">{currentProbe.genomicPositionMb} Mb</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Log2 Ratio:</span>
                <span className={`font-bold ${currentProbe.isAbnormal ? 'text-rose-400' : 'text-slate-200'}`}>
                  {currentProbe.log2Ratio}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">B-Allele Freq (BAF):</span>
                <span className="font-bold text-purple-300">{currentProbe.bAlleleFrequency}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              <strong className="text-teal-300">Cytogenomic Interpretation: </strong>
              {currentProbe.isAbnormal
                ? `Probe exhibits significant log2 ratio deviation (${currentProbe.log2Ratio}) and split loss of heterozygosity in BAF, confirming a ${cmaData.abnormalityType} across ${cmaData.genomicSpan}.`
                : 'Probe resides within normal diploid autosomal baseline (2 copies, log2 ratio near 0.0, balanced heterozygous BAF at 0.5).'}
            </p>
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // 8. GENOTYPING / SNP 2D VISUALIZATION (Allelic Discrimination Cluster Plot)
  // =========================================================================
  const renderGenotyping2D = () => {
    const currentPoint = selectedGenotypingPoint || genotypingData.clusterPoints[0];

    const filteredPoints = genotypingData.clusterPoints.filter((pt) => {
      if (genotypingFilter === 'ALL') return true;
      if (genotypingFilter === 'PATIENT') return pt.sampleType === 'Patient Proband';
      if (genotypingFilter === 'AA') return pt.call === 'AA (Homozygous Ref)';
      if (genotypingFilter === 'AB') return pt.call === 'AB (Heterozygous)';
      if (genotypingFilter === 'BB') return pt.call === 'BB (Homozygous Alt)';
      return true;
    });

    return (
      <div className="space-y-4">
        {renderClickBanner('Click any cluster sphere in the Cartesian plot or filter buttons to inspect individual sample genotypes.')}

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Marker Accession</span>
            <span className="font-mono font-bold text-teal-300 text-sm">{genotypingData.markerRsid}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Patient Proband Call</span>
            <span className="font-mono font-bold text-purple-300 text-sm">{genotypingData.patientCall}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Array Call Rate</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{genotypingData.callRatePercent}%</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-[10px] text-slate-400">Cluster Filter:</span>
          <div className="flex items-center gap-1">
            {(['ALL', 'PATIENT', 'AA', 'AB', 'BB'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setGenotypingFilter(f)}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                  genotypingFilter === f ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {f === 'ALL'
                  ? 'All Points'
                  : f === 'PATIENT'
                  ? 'Proband'
                  : f === 'AA'
                  ? 'AA (Ref)'
                  : f === 'AB'
                  ? 'AB (Het)'
                  : 'BB (Alt)'}
              </button>
            ))}
          </div>
        </div>

        {/* Cartesian Allelic Discrimination Scatter Plot */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="font-bold text-slate-200">
              Cartesian Allelic Discrimination Plot (Allele 1 [VIC] vs Allele 2 [FAM])
            </span>
            <div className="flex items-center gap-3">
              <span className="text-sky-400">● AA (Ref)</span>
              <span className="text-emerald-400">● AB (Het)</span>
              <span className="text-rose-400">● BB (Alt)</span>
            </div>
          </div>

          <div className="h-64 w-full relative border-l-2 border-b-2 border-slate-700 bg-slate-900/80 p-4 rounded">
            {/* Axis Labels */}
            <span className="absolute bottom-1 right-3 text-[10px] font-mono text-slate-400">
              Allele 1 Intensity (Ref: {genotypingData.alleleRef}) →
            </span>
            <span className="absolute top-2 left-2 text-[10px] font-mono text-slate-400">
              ↑ Allele 2 Intensity (Alt: {genotypingData.alleleAlt})
            </span>

            {/* Render Clusters */}
            {filteredPoints.map((pt) => {
              const isPatient = pt.sampleType === 'Patient Proband';
              const isSelected = currentPoint?.id === pt.id;
              const leftPercent = pt.normIntensityX * 85 + 5;
              const topPercent = (1 - pt.normIntensityY) * 85 + 5;

              const color =
                pt.call === 'AA (Homozygous Ref)'
                  ? 'bg-sky-400'
                  : pt.call === 'AB (Heterozygous)'
                  ? 'bg-emerald-400'
                  : 'bg-rose-400';

              return (
                <div
                  key={pt.id}
                  onClick={() => setSelectedGenotypingPoint(pt)}
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  className={`absolute rounded-full transition-transform cursor-pointer ${
                    isSelected
                      ? 'w-5 h-5 bg-white ring-4 ring-purple-400 -translate-x-2.5 -translate-y-2.5 z-30 scale-125'
                      : isPatient
                      ? 'w-4 h-4 bg-purple-400 ring-4 ring-purple-300 -translate-x-2 -translate-y-2 z-20 animate-bounce'
                      : `w-2.5 h-2.5 ${color} opacity-80 -translate-x-1 -translate-y-1 hover:scale-150`
                  }`}
                  title={`${pt.sampleType}: ${pt.call}`}
                />
              );
            })}
          </div>
        </div>

        {/* CLICKED GENOTYPING POINT INSPECTOR */}
        {currentPoint && (
          <div className="bg-slate-950 border border-teal-500/40 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-slate-100">
                  Inspecting Genotype Sample: <strong className="text-purple-300 font-mono">{currentPoint.sampleType}</strong>
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                CALL: {currentPoint.call}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Allele 1 (VIC) Intensity:</span>
                <span className="font-bold text-sky-400">{currentPoint.normIntensityX.toFixed(3)}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Allele 2 (FAM) Intensity:</span>
                <span className="font-bold text-rose-400">{currentPoint.normIntensityY.toFixed(3)}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Cluster Assignment:</span>
                <span className="font-bold text-emerald-400">Confidence 99.8%</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">SNP Marker RSID:</span>
                <span className="font-bold text-slate-200">{genotypingData.markerRsid}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              <strong className="text-teal-300">TaqMan / Array Interpretation: </strong>
              Sample clusters cleanly within the {currentPoint.call} Gaussian centroid distribution, showing high signal-to-noise ratio and zero cluster overlap.
            </p>
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // 9. KARYOTYPING 2D VISUALIZATION (Metaphase G-Banded Karyogram)
  // =========================================================================
  const renderKaryotyping2D = () => {
    const currentChr = selectedChromosome || karyotypingData.chromosomes[0];

    return (
      <div className="space-y-4">
        {renderClickBanner('Click any chromosome pair (1-22, X, Y) in the karyogram below to inspect high-resolution G-bands.')}

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cytogenetic ISCN Karyotype</span>
            <span className="font-mono font-bold text-teal-300 text-sm">{karyotypingData.karyotypeIscn}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Band Resolution</span>
            <span className="font-mono text-slate-200">{karyotypingData.resolutionBands} Giemsa G-Bands</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mitotic Index</span>
            <span className="font-mono text-slate-200">
              {karyotypingData.mitoticIndexPercent}% ({karyotypingData.cellsAnalyzed} Metaphases)
            </span>
          </div>
        </div>

        {/* 23-Chromosome Karyogram Grid - All Clickable */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <span className="text-xs font-bold text-slate-200 block">
            Constitutional G-Banding Karyogram (Pairs 1 to 22 + Sex Chromosomes — Click to inspect)
          </span>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
            {karyotypingData.chromosomes.map((chr) => {
              const isSelected = currentChr?.number === chr.number;
              return (
                <button
                  key={chr.number}
                  type="button"
                  onClick={() => setSelectedChromosome(chr)}
                  className={`bg-slate-900 border rounded-lg p-2 flex flex-col items-center justify-between h-28 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-400 bg-slate-800 ring-2 ring-teal-400 scale-105 shadow-lg'
                      : 'border-slate-800 hover:border-teal-500/50 hover:bg-slate-850'
                  }`}
                  title={`Click to inspect ${chr.label}`}
                >
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-teal-300 font-bold' : 'text-slate-400'}`}>
                    {chr.label}
                  </span>

                  {/* Simulated Chromosome with G-Bands */}
                  <div className="w-3.5 h-16 bg-slate-200 rounded-full flex flex-col justify-between overflow-hidden shadow">
                    <div className="h-2 bg-slate-900" />
                    <div className="h-1 bg-slate-500" />
                    {/* Centromere constriction */}
                    <div className="h-1 w-2 bg-rose-600 rounded-full mx-auto" title="Centromere" />
                    <div className="h-3 bg-slate-900" />
                    <div className="h-1 bg-slate-600" />
                  </div>

                  <span className="text-[9px] font-mono text-teal-300 font-bold">2n</span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            {karyotypingData.cytogeneticDiagnosis}
          </p>
        </div>

        {/* CLICKED CHROMOSOME INSPECTOR */}
        {currentChr && (
          <div className="bg-slate-950 border border-teal-500/40 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-slate-100">
                  Inspecting Cytogenetic Homolog: <strong className="text-teal-300 font-mono">{currentChr.label}</strong>
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                550 GIEMSA G-BANDS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Detailed Horizontal Ideogram Bar */}
              <div className="sm:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                <span className="text-[10px] text-slate-400 font-mono block">
                  High-Resolution Cytoband Ideogram Map ({currentChr.label})
                </span>
                <div className="h-8 w-full bg-slate-300 rounded-lg flex overflow-hidden border border-slate-600 shadow">
                  <div className="w-1/6 bg-slate-900 flex items-center justify-center text-[8px] text-white font-mono">p-ter</div>
                  <div className="w-1/6 bg-slate-400" />
                  <div className="w-1/12 bg-rose-600 flex items-center justify-center text-[7px] text-white font-bold" title="Centromere">cen</div>
                  <div className="w-1/4 bg-slate-800 flex items-center justify-center text-[8px] text-teal-300 font-mono font-bold" title="Active Target Locus">
                    q21.31
                  </div>
                  <div className="w-1/6 bg-slate-500" />
                  <div className="w-1/6 bg-slate-900 flex items-center justify-center text-[8px] text-white font-mono">q-ter</div>
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>p-arm (Short arm)</span>
                  <span className="text-rose-400">Primary Centromeric Constriction</span>
                  <span>q-arm (Long arm)</span>
                </div>
              </div>

              {/* Chromosome Stats */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ploidy State:</span>
                  <span className="text-emerald-400 font-bold">Diploid (2n=46)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Structural Anomaly:</span>
                  <span className="text-slate-200">{currentChr.hasStructuralAnomaly ? 'Present' : 'None detected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Centromeric Morphology:</span>
                  <span className="text-teal-300">Submetacentric</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ISCN Nomenclature:</span>
                  <span className="text-white font-bold">{karyotypingData.karyotypeIscn}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              <strong className="text-teal-300">Cytogenetic Clinical Finding: </strong>
              Standard metaphase G-banding demonstrates normal constitutional chromosome morphology for {currentChr.label} without gross deletions, inversions, or balanced reciprocal translocations greater than the 5-10 Mb optical microscopy resolution limit.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Assay-specific 2D renderer */}
      {assayType === 'pcr' && renderPcr2D()}
      {assayType === 'sanger' && renderSanger2D()}
      {assayType === 'ngs' && renderNgs2D()}
      {assayType === 'wes' && renderWes2D()}
      {assayType === 'wgs' && renderWgs2D()}
      {assayType === 'microarray' && renderMicroarray2D()}
      {assayType === 'cma' && renderCma2D()}
      {assayType === 'genotyping' && renderGenotyping2D()}
      {assayType === 'karyotyping' && renderKaryotyping2D()}
    </div>
  );
};
