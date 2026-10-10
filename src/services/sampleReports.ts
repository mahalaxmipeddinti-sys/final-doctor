// src/services/sampleReports.ts
// Generates realistic mock laboratory report files (Image and PDF data URLs) for clinical testing

export interface SampleReportPreset {
  id: string;
  targetRole: 'child' | 'mother' | 'father';
  fileType: 'pdf' | 'image';
  fileName: string;
  mimeType: string;
  clinvarId: string;
  hgvs: string;
  gene: string;
  zygosity: 'HETEROZYGOUS' | 'HOMOZYGOUS_ALT' | 'HOMOZYGOUS_REF_WILDTYPE';
  isAffected: boolean;
  labTitle: string;
  generateDataUrl: () => string;
}

// Helper to generate a realistic SVG/PNG image data URL for a genetics laboratory report
export function createReportImageDataUrl(params: {
  patientRole: string;
  patientId: string;
  gene: string;
  clinvarId: string;
  hgvs: string;
  zygosity: string;
  clinicalSignificance: string;
  date: string;
}): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000" style="background:#0f172a;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace">
    <!-- Header Banner -->
    <rect x="0" y="0" width="800" height="90" fill="#020617"/>
    <rect x="0" y="88" width="800" height="2" fill="#0d9488"/>
    
    <text x="35" y="45" fill="#14b8a6" font-size="20" font-weight="bold" letter-spacing="1">GENOMIX DIAGNOSTICS &amp; CLINICAL MOLECULAR GENETICS</text>
    <text x="35" y="70" fill="#94a3b8" font-size="11">CLIA #99D2081192 • CAP Accredited Comprehensive Trio Whole-Exome Sequencing</text>

    <!-- Report Title -->
    <rect x="35" y="115" width="730" height="42" rx="6" fill="#1e293b"/>
    <text x="50" y="141" fill="#f8fafc" font-size="14" font-weight="bold">CONFIDENTIAL CLINICAL GENOMICS MOLECULAR DIAGNOSTIC REPORT</text>
    <text x="630" y="141" fill="#38bdf8" font-size="12" font-weight="bold">${params.patientRole.toUpperCase()}</text>

    <!-- Patient Demographics Box -->
    <rect x="35" y="175" width="730" height="130" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <text x="55" y="205" fill="#64748b" font-size="11">PATIENT IDENTIFIER:</text>
    <text x="210" y="205" fill="#f1f5f9" font-size="12" font-weight="bold">${params.patientId}</text>
    <text x="440" y="205" fill="#64748b" font-size="11">SAMPLE TYPE:</text>
    <text x="560" y="205" fill="#f1f5f9" font-size="12">Peripheral Whole Blood</text>

    <text x="55" y="235" fill="#64748b" font-size="11">FAMILY RELATIONSHIP:</text>
    <text x="210" y="235" fill="#14b8a6" font-size="12" font-weight="bold">${params.patientRole}</text>
    <text x="440" y="235" fill="#64748b" font-size="11">SEQUENCING PLATFORM:</text>
    <text x="560" y="235" fill="#f1f5f9" font-size="12">Illumina NovaSeq 6000 (150x)</text>

    <text x="55" y="265" fill="#64748b" font-size="11">REPORT DATE:</text>
    <text x="210" y="265" fill="#f1f5f9" font-size="12">${params.date}</text>
    <text x="440" y="265" fill="#64748b" font-size="11">TEST ORDER CODE:</text>
    <text x="560" y="265" fill="#f1f5f9" font-size="12">WES-TRIO-PANEL-v4</text>

    <!-- Primary Finding Box -->
    <rect x="35" y="325" width="730" height="250" rx="8" fill="#0b1329" stroke="#0d9488" stroke-width="1.5"/>
    <rect x="35" y="325" width="730" height="36" rx="8" fill="#0f766e"/>
    <text x="55" y="348" fill="#ffffff" font-size="13" font-weight="bold">PRIMARY SEQUENCE VARIANT FINDING (CLINICAL CONCURRENCE)</text>

    <text x="55" y="390" fill="#94a3b8" font-size="11">GENE SYMBOL:</text>
    <text x="210" y="392" fill="#5eead4" font-size="15" font-weight="bold">${params.gene}</text>

    <text x="55" y="425" fill="#94a3b8" font-size="11">NCBI CLINVAR ID:</text>
    <text x="210" y="426" fill="#facc15" font-size="14" font-weight="bold">${params.clinvarId}</text>

    <text x="55" y="460" fill="#94a3b8" font-size="11">HGVS NOMENCLATURE:</text>
    <text x="210" y="461" fill="#f1f5f9" font-size="13" font-weight="bold">${params.hgvs}</text>

    <text x="55" y="495" fill="#94a3b8" font-size="11">ZYGOSITY STATE:</text>
    <text x="210" y="496" fill="#38bdf8" font-size="13" font-weight="bold">${params.zygosity}</text>

    <text x="55" y="530" fill="#94a3b8" font-size="11">ACMG / CLINVAR STATUS:</text>
    <text x="210" y="532" fill="#f43f5e" font-size="13" font-weight="bold">${params.clinicalSignificance}</text>

    <!-- Technical Methodology & Segregation Summary -->
    <rect x="35" y="595" width="730" height="180" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <text x="55" y="625" fill="#e2e8f0" font-size="12" font-weight="bold">METHODOLOGY &amp; BIOINFORMATICS INTERPRETATION</text>
    <text x="55" y="650" fill="#94a3b8" font-size="10">Target genomic regions enriched using Twist Comprehensive Exome capture. Mean target depth exceeds 120x.</text>
    <text x="55" y="670" fill="#94a3b8" font-size="10">Variants called with GATK HaplotypeCaller v4.3 and annotated against Ensembl VEP (release 110) &amp; ClinVar.</text>
    <text x="55" y="695" fill="#94a3b8" font-size="10">The variant reported above is classified in accordance with Richards et al. (2015) ACMG/AMP consensus guidelines.</text>
    <text x="55" y="715" fill="#94a3b8" font-size="10">Parental confirmation performed as part of standard Trio pedigree inheritance verification.</text>
    <text x="55" y="745" fill="#64748b" font-size="10">Sign-off: Eleanor Vance, MD, PhD, FACMG (Laboratory Medical Director)</text>

    <!-- Footer Security Watermark -->
    <rect x="35" y="795" width="730" height="80" rx="6" fill="#020617" stroke="#1e293b"/>
    <text x="55" y="825" fill="#475569" font-size="9">VERIFICATION HASH: SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}-CLINICAL-AUDIT</text>
    <text x="55" y="845" fill="#475569" font-size="9">THIS REPORT CONTAINS PROTECTED HEALTH INFORMATION (PHI) UNDER HIPAA PRIVACY RULE 45 CFR § 164.514</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

// Generate simple mock PDF data URL
export function createReportPdfDataUrl(params: {
  patientRole: string;
  patientId: string;
  gene: string;
  clinvarId: string;
  hgvs: string;
  zygosity: string;
  clinicalSignificance: string;
}): string {
  // We can encode a valid minimal PDF or PDF text envelope
  const rawPdfText = `%PDF-1.4
% Clinical Genomics Trio Diagnostic Report
% Patient: ${params.patientId} (${params.patientRole})
% ClinVar Variation ID: ${params.clinvarId}
% Gene: ${params.gene}
% HGVS: ${params.hgvs}
% Zygosity: ${params.zygosity}
% Classification: ${params.clinicalSignificance}
1 0 obj
<< /Title (Clinical Genetics Report - ${params.gene})
   /Author (Genomix Diagnostics Laboratory)
   /Subject (ClinVar ${params.clinvarId} Trio Evaluation)
>>
endobj
trailer
<< /Root 1 0 R >>
%%EOF`;

  return `data:application/pdf;base64,${btoa(unescape(encodeURIComponent(rawPdfText)))}`;
}

export const SAMPLE_REPORT_PRESETS: SampleReportPreset[] = [
  {
    id: 'child-brca1-pdf',
    targetRole: 'child',
    fileType: 'pdf',
    fileName: 'Proband_Child_Genetics_Report_BRCA1_17661.pdf',
    mimeType: 'application/pdf',
    clinvarId: '17661',
    hgvs: 'c.5266dupC',
    gene: 'BRCA1',
    zygosity: 'HETEROZYGOUS',
    isAffected: true,
    labTitle: 'Proband Child WES Report (BRCA1 c.5266dupC)',
    generateDataUrl: () =>
      createReportPdfDataUrl({
        patientRole: 'Proband (Child)',
        patientId: 'PAT-2026-CH-17661',
        gene: 'BRCA1',
        clinvarId: '17661',
        hgvs: 'c.5266dupC',
        zygosity: 'HETEROZYGOUS (0/1)',
        clinicalSignificance: 'Pathogenic (ClinVar ID: 17661)',
      }),
  },
  {
    id: 'child-cftr-img',
    targetRole: 'child',
    fileType: 'image',
    fileName: 'Proband_Child_Exome_CFTR_7105.png',
    mimeType: 'image/png',
    clinvarId: '7105',
    hgvs: 'c.1521_1523delCTT',
    gene: 'CFTR',
    zygosity: 'HOMOZYGOUS_ALT',
    isAffected: true,
    labTitle: 'Proband Child Exome Scan (CFTR F508del)',
    generateDataUrl: () =>
      createReportImageDataUrl({
        patientRole: 'Proband (Child)',
        patientId: 'PAT-2026-CH-7105',
        gene: 'CFTR',
        clinvarId: '7105',
        hgvs: 'c.1521_1523delCTT (p.Phe508del)',
        zygosity: 'HOMOZYGOUS (1/1)',
        clinicalSignificance: 'Pathogenic (ClinVar ID: 7105)',
        date: '2026-03-15',
      }),
  },
  {
    id: 'mother-wildtype-pdf',
    targetRole: 'mother',
    fileType: 'pdf',
    fileName: 'Maternal_Report_Negative_NonCarrier.pdf',
    mimeType: 'application/pdf',
    clinvarId: '',
    hgvs: 'Wildtype (0/0)',
    gene: 'BRCA1',
    zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
    isAffected: false,
    labTitle: 'Maternal Sequencing (Wildtype / Negative)',
    generateDataUrl: () =>
      createReportPdfDataUrl({
        patientRole: 'Mother (Maternal)',
        patientId: 'PAT-2026-MO-NEG',
        gene: 'BRCA1',
        clinvarId: 'NEGATIVE',
        hgvs: 'Reference sequence (c.5266dupC not detected)',
        zygosity: 'HOMOZYGOUS REFERENCE (0/0)',
        clinicalSignificance: 'Negative / Wildtype Non-Carrier',
      }),
  },
  {
    id: 'father-wildtype-img',
    targetRole: 'father',
    fileType: 'image',
    fileName: 'Paternal_Report_Negative_NonCarrier.png',
    mimeType: 'image/png',
    clinvarId: '',
    hgvs: 'Wildtype (0/0)',
    gene: 'BRCA1',
    zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
    isAffected: false,
    labTitle: 'Paternal Sequencing Scan (Negative / Non-Carrier)',
    generateDataUrl: () =>
      createReportImageDataUrl({
        patientRole: 'Father (Paternal)',
        patientId: 'PAT-2026-FA-NEG',
        gene: 'BRCA1',
        clinvarId: 'NEGATIVE',
        hgvs: 'Reference sequence (c.5266dupC not detected)',
        zygosity: 'HOMOZYGOUS REFERENCE (0/0)',
        clinicalSignificance: 'Negative / Non-Carrier (Wildtype)',
        date: '2026-03-15',
      }),
  },
];
