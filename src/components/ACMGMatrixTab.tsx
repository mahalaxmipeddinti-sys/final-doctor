// src/components/ACMGMatrixTab.tsx
import React, { useState } from 'react';
import { ACMGEvaluationResult, ACMGCriterionEvaluation } from '../types/genomics.ts';
import {
  ShieldCheck,
  Filter,
  ExternalLink,
  CheckCircle,
  XCircle,
  HelpCircle,
  Sparkles,
  AlertTriangle,
  Play,
  FileText,
  Info,
} from 'lucide-react';

interface ACMGMatrixTabProps {
  evaluation?: ACMGEvaluationResult;
  onOverrideCriterion?: (code: string, newStatus: ACMGCriterionEvaluation['status']) => void;
}

export const ACMGMatrixTab: React.FC<ACMGMatrixTabProps> = ({ evaluation, onOverrideCriterion }) => {
  const [filter, setFilter] = useState<'ALL' | 'SUPPORTED' | 'PATHOGENIC' | 'BENIGN' | 'CONFLICTING'>('SUPPORTED');
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [testSuiteRunning, setTestSuiteRunning] = useState(false);
  const [testReport, setTestReport] = useState<any>(null);

  if (!evaluation) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-slate-400 text-xs">
        ACMG evidence evaluation was not executed. Submit a variant to initialize evaluation.
      </div>
    );
  }

  const allCriteria = Object.values(evaluation.criteriaEvaluations);

  const filtered = allCriteria.filter((c) => {
    if (filter === 'SUPPORTED') return c.status === 'SUPPORTED';
    if (filter === 'PATHOGENIC') return c.category === 'PATHOGENIC';
    if (filter === 'BENIGN') return c.category === 'BENIGN';
    if (filter === 'CONFLICTING') return c.status === 'CONFLICTING';
    return true;
  });

  const runAutomatedTests = async () => {
    setTestSuiteRunning(true);
    try {
      const res = await fetch('/api/acmg/run-tests');
      if (res.ok) {
        const data = await res.json();
        setTestReport(data);
      }
    } catch (err) {
      console.error('Failed to run test suite:', err);
    } finally {
      setTestSuiteRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Overview & Classification Formula */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Explainable ACMG/AMP 2015 Classification Rules Engine</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Standard 28 criteria with ClinGen SVI modified strength specifications &amp; Tavtigian Bayesian point calibration.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowExplainModal(true)}
              className="px-2.5 py-1 rounded text-xs font-medium bg-teal-600 hover:bg-teal-500 text-white flex items-center space-x-1"
            >
              <Info className="h-3.5 w-3.5" />
              <span>Why This Result?</span>
            </button>
            <button
              onClick={runAutomatedTests}
              disabled={testSuiteRunning}
              className="px-2.5 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1"
            >
              <Play className="h-3.5 w-3.5 text-emerald-400" />
              <span>{testSuiteRunning ? 'Running Tests...' : 'Run Automated Tests'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
            <span className="text-slate-500 block">Overall Classification Tier:</span>
            <span className="text-sm font-bold text-teal-300 mt-0.5 block">
              {evaluation.overallClassification.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
            <span className="text-slate-500 block">Active Criteria Triggered:</span>
            <span className="text-sm font-mono font-bold text-slate-200 mt-0.5 block">
              {evaluation.supportedCriteria.length} of 28 canonical criteria
            </span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
            <span className="text-slate-500 block">Tavtigian Bayesian Score:</span>
            <span className="text-sm font-mono font-bold text-slate-200 mt-0.5 block">
              {evaluation.bayesianScore > 0 ? `+${evaluation.bayesianScore}` : evaluation.bayesianScore} points (P = {(evaluation.bayesianProbability * 100).toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="mt-3 bg-slate-950/70 p-2.5 rounded border border-slate-800 text-xs text-slate-300">
          <strong className="text-slate-200">Rule Logic Summary:</strong> {evaluation.appliedRuleSummary}
        </div>
      </div>

      {/* Automated Test Suite Report Display */}
      {testReport && (
        <div className="bg-slate-900/90 border border-teal-500/30 rounded-lg p-3.5 text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-teal-300 flex items-center space-x-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Automated ACMG Test Suite Execution Results:</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              {testReport.passedCount}/{testReport.totalTests} Passed ({testReport.passRatePercentage}%)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {testReport.results.map((r: any) => (
              <div
                key={r.testId}
                className={`p-2 rounded border text-[11px] ${
                  r.passed ? 'bg-slate-950 border-emerald-900/50 text-slate-300' : 'bg-rose-950/40 border-rose-800 text-rose-200'
                }`}
              >
                <div className="font-semibold flex items-center justify-between">
                  <span>{r.testId}: {r.testName}</span>
                  <span className={`font-bold ${r.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {r.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">
                  Actual: {r.actual}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Strength Overrides Bar */}
      <div className="bg-slate-900/90 border border-teal-500/30 rounded-lg p-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200">
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            <span>ClinGen SVI Interactive Evidence Overrides &amp; Functional Assays:</span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Click to toggle laboratory assay, pedigree segregation, or de novo evidence
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <button
            onClick={() => onOverrideCriterion && onOverrideCriterion('PS3', evaluation.criteriaEvaluations['PS3']?.status === 'SUPPORTED' ? 'NOT_SUPPORTED' : 'SUPPORTED')}
            className={`px-2 py-1.5 rounded text-[11px] font-medium border text-left flex flex-col transition-all ${
              evaluation.criteriaEvaluations['PS3']?.status === 'SUPPORTED'
                ? 'bg-rose-950 text-rose-300 border-rose-800 ring-1 ring-rose-500/30'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            <span className="font-bold">PS3 (+4 pts)</span>
            <span className="text-[10px] text-slate-400 truncate">Functional Damaging</span>
          </button>

          <button
            onClick={() => onOverrideCriterion && onOverrideCriterion('BS3', evaluation.criteriaEvaluations['BS3']?.status === 'SUPPORTED' ? 'NOT_SUPPORTED' : 'SUPPORTED')}
            className={`px-2 py-1.5 rounded text-[11px] font-medium border text-left flex flex-col transition-all ${
              evaluation.criteriaEvaluations['BS3']?.status === 'SUPPORTED'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800 ring-1 ring-emerald-500/30'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            <span className="font-bold">BS3 (-4 pts)</span>
            <span className="text-[10px] text-slate-400 truncate">Functional Normal</span>
          </button>

          <button
            onClick={() => onOverrideCriterion && onOverrideCriterion('PS2', evaluation.criteriaEvaluations['PS2']?.status === 'SUPPORTED' ? 'NOT_SUPPORTED' : 'SUPPORTED')}
            className={`px-2 py-1.5 rounded text-[11px] font-medium border text-left flex flex-col transition-all ${
              evaluation.criteriaEvaluations['PS2']?.status === 'SUPPORTED'
                ? 'bg-rose-950 text-rose-300 border-rose-800 ring-1 ring-rose-500/30'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            <span className="font-bold">PS2 (+4 pts)</span>
            <span className="text-[10px] text-slate-400 truncate">Confirmed De Novo</span>
          </button>

          <button
            onClick={() => onOverrideCriterion && onOverrideCriterion('PM1', evaluation.criteriaEvaluations['PM1']?.status === 'SUPPORTED' ? 'NOT_SUPPORTED' : 'SUPPORTED')}
            className={`px-2 py-1.5 rounded text-[11px] font-medium border text-left flex flex-col transition-all ${
              evaluation.criteriaEvaluations['PM1']?.status === 'SUPPORTED'
                ? 'bg-rose-950 text-rose-300 border-rose-800 ring-1 ring-rose-500/30'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            <span className="font-bold">PM1 (+2 pts)</span>
            <span className="text-[10px] text-slate-400 truncate">Hotspot / Domain</span>
          </button>

          <button
            onClick={() => onOverrideCriterion && onOverrideCriterion('PM3', evaluation.criteriaEvaluations['PM3']?.status === 'SUPPORTED' ? 'NOT_SUPPORTED' : 'SUPPORTED')}
            className={`px-2 py-1.5 rounded text-[11px] font-medium border text-left flex flex-col transition-all ${
              evaluation.criteriaEvaluations['PM3']?.status === 'SUPPORTED'
                ? 'bg-rose-950 text-rose-300 border-rose-800 ring-1 ring-rose-500/30'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            <span className="font-bold">PM3 (+2 pts)</span>
            <span className="text-[10px] text-slate-400 truncate">Recessive in-trans</span>
          </button>

          <button
            onClick={() => onOverrideCriterion && onOverrideCriterion('PP1', evaluation.criteriaEvaluations['PP1']?.status === 'SUPPORTED' ? 'NOT_SUPPORTED' : 'SUPPORTED')}
            className={`px-2 py-1.5 rounded text-[11px] font-medium border text-left flex flex-col transition-all ${
              evaluation.criteriaEvaluations['PP1']?.status === 'SUPPORTED'
                ? 'bg-rose-950 text-rose-300 border-rose-800 ring-1 ring-rose-500/30'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            <span className="font-bold">PP1 (+1 pt)</span>
            <span className="text-[10px] text-slate-400 truncate">Family Segregation</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setFilter('SUPPORTED')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filter === 'SUPPORTED'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Triggered Criteria ({evaluation.supportedCriteria.length})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filter === 'ALL'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All 28 Canonical Criteria
          </button>
          <button
            onClick={() => setFilter('PATHOGENIC')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filter === 'PATHOGENIC'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pathogenic Rules (16)
          </button>
          <button
            onClick={() => setFilter('BENIGN')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filter === 'BENIGN'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Benign Rules (12)
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Showing {filtered.length} of 28 criteria
        </div>
      </div>

      {/* ACMG 28-Rules Criteria Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Code</th>
                <th className="py-2.5 px-3 font-semibold">Category &amp; Strength</th>
                <th className="py-2.5 px-3 font-semibold">Evaluation Status</th>
                <th className="py-2.5 px-3 font-semibold">Evidence Rationale &amp; Provenance</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((c) => {
                const isSupported = c.status === 'SUPPORTED';
                const isPath = c.category === 'PATHOGENIC';

                return (
                  <tr
                    key={c.code}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSupported ? 'bg-slate-850/40' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-200 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          isPath ? 'text-rose-300 bg-rose-950/60' : 'text-emerald-300 bg-emerald-950/60'
                        }`}
                      >
                        {c.code}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-slate-300 font-medium block">
                        {c.assignedStrength}
                        {c.assignedStrength !== c.defaultStrength && (
                          <span className="text-[10px] text-amber-400 ml-1">(ClinGen Modified)</span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {c.category} • {c.pointsAwarded !== undefined && c.pointsAwarded !== 0 ? `${c.pointsAwarded > 0 ? '+' : ''}${c.pointsAwarded} pts` : ''}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isSupported
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-950 text-slate-500 border border-slate-800'
                        }`}
                      >
                        {isSupported ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-emerald-400" />
                            <span>MET</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-slate-600" />
                            <span>NOT MET</span>
                          </>
                        )}
                      </span>
                      {c.isUserOverridden && (
                        <span className="ml-1 text-[9px] text-amber-400 font-mono">(Clinician Override)</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-slate-300 max-w-md">
                      <div className="font-medium text-slate-200">{c.shortDescription}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{c.rationale}</div>
                      {c.citationUrl && (
                        <a
                          href={c.citationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-teal-400 hover:underline inline-flex items-center space-x-0.5 mt-1"
                        >
                          <span>Evidence Citation &amp; Guideline</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {onOverrideCriterion && (
                        <button
                          onClick={() =>
                            onOverrideCriterion(c.code, isSupported ? 'NOT_SUPPORTED' : 'SUPPORTED')
                          }
                          className="px-2 py-1 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                        >
                          {isSupported ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explainability Modal */}
      {showExplainModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <FileText className="h-4 w-4 text-teal-400" />
                <span>Step-by-Step ACMG Explanation &amp; Discrepancy Breakdown</span>
              </h3>
              <button
                onClick={() => setShowExplainModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="font-bold text-teal-300 block mb-1">Decision Summary:</span>
                <p className="leading-relaxed">{evaluation.appliedRuleSummary}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="font-bold text-teal-300 block mb-1">Active Criteria Breakdown:</span>
                <ul className="space-y-1 list-disc list-inside text-slate-300">
                  {evaluation.supportedCriteria.map((code) => {
                    const ev = evaluation.criteriaEvaluations[code];
                    return (
                      <li key={code}>
                        <strong className="text-emerald-300">{code}</strong> ({ev.assignedStrength}): {ev.rationale}
                      </li>
                    );
                  })}
                  {evaluation.supportedCriteria.length === 0 && (
                    <li className="text-slate-500 italic">No criteria met. Variant classified as VUS / Unresolved.</li>
                  )}
                </ul>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="font-bold text-amber-300 block mb-1">Research Use Disclaimer:</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  CAUTION: This ACMG/AMP variant classification is generated for research, educational, and decision-support purposes only. Final clinical diagnosis requires expert review by a certified Medical Geneticist or Molecular Pathologist.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
