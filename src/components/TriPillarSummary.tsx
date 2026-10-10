// src/components/TriPillarSummary.tsx
import { Database, Cpu, ShieldCheck, Star, ExternalLink, AlertTriangle, FileText } from 'lucide-react';
import { FullAnalysisResult } from '../types/genomics.ts';

interface TriPillarSummaryProps {
  result: FullAnalysisResult;
  onOpenReport?: () => void;
}

export const TriPillarSummary: React.FC<TriPillarSummaryProps> = ({ result, onOpenReport }) => {
  const { clinvarRecord: cv, mlPrediction: ml, acmgEvaluation: acmg } = result;

  // Helper for ClinVar color
  const getClinVarColor = (clinsig: string = '') => {
    const s = clinsig.toLowerCase();
    if (s.includes('pathogenic') && !s.includes('benign')) return 'text-rose-400 bg-rose-950/40 border-rose-800/60';
    if (s.includes('benign')) return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
    return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
  };

  // Helper for ACMG Tier color
  const getACMGColor = (tier: string = '') => {
    switch (tier) {
      case 'PATHOGENIC':
        return 'text-rose-400 bg-rose-950/40 border-rose-800/60';
      case 'LIKELY_PATHOGENIC':
        return 'text-orange-400 bg-orange-950/40 border-orange-800/60';
      case 'BENIGN':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
      case 'LIKELY_BENIGN':
        return 'text-teal-400 bg-teal-950/40 border-teal-800/60';
      case 'UNCERTAIN_SIGNIFICANCE':
      default:
        return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
    }
  };

  // Helper for ML Category color
  const getMLColor = (cat: string = '') => {
    if (cat.includes('HIGH_RISK')) return 'text-rose-400 bg-rose-950/40 border-rose-800/60';
    if (cat.includes('MODERATE')) return 'text-orange-400 bg-orange-950/40 border-orange-800/60';
    if (cat.includes('VERY_LOW') || cat.includes('LOW_RISK')) return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
    return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              The Tri-Pillar Evidence Paradigm
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700 font-mono">
              Never Interchanged or Averaged
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Distinct epistemological outputs evaluated in strict isolation to detect clinical discordance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenReport && (
            <button
              onClick={onOpenReport}
              className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-teal-900/40 cursor-pointer"
              title="Open Official DNA Doctor 10-Page Clinical PDF Report"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate / Download Report (PDF)</span>
            </button>
          )}

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Status:</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${
                result.summaryStatus === 'COMPLETED'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                  : result.summaryStatus === 'CONFLICTS_DETECTED'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-700/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {result.summaryStatus.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* PILLAR 1: ClinVar Database Interpretation */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Pillar 1: ClinVar Record
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">NCBI Live</span>
            </div>

            {cv ? (
              <div>
                <div className="my-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${getClinVarColor(
                      cv.clinicalSignificance
                    )}`}
                  >
                    {cv.clinicalSignificance}
                  </span>
                </div>

                {/* Stars Rating */}
                <div className="flex items-center space-x-1.5 my-2">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`h-3.5 w-3.5 ${
                          starIdx <= cv.reviewStars ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    ({cv.reviewStars}/4 stars: {cv.reviewStatus})
                  </span>
                </div>

                {/* Low confidence caution badge if 0 or 1 star */}
                {cv.reviewStars <= 1 && (
                  <div className="my-2 bg-amber-950/70 border border-amber-600/60 rounded p-2 text-[11px] text-amber-300 flex items-start space-x-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-amber-200">Caution: Low-Confidence Record ({cv.reviewStars}/4 ★)</strong>
                      <span>Single laboratory assertion or missing criteria. Higher probability of discordance with updated clinical guidelines.</span>
                    </div>
                  </div>
                )}
                {cv.reviewStars >= 3 && (
                  <div className="my-1.5 bg-emerald-950/50 border border-emerald-800/60 rounded px-2 py-1 text-[11px] text-emerald-300 flex items-center space-x-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Expert Panel Reviewed consensus ({cv.reviewStars}/4 ★)</span>
                  </div>
                )}

                <p className="text-xs text-slate-400 line-clamp-2 mt-2">
                  <span className="text-slate-300 font-semibold">Conditions:</span>{' '}
                  {cv.associatedConditions.join(', ') || 'Unspecified'}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-900">
                  <span>{cv.submissions.length} Submitter lab(s)</span>
                  <a
                    href={cv.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-400 hover:text-teal-300 flex items-center space-x-1"
                  >
                    <span>{cv.canonicalAccession}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No direct consensus record in ClinVar for this coordinate.
              </div>
            )}
          </div>
          <div className="mt-3 text-[10px] text-slate-400 bg-slate-900/60 p-1.5 rounded font-mono">
            Ground-truth consensus from global diagnostic laboratories.
          </div>
        </div>

        {/* PILLAR 2: Machine Learning Pathogenicity Prediction */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-teal-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Pillar 2: ML Predictor
                </span>
              </div>
              <span className="text-[10px] text-teal-400 font-mono">v1.0.0</span>
            </div>

            {ml ? (
              <div>
                <div className="my-3 flex items-baseline space-x-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${getMLColor(
                      ml.classificationCategory
                    )}`}
                  >
                    {ml.classificationCategory.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Score & Meter */}
                <div className="my-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-medium">Pathogenicity Probability:</span>
                    <span className="font-mono font-bold text-slate-100">
                      {(ml.calibratedProbability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        ml.calibratedProbability > 0.7
                          ? 'bg-rose-500'
                          : ml.calibratedProbability > 0.4
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${ml.calibratedProbability * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>95% CI:</span>
                    <span>
                      [{(ml.confidenceInterval[0] * 100).toFixed(1)}% - {(ml.confidenceInterval[1] * 100).toFixed(1)}%]
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                  Top driver:{' '}
                  <span className="text-slate-300 font-medium">
                    {ml.featureContributions[0]?.featureName || 'Conservation'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                ML prediction model was not invoked or missing features.
              </div>
            )}
          </div>
          <div className="mt-3 text-[10px] text-slate-400 bg-slate-900/60 p-1.5 rounded font-mono">
            Continuous in-silico probability. Never equates to clinical diagnosis.
          </div>
        </div>

        {/* PILLAR 3: ACMG/AMP 2015 Guideline Assessment */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Pillar 3: ACMG 2015 Rules
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">28 Criteria</span>
            </div>

            {acmg ? (
              <div>
                <div className="my-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${getACMGColor(
                      acmg.overallClassification
                    )}`}
                  >
                    {acmg.overallClassification.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Bayesian & Score info */}
                <div className="my-2 flex items-center justify-between text-xs bg-slate-900 px-2 py-1.5 rounded border border-slate-800">
                  <span className="text-slate-400">Bayesian Point Score:</span>
                  <span
                    className={`font-mono font-bold ${
                      acmg.bayesianScore > 0
                        ? 'text-rose-400'
                        : acmg.bayesianScore < 0
                        ? 'text-emerald-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {acmg.bayesianScore > 0 ? `+${acmg.bayesianScore}` : acmg.bayesianScore} pts
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 line-clamp-2 mt-2">
                  <span className="text-slate-300 font-semibold">Active Criteria:</span>{' '}
                  {acmg.supportedCriteria.length > 0 ? acmg.supportedCriteria.join(', ') : 'None triggered'}
                </div>

                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  {acmg.appliedRuleSummary}
                </p>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                ACMG rules engine was not evaluated.
              </div>
            )}
          </div>
          <div className="mt-3 text-[10px] text-slate-400 bg-slate-900/60 p-1.5 rounded font-mono">
            Deterministic combination rules based on curated clinical evidence.
          </div>
        </div>
      </div>
    </div>
  );
};
