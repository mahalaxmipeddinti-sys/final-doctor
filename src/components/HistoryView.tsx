// src/components/HistoryView.tsx
import React, { useState, useEffect } from 'react';
import { History, Trash2, ArrowUpRight, RefreshCw, Database, AlertTriangle, Scale, CheckSquare, Square } from 'lucide-react';
import { FullAnalysisResult } from '../types/genomics.ts';

interface HistoryViewProps {
  onLoadAnalysis: (analysis: FullAnalysisResult) => void;
  onCompareAnalyses?: (analysisA: FullAnalysisResult, analysisB: FullAnalysisResult) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onLoadAnalysis, onCompareAnalyses }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyses');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      } else {
        setError('Failed to fetch history from Cloud SQL database.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this analysis record from Cloud SQL?')) return;
    try {
      const res = await fetch(`/api/analyses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.analysisId !== id));
        setSelectedForComparison((prev) => prev.filter((item) => item !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const toggleSelectForComparison = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedForComparison.includes(id)) {
      setSelectedForComparison(selectedForComparison.filter((x) => x !== id));
    } else {
      if (selectedForComparison.length >= 2) {
        // Keep the latest two
        setSelectedForComparison([selectedForComparison[1], id]);
      } else {
        setSelectedForComparison([...selectedForComparison, id]);
      }
    }
  };

  const handleTriggerCompare = () => {
    if (selectedForComparison.length !== 2 || !onCompareAnalyses) return;
    const itemA = history.find((h) => h.analysisId === selectedForComparison[0]);
    const itemB = history.find((h) => h.analysisId === selectedForComparison[1]);
    if (itemA && itemB) {
      onCompareAnalyses(itemA, itemB);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-2">
            <Database className="h-4 w-4 text-teal-400" />
            <span>Persistent Analysis History (Cloud SQL PostgreSQL)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full sessions stored in relational PostgreSQL tables with schemas for normalized variants, annotations, ML predictions, and ACMG criteria.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onCompareAnalyses && (
            <button
              onClick={handleTriggerCompare}
              disabled={selectedForComparison.length !== 2}
              className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center space-x-1.5 transition-all ${
                selectedForComparison.length === 2
                  ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <Scale className="h-3.5 w-3.5" />
              <span>Compare Selected ({selectedForComparison.length}/2)</span>
            </button>
          )}

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/30 border border-rose-800 rounded-lg p-3 text-xs text-rose-300">
          {error}
        </div>
      )}

      {loading && history.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-10 text-center text-slate-400 text-xs">
          Loading history from PostgreSQL database...
        </div>
      ) : history.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-10 text-center text-slate-400 text-xs">
          <History className="h-8 w-8 mx-auto text-slate-600 mb-2" />
          No analysis records saved yet. Run an analysis in the Workbench to see records here.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold w-10 text-center">Compare</th>
                  <th className="py-2.5 px-3 font-semibold">Variant Input</th>
                  <th className="py-2.5 px-3 font-semibold">ClinVar Consensus</th>
                  <th className="py-2.5 px-3 font-semibold">ML Score</th>
                  <th className="py-2.5 px-3 font-semibold">ACMG 2015 Class</th>
                  <th className="py-2.5 px-3 font-semibold">Conflicts</th>
                  <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item) => {
                  const cv = item.clinvarRecord;
                  const ml = item.mlPrediction;
                  const acmg = item.acmgEvaluation;
                  const hasConflicts = item.conflicts && item.conflicts.length > 0;
                  const isChecked = selectedForComparison.includes(item.analysisId);

                  return (
                    <tr
                      key={item.analysisId}
                      onClick={() => onLoadAnalysis(item)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        isChecked ? 'bg-teal-950/30' : ''
                      }`}
                    >
                      {/* Comparison Checkbox */}
                      <td
                        className="py-2.5 px-3 text-center"
                        onClick={(e) => toggleSelectForComparison(item.analysisId, e)}
                      >
                        <button
                          type="button"
                          className="text-teal-400 hover:text-teal-300 focus:outline-none"
                          title="Select to compare"
                        >
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-teal-400" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      <td className="py-2.5 px-3 font-mono font-medium text-teal-300">
                        {item.variantInput}
                      </td>

                      <td className="py-2.5 px-3">
                        {cv ? (
                          <span className="text-slate-200">{cv.clinicalSignificance}</span>
                        ) : (
                          <span className="text-slate-500">None</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-mono">
                        {ml ? (
                          <span
                            className={
                              ml.calibratedProbability > 0.7
                                ? 'text-rose-400 font-bold'
                                : ml.calibratedProbability > 0.3
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }
                          >
                            {(ml.calibratedProbability * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-semibold">
                        {acmg ? (
                          <span
                            className={
                              acmg.overallClassification === 'PATHOGENIC'
                                ? 'text-rose-400'
                                : acmg.overallClassification === 'LIKELY_PATHOGENIC'
                                ? 'text-orange-400'
                                : acmg.overallClassification.includes('BENIGN')
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }
                          >
                            {acmg.overallClassification.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        {hasConflicts ? (
                          <span className="inline-flex items-center space-x-1 text-amber-400 font-semibold">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{item.conflicts.length}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoadAnalysis(item);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300"
                            title="Load into Workbench"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(item.analysisId, e)}
                            className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
