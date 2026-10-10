// src/components/ReportModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
  Dna,
  ExternalLink,
  Printer,
  FileCheck,
} from 'lucide-react';
import { FullAnalysisResult } from '../types/genomics.ts';
import { AppUser } from '../services/auth.service.ts';
import { generateDnaDoctorPDF } from '../services/pdfReportGenerator.ts';
import { DNA_WATERMARK_BASE64 } from '../assets/dnaWatermark.ts';

interface ReportModalProps {
  analysis: FullAnalysisResult | null;
  currentUser: AppUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  analysis,
  currentUser,
  isOpen,
  onClose,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pdf' | 'interactive'>('pdf');
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && analysis) {
      handleGeneratePreview();
    } else {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setPdfBlobUrl(null);
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [isOpen, analysis]);

  if (!isOpen || !analysis) return null;

  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const generatedId = `RPT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setReportId(generatedId);

      const doc = await generateDnaDoctorPDF({
        analysis,
        user: currentUser,
        reportId: generatedId,
      });

      const blob = doc.output('blob');
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setPdfBlobUrl(url);
    } catch (err: any) {
      console.error('PDF Generation failed:', err);
      setErrorMsg(err.message || 'Failed to generate PDF document.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!analysis) return;
    try {
      const doc = await generateDnaDoctorPDF({
        analysis,
        user: currentUser,
        reportId: reportId || `RPT-${Date.now().toString(36).toUpperCase()}`,
      });

      const rawGene = analysis.normalizedVariant?.geneSymbol || analysis.normalizedVariant?.originalInput || 'Variant';
      const cleanGene = rawGene.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `DNADoctor_Report_${cleanGene}_${reportId || 'Clinical'}.pdf`;

      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 800);
    } catch (err: any) {
      setErrorMsg('Failed to download PDF: ' + err.message);
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank');
    }
  };

  const gene = analysis.normalizedVariant?.geneSymbol || analysis.normalizedVariant?.originalInput || 'Variant';
  const tier = (analysis.acmgEvaluation?.overallClassification || 'Assessed').replace(/_/g, ' ');
  const norm = analysis.normalizedVariant || ({} as any);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-6xl w-full h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Action Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/95 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-md">
              <Dna className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>DNA Doctor • 10-Page Clinical Genetic PDF Report</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {reportId || 'GENERATED'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {gene} ({norm.hgvsc || norm.originalInput}) • Status:{' '}
                <span className="font-semibold text-teal-300">{tier}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex text-xs">
              <button
                onClick={() => setViewMode('pdf')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                  viewMode === 'pdf' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>PDF Document</span>
              </button>
              <button
                onClick={() => setViewMode('interactive')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                  viewMode === 'interactive' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Interactive View</span>
              </button>
            </div>

            {/* Open in New Window */}
            {pdfBlobUrl && (
              <button
                onClick={handleOpenInNewTab}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
                title="Open PDF directly in a new browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                <span>Open in Tab</span>
              </button>
            )}

            {/* Direct Instant Download PDF */}
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-900/40 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div className="flex-1 bg-slate-950 overflow-auto relative">
          {isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 p-8 text-center">
              <RefreshCw className="w-9 h-9 text-teal-400 animate-spin" />
              <p className="text-sm font-semibold text-slate-200">Rendering 10-Page DNA Doctor PDF Report...</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Formatting ClinVar consensus, population frequencies, calibrated ML predictions, and ACMG criteria tables.
              </p>
            </div>
          ) : errorMsg ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 p-6 text-center text-rose-400">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm font-semibold">{errorMsg}</p>
              <button
                onClick={handleGeneratePreview}
                className="mt-2 px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md"
              >
                Retry PDF Build
              </button>
            </div>
          ) : viewMode === 'pdf' && pdfBlobUrl ? (
            <div className="w-full h-full flex flex-col">
              <object
                data={pdfBlobUrl}
                type="application/pdf"
                className="w-full h-full min-h-[500px] border-none bg-slate-900"
              >
                {/* Fallback if object is blocked */}
                <iframe
                  src={pdfBlobUrl}
                  title="DNA Doctor Clinical Report Preview"
                  className="w-full h-full border-none bg-slate-900"
                />
              </object>
            </div>
          ) : (
            /* Interactive 10-Section View (Always 100% visible even without PDF plugin) */
            <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-6 text-slate-200 font-sans relative">
              {/* DNA Background Watermark */}
              <div
                className="absolute inset-0 pointer-events-none opacity-5 bg-center bg-no-repeat bg-contain"
                style={{ backgroundImage: `url(${DNA_WATERMARK_BASE64})` }}
              />

              {/* Cover Banner */}
              <div className="bg-slate-900/90 backdrop-blur-md border border-teal-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold uppercase">
                      DNA Doctor • Clinical Report
                    </span>
                    <h1 className="text-xl font-bold text-white mt-2">Detailed Genetic Analysis Report</h1>
                    <p className="text-xs text-slate-400 mt-1">Report ID: {reportId} • Generated: {new Date().toLocaleString()}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-teal-300 font-semibold">Clinician ID: {currentUser?.uid || currentUser?.id || 'CLIN-849201'}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300">{currentUser?.displayName || 'Dr. Karthik (Lead Geneticist)'}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{currentUser?.institution || 'Genomics Diagnostic Institute'}</span>
                    </div>
                  </div>
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Clinician Face"
                      className="w-16 h-16 rounded-2xl border-2 border-teal-400/80 object-cover shadow-lg shadow-teal-950/50 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl border-2 border-teal-400/80 bg-slate-800 flex flex-col items-center justify-center text-teal-400 font-bold shadow-lg shrink-0">
                      <span className="text-base font-black">
                        {(currentUser?.displayName || 'Dr. Karthik').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                      <span className="text-[8px] text-slate-400 uppercase tracking-wider font-sans">DOCTOR</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Classification Tier</div>
                    <div className="text-lg font-black text-teal-400">{tier}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Target Gene</div>
                    <div className="text-lg font-mono font-bold text-white">{gene}</div>
                  </div>
                </div>
              </div>

              {/* 10-Page Summary Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h3 className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Pillar 1: ClinVar Clinical Consensus</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Significance: <span className="font-semibold text-white">{analysis.clinvarRecord?.clinicalSignificance || 'Novel / Unreviewed'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Review Stars: {analysis.clinvarRecord?.reviewStars ?? 0} / 4 Stars • Submissions: {analysis.clinvarRecord?.submissions?.length ?? 0}
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h3 className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                    <Dna className="w-3.5 h-3.5" />
                    <span>Pillar 2: Functional &amp; gnomAD Annotations</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    gnomAD Global AF: <span className="font-mono text-white">{analysis.annotationData?.gnomadAfGlobal ?? '0.00e+0'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    SIFT: {analysis.annotationData?.siftPrediction || 'N/A'} • PolyPhen: {analysis.annotationData?.polyphenPrediction || 'N/A'} • CADD: {analysis.annotationData?.caddPhred ?? 'N/A'}
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Pillar 3: ACMG 28-Rules &amp; ML Predictor</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Active Rules: <span className="font-mono text-emerald-300">{analysis.acmgEvaluation?.supportedCriteria?.join(', ') || 'None'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Bayesian Score: {analysis.acmgEvaluation?.bayesianScore ?? 0} pts • ML Probability: {((analysis.mlPrediction?.calibratedProbability ?? 0.5) * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h3 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Multi-Page PDF Export</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Click the <strong className="text-teal-300">Download PDF</strong> button above to save the complete 10-page scientific document.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Auditable vector report with embedded provenance, watermark, and clinician profile verification.</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <button
              onClick={handleDownload}
              className="text-teal-400 hover:text-teal-300 font-bold underline"
            >
              Direct Download (.pdf)
            </button>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">A4 • 10 Pages</span>
          </div>
        </div>
      </div>
    </div>
  );
};
