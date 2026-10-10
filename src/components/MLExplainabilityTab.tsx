// src/components/MLExplainabilityTab.tsx
import React from 'react';
import { MLPrediction } from '../types/genomics.ts';
import { Cpu, ShieldAlert, CheckCircle, Info, BarChart } from 'lucide-react';

interface MLExplainabilityTabProps {
  prediction?: MLPrediction;
}

export const MLExplainabilityTab: React.FC<MLExplainabilityTabProps> = ({ prediction }) => {
  if (!prediction) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-slate-400 text-xs">
        Machine Learning inference was not executed.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Risk Probability Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <Cpu className="h-4 w-4 text-teal-400" />
              <span>Calibrated Pathogenicity Probability</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Supervised statistical classifier trained on balanced curated benchmark variants.
            </p>
          </div>
          <span className="text-[11px] font-mono text-teal-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 self-start sm:self-auto">
            Model: {prediction.modelVersion}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col justify-center">
            <span className="text-slate-500 text-xs">Calibrated Score:</span>
            <span className="text-2xl font-mono font-bold text-slate-100 mt-1">
              {(prediction.calibratedProbability * 100).toFixed(1)}%
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Risk: <strong className="text-teal-300">{prediction.classificationCategory.replace(/_/g, ' ')}</strong>
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col justify-center">
            <span className="text-slate-500 text-xs">95% Confidence Interval:</span>
            <span className="text-lg font-mono font-bold text-slate-200 mt-1">
              [{(prediction.confidenceInterval[0] * 100).toFixed(1)}% - {(prediction.confidenceInterval[1] * 100).toFixed(1)}%]
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">Standard error: ±4.5%</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col justify-center">
            <span className="text-slate-500 text-xs">Validation Metric:</span>
            <span className="text-lg font-mono font-bold text-emerald-400 mt-1">
              AUC-ROC {prediction.trainingMetadata.aucRoc}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              N = {prediction.trainingMetadata.datasetSize.toLocaleString()} variants
            </span>
          </div>
        </div>
      </div>

      {/* Feature Attributions / SHAP Waterfall */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center space-x-1.5">
          <BarChart className="h-4 w-4 text-teal-400" />
          <span>Feature Weight Breakdown (Directional Impact)</span>
        </h4>
        <p className="text-xs text-slate-400 mb-3">
          Relative contribution of biological, frequency, and structural features towards predicted pathogenicity.
        </p>

        <div className="space-y-2.5">
          {prediction.featureContributions.map((fc, idx) => {
            const isPath = fc.contributionDirection === 'PATHOGENIC';
            const isBenign = fc.contributionDirection === 'BENIGN';
            const barWidth = Math.min(100, Math.abs(fc.weight) * 25);

            return (
              <div key={idx} className="bg-slate-950/70 border border-slate-800/80 rounded p-2.5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-200">{fc.featureName}</span>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                      Value: {fc.featureValue}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold ${
                      isPath ? 'text-rose-400' : isBenign ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {fc.weight > 0 ? `+${fc.weight.toFixed(1)}` : fc.weight.toFixed(1)} log-odds
                  </span>
                </div>

                {/* Contribution bar */}
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden my-1">
                  <div
                    className={`h-full ${isPath ? 'bg-rose-500' : isBenign ? 'bg-emerald-500' : 'bg-slate-600'}`}
                    style={{ width: `${barWidth}%` }}
                  ></div>
                </div>

                <p className="text-[11px] text-slate-400 mt-1">{fc.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Disclaimer Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 flex items-start space-x-2">
        <ShieldAlert className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">{prediction.disclaimer}</p>
      </div>
    </div>
  );
};
