// src/components/ConflictCard.tsx
import React from 'react';
import { AlertTriangle, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { ConflictRecord } from '../types/genomics.ts';

interface ConflictCardProps {
  conflicts: ConflictRecord[];
}

export const ConflictCard: React.FC<ConflictCardProps> = ({ conflicts }) => {
  if (conflicts.length === 0) return null;

  return (
    <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-4 my-4">
      <div className="flex items-center space-x-2 text-amber-400 mb-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
        <h3 className="text-sm font-bold uppercase tracking-wider">
          Evidence Dissonance & Conflict Detection ({conflicts.length})
        </h3>
      </div>

      <div className="space-y-3">
        {conflicts.map((cf, idx) => (
          <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-200 text-xs">{cf.title}</span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                  cf.severity === 'HIGH'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                    : cf.severity === 'MODERATE'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Severity: {cf.severity}
              </span>
            </div>

            <p className="text-slate-300 mb-2 leading-relaxed">{cf.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 bg-slate-950/80 p-2 rounded border border-slate-850">
              <div className="text-[11px]">
                <span className="text-slate-400">First Signal:</span>{' '}
                <span className="text-teal-300 font-mono">{cf.firstSource}</span>
              </div>
              <div className="text-[11px]">
                <span className="text-slate-400">Contradictory Signal:</span>{' '}
                <span className="text-amber-300 font-mono">{cf.secondSource}</span>
              </div>
            </div>

            <div className="flex items-start space-x-1.5 text-[11px] text-slate-400 mt-2 bg-slate-800/40 p-2 rounded border border-slate-750">
              <Info className="h-3.5 w-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-300">Action:</strong> {cf.suggestedAction}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
