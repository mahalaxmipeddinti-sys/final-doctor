// src/components/ClinVarSubmissionsTab.tsx
import React from 'react';
import { ClinVarRecord } from '../types/genomics.ts';
import { Database, ExternalLink, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface ClinVarSubmissionsTabProps {
  clinvar?: ClinVarRecord;
}

export const ClinVarSubmissionsTab: React.FC<ClinVarSubmissionsTabProps> = ({ clinvar }) => {
  if (!clinvar) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-slate-400 text-xs">
        <Database className="h-8 w-8 mx-auto text-slate-600 mb-2" />
        No ClinVar consensus record found for this coordinate in NCBI.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              NCBI ClinVar Aggregated Record
            </h3>
            <p className="text-sm font-semibold text-slate-100 mt-0.5">{clinvar.title}</p>
          </div>
          <a
            href={clinvar.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-teal-400 hover:text-teal-300 inline-flex items-center space-x-1 font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800 self-start sm:self-auto"
          >
            <span>Accession: {clinvar.canonicalAccession}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
          <div>
            <span className="text-slate-500 block">Overall Clinical Significance:</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{clinvar.clinicalSignificance}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Review Status:</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{clinvar.reviewStatus}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Last Evaluated:</span>
            <span className="font-mono text-slate-300 mt-0.5 block">{clinvar.lastEvaluated || 'Not recorded'}</span>
          </div>
        </div>
      </div>

      {/* Individual Submissions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Recorded Clinical Laboratory Submissions ({clinvar.submissions.length})
          </h4>
          <span className="text-[11px] text-slate-500">
            Source: NCBI ClinVar VCV XML / Submission Assertions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Submitting Organization</th>
                <th className="py-2.5 px-3 font-semibold">Reported Significance</th>
                <th className="py-2.5 px-3 font-semibold">Assertion Method</th>
                <th className="py-2.5 px-3 font-semibold">Evaluation Date</th>
                <th className="py-2.5 px-3 font-semibold">Curator Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {clinvar.submissions.map((sub, idx) => {
                const isPath = sub.clinicalSignificance.toLowerCase().includes('pathogenic');
                const isBenign = sub.clinicalSignificance.toLowerCase().includes('benign');

                return (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-200">{sub.submitterName}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isPath
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-800/60'
                            : isBenign
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                            : 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                        }`}
                      >
                        {sub.clinicalSignificance}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {sub.assertionCriteria || 'Clinical Guidelines'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {sub.lastEvaluated || 'Historical'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-xs truncate">
                      {sub.curatorNotes || 'Assertion criteria met in clinical testing.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
