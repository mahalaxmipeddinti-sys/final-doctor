// src/components/NewAnalysisModal.tsx
import React, { useState } from 'react';
import {
  X,
  Dna,
  Search,
  Sparkles,
  Users,
  FlaskConical,
  ArrowRight,
  ShieldCheck,
  Shuffle,
  Activity,
  Layers,
} from 'lucide-react';
import { GenomeAssembly, TrioMemberInput } from '../types/genomics.ts';
import { BENCHMARK_VARIANTS } from '../services/benchmarkVariants.ts';

interface NewAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunAnalysis: (
    input: string,
    assembly: GenomeAssembly,
    trioInput?: { child: TrioMemberInput; mother: TrioMemberInput; father: TrioMemberInput },
    targetTab?: 'workbench' | 'assays'
  ) => void;
  currentAssembly: GenomeAssembly;
  currentTab: 'home' | 'workbench' | 'matrix' | 'compare' | 'history' | 'methodology' | 'assays';
  defaultFamilyId?: string;
  defaultChildId?: string;
  defaultMotherId?: string;
  defaultFatherId?: string;
}

export const NewAnalysisModal: React.FC<NewAnalysisModalProps> = ({
  isOpen,
  onClose,
  onRunAnalysis,
  currentAssembly,
  currentTab,
  defaultFamilyId = 'FAM-2025-01',
  defaultChildId = 'CH-2025-01',
  defaultMotherId = 'MO-2025-01',
  defaultFatherId = 'FA-2025-01',
}) => {
  const [variantInput, setVariantInput] = useState<string>('17661');
  const [assembly, setAssembly] = useState<GenomeAssembly>(currentAssembly);
  const [mode, setMode] = useState<'single' | 'trio'>('trio');

  // Trio IDs and settings
  const [familyId, setFamilyId] = useState<string>(defaultFamilyId);
  const [childId, setChildId] = useState<string>(defaultChildId);
  const [motherId, setMotherId] = useState<string>(defaultMotherId);
  const [fatherId, setFatherId] = useState<string>(defaultFatherId);

  // Zygosity & Phenotype
  const [childZygosity, setChildZygosity] = useState<any>('HETEROZYGOUS');
  const [motherZygosity, setMotherZygosity] = useState<any>('HOMOZYGOUS_REF_WILDTYPE');
  const [fatherZygosity, setFatherZygosity] = useState<any>('HOMOZYGOUS_REF_WILDTYPE');

  if (!isOpen) return null;

  const handleRandomizeIds = () => {
    const num = Math.floor(100 + Math.random() * 900);
    const year = new Date().getFullYear();
    setFamilyId(`FAM-${year}-${num}`);
    setChildId(`CH-${year}-${num}`);
    setMotherId(`MO-${year}-${num}`);
    setFatherId(`FA-${year}-${num}`);
  };

  const handleApplyPreset = (clinvarId: string) => {
    setVariantInput(clinvarId);
  };

  const handleSubmit = (target: 'workbench' | 'assays') => {
    if (!variantInput.trim()) return;

    if (mode === 'trio') {
      const trioInput = {
        child: {
          relationship: 'child' as const,
          label: 'Proband (Child)',
          sampleId: childId,
          variantInput: variantInput.trim(),
          zygosity: childZygosity,
          isAffected: true,
        },
        mother: {
          relationship: 'mother' as const,
          label: 'Mother (Maternal)',
          sampleId: motherId,
          variantInput: motherZygosity === 'HOMOZYGOUS_REF_WILDTYPE' ? '' : variantInput.trim(),
          zygosity: motherZygosity,
          isAffected: motherZygosity !== 'HOMOZYGOUS_REF_WILDTYPE',
        },
        father: {
          relationship: 'father' as const,
          label: 'Father (Paternal)',
          sampleId: fatherId,
          variantInput: fatherZygosity === 'HOMOZYGOUS_REF_WILDTYPE' ? '' : variantInput.trim(),
          zygosity: fatherZygosity,
          isAffected: fatherZygosity !== 'HOMOZYGOUS_REF_WILDTYPE',
        },
      };
      onRunAnalysis(variantInput.trim(), assembly, trioInput, target);
    } else {
      onRunAnalysis(variantInput.trim(), assembly, undefined, target);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
              <Dna className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Start New Clinical Variant Analysis</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                  NEW RUN
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Execute analysis across ClinVar records, ACMG 28-Rules, ML scoring, and 9 Diagnostic Assays.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-200">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('trio')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  mode === 'trio'
                    ? 'bg-teal-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Family Trio (Child • Mother • Father)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('single')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  mode === 'single'
                    ? 'bg-teal-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Single Variant</span>
              </button>
            </div>

            {/* Assembly Toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Assembly:</span>
              <select
                value={assembly}
                onChange={(e) => setAssembly(e.target.value as GenomeAssembly)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-teal-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="GRCh38">GRCh38</option>
                <option value="GRCh37">GRCh37 (hg19)</option>
              </select>
            </div>
          </div>

          {/* Target Variant Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Variant Search String / Identifier:
            </label>
            <div className="relative">
              <input
                type="text"
                value={variantInput}
                onChange={(e) => setVariantInput(e.target.value)}
                placeholder="e.g. 17661, NM_007294.4:c.5266dupC, chr17:43044295:G>A, or BRAF V600E"
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl px-3.5 py-2.5 font-mono text-slate-100 placeholder:text-slate-600 outline-none text-xs"
              />
            </div>
          </div>

          {/* Clinical Benchmark Preset Shortcuts */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-semibold block">
              Or Load Verified Clinical Control Preset:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BENCHMARK_VARIANTS.slice(0, 4).map((p) => (
                <button
                  key={p.clinvarId}
                  type="button"
                  onClick={() => handleApplyPreset(p.clinvarId)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    variantInput === p.clinvarId
                      ? 'bg-teal-950/80 border-teal-500 text-teal-200'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>{p.geneSymbol}</span>
                    <span className="text-[9px] font-mono text-teal-400">{p.clinvarId}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">{p.hgvs}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Trio Family ID & Sample Management */}
          {mode === 'trio' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>Family &amp; Subject Identifiers</span>
                </span>
                <button
                  type="button"
                  onClick={handleRandomizeIds}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-teal-300 text-[11px] font-mono flex items-center gap-1 border border-slate-800 transition-colors"
                  title="Generate new synced random IDs"
                >
                  <Shuffle className="w-3 h-3 text-teal-400" />
                  <span>Auto-Gen IDs</span>
                </button>
              </div>

              {/* Family ID */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono block">FAMILY ID</span>
                  <input
                    type="text"
                    value={familyId}
                    onChange={(e) => setFamilyId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs text-amber-300"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-teal-400 font-mono block">PROBAND CHILD ID</span>
                  <input
                    type="text"
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                    className="w-full bg-slate-900 border border-teal-500/40 rounded px-2.5 py-1.5 font-mono text-xs text-teal-300"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-purple-400 font-mono block">MOTHER ID</span>
                  <input
                    type="text"
                    value={motherId}
                    onChange={(e) => setMotherId(e.target.value)}
                    className="w-full bg-slate-900 border border-purple-500/40 rounded px-2.5 py-1.5 font-mono text-xs text-purple-300"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-sky-400 font-mono block">FATHER ID</span>
                  <input
                    type="text"
                    value={fatherId}
                    onChange={(e) => setFatherId(e.target.value)}
                    className="w-full bg-slate-900 border border-sky-500/40 rounded px-2.5 py-1.5 font-mono text-xs text-sky-300"
                  />
                </div>
              </div>

              {/* Trio Zygosity Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-900">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Child Zygosity:</span>
                  <select
                    value={childZygosity}
                    onChange={(e) => setChildZygosity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                  >
                    <option value="HETEROZYGOUS">Heterozygous (0/1)</option>
                    <option value="HOMOZYGOUS_ALT">Homozygous Alt (1/1)</option>
                    <option value="HEMIZYGOUS">Hemizygous (X-linked)</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Mother Zygosity:</span>
                  <select
                    value={motherZygosity}
                    onChange={(e) => setMotherZygosity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                  >
                    <option value="HOMOZYGOUS_REF_WILDTYPE">Wildtype Ref (0/0)</option>
                    <option value="HETEROZYGOUS">Heterozygous Carrier (0/1)</option>
                    <option value="HOMOZYGOUS_ALT">Homozygous Affected (1/1)</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Father Zygosity:</span>
                  <select
                    value={fatherZygosity}
                    onChange={(e) => setFatherZygosity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                  >
                    <option value="HOMOZYGOUS_REF_WILDTYPE">Wildtype Ref (0/0)</option>
                    <option value="HETEROZYGOUS">Heterozygous Carrier (0/1)</option>
                    <option value="HOMOZYGOUS_ALT">Homozygous Affected (1/1)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors text-xs font-semibold"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {/* Run in Workbench */}
            <button
              type="button"
              onClick={() => handleSubmit('workbench')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs transition-colors flex items-center gap-1.5 border border-slate-700 shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>Analyze in Workbench</span>
            </button>

            {/* Run and open 9-Assay Lab */}
            <button
              type="button"
              onClick={() => handleSubmit('assays')}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-teal-900/30"
            >
              <FlaskConical className="w-4 h-4 text-white" />
              <span>Test in 9-Assay Lab (2D/3D)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
