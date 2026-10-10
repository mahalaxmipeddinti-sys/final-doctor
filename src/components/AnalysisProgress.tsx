// src/components/AnalysisProgress.tsx
import React from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface ProgressStep {
  label: string;
  subtext: string;
  status: 'pending' | 'running' | 'completed' | 'warning' | 'error';
}

interface AnalysisProgressProps {
  steps: ProgressStep[];
  currentStepIndex: number;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ steps }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 my-4">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
          <span>Automated Pipeline Execution</span>
        </h3>
        <span className="text-[11px] font-mono text-slate-400">Strictly Isolated Tri-Pillar Engine</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {steps.map((step, idx) => {
          let badgeColor = 'bg-slate-950/80 border-slate-800 text-slate-400';
          if (step.status === 'running') {
            badgeColor = 'bg-teal-950/60 border-teal-500/50 text-teal-300 ring-1 ring-teal-500/30';
          } else if (step.status === 'completed') {
            badgeColor = 'bg-emerald-950/30 border-emerald-700/40 text-emerald-300';
          } else if (step.status === 'warning') {
            badgeColor = 'bg-amber-950/30 border-amber-700/40 text-amber-300';
          } else if (step.status === 'error') {
            badgeColor = 'bg-rose-950/30 border-rose-700/40 text-rose-300';
          }

          return (
            <div key={idx} className={`p-2.5 rounded border ${badgeColor} transition-all`}>
              <div className="flex items-center space-x-1.5 mb-1">
                {step.status === 'running' && <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-400" />}
                {step.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                {step.status === 'warning' && <AlertCircle className="h-3.5 w-3.5 text-amber-400" />}
                {step.status === 'pending' && <span className="text-[10px] font-mono text-slate-500">{idx + 1}.</span>}
                <span className="text-xs font-semibold truncate">{step.label}</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">{step.subtext}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
