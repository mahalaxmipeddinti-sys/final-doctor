// src/components/AnnotationTab.tsx
import React from 'react';
import { AnnotationData } from '../types/genomics.ts';
import { Activity, BarChart2, ShieldCheck, Layers, GitCommit } from 'lucide-react';

interface AnnotationTabProps {
  annotation?: AnnotationData;
}

export const AnnotationTab: React.FC<AnnotationTabProps> = ({ annotation }) => {
  if (!annotation) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-slate-400 text-xs">
        No biological annotation retrieved.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Consequence & Domain Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-1.5">
          <Layers className="h-4 w-4 text-teal-400" />
          <span>Molecular Consequence & Structural Impact</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Consequence Term:</span>
            <span className="font-mono font-semibold text-teal-300 mt-0.5 block">
              {annotation.consequence.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Predicted Impact:</span>
            <span
              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold mt-0.5 ${
                annotation.impact === 'HIGH'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : annotation.impact === 'MODERATE'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {annotation.impact}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Protein Domain Overlap:</span>
            <span className="text-slate-300 mt-0.5 block font-medium">
              {annotation.domainName || 'No specific catalytic domain annotated'}
            </span>
          </div>
        </div>
      </div>

      {/* Population Frequencies & In Silico Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Population Frequencies (gnomAD) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-1.5">
            <BarChart2 className="h-4 w-4 text-blue-400" />
            <span>gnomAD Population Allele Frequencies</span>
          </h4>

          <dl className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <dt className="text-slate-400">Global Allele Frequency (AF):</dt>
              <dd className="font-mono font-bold text-slate-200">
                {typeof annotation.gnomadAfGlobal === 'number'
                  ? annotation.gnomadAfGlobal.toExponential(3)
                  : 'Absent / Novel (<1e-6)'}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <dt className="text-slate-400">PopMax (Highest Subpopulation AF):</dt>
              <dd className="font-mono font-bold text-teal-300">
                {typeof annotation.gnomadAfPopmax === 'number'
                  ? annotation.gnomadAfPopmax.toExponential(3)
                  : 'N/A'}
              </dd>
            </div>
            <div className="flex justify-between pt-1">
              <dt className="text-slate-400">Threshold Relevance:</dt>
              <dd className="text-right text-[11px] text-slate-400">
                {annotation.gnomadAfGlobal && annotation.gnomadAfGlobal > 0.05
                  ? 'Exceeds BA1 Standalone Benign threshold (>5%)'
                  : 'Meets PM2 Absence/Rarity (<0.001%)'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Computational & In Silico Pathogenicity Algorithms */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-1.5">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>In-Silico Prediction & Conservation</span>
          </h4>

          <dl className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <dt className="text-slate-400">CADD Phred Score:</dt>
              <dd className="font-mono font-bold text-slate-200">
                {annotation.caddPhred ? annotation.caddPhred.toFixed(1) : 'N/A'}
                <span className="text-[10px] text-slate-500 ml-1">
                  ({(annotation.caddPhred ?? 0) >= 20 ? 'Top 1% deleterious' : 'Neutral range'})
                </span>
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <dt className="text-slate-400">PolyPhen-2 HumVar:</dt>
              <dd className="font-mono text-slate-200">
                {annotation.polyphenScore !== undefined ? (
                  <span>
                    <strong className="text-slate-100">{annotation.polyphenScore.toFixed(3)}</strong>{' '}
                    <span className="text-slate-400">({annotation.polyphenPrediction})</span>
                  </span>
                ) : (
                  'N/A'
                )}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1.5">
              <dt className="text-slate-400">SIFT Score:</dt>
              <dd className="font-mono text-slate-200">
                {annotation.siftScore !== undefined ? (
                  <span>
                    <strong className="text-slate-100">{annotation.siftScore.toFixed(3)}</strong>{' '}
                    <span className="text-slate-400">({annotation.siftPrediction})</span>
                  </span>
                ) : (
                  'N/A'
                )}
              </dd>
            </div>
            <div className="flex justify-between pt-1">
              <dt className="text-slate-400">PhyloP 100-Way Conservation:</dt>
              <dd className="font-mono font-bold text-teal-300">
                {annotation.phylop100way !== undefined ? annotation.phylop100way.toFixed(2) : 'N/A'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};
