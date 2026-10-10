import { FullAnalysisResult, GenomeAssembly, TrioMemberInput, TrioAnalysisData } from '../types/genomics.ts';
import { normalizeVariantInput } from './variantNormalization.ts';
import { fetchClinVarRecord } from './clinvarClient.ts';
import { annotateVariant } from './annotationService.ts';
import { runMLPathogenicityInference } from './mlPredictor.ts';
import { evaluateACMGGuidelines } from './acmgRulesEngine.ts';
import { integrateAnalysisResults } from './resultIntegrator.ts';
import { determineTrioInheritance, buildTrioAnalysisData } from './trioService.ts';
import { saveAnalysisToDatabase } from '../db/analyses.ts';

export async function executeVariantAnalysis(
  rawInput: string,
  assembly: GenomeAssembly = 'GRCh38',
  userId: string = 'anonymous',
  userOverrides: Record<string, any> = {},
  trioInput?: {
    child: TrioMemberInput;
    mother: TrioMemberInput;
    father: TrioMemberInput;
  }
): Promise<FullAnalysisResult> {
  const analysisId = `va-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const executionLog: FullAnalysisResult['executionLog'] = [];

  // Step 1: Input Validation and Variant Normalization
  const t0 = Date.now();
  const normalizedVariant = normalizeVariantInput(rawInput, assembly);
  executionLog.push({
    step: 'Input Validation & Normalization',
    status: normalizedVariant.validationStatus === 'INVALID' ? 'FAILED' : 'SUCCESS',
    durationMs: Date.now() - t0,
    details: `Parsed as ${normalizedVariant.inputType}: ${normalizedVariant.normalizedRepresentation}`,
  });

  if (normalizedVariant.validationStatus === 'INVALID') {
    return integrateAnalysisResults(
      analysisId,
      normalizedVariant,
      null,
      undefined,
      undefined,
      undefined,
      executionLog
    );
  }

  // Step 2: ClinVar Database Retrieval
  const t1 = Date.now();
  let clinvarRecord = null;
  try {
    clinvarRecord = await fetchClinVarRecord(normalizedVariant);
    executionLog.push({
      step: 'ClinVar Database Retrieval',
      status: clinvarRecord ? 'SUCCESS' : 'WARNING',
      durationMs: Date.now() - t1,
      details: clinvarRecord
        ? `Retrieved ${clinvarRecord.canonicalAccession}: ${clinvarRecord.clinicalSignificance} (${clinvarRecord.reviewStars} stars)`
        : 'No direct ClinVar consensus record found',
    });
  } catch (err: any) {
    executionLog.push({
      step: 'ClinVar Database Retrieval',
      status: 'WARNING',
      durationMs: Date.now() - t1,
      details: `NCBI query exception: ${err.message}`,
    });
  }

  // Step 3: Variant Annotation (VEP / In Silico / Frequencies)
  const t2 = Date.now();
  let annotationData = undefined;
  try {
    annotationData = await annotateVariant(normalizedVariant);
    executionLog.push({
      step: 'Variant Effect & Frequency Annotation',
      status: 'SUCCESS',
      durationMs: Date.now() - t2,
      details: `Consequence: ${annotationData.consequence}, gnomAD AF: ${annotationData.gnomadAfPopmax ?? annotationData.gnomadAfGlobal ?? 'N/A'}`,
    });
  } catch (err: any) {
    executionLog.push({
      step: 'Variant Effect & Frequency Annotation',
      status: 'WARNING',
      durationMs: Date.now() - t2,
      details: `Annotation exception: ${err.message}`,
    });
  }

  // Step 4: Machine Learning Pathogenicity Inference
  const t3 = Date.now();
  let mlPrediction = undefined;
  if (annotationData) {
    try {
      mlPrediction = runMLPathogenicityInference(normalizedVariant, annotationData);
      executionLog.push({
        step: 'Machine-Learning Pathogenicity Predictor',
        status: 'SUCCESS',
        durationMs: Date.now() - t3,
        details: `Model ${mlPrediction.modelVersion}: Score ${(mlPrediction.calibratedProbability * 100).toFixed(1)}% (${mlPrediction.classificationCategory})`,
      });
    } catch (err: any) {
      executionLog.push({
        step: 'Machine-Learning Pathogenicity Predictor',
        status: 'WARNING',
        durationMs: Date.now() - t3,
        details: `ML inference failed: ${err.message}`,
      });
    }
  }

  // Step 5: ACMG/AMP 2015 Rules Evaluation
  const t4 = Date.now();
  let acmgEvaluation = undefined;
  let mergedOverrides = { ...userOverrides };
  let trioData: TrioAnalysisData | undefined = undefined;

  if (trioInput) {
    const trioEval = determineTrioInheritance(
      trioInput.child,
      trioInput.mother,
      trioInput.father,
      normalizedVariant
    );
    mergedOverrides = { ...trioEval.overrides, ...userOverrides };
    trioData = buildTrioAnalysisData(
      trioInput.child,
      trioInput.mother,
      trioInput.father,
      normalizedVariant
    );
  }

  if (annotationData) {
    try {
      acmgEvaluation = evaluateACMGGuidelines(
        normalizedVariant,
        annotationData,
        clinvarRecord,
        mergedOverrides
      );
      executionLog.push({
        step: 'ACMG/AMP Evidence Rules Evaluation',
        status: 'SUCCESS',
        durationMs: Date.now() - t4,
        details: `Classification: ${acmgEvaluation.overallClassification} (${acmgEvaluation.supportedCriteria.length} criteria active)`,
      });
    } catch (err: any) {
      executionLog.push({
        step: 'ACMG/AMP Evidence Rules Evaluation',
        status: 'WARNING',
        durationMs: Date.now() - t4,
        details: `ACMG engine failed: ${err.message}`,
      });
    }
  }

  // Step 6: Integration, Synthesis, and Conflict Detection
  const integratedResult = integrateAnalysisResults(
    analysisId,
    normalizedVariant,
    clinvarRecord,
    annotationData,
    mlPrediction,
    acmgEvaluation,
    executionLog
  );

  if (trioData) {
    integratedResult.trioData = trioData;
  }

  // Step 7: Persist to Cloud SQL PostgreSQL
  try {
    await saveAnalysisToDatabase(integratedResult, userId);
  } catch (err) {
    console.warn('Analysis save skipped due to db warning:', err);
  }

  return integratedResult;
}
