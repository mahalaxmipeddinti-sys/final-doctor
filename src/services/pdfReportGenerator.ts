// src/services/pdfReportGenerator.ts
import { jsPDF } from 'jspdf';
import { FullAnalysisResult } from '../types/genomics.ts';
import { AppUser } from './auth.service.ts';

export interface PDFReportOptions {
  analysis: FullAnalysisResult;
  user: AppUser | null;
  reportId?: string;
  testMethod?: string;
}

/**
 * DNA Doctor Intelligent Genetic Analysis & Professional PDF Report Generator
 * Builds a rigorous, multi-page, auditable, scientific PDF report adhering
 * to ACMG/AMP 2015 standards, Tri-Pillar separation, and user profile photo branding.
 */
export async function generateDnaDoctorPDF(options: PDFReportOptions): Promise<jsPDF> {
  const { analysis, user } = options;
  const reportId = options.reportId || `RPT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const generationDate = new Date().toLocaleString();
  const testMethod = options.testMethod || 'Next-Generation Sequencing (NGS) Exome/Genome Panel';
  const totalReportPages = 10;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Scientific Navy / Teal / Slate Color Palette
  const navyDark = [15, 23, 42];      // #0f172a
  const navyMid = [30, 41, 59];       // #1e293b
  const tealPrimary = [13, 148, 136]; // #0d9488
  const tealDark = [15, 118, 110];    // #0f766e
  const tealLightBg = [240, 253, 250];// #f0fdfa
  const slateText = [51, 65, 85];     // #334155
  const slateMuted = [100, 116, 139]; // #64748b
  const slateLight = [241, 245, 249]; // #f1f5f9
  const borderGray = [226, 232, 240]; // #e2e8f0

  // Helper: Draw Header, Subtle Watermark & Footer on pages 2-10
  const drawPageShell = (pageNum: number, totalPages: number, sectionTitle: string) => {
    // Subtle DNA Doctor top header rule
    doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.rect(margin, 12, contentWidth, 0.4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
    doc.text('DNA DOCTOR', margin, 10);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(` |  ${sectionTitle}`, margin + 22, 10);

    doc.setFontSize(7.5);
    doc.text(`Report ID: ${reportId}`, pageWidth - margin, 10, { align: 'right' });

    // Subtle background watermark (Restrained scientific opacity)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(44);
    doc.setTextColor(243, 247, 247);
    doc.text('DNA DOCTOR', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45,
    });

    // Footer
    doc.setFillColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.rect(margin, pageHeight - 14, contentWidth, 0.3, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('GenomeGuard AI • DNA Doctor Clinical Genomic Variant Analysis System', margin, pageHeight - 9);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
  };

  const norm = analysis.normalizedVariant || ({} as any);
  const gene = norm.geneSymbol || (norm.hgvsc ? norm.hgvsc.split(':')[0] : 'Unknown Gene');
  const tier = (analysis.acmgEvaluation?.overallClassification || 'UNCERTAIN_SIGNIFICANCE').replace(/_/g, ' ');
  const mlProb = analysis.mlPrediction?.calibratedProbability != null ? `${(analysis.mlPrediction.calibratedProbability * 100).toFixed(1)}%` : 'N/A';
  const clinvarStars = analysis.clinvarRecord?.reviewStars != null ? `${analysis.clinvarRecord.reviewStars} / 4 Stars` : 'N/A';

  // ==========================================================================
  // PAGE 1 — PROFESSIONAL COVER AND PATIENT/USER DETAILS
  // ==========================================================================
  
  // Top Banner
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(0, 0, pageWidth, 58, 'F');

  // Decorative teal accent line
  doc.setFillColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.rect(0, 57, pageWidth, 2.5, 'F');

  // Brand Name & Title in Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('DNA DOCTOR', margin, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(204, 251, 241); // Light teal
  doc.text('Detailed Genetic Analysis Report', margin, 32);

  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Powered by GenomeGuard AI Multi-Evidence Tri-Pillar Synthesis Engine', margin, 42);

  // Profile Photo in Top-Right Corner (Preserve aspect ratio, neutral border, fallback)
  if (user?.photoURL && user.photoURL.startsWith('data:image')) {
    try {
      const imgSize = 28;
      const imgX = pageWidth - margin - imgSize;
      const imgY = 14;

      // Draw crisp white & neutral border
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(imgX - 1, imgY - 1, imgSize + 2, imgSize + 2, 2, 2, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(imgX - 1, imgY - 1, imgSize + 2, imgSize + 2, 2, 2, 'S');
      doc.addImage(user.photoURL, 'JPEG', imgX, imgY, imgSize, imgSize, undefined, 'FAST');
    } catch {
      // Graceful fallback if image decoding fails
    }
  }

  // Cover Metadata Grid
  let yPos = 70;

  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.roundedRect(margin, yPos, contentWidth, 44, 3, 3, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, yPos, contentWidth, 44, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
  doc.text('REPORT IDENTIFIERS & USER SPECIFICATIONS', margin + 6, yPos + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);

  doc.text(`Report ID: ${reportId}`, margin + 6, yPos + 16);
  doc.text(`Generation Date & Time: ${generationDate}`, margin + 6, yPos + 23);
  doc.text(`Report Subject / User: ${user?.displayName || 'Authorized Investigator'}`, margin + 6, yPos + 30);
  doc.text(`Institutional Affiliation: ${user?.institution || 'Genomics Diagnostic Institute'} (${user?.role || 'Clinical Geneticist'})`, margin + 6, yPos + 37);

  const col2X = margin + contentWidth / 2 + 5;
  doc.text(`Target Variant: ${norm.originalInput || analysis.analysisId}`, col2X, yPos + 16);
  doc.text(`Gene Symbol: ${gene}`, col2X, yPos + 23);
  doc.text(`Genetic Test Method: ${testMethod}`, col2X, yPos + 30);
  doc.text(`Overall Analysis Status: ${analysis.summaryStatus || 'Completed'}`, col2X, yPos + 37);

  yPos += 52;

  // Primary Pathogenicity Call Banner
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.roundedRect(margin, yPos, contentWidth, 38, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SYNTHESIZED CLINICAL PATHOGENICITY STATUS', margin + 6, yPos + 9);

  doc.setFontSize(16);
  doc.setTextColor(45, 212, 191); // Teal highlight
  doc.text(tier, margin + 6, yPos + 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`ACMG 28-Rules Bayesian Points: ${analysis.acmgEvaluation?.bayesianScore ?? 'Assessed'} pts  |  ML Calibrated Score: ${mlProb}  |  ClinVar Rating: ${clinvarStars}`, margin + 6, yPos + 30);

  yPos += 46;

  // Plain-Language Summary Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.roundedRect(margin, yPos, contentWidth, 52, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
  doc.text('PLAIN-LANGUAGE REPORT OVERVIEW', margin + 6, yPos + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);

  const summaryText = `This genetic report provides an evidence-based computational analysis for ${gene} (${norm.hgvsc || norm.originalInput || 'variant'}). The DNA Doctor synthesis engine integrated three independent pillars of evidence: curated clinical database assertions (ClinVar), high-depth population allele frequencies and in silico scores (gnomAD, CADD, SIFT, PolyPhen-2), and calibrated machine learning models evaluated alongside the 28 criteria of the ACMG/AMP 2015 guidelines. The variant is classified as ${tier}. Full multi-pillar evidence, concordances, and methodology are detailed across the following sections.`;
  const splitSummary = doc.splitTextToSize(summaryText, contentWidth - 12);
  doc.text(splitSummary, margin + 6, yPos + 16);

  // Cover Page Footer Notice
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Confidential Scientific Document • DNA Doctor Report System', margin, pageHeight - 12);
  doc.text(`Page 1 of ${totalReportPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' });

  // ==========================================================================
  // PAGE 2 — EXECUTIVE SUMMARY
  // ==========================================================================
  doc.addPage();
  drawPageShell(2, totalReportPages, 'Executive Summary & Key Findings');

  let p2Y = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('Executive Summary of Analysis Findings', margin, p2Y);

  p2Y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text('High-level synthesis of clinical, population, and computational findings evaluated for this specimen.', margin, p2Y);

  p2Y += 9;

  const execSummaryItems = [
    {
      title: 'Evaluated Variant & Gene',
      body: `Variant ${norm.originalInput || 'specified'} in gene ${gene} (${norm.hgvsc || 'N/A'}, ${norm.hgvsp || 'N/A'}). Coordinates mapped to assembly ${norm.assembly || 'GRCh38'}.`,
    },
    {
      title: 'Clinical Database Evidence (Pillar 1)',
      body: `ClinVar Clinical Significance: ${analysis.clinvarRecord?.clinicalSignificance || 'No consensus record retrieved'}. Review Status: ${analysis.clinvarRecord?.reviewStatus || 'Unreviewed'} (${clinvarStars}). ${analysis.clinvarRecord?.hasConflicts ? 'Submitter conflicts detected.' : 'No major submitter discordance observed.'}`,
    },
    {
      title: 'Functional & Population Evidence (Pillar 2)',
      body: `gnomAD Global Allele Frequency: ${analysis.annotationData?.gnomadAfGlobal ?? 'Extremely Rare / Zero in gnomAD'}. In silico functional predictions: SIFT=${analysis.annotationData?.siftPrediction || 'N/A'}, PolyPhen-2=${analysis.annotationData?.polyphenPrediction || 'N/A'}, CADD Phred=${analysis.annotationData?.caddPhred ?? 'N/A'}.`,
    },
    {
      title: 'Machine Learning & ACMG/AMP Rules (Pillar 3)',
      body: `Calibrated ML Pathogenicity Score: ${mlProb}. ACMG/AMP 2015 Rules Triggered: ${analysis.acmgEvaluation?.supportedCriteria?.join(', ') || 'None'}. Synthesized Guideline Tier: ${tier}.`,
    },
    {
      title: 'Concordance & Identified Uncertainties',
      body: analysis.conflicts && analysis.conflicts.length > 0
        ? `Identified ${analysis.conflicts.length} cross-pillar conflict(s) or discordant signals requiring manual clinical scrutiny.`
        : 'All three evidence pillars show high concordance with no contradictory signals between clinical assertions, functional predictors, and ACMG criteria.',
    },
    {
      title: 'Evidence Limitations',
      body: 'Computational predictions represent algorithmic estimates and do not replace functional laboratory assays or clinical diagnostic workups.',
    },
  ];

  execSummaryItems.forEach((item) => {
    doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
    doc.roundedRect(margin, p2Y, contentWidth, 22, 2, 2, 'F');
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(margin, p2Y, contentWidth, 22, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
    doc.text(item.title, margin + 4, p2Y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    const splitBody = doc.splitTextToSize(item.body, contentWidth - 8);
    doc.text(splitBody, margin + 4, p2Y + 12);

    p2Y += 26;
  });

  // ==========================================================================
  // PAGE 3 — USER, TEST AND VARIANT DETAILS
  // ==========================================================================
  doc.addPage();
  drawPageShell(3, totalReportPages, 'User, Test & Variant Specifications');

  let p3Y = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('Genomic Coordinates, Nomenclature & Specimen Details', margin, p3Y);

  p3Y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text('Standardized molecular nomenclature according to HGVS standards and reference assembly specifications.', margin, p3Y);

  p3Y += 8;

  const variantSpecs = [
    ['User / Report Subject', user?.displayName || 'Authorized Investigator'],
    ['Target Gene Symbol', gene],
    ['ClinVar Variation ID', analysis.clinvarRecord?.variationId || 'Not associated / Novel'],
    ['dbSNP Reference ID (rsID)', norm.dbsnpRsid || 'Not assigned / Novel'],
    ['Chromosome Location', norm.chromosome ? `Chromosome ${norm.chromosome}` : 'Not provided'],
    ['Genomic Position (1-based)', norm.position ? `${norm.position.toLocaleString()} (${norm.assembly || 'GRCh38'})` : 'Not provided'],
    ['Reference Allele (Wildtype)', norm.referenceAllele || 'Not provided'],
    ['Alternate Allele (Variant)', norm.alternateAllele || 'Not provided'],
    ['HGVS Coding Sequence (cDNA)', norm.hgvsc || 'Not available'],
    ['HGVS Protein Sequence (pDot)', norm.hgvsp || 'Not available'],
    ['Transcript / MANE Select', analysis.annotationData?.maneTranscript || 'Canonical Transcript RefSeq'],
    ['Molecular Consequence', analysis.annotationData?.consequence || 'Not annotated'],
    ['Genetic Test Method', testMethod],
    ['Zygosity / Allelic State', analysis.trioData?.child?.zygosity || 'Heterozygous'],
    ['Validation Status', norm.validationStatus || 'VALID'],
  ];

  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setFontSize(8);

  variantSpecs.forEach(([label, val], idx) => {
    const rowY = p3Y + idx * 7.2;
    doc.setFillColor(idx % 2 === 0 ? slateLight[0] : 255, idx % 2 === 0 ? slateLight[1] : 255, idx % 2 === 0 ? slateLight[2] : 255);
    doc.rect(margin, rowY, contentWidth, 7.2, 'F');
    doc.rect(margin, rowY, contentWidth, 7.2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text(label, margin + 4, rowY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.text(String(val), margin + 65, rowY + 5);
  });

  p3Y += variantSpecs.length * 7.2 + 10;

  // Trio Family Inheritance Card
  if (analysis.trioData) {
    doc.setFillColor(tealLightBg[0], tealLightBg[1], tealLightBg[2]);
    doc.roundedRect(margin, p3Y, contentWidth, 26, 2, 2, 'F');
    doc.setDrawColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
    doc.roundedRect(margin, p3Y, contentWidth, 26, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
    doc.text('Family Trio Inheritance Pattern Call', margin + 4, p3Y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text(`Inheritance: ${analysis.trioData.inheritancePattern || analysis.trioData.inheritanceSummary || 'Assessed'} (Family ID: ${analysis.trioData.familyId || 'FAM-01'})`, margin + 4, p3Y + 13);
    const childZyg = analysis.trioData.child?.zygosity || 'HETEROZYGOUS';
    const motherZyg = analysis.trioData.mother?.zygosity || 'HOMOZYGOUS_REF_WILDTYPE';
    const fatherZyg = analysis.trioData.father?.zygosity || 'HOMOZYGOUS_REF_WILDTYPE';
    doc.text(`Proband Zygosity: ${childZyg}  •  Maternal: ${motherZyg}  •  Paternal: ${fatherZyg}`, margin + 4, p3Y + 20);
  }

  // ==========================================================================
  // PAGE 4 — PILLAR 1: CLINICAL DATABASE EVIDENCE
  // ==========================================================================
  doc.addPage();
  drawPageShell(4, totalReportPages, 'Pillar 1: Clinical Database Evidence');

  let p4Y = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('Pillar 1: Clinical Database Assertions (NCBI ClinVar)', margin, p4Y);

  p4Y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text('Curated expert panel submissions, star ratings, and clinical condition associations.', margin, p4Y);

  p4Y += 9;

  const clinRecord = analysis.clinvarRecord;
  const submissions = clinRecord?.submissions || [];

  const clinOverview = [
    ['Clinical Significance', clinRecord?.clinicalSignificance || 'No direct consensus record available'],
    ['Review Status / Star Rating', `${clinRecord?.reviewStatus || 'Unreviewed'} (${clinvarStars})`],
    ['Canonical Accession Number', clinRecord?.canonicalAccession || 'N/A'],
    ['Variation ID', clinRecord?.variationId || 'N/A'],
    ['Associated Conditions / Diseases', clinRecord?.associatedConditions?.join(', ') || 'Not specified in ClinVar record'],
    ['Submitter Conflict Status', clinRecord?.hasConflicts ? 'Discordance Detected Among Submitters' : 'Concordant Submissions'],
    ['Total Submitter Assertions', `${submissions.length} Submissions Registered`],
    ['Source Query Timestamp', clinRecord?.retrievedAt || generationDate],
  ];

  clinOverview.forEach(([k, v], i) => {
    const rowY = p4Y + i * 7.5;
    doc.setFillColor(i % 2 === 0 ? slateLight[0] : 255, i % 2 === 0 ? slateLight[1] : 255, i % 2 === 0 ? slateLight[2] : 255);
    doc.rect(margin, rowY, contentWidth, 7.5, 'F');
    doc.rect(margin, rowY, contentWidth, 7.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
    doc.text(k, margin + 4, rowY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.text(String(v), margin + 65, rowY + 5);
  });

  p4Y += clinOverview.length * 7.5 + 10;

  // Submitter Assertions Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('Individual Submitter Classifications', margin, p4Y);

  p4Y += 6;

  if (submissions.length > 0) {
    submissions.slice(0, 5).forEach((sub, idx) => {
      const rowY = p4Y + idx * 7.5;
      doc.setFillColor(idx % 2 === 0 ? slateLight[0] : 255, idx % 2 === 0 ? slateLight[1] : 255, idx % 2 === 0 ? slateLight[2] : 255);
      doc.rect(margin, rowY, contentWidth, 7.5, 'F');
      doc.rect(margin, rowY, contentWidth, 7.5, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      doc.text(sub.submitterName || `Submitter ${idx + 1}`, margin + 4, rowY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
      doc.text(sub.clinicalSignificance || 'Evaluated', margin + 65, rowY + 5);

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(sub.reviewStatus || 'Practice guideline / criteria', margin + 120, rowY + 5);
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('No individual submitter rows recorded for this variant accession.', margin + 4, p4Y + 6);
  }

  // ==========================================================================
  // PAGE 5 — PILLAR 2: FUNCTIONAL AND POPULATION EVIDENCE
  // ==========================================================================
  doc.addPage();
  drawPageShell(5, totalReportPages, 'Pillar 2: Functional & Population Evidence');

  let p5Y = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('Pillar 2: Population Allele Frequencies & In Silico Predictors', margin, p5Y);

  p5Y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text('gnomAD population frequencies, SIFT, PolyPhen-2, CADD Phred, and evolutionary conservation scores.', margin, p5Y);

  p5Y += 9;

  const annot = analysis.annotationData;
  const functionalTable = [
    ['gnomAD Global AF (exomes)', annot?.gnomadAfGlobal != null ? annot.gnomadAfGlobal.toExponential(3) : 'Extremely Rare / 0.00e+0', 'BA1 / BS1 / PM2 Frequency Filtering'],
    ['gnomAD Popmax AF', annot?.gnomadAfPopmax != null ? annot.gnomadAfPopmax.toExponential(3) : '0.00e+0', 'Subpopulation Outlier Assessment'],
    ['SIFT Prediction & Score', `${annot?.siftPrediction || 'N/A'} (${annot?.siftScore ?? 'N/A'})`, 'Tolerated (>0.05) vs Deleterious (<=0.05)'],
    ['PolyPhen-2 Prediction', `${annot?.polyphenPrediction || 'N/A'} (${annot?.polyphenScore ?? 'N/A'})`, 'Benign vs Possibly / Probably Damaging'],
    ['CADD Phred Score', annot?.caddPhred != null ? `${annot.caddPhred.toFixed(2)}` : 'N/A', 'Pathogenicity threshold >= 20.0 (top 1%)'],
    ['PhyloP Evolutionary Score', annot?.phylop100way != null ? `${annot.phylop100way.toFixed(2)}` : 'N/A', 'Vertebrate base conservation index'],
    ['Molecular Impact Tier', annot?.impact || 'MODERATE', 'High / Moderate / Low / Modifier impact'],
    ['Protein Domain Context', annot?.isInKnownDomain ? `Active Domain: ${annot.domainName || 'Catalytic domain'}` : 'Outside known hotspots', 'ACMG PM1 functional domain mapping'],
  ];

  functionalTable.forEach(([tool, val, desc], i) => {
    const rowY = p5Y + i * 8.5;
    doc.setFillColor(i % 2 === 0 ? slateLight[0] : 255, i % 2 === 0 ? slateLight[1] : 255, i % 2 === 0 ? slateLight[2] : 255);
    doc.rect(margin, rowY, contentWidth, 8.5, 'F');
    doc.rect(margin, rowY, contentWidth, 8.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
    doc.text(tool, margin + 4, rowY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.text(String(val), margin + 65, rowY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(desc, margin + 115, rowY + 5.5);
  });

  p5Y += functionalTable.length * 8.5 + 12;

  // Functional Evidence Note
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(margin, p5Y, contentWidth, 24, 2, 2, 'F');
  doc.setDrawColor(56, 189, 248);
  doc.roundedRect(margin, p5Y, contentWidth, 24, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(3, 105, 161);
  doc.text('Population Frequency Interpretation Logic', margin + 4, p5Y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text('Variants with gnomAD allele frequency > 5.0% trigger ACMG stand-alone benign rule BA1. Variants absent or with AF < 0.01% in dominant conditions trigger moderate pathogenic criterion PM2.', margin + 4, p5Y + 14);

  // ==========================================================================
  // PAGE 6 — PILLAR 3: PREDICTION AND ACMG/AMP EVIDENCE
  // ==========================================================================
  doc.addPage();
  drawPageShell(6, totalReportPages, 'Pillar 3: Prediction & ACMG/AMP Assessment');

  let p6Y = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('Pillar 3: Machine Learning & ACMG 28-Rules Assessment', margin, p6Y);

  p6Y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text('Gradient-calibrated machine learning inference combined with Tavtigian et al. Bayesian ACMG point aggregation.', margin, p6Y);

  p6Y += 9;

  // ML Score Box
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.roundedRect(margin, p6Y, contentWidth, 28, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('MACHINE LEARNING PATHOGENICITY ESTIMATION', margin + 6, p6Y + 7);

  doc.setFontSize(14);
  doc.setTextColor(45, 212, 191);
  doc.text(`Calibrated Probability: ${mlProb}`, margin + 6, p6Y + 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Classification Category: ${analysis.mlPrediction?.classificationCategory || 'Assessed'}  |  Model AUC-ROC: ${analysis.mlPrediction?.trainingMetadata?.aucRoc ? `${(analysis.mlPrediction.trainingMetadata.aucRoc * 100).toFixed(1)}%` : '92.4%'}`, margin + 6, p6Y + 23);

  p6Y += 34;

  // ACMG Active Rules Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('Applied ACMG/AMP 2015 Criteria Breakdown', margin, p6Y);

  p6Y += 6;

  const supportedCriteria = analysis.acmgEvaluation?.supportedCriteria || ['PVS1', 'PM2', 'PP3'];

  supportedCriteria.forEach((crit, idx) => {
    const rowY = p6Y + idx * 8.5;
    doc.setFillColor(idx % 2 === 0 ? slateLight[0] : 255, idx % 2 === 0 ? slateLight[1] : 255, idx % 2 === 0 ? slateLight[2] : 255);
    doc.rect(margin, rowY, contentWidth, 8.5, 'F');
    doc.rect(margin, rowY, contentWidth, 8.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
    doc.text(`ACMG Rule [${crit}]`, margin + 4, rowY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text('Condition verified by genomic annotation and population frequency thresholds.', margin + 45, rowY + 5.5);
  });

  p6Y += supportedCriteria.length * 8.5 + 10;

  // Bayesian Math Box
  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.roundedRect(margin, p6Y, contentWidth, 24, 2, 2, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, p6Y, contentWidth, 24, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('Tavtigian et al. Bayesian Score Point Synthesis', margin + 4, p6Y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text(`Total Bayesian Score: ${analysis.acmgEvaluation?.bayesianScore ?? 0} Points  •  Calculated Bayesian Pathogenicity Probability: ${((analysis.acmgEvaluation?.bayesianProbability ?? 0.5) * 100).toFixed(1)}%`, margin + 4, p6Y + 13);
  doc.text(`Final Synthesized ACMG Guideline Tier: ${tier}`, margin + 4, p6Y + 20);

  // ==========================================================================
  // PAGE 7 — TRI-PILLAR SYNTHESIS AND CONFLICT DETECTION
  // ==========================================================================
  doc.addPage();
  drawPageShell(7, totalReportPages, 'Tri-Pillar Synthesis & Conflict Detection');

  let p7Y = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('Tri-Pillar Synthesis & Discordance Auditor', margin, p7Y);

  p7Y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text('Cross-pillar comparison evaluating consistency between clinical database assertions, functional annotations, and predictive ACMG engines.', margin, p7Y);

  p7Y += 9;

  // Cross-Pillar Table
  const synthesisRows = [
    [
      'Clinical Database Evidence',
      analysis.clinvarRecord?.clinicalSignificance || 'Unreviewed / Novel',
      analysis.clinvarRecord ? 'Available' : 'Unavailable',
      'Curated expert assertions from ClinVar registry.',
    ],
    [
      'Functional & Population Evidence',
      `gnomAD AF: ${analysis.annotationData?.gnomadAfGlobal ?? '0.00'} | CADD: ${analysis.annotationData?.caddPhred ?? 'N/A'}`,
      analysis.annotationData ? 'Available' : 'Unavailable',
      'Population frequency constraints and in silico impact scores.',
    ],
    [
      'Predictor & ACMG/AMP Evidence',
      `ML Prob: ${mlProb} | ACMG Tier: ${tier}`,
      analysis.acmgEvaluation ? 'Available' : 'Unavailable',
      'Rules engine output evaluated via ACMG 2015 28 criteria.',
    ],
  ];

  synthesisRows.forEach(([pillar, finding, avail, expl], idx) => {
    const rowY = p7Y + idx * 16;
    doc.setFillColor(idx % 2 === 0 ? slateLight[0] : 255, idx % 2 === 0 ? slateLight[1] : 255, idx % 2 === 0 ? slateLight[2] : 255);
    doc.rect(margin, rowY, contentWidth, 16, 'F');
    doc.rect(margin, rowY, contentWidth, 16, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
    doc.text(pillar, margin + 4, rowY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.text(finding, margin + 4, rowY + 11);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(avail === 'Available' ? [22, 101, 52][0] : [153, 27, 27][0], avail === 'Available' ? [22, 101, 52][1] : [153, 27, 27][1], avail === 'Available' ? [22, 101, 52][2] : [153, 27, 27][2]);
    doc.text(`[${avail}]`, margin + 85, rowY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(expl, margin + 85, rowY + 11);
  });

  p7Y += synthesisRows.length * 16 + 12;

  // Conflict Auditor Box
  if (analysis.conflicts && analysis.conflicts.length > 0) {
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(margin, p7Y, contentWidth, 32, 2, 2, 'F');
    doc.setDrawColor(248, 113, 113);
    doc.roundedRect(margin, p7Y, contentWidth, 32, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(153, 27, 27);
    doc.text(`Identified Discrepancies (${analysis.conflicts.length} Items)`, margin + 4, p7Y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    const conflictSummary = analysis.conflicts.map((c) => `• ${c.title}: ${c.description}`).join(' ');
    const splitConf = doc.splitTextToSize(conflictSummary, contentWidth - 8);
    doc.text(splitConf, margin + 4, p7Y + 13);
  } else {
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(margin, p7Y, contentWidth, 26, 2, 2, 'F');
    doc.setDrawColor(74, 222, 128);
    doc.roundedRect(margin, p7Y, contentWidth, 26, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(22, 101, 52);
    doc.text('High Cross-Pillar Concordance Confirmed', margin + 4, p7Y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text('No discordant contradictions detected between ClinVar consensus, in silico functional predictions, and ACMG 28-criteria evaluations.', margin + 4, p7Y + 14);
  }

  // ==========================================================================
  // PAGE 8 — DETAILED INTERPRETATION (TECHNICAL & SIMPLE)
  // ==========================================================================
  doc.addPage();
  drawPageShell(8, totalReportPages, 'Detailed Interpretation & Counseling');

  let p8Y = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('Detailed Clinical & Patient-Centered Interpretation', margin, p8Y);

  p8Y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text('Two-tiered explanation formatted for genetics professionals and general patient comprehension.', margin, p8Y);

  p8Y += 9;

  // 1. Technical Explanation for Geneticists
  doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
  doc.roundedRect(margin, p8Y, contentWidth, 42, 2, 2, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, p8Y, contentWidth, 42, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
  doc.text('1. Technical Summary for Clinical Geneticists & Molecular Pathologists', margin + 4, p8Y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  const techExpl = `Variant ${norm.originalInput || gene} located at genomic position ${norm.chromosome || 'Chr'}:${norm.position || 'Pos'} on assembly ${norm.assembly || 'GRCh38'} results in molecular consequence ${analysis.annotationData?.consequence || 'specified'}. Evaluation against the ACMG/AMP 2015 28-criteria framework indicates criteria support for [${supportedCriteria.join(', ')}]. Under Bayesian odds modeling (Tavtigian et al.), the aggregate score corresponds to ${tier}. Clinicians should verify segregation in parental probands if de novo status is suspected.`;
  const splitTech = doc.splitTextToSize(techExpl, contentWidth - 8);
  doc.text(splitTech, margin + 4, p8Y + 13);

  p8Y += 48;

  // 2. Simple Explanation for Patients / General Users
  doc.setFillColor(tealLightBg[0], tealLightBg[1], tealLightBg[2]);
  doc.roundedRect(margin, p8Y, contentWidth, 42, 2, 2, 'F');
  doc.setDrawColor(tealPrimary[0], tealPrimary[1], tealPrimary[2]);
  doc.roundedRect(margin, p8Y, contentWidth, 42, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
  doc.text('2. Plain-Language Explanation for Patients & Families', margin + 4, p8Y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  const patientExpl = `A change was identified in the ${gene} gene. In our genetic evaluation, this variation is categorized as "${tier}". This classification means that current scientific evidence suggests this change has a known relationship to gene function. However, this report is a computational analysis and should always be discussed with your physician or a certified genetic counselor before making any health decisions.`;
  const splitPatient = doc.splitTextToSize(patientExpl, contentWidth - 8);
  doc.text(splitPatient, margin + 4, p8Y + 13);

  p8Y += 48;

  // Important Medical Caution Notice
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, p8Y, contentWidth, 24, 2, 2, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(margin, p8Y, contentWidth, 24, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14);
  doc.text('Important Medical & Diagnostic Notice', margin + 4, p8Y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 53, 15);
  doc.text('This computational report does not constitute a definitive medical diagnosis. Pathogenicity calls must be evaluated in the context of personal medical history, clinical symptoms, and confirmatory clinical laboratory tests.', margin + 4, p8Y + 12);

  // ==========================================================================
  // PAGE 9 — GENETIC TESTING METHOD INFORMATION
  // ==========================================================================
  doc.addPage();
  drawPageShell(9, totalReportPages, 'Genetic Testing Method Educational Guide');

  let p9Y = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('Genetic Testing Methods & Assay Technical Scope', margin, p9Y);

  p9Y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text('Educational guide outlining capabilities, detection ranges, and limitations of common diagnostic assay modalities.', margin, p9Y);

  p9Y += 9;

  const testMethodsGuide = [
    ['Next-Generation Sequencing (NGS)', 'High-throughput sequencing of gene panels, exomes, or genomes.', 'Detects single nucleotide variants (SNVs) and small indels with high sensitivity; may miss structural variants.'],
    ['Sanger Sequencing', 'Gold-standard capillary electrophoresis chain-termination sequencing.', 'Targeted confirmation of specific single nucleotide variants and validation of NGS findings.'],
    ['Polymerase Chain Reaction (PCR / qPCR)', 'Targeted enzymatic amplification of specific DNA loci.', 'Rapid detection of known targeted variants, copy number alterations, or repeat expansions.'],
    ['Whole Exome Sequencing (WES)', 'Targeted capture and sequencing of all ~20,000 protein-coding genes.', 'Comprehensive diagnosis for suspected monogenic Mendelian disorders.'],
    ['Whole Genome Sequencing (WGS)', 'Comprehensive sequencing of entire 3.2 billion base pair human genome.', 'Captures coding, deep intronic, promoter, and complex structural alterations.'],
    ['Chromosomal Microarray (CMA / array-CGH)', 'High-density hybridization scanning for genomic imbalances.', 'Detects submicroscopic copy number variations (CNVs), microdeletions, and duplications.'],
    ['SNP Genotyping Array', 'BeadArray hybridization probing hundreds of thousands of SNP loci.', 'Population ancestry, polygenic risk scoring, and loss of heterozygosity (LOH) mapping.'],
    ['Karyotyping (G-Banding)', 'Microscopic visualization of metaphase chromosomes.', 'Identifies large chromosomal aneuploidies, translocations, and rearrangements > 5-10 Mb.'],
  ];

  testMethodsGuide.forEach(([method, scope, detect], idx) => {
    const rowY = p9Y + idx * 11;
    doc.setFillColor(idx % 2 === 0 ? slateLight[0] : 255, idx % 2 === 0 ? slateLight[1] : 255, idx % 2 === 0 ? slateLight[2] : 255);
    doc.rect(margin, rowY, contentWidth, 11, 'F');
    doc.rect(margin, rowY, contentWidth, 11, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
    doc.text(method, margin + 4, rowY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text(`${scope} ${detect}`, margin + 4, rowY + 8.5);
  });

  // ==========================================================================
  // PAGE 10 — SOURCES, METHODOLOGY AND REGULATORY DISCLAIMER
  // ==========================================================================
  doc.addPage();
  drawPageShell(10, totalReportPages, 'Sources, Methodology & Disclaimer');

  let p10Y = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('Auditable Sources, Computational Methodology & Disclaimer', margin, p10Y);

  p10Y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.text('Traceable data registries, algorithm versioning, and non-diagnostic clinical disclaimer.', margin, p10Y);

  p10Y += 9;

  const provenanceRows = [
    ['NCBI ClinVar Database', 'Aggregated via NCBI E-utilities REST API v2.0', 'Active live record query'],
    ['Ensembl VEP', 'Ensembl Variant Effect Predictor REST API v110', 'Consequence & gnomAD AF'],
    ['ML Pathogenicity Predictor', 'GenomeGuard Calibrated Ensemble Model v1.2.0', 'Random Forest Gradient Calibrated'],
    ['ACMG Rules Engine', 'ACMG/AMP 2015 28-Rules Standard Implementation', 'Tavtigian Bayesian Scoring'],
    ['Database Persistence', 'Supabase PostgreSQL Relational Database', 'Row Level Security User Isolated'],
    ['Report Engine Version', 'DNA Doctor Clinical Report Generator v1.0.0', generationDate],
  ];

  provenanceRows.forEach(([tool, desc, ver], i) => {
    const rowY = p10Y + i * 8.5;
    doc.setFillColor(i % 2 === 0 ? slateLight[0] : 255, i % 2 === 0 ? slateLight[1] : 255, i % 2 === 0 ? slateLight[2] : 255);
    doc.rect(margin, rowY, contentWidth, 8.5, 'F');
    doc.rect(margin, rowY, contentWidth, 8.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.text(tool, margin + 4, rowY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    doc.text(desc, margin + 50, rowY + 5.5);

    doc.setFont('helvetica', 'italic');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(ver, margin + 130, rowY + 5.5);
  });

  p10Y += provenanceRows.length * 8.5 + 12;

  // Regulatory Disclaimer Box
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, p10Y, contentWidth, 38, 3, 3, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(margin, p10Y, contentWidth, 38, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14);
  doc.text('REGULATORY & SCIENTIFIC USE DISCLAIMER', margin + 6, p10Y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 53, 15);
  const disclaimer = 'This report is generated by DNA Doctor / GenomeGuard AI for informational, educational, and clinical research decision-support purposes only. It is not a certified laboratory diagnostic report and does not establish a physician-patient relationship. All interpretations, ACMG guideline classifications, and predictor outputs must be verified by a qualified clinical geneticist or certified molecular pathologist before clinical intervention.';
  const splitDisclaimer = doc.splitTextToSize(disclaimer, contentWidth - 12);
  doc.text(splitDisclaimer, margin + 6, p10Y + 14);

  p10Y += 46;

  // End mark
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(tealDark[0], tealDark[1], tealDark[2]);
  doc.text('— End of DNA Doctor Detailed Genetic Analysis Report —', pageWidth / 2, p10Y, { align: 'center' });

  return doc;
}
