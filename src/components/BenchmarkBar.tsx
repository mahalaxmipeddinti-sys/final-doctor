// src/components/BenchmarkBar.tsx
import React from 'react';
import { BENCHMARK_VARIANTS, BenchmarkVariantPreset } from '../services/benchmarkVariants.ts';
import { Sparkles, ArrowRight } from 'lucide-react';

interface BenchmarkBarProps {
  onSelect: (preset: BenchmarkVariantPreset) => void;
  selectedId?: string;
}

export const BenchmarkBar: React.FC<BenchmarkBarProps> = ({ onSelect, selectedId }) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-teal-400" />
          <span>Clinical Benchmark Controls (1-Click Evaluation):</span>
        </div>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Grounded ClinVar & gnomAD verified reference records
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {BENCHMARK_VARIANTS.map((b) => {
          const isSelected = selectedId === b.clinvarId || selectedId === b.id;
          const isBenign = b.expectedClinVar.toLowerCase().includes('benign');

          return (
            <button
              key={b.id}
              onClick={() => onSelect(b)}
              className={`text-left px-2.5 py-1.5 rounded text-xs border transition-all flex items-center space-x-2 ${
                isSelected
                  ? 'bg-teal-950/80 border-teal-500/60 text-teal-200 ring-1 ring-teal-500/30'
                  : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-slate-100">{b.geneSymbol}</span>
                  <span className="text-[11px] font-mono text-slate-400">{b.hgvs.split(':').pop()}</span>
                </div>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      isBenign ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  ></span>
                  <span className="text-[10px] text-slate-400">{b.expectedClinVar.split('(')[0]}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
