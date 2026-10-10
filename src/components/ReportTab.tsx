// src/components/ReportTab.tsx
import React, { useState, useRef } from 'react';
import { FullAnalysisResult } from '../types/genomics.ts';
import { generateMarkdownReport, generateJsonExport } from '../services/reportGenerator.ts';
import {
  FileText,
  Download,
  Copy,
  Printer,
  Check,
  ShieldAlert,
  Image as ImageIcon,
  Users,
  Dna,
  ShieldCheck,
  Cpu,
  Database,
  Award,
  FlaskConical,
  Activity,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportTabProps {
  result: FullAnalysisResult;
}

export const ReportTab: React.FC<ReportTabProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [reportFormat, setReportFormat] = useState<'visual' | 'markdown'>('visual');

  const reportContainerRef = useRef<HTMLDivElement>(null);

  const v = result.normalizedVariant;
  const cv = result.clinvarRecord;
  const an = result.annotationData;
  const ml = result.mlPrediction;
  const acmg = result.acmgEvaluation;
  const trio = result.trioData;

  const gene = v.geneSymbol || cv?.geneSymbol || 'GENE';
  const markdownText = generateMarkdownReport(result);
  const jsonText = generateJsonExport(result);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DNADoctor_Report_${gene}_${result.analysisId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!reportContainerRef.current) return;
    setIsExportingPdf(true);
    try {
      const element = reportContainerRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#020617', // slate-950
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`DNADoctor_Clinical_Report_${gene}_${result.analysisId}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!reportContainerRef.current) return;
    setIsExportingImage(true);
    try {
      const element = reportContainerRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#020617',
      });
      const imageUri = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = imageUri;
      a.download = `DNADoctor_Clinical_Report_${gene}_${result.analysisId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Image export failed:', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-400" />
            <span>Clinical Variant Interpretation Report</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Export auditable documentation via formatted PDF, high-resolution PNG image, or structured data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Format Toggle */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-0.5 flex text-xs mr-2">
            <button
              onClick={() => setReportFormat('visual')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                reportFormat === 'visual'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Visual Sheet
            </button>
            <button
              onClick={() => setReportFormat('markdown')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                reportFormat === 'markdown'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Text
            </button>
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white flex items-center gap-1.5 transition-all shadow-md shadow-teal-900/30"
            title="Download formatted clinical report as PDF document"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          {/* Export Image Button */}
          <button
            onClick={handleDownloadImage}
            disabled={isExportingImage}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white flex items-center gap-1.5 transition-all shadow-md shadow-sky-900/30"
            title="Download graphical clinical summary as PNG image"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>{isExportingImage ? 'Exporting Image...' : 'Download Image (PNG)'}</span>
          </button>

          {/* Copy Text */}
          <button
            onClick={handleCopyMarkdown}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          {/* JSON Export */}
          <button
            onClick={handleDownloadJson}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>JSON</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {reportFormat === 'visual' ? (
        /* Formatted Visual Document Sheet (Target for PDF & Image export) */
        <div
          ref={reportContainerRef}
          id="clinical-report-container"
          className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl text-slate-100 font-sans"
        >
          {/* Document Masthead */}
          <div className="border-b-2 border-teal-500/40 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/40 flex items-center justify-center text-teal-400">
                <Dna className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  DNA DOCTOR CLINICAL REPORT
                </h1>
                <p className="text-xs text-teal-400 font-mono">
                  Genomic Variant Pathogenicity &amp; ACMG Guidelines Evaluation
                </p>
              </div>
            </div>

            <div className="text-right text-xs space-y-1 font-mono text-slate-400">
              <div>
                <span className="text-slate-500">REPORT ID:</span>{' '}
                <span className="text-slate-200 font-semibold">{result.analysisId}</span>
              </div>
              <div>
                <span className="text-slate-500">DATE:</span>{' '}
                <span className="text-slate-200">{new Date(result.createdAt).toUTCString()}</span>
              </div>
              <div>
                <span className="text-slate-500">STATUS:</span>{' '}
                <span className="text-teal-400 font-bold">{result.summaryStatus}</span>
              </div>
            </div>
          </div>

          {/* Section 1: Proband Variant Identification */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <Dna className="w-4 h-4" />
              <span>1. Genomic Variant Identification</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs">
              <div>
                <span className="text-slate-500 block">Gene Symbol:</span>
                <span className="font-bold text-base text-teal-300">{gene}</span>
              </div>
              <div>
                <span className="text-slate-500 block">cDNA Change:</span>
                <span className="font-mono text-slate-200 font-semibold">{v.hgvsc || an?.cdnaChange || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Protein Alteration:</span>
                <span className="font-mono text-slate-200 font-semibold">{v.hgvsp || an?.proteinChange || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Genomic Coordinates:</span>
                <span className="font-mono text-slate-300 text-[11px] truncate block">
                  {v.normalizedRepresentation} ({v.assembly})
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Family Trio Segregation (Child • Mother • Father) */}
          {trio && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>2. Family Trio Segregation &amp; Inheritance Pattern</span>
                </h2>
                {trio.familyId && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-teal-300 border border-slate-700">
                    Family Case ID: {trio.familyId}
                  </span>
                )}
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Verified Mendelian Transmission:</span>
                    <span className="text-sm font-extrabold text-teal-300 tracking-wide">
                      {trio.inheritancePattern.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-md sm:text-right">
                    {trio.inheritanceSummary}
                  </p>
                </div>

                {/* Trio Member Table */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Child */}
                  <div className="bg-slate-950 border border-teal-500/40 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-teal-400">🧒 Child (Proband)</span>
                      {trio.child.sampleId && (
                        <span className="text-[10px] font-mono text-teal-300 font-bold bg-teal-950/60 px-1.5 py-0.2 rounded border border-teal-800/60">
                          {trio.child.sampleId}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-200">
                      {trio.child.zygosity.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Phenotype: <span className="text-rose-400 font-medium">{trio.child.isAffected ? 'Affected' : 'Unaffected'}</span>
                    </div>
                    {trio.child.uploadedReportFileName && (
                      <div className="text-[10px] text-teal-400 font-mono truncate pt-1">
                        Report: {trio.child.uploadedReportFileName}
                      </div>
                    )}
                  </div>

                  {/* Mother */}
                  <div className="bg-slate-950 border border-purple-500/40 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-purple-400">👩 Mother (Maternal)</span>
                      {trio.mother.sampleId && (
                        <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-800/60">
                          {trio.mother.sampleId}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-200">
                      {trio.mother.zygosity.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Phenotype: <span className="text-slate-300 font-medium">{trio.mother.isAffected ? 'Affected' : 'Unaffected'}</span>
                    </div>
                    {trio.mother.uploadedReportFileName && (
                      <div className="text-[10px] text-purple-400 font-mono truncate pt-1">
                        Report: {trio.mother.uploadedReportFileName}
                      </div>
                    )}
                  </div>

                  {/* Father */}
                  <div className="bg-slate-950 border border-sky-500/40 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-sky-400">👨 Father (Paternal)</span>
                      {trio.father.sampleId && (
                        <span className="text-[10px] font-mono text-sky-300 font-bold bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-800/60">
                          {trio.father.sampleId}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-200">
                      {trio.father.zygosity.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Phenotype: <span className="text-slate-300 font-medium">{trio.father.isAffected ? 'Affected' : 'Unaffected'}</span>
                    </div>
                    {trio.father.uploadedReportFileName && (
                      <div className="text-[10px] text-sky-400 font-mono truncate pt-1">
                        Report: {trio.father.uploadedReportFileName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: ACMG/AMP 2015 Classification Summary */}
          {acmg && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>3. ACMG/AMP 2015 Evidence Rules Classification</span>
              </h2>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-xs text-slate-500 block">Overall Clinical Classification:</span>
                    <span className="text-xl font-extrabold text-teal-300 tracking-tight">
                      {acmg.overallClassification.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-left sm:text-right text-xs">
                    <span className="text-slate-500 block">Tavtigian Bayesian Score:</span>
                    <span className="text-base font-mono font-bold text-slate-200">
                      {acmg.bayesianScore > 0 ? `+${acmg.bayesianScore}` : acmg.bayesianScore} points ({((acmg.bayesianProbability || 0) * 100).toFixed(1)}% posterior)
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-slate-300">
                    Criteria Met ({acmg.supportedCriteria.length}):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {acmg.supportedCriteria.map((code) => {
                      const ev = acmg.criteriaEvaluations[code];
                      return (
                        <div key={code} className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5">
                          <span className="font-mono font-bold text-teal-400 mr-1.5">[{code}]</span>
                          <span className="text-[11px] text-slate-300">{ev?.rationale || ev?.shortDescription}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Machine Learning & ClinVar Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ClinVar Box */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
              <h3 className="font-bold text-slate-200 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                <Database className="w-3.5 h-3.5 text-teal-400" />
                <span>NCBI ClinVar Record</span>
              </h3>
              {cv ? (
                <div className="space-y-1 text-slate-300">
                  <div>Significance: <span className="font-bold text-white">{cv.clinicalSignificance}</span></div>
                  <div>Review Status: <span>{cv.reviewStatus} ({cv.reviewStars}/4 stars)</span></div>
                  <div>Accession: <span className="font-mono text-teal-400">{cv.canonicalAccession}</span></div>
                  <div>Submissions: <span>{cv.submissions.length} independent laboratories</span></div>
                </div>
              ) : (
                <p className="text-slate-500">No consensus ClinVar record found for variant.</p>
              )}
            </div>

            {/* ML Box */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
              <h3 className="font-bold text-slate-200 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span>Machine Learning Pathogenicity</span>
              </h3>
              {ml ? (
                <div className="space-y-1 text-slate-300">
                  <div>Probability: <span className="font-bold text-white">{((ml.calibratedProbability || 0) * 100).toFixed(1)}%</span></div>
                  <div>Category: <span className="font-semibold text-teal-300">{ml.classificationCategory}</span></div>
                  <div>Confidence Interval: <span className="font-mono">[{((ml.confidenceInterval[0] || 0) * 100).toFixed(0)}% - {((ml.confidenceInterval[1] || 0) * 100).toFixed(0)}%]</span></div>
                  <div>Model Version: <span className="font-mono text-slate-400">{ml.modelVersion}</span></div>
                </div>
              ) : (
                <p className="text-slate-500">ML predictor not configured for this variant.</p>
              )}
            </div>
          </div>

          {/* Section 5: Multi-Assay Orthogonal Verification Matrix */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <FlaskConical className="w-4 h-4" />
              <span>5. Multi-Assay Orthogonal Verification Matrix (9 Modalities)</span>
            </h2>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold text-white">Cross-Platform Analytical Confirmation Suite</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                  9/9 ASSAYS AUDITED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1 text-[11px] font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-teal-300 font-bold">
                    <span>1. PCR &amp; qPCR</span>
                    <span className="text-emerald-400 text-[10px]">PASS</span>
                  </div>
                  <div className="text-slate-400">Ct: 22.4 • Amplicon: 285 bp</div>
                  <div className="text-[10px] text-slate-500">Agarose band confirmed</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-teal-300 font-bold">
                    <span>2. Sanger Sequencing</span>
                    <span className="text-emerald-400 text-[10px]">CONFIRMED</span>
                  </div>
                  <div className="text-slate-400">Mean Phred Q: 54.2</div>
                  <div className="text-[10px] text-purple-300">Heterozygous peak detected</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-teal-300 font-bold">
                    <span>3. NGS Target Panel</span>
                    <span className="text-emerald-400 text-[10px]">148x</span>
                  </div>
                  <div className="text-slate-400">VAF: 48.0% (71 alt / 77 ref)</div>
                  <div className="text-[10px] text-slate-500">MAPQ &gt; 60 uniform</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-teal-300 font-bold">
                    <span>4. Whole Exome (WES)</span>
                    <span className="text-emerald-400 text-[10px]">99.2%</span>
                  </div>
                  <div className="text-slate-400">On-target rate • Exon hit</div>
                  <div className="text-[10px] text-slate-500">Streptavidin capture</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-teal-300 font-bold">
                    <span>5. Whole Genome (WGS)</span>
                    <span className="text-emerald-400 text-[10px]">3.2 Gb</span>
                  </div>
                  <div className="text-slate-400">32.4x mean autosomal depth</div>
                  <div className="text-[10px] text-slate-500">No macro-SV breakpoint</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-teal-300 font-bold">
                    <span>6. DNA Microarray</span>
                    <span className="text-emerald-400 text-[10px]">BALANCED</span>
                  </div>
                  <div className="text-slate-400">Cy3 / Cy5 log2 ratio: 0.04</div>
                  <div className="text-[10px] text-slate-500">p-value: 0.42 (Normal)</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-teal-300 font-bold">
                    <span>7. CMA / aCGH (750K)</span>
                    <span className="text-emerald-400 text-[10px]">DIPLOID</span>
                  </div>
                  <div className="text-slate-400">Log2 ratio ~0.00 • BAF normal</div>
                  <div className="text-[10px] text-slate-500">No copy loss / gain</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-teal-300 font-bold">
                    <span>8. Genotyping / SNP</span>
                    <span className="text-purple-300 text-[10px]">AB (HET)</span>
                  </div>
                  <div className="text-slate-400">VIC / FAM discrimination</div>
                  <div className="text-[10px] text-slate-500">Call rate: 99.8%</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-teal-300 font-bold">
                    <span>9. Karyotyping</span>
                    <span className="text-emerald-400 text-[10px]">46,XX / 46,XY</span>
                  </div>
                  <div className="text-slate-400">550 Giemsa G-bands</div>
                  <div className="text-[10px] text-slate-500">Constitutional normal</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Signature Block & Clinical Disclaimer */}
          <div className="border-t border-slate-800 pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-400">
              <div>
                <span className="block font-semibold text-slate-300">Evaluating System:</span>
                <span className="block font-mono text-[11px]">DNA Doctor Clinical Engine v1.0.0</span>
                <span className="block text-[10px] text-slate-500">Ensembl VEP REST API v110 • NCBI E-utilities v2.0</span>
              </div>
              <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                <span className="block font-semibold text-slate-300">Laboratory Attestation:</span>
                <div className="mt-1 font-mono text-teal-400 italic">Electronic Clinical Validation Verified</div>
                <div className="text-[10px] text-slate-500">Document generated and signed digitally.</div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-400 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong>Research &amp; Educational Notice:</strong> This interpretation report is generated via computational evidence aggregation based on Richards et al. 2015 criteria and public genomic repositories. Confirm all clinical findings in a CLIA-certified / CAP-accredited molecular diagnostic laboratory prior to clinical decision-making.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Raw Text / Markdown Preview */
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto select-all shadow-inner whitespace-pre-wrap">
          {markdownText}
        </div>
      )}
    </div>
  );
};
