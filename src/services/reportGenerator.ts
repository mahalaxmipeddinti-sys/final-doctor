// src/services/reportGenerator.ts
import { FullAnalysisResult } from '../types/genomics.ts';

export function generateMarkdownReport(result: FullAnalysisResult): string {
  const v = result.normalizedVariant;
  const cv = result.clinvarRecord;
  const an = result.annotationData;
  const ml = result.mlPrediction;
  const acmg = result.acmgEvaluation;

  return `# DNA DOCTOR GENOMIC VARIANT INTERPRETATION REPORT
**Report ID:** ${result.analysisId}
**Date Generated:** ${new Date(result.createdAt).toUTCString()}
**Summary Status:** ${result.summaryStatus}

---

## 1. VARIANT IDENTITY & COORDINATES
- **Input Identifier:** \`${v.originalInput}\` (${v.inputType})
- **Normalized Genomic Coordinate:** \`${v.normalizedRepresentation}\`
- **Reference Genome Assembly:** ${v.assembly}
- **Gene Symbol:** ${v.geneSymbol || cv?.geneSymbol || 'Not Specified'}
- **Associated Transcript:** ${an?.maneTranscript || 'MANE Select not resolved'}
- **cDNA Alteration:** ${v.hgvsc || an?.cdnaChange || 'N/A'}
- **Protein Alteration:** ${v.hgvsp || an?.proteinChange || 'N/A'}
- **Validation Status:** ${v.validationStatus}

${
  result.trioData
    ? `---

## 1B. FAMILY TRIO SEGREGATION & INHERITANCE
- **Family Case ID:** \`${result.trioData.familyId || 'FAM-TRIO-01'}\`
- **Transmission Classification:** **${result.trioData.inheritancePattern.replace(/_/g, ' ')}**
- **Synthesis:** ${result.trioData.inheritanceSummary}
- **Child (Proband) [ID: ${result.trioData.child.sampleId || 'CH-01'}]:** ${result.trioData.child.zygosity.replace(/_/g, ' ')} (${result.trioData.child.isAffected ? 'Affected' : 'Unaffected'})${result.trioData.child.uploadedReportFileName ? ` • Report: ${result.trioData.child.uploadedReportFileName}` : ''}
- **Mother (Maternal) [ID: ${result.trioData.mother.sampleId || 'MO-01'}]:** ${result.trioData.mother.zygosity.replace(/_/g, ' ')} (${result.trioData.mother.isAffected ? 'Affected' : 'Unaffected'})${result.trioData.mother.uploadedReportFileName ? ` • Report: ${result.trioData.mother.uploadedReportFileName}` : ''}
- **Father (Paternal) [ID: ${result.trioData.father.sampleId || 'FA-01'}]:** ${result.trioData.father.zygosity.replace(/_/g, ' ')} (${result.trioData.father.isAffected ? 'Affected' : 'Unaffected'})${result.trioData.father.uploadedReportFileName ? ` • Report: ${result.trioData.father.uploadedReportFileName}` : ''}
- **ACMG Segregation Criteria:** ${result.trioData.acmgImplications.join('; ') || 'None'}`
    : ''
}

---

## 2. EXISTING DATABASE RECORD (NCBI ClinVar)
${
  cv
    ? `- **Reported Clinical Significance:** **${cv.clinicalSignificance}**
- **Review Status:** ${cv.reviewStatus} (${cv.reviewStars}/4 stars)
- **Variation Accession:** [${cv.canonicalAccession}](${cv.sourceUrl})
- **Associated Conditions:** ${cv.associatedConditions.join(', ') || 'None specified'}
- **Last Evaluated:** ${cv.lastEvaluated || 'Unspecified'}
- **Submitter Assertions Recorded:** ${cv.submissions.length} laboratories
- **Internal Submitter Conflicts:** ${cv.hasConflicts ? 'YES (Conflicting interpretations present)' : 'None detected'}`
    : `*No record retrieved from NCBI ClinVar for this variant.*`
}

---

## 3. BIOLOGICAL & IN-SILICO ANNOTATION
- **Molecular Consequence:** \`${an?.consequence || 'Unknown'}\` (Impact: ${an?.impact || 'MODERATE'})
- **gnomAD Global Allele Frequency:** ${
    typeof an?.gnomadAfGlobal === 'number' ? an.gnomadAfGlobal.toExponential(3) : 'Absent / Not Reported'
  }
- **gnomAD PopMax Frequency:** ${
    typeof an?.gnomadAfPopmax === 'number' ? an.gnomadAfPopmax.toExponential(3) : 'N/A'
  }
- **CADD Phred Score:** ${an?.caddPhred?.toFixed(1) || 'N/A'}
- **SIFT Score / Prediction:** ${an?.siftScore !== undefined ? `${an.siftScore.toFixed(3)} (${an.siftPrediction})` : 'N/A'}
- **PolyPhen-2 Score:** ${an?.polyphenScore !== undefined ? `${an.polyphenScore.toFixed(3)} (${an.polyphenPrediction})` : 'N/A'}
- **PhyloP 100-Way Conservation:** ${an?.phylop100way?.toFixed(2) || 'N/A'}
- **Functional Domain Overlap:** ${an?.domainName || 'No specific catalytic domain annotated'}

---

## 4. MACHINE-LEARNING PATHOGENICITY ESTIMATE
${
  ml
    ? `- **Inference Model Version:** \`${ml.modelVersion}\`
- **Pathogenicity Probability Score:** **${(ml.calibratedProbability * 100).toFixed(1)}%**
- **Classification Risk Category:** **${ml.classificationCategory}**
- **95% Confidence Interval:** [${(ml.confidenceInterval[0] * 100).toFixed(1)}% - ${(ml.confidenceInterval[1] * 100).toFixed(1)}%]
- **Key Feature Attributions:**
${ml.featureContributions
  .map((f) => `  * **${f.featureName}** (${f.contributionDirection}): weight ${f.weight > 0 ? '+' : ''}${f.weight.toFixed(1)} — ${f.description}`)
  .join('\n')}
- **Missing Features:** ${ml.missingFeatures.length > 0 ? ml.missingFeatures.join(', ') : 'None'}`
    : `*ML Model was not configured or executed.*`
}

---

## 5. ACMG/AMP 2015 EVIDENCE GUIDELINES CLASSIFICATION
${
  acmg
    ? `- **Overall Evaluated Classification:** **${acmg.overallClassification}**
- **Applied Ruleset:** \`${acmg.rulesetVersion}\`
- **Bayesian Point Score:** **${acmg.bayesianScore > 0 ? '+' : ''}${acmg.bayesianScore} points** (Posterior probability: ${(acmg.bayesianProbability * 100).toFixed(1)}%)
- **Combination Logic Summary:** ${acmg.appliedRuleSummary}
- **Supported Criteria Met:** ${acmg.supportedCriteria.length > 0 ? acmg.supportedCriteria.join(', ') : 'None'}
${acmg.supportedCriteria
  .map((c) => {
    const ev = acmg.criteriaEvaluations[c];
    return `  * **${c} (${ev.assignedStrength})**: ${ev.rationale}`;
  })
  .join('\n')}
- **Need for Expert Clinical Review:** ${acmg.requiresExpertReview ? 'YES' : 'NO'}`
    : `*ACMG guideline evaluation was not performed.*`
}

---

## 6. CROSS-PILLAR CONFLICTS & DISCORDANCE AUDIT
${
  result.conflicts.length > 0
    ? result.conflicts
        .map(
          (cf, i) => `### Conflict ${i + 1}: ${cf.title} [Severity: ${cf.severity}]
- **Description:** ${cf.description}
- **First Source:** ${cf.firstSource}
- **Second Source:** ${cf.secondSource}
- **Action Recommendation:** ${cf.suggestedAction}`
        )
        .join('\n\n')
    : `*No conflicts detected across database, ML, and guideline assessment.*`
}

---

## 7. RESEARCH DISCLAIMER & PROVENANCE
This report was generated by the PS-10 Genomic Variant Pathogenicity Predictor & ACMG Guideline Compliance Classifier.
**RESEARCH AND EDUCATIONAL USE ONLY.** This software does not provide medical advice, diagnosis, or treatment. Independent clinical laboratory confirmation is required before any healthcare action.
`;
}

export function generateJsonExport(result: FullAnalysisResult): string {
  return JSON.stringify(result, null, 2);
}
