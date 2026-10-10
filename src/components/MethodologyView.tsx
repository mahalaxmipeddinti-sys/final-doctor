// src/components/MethodologyView.tsx
import React from 'react';
import { BookOpen, ShieldCheck, Database, Cpu, AlertTriangle, Scale } from 'lucide-react';

export const MethodologyView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-100 flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-teal-400" />
          <span>Scientific Methodology & Algorithmic Architecture</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          DNA Doctor was engineered to address clinical genomics challenges: conflation between historical database
          submissions, machine-learning continuous predictors, and formal evidence-based guideline compliance.
        </p>
      </div>

      {/* 1. Tri-Pillar Separation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center space-x-2 text-teal-400 mb-3">
          <Scale className="h-5 w-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider">1. The Tri-Pillar Epistemological Separation</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          A fundamental error in bioinformatics platforms is taking an arithmetic average of a ClinVar submission, a CADD
          score, and an ACMG rule result. DNA Doctor establishes three strictly distinct analytical pillars:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-2 text-blue-400 font-bold mb-1">
              <Database className="h-4 w-4" />
              <span>Pillar 1: Database Interpretations</span>
            </div>
            <p className="text-slate-400 mt-2 leading-relaxed">
              Consensus and individual submitter laboratory records retrieved from NCBI ClinVar. Preserves review stars
              (0–4 stars), submission assertion criteria, and last evaluation timestamps.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-2 text-teal-400 font-bold mb-1">
              <Cpu className="h-4 w-4" />
              <span>Pillar 2: Machine Learning Prediction</span>
            </div>
            <p className="text-slate-400 mt-2 leading-relaxed">
              Supervised continuous probability estimator derived solely from biological, structural, and evolutionary
              conservation features (CADD, PhyloP, SIFT, PolyPhen-2, gnomAD AF). Labels are strictly excluded from features
              to prevent circular leakage.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Pillar 3: ACMG/AMP 2015 Rules</span>
            </div>
            <p className="text-slate-400 mt-2 leading-relaxed">
              Deterministic evaluation of the 28 criteria defined by Richards et al. 2015 and calibrated by Tavtigian et al.
              Bayesian formulation. Criteria are activated strictly by meeting explicit evidence thresholds.
            </p>
          </div>
        </div>
      </div>

      {/* 2. ACMG 2015 Combination Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center space-x-2 text-emerald-400 mb-3">
          <ShieldCheck className="h-5 w-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider">2. ACMG/AMP 2015 Combination Rules</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          The engine implements the formal combinatorial criteria matrix. The five canonical clinical tiers are assigned
          according to standard rules:
        </p>

        <div className="space-y-2 text-xs">
          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <strong className="text-rose-400 block mb-1">PATHOGENIC RULES:</strong>
            <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
              <li>1 Very Strong (PVS1) AND ≥1 Strong (PS1–PS4)</li>
              <li>1 Very Strong (PVS1) AND ≥2 Moderate (PM1–PM6)</li>
              <li>1 Very Strong (PVS1) AND 1 Moderate (PM) AND 1 Supporting (PP1–PP5)</li>
              <li>1 Very Strong (PVS1) AND ≥2 Supporting (PP)</li>
              <li>≥2 Strong (PS1–PS4)</li>
              <li>1 Strong (PS) AND ≥3 Moderate (PM)</li>
              <li>1 Strong (PS) AND 2 Moderate (PM) AND ≥2 Supporting (PP)</li>
              <li>1 Strong (PS) AND 1 Moderate (PM) AND ≥4 Supporting (PP)</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <strong className="text-orange-400 block mb-1">LIKELY PATHOGENIC RULES:</strong>
            <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
              <li>1 Very Strong (PVS1) AND 1 Moderate (PM)</li>
              <li>1 Strong (PS) AND 1–2 Moderate (PM)</li>
              <li>1 Strong (PS) AND ≥2 Supporting (PP)</li>
              <li>≥3 Moderate (PM)</li>
              <li>2 Moderate (PM) AND ≥2 Supporting (PP)</li>
              <li>1 Moderate (PM) AND ≥4 Supporting (PP)</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <strong className="text-emerald-400 block mb-1">BENIGN &amp; LIKELY BENIGN RULES:</strong>
            <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
              <li><strong>Benign:</strong> 1 Stand-alone (BA1: gnomAD AF &gt; 5%) OR ≥2 Strong (BS1–BS4)</li>
              <li><strong>Likely Benign:</strong> 1 Strong (BS) AND 1 Supporting (BP) OR ≥2 Supporting (BP1–BP7)</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <strong className="text-amber-400 block mb-1">UNCERTAIN SIGNIFICANCE (VUS):</strong>
            <p className="text-slate-400 text-[11px]">
              All combinations that do not meet the criteria above, or scenarios where conflicting pathogenic and benign
              evidence criteria are simultaneously triggered.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Research Limitations & Compliance */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center space-x-2 text-amber-400 mb-3">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider">3. Limitations &amp; Ethical Boundaries</h3>
        </div>
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            • <strong>No Medical Diagnosis:</strong> This application is an educational and research prototype. Outputs must
            never be used to diagnose patients, recommend interventions, or replace professional genetic counseling.
          </p>
          <p>
            • <strong>Pedigree &amp; Segregation Boundaries:</strong> Criteria such as PS2 (confirmed de novo) and PP1
            (co-segregation) cannot be fully verified from public genomic coordinates alone and require clinical family
            pedigree data.
          </p>
          <p>
            • <strong>Database Provenance:</strong> ClinVar submissions reflect individual assertions from diagnostic
            laboratories; stars indicate review level, not absolute biological certainty.
          </p>
        </div>
      </div>
    </div>
  );
};
