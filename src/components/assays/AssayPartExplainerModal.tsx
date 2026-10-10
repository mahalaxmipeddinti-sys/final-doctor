// src/components/assays/AssayPartExplainerModal.tsx
// Comprehensive slide-out or modal explainer for EVERY part in 2D and 3D visualizers.
// Interactively links biophysical mechanisms, dynamic active-variant observations, and clinical ACMG rules.

import React, { useState } from 'react';
import {
  AssayPartExplanation,
  getPartsForAssay,
} from '../../services/assayPartExplainerService.ts';
import { AssayType } from '../../types/assays.ts';
import { NormalizedVariant } from '../../types/genomics.ts';
import {
  X,
  Info,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Maximize2,
  Eye,
  Camera,
  Layers,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  TestTube2,
  Activity,
} from 'lucide-react';

interface AssayPartExplainerModalProps {
  part: AssayPartExplanation | null;
  isOpen: boolean;
  onClose: () => void;
  currentVariant?: NormalizedVariant;
  assayType: AssayType;
  onSelectPart: (part: AssayPartExplanation) => void;
  onFocus3dCamera?: (part: AssayPartExplanation) => void;
  onHighlight2dTrace?: (part: AssayPartExplanation) => void;
}

export const AssayPartExplainerModal: React.FC<AssayPartExplainerModalProps> = ({
  part,
  isOpen,
  onClose,
  currentVariant,
  assayType,
  onSelectPart,
  onFocus3dCamera,
  onHighlight2dTrace,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'mechanism' | 'variant' | 'pitfalls'>('overview');
  const [copiedNote, setCopiedNote] = useState<boolean>(false);

  if (!isOpen || !part) return null;

  const allAssayParts = getPartsForAssay(assayType);
  const variantObs = part.getVariantObservation(currentVariant);

  const handleCopyNote = () => {
    const noteText = `[CLINICAL LAB ANNOTATION - ${part.name.toUpperCase()}]\n` +
      `Assay: ${part.assayType.toUpperCase()} | Subsystem: ${part.category}\n` +
      `Technical Nomenclature: ${part.technicalTerm}\n` +
      `Current Variant Observation: ${variantObs.finding}\n` +
      `Diagnostic Impact: ${variantObs.clinicalImpact}\n` +
      `ACMG Relevance: ${part.acmgRelevance}\n` +
      `QC Standard: ${part.qcStandard}\n` +
      `Evaluated Target: ${currentVariant?.geneSymbol || 'BRCA1'} (${currentVariant?.hgvsc || 'c.5266dupC'})`;

    navigator.clipboard.writeText(noteText);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-5 h-5 text-teal-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                  {part.assayType.toUpperCase()} SUB-COMPONENT
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  {part.dimension} INSPECTION
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {part.category}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 truncate mt-0.5">
                {part.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopyNote}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1.5 border border-slate-700 transition-colors"
              title="Copy clinical diagnostic note"
            >
              {copiedNote ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Note</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="Close explainer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Component Navigation Ribbon */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] font-mono text-slate-400 shrink-0 font-semibold">
            All {assayType.toUpperCase()} Parts:
          </span>
          {allAssayParts.map((p) => {
            const isCurrent = p.id === part.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPart(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{p.name.split('(')[0].trim()}</span>
                {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />}
              </button>
            );
          })}
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-800 px-6 flex items-center space-x-2 bg-slate-900/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Overview &amp; Role</span>
          </button>
          <button
            onClick={() => setActiveTab('variant')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'variant'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span>Active Variant Live Reading</span>
            <span className="text-[9px] font-mono px-1 rounded bg-teal-500/20 text-teal-300 ml-1">
              LIVE
            </span>
          </button>
          <button
            onClick={() => setActiveTab('mechanism')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'mechanism'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TestTube2 className="w-3.5 h-3.5" />
            <span>Biophysical &amp; Chemical Mechanism</span>
          </button>
          <button
            onClick={() => setActiveTab('pitfalls')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'pitfalls'
                ? 'border-teal-400 text-teal-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Clinical Pitfalls &amp; ACMG Utility</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-sm leading-relaxed">
          {/* TAB 1: OVERVIEW & ROLE */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider block font-bold">
                  Technical Nomenclature &amp; Identity
                </span>
                <p className="text-sm font-mono text-slate-200 font-semibold">{part.technicalTerm}</p>
                <p className="text-xs text-slate-400 leading-relaxed pt-1">{part.molecularRole}</p>
              </div>

              {/* Dynamic Live Status Card */}
              <div className="bg-gradient-to-r from-teal-950/40 via-slate-950/60 to-purple-950/40 border border-teal-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-teal-400" />
                    <span>Real-Time Instrument Observation for Active Variant</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                    {currentVariant?.geneSymbol || 'BRCA1'} • {currentVariant?.hgvsc || 'c.5266dupC'}
                  </span>
                </div>
                <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800 text-xs text-slate-200 font-mono">
                  {variantObs.finding}
                </div>
                <p className="text-xs text-slate-300">{variantObs.clinicalImpact}</p>
              </div>

              {/* Lab Metrics Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block">Instrument Specifications &amp; Kinetic Constants</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(variantObs.metrics).map(([key, val]) => (
                    <div key={key} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
                      <span className="text-[11px] text-slate-400">{key}</span>
                      <span className="text-xs font-mono font-bold text-teal-300 mt-1">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE VARIANT LIVE STATUS */}
          {activeTab === 'variant' && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 border border-teal-500/40 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Live Reading Analysis</h3>
                    <p className="text-xs text-slate-400">
                      Evaluated for {currentVariant?.geneSymbol || 'BRCA1'} on chromosome {currentVariant?.chromosome || '17'}
                    </p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                    {currentVariant?.assembly || 'GRCh38'}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Observation Description:</span>
                  <p className="text-xs text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800 leading-relaxed font-mono">
                    {variantObs.finding}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Diagnostic Implication:</span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {variantObs.clinicalImpact}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400">Target Genomic Coordinates:</span>
                  <span className="font-mono text-teal-300 font-bold">
                    chr{currentVariant?.chromosome || '17'}:{currentVariant?.position || '43044295'} ({currentVariant?.referenceAllele || 'C'}&gt;{currentVariant?.alternateAllele || 'CC'})
                  </span>
                </div>
              </div>

              {/* Action Buttons to Focus View */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {onFocus3dCamera && (
                  <button
                    onClick={() => onFocus3dCamera(part)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Focus 3D WebGL Camera on this Part</span>
                  </button>
                )}
                {onHighlight2dTrace && (
                  <button
                    onClick={() => onHighlight2dTrace(part)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Highlight in 2D Diagnostic Trace</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BIOPHYSICAL & CHEMICAL MECHANISM */}
          {activeTab === 'mechanism' && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3">
                <span className="text-xs font-bold text-teal-400 block uppercase tracking-wider font-mono">
                  Molecular Biophysics &amp; Chemistry
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {part.biophysicalMechanism}
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-slate-300 block">Quality Assurance &amp; Standard</span>
                <p className="text-xs text-slate-300 font-mono bg-slate-900/70 p-3 rounded-lg border border-slate-800/80">
                  {part.qcStandard}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: CLINICAL PITFALLS & ACMG UTILITY */}
          {activeTab === 'pitfalls' && (
            <div className="space-y-4">
              {/* ACMG Evidence Category */}
              <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>ACMG 2015 Guideline Cross-Reference</span>
                </div>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  {part.acmgRelevance}
                </p>
              </div>

              {/* Laboratory Pitfalls & Artifacts */}
              <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Clinical Pitfalls &amp; Diagnostic Artifacts</span>
                </div>
                <ul className="space-y-2 text-xs text-amber-100/90">
                  {part.clinicalPitfalls.map((pitfall, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                      <span>{pitfall}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>CLIA &amp; CAP Compliant Laboratory Reference Guide</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors"
            >
              Done Inspecting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
