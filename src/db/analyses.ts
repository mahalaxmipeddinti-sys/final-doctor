// src/db/analyses.ts
import { desc, eq } from 'drizzle-orm';
import { db, isDatabaseConfigured } from './index.ts';
import { analyses, bookmarks } from './schema.ts';
import { FullAnalysisResult } from '../types/genomics.ts';

// In-memory analysis storage for seamless offline / pre-provisioned operation
const memoryAnalyses = new Map<string, any>();

export async function saveAnalysisToDatabase(
  result: FullAnalysisResult,
  userId: string = 'anonymous'
) {
  const memoryRecord = {
    analysisId: result.analysisId,
    variantInput: result.normalizedVariant.originalInput,
    inputType: result.normalizedVariant.inputType,
    normalizedVariant: result.normalizedVariant,
    clinvarRecord: result.clinvarRecord || null,
    annotationData: result.annotationData || null,
    mlPrediction: result.mlPrediction || null,
    acmgEvaluation: result.acmgEvaluation || null,
    conflicts: result.conflicts || [],
    summaryStatus: result.summaryStatus,
    executionLog: result.executionLog || [],
    trioData: result.trioData || null,
    createdAt: result.createdAt || new Date().toISOString(),
  };
  memoryAnalyses.set(result.analysisId, memoryRecord);

  if (isDatabaseConfigured) {
    try {
      await db
        .insert(analyses)
        .values({
          id: result.analysisId,
          userId: userId,
          variantInput: result.normalizedVariant.originalInput,
          inputType: result.normalizedVariant.inputType,
          normalizedVariant: JSON.stringify(result.normalizedVariant),
          clinvarData: result.clinvarRecord ? JSON.stringify(result.clinvarRecord) : null,
          annotationData: result.annotationData ? JSON.stringify(result.annotationData) : null,
          mlPrediction: result.mlPrediction ? JSON.stringify(result.mlPrediction) : null,
          acmgEvaluation: result.acmgEvaluation ? JSON.stringify(result.acmgEvaluation) : null,
          conflicts: JSON.stringify(result.conflicts),
          summaryStatus: result.summaryStatus,
        })
        .onConflictDoUpdate({
          target: analyses.id,
          set: {
            clinvarData: result.clinvarRecord ? JSON.stringify(result.clinvarRecord) : null,
            annotationData: result.annotationData ? JSON.stringify(result.annotationData) : null,
            mlPrediction: result.mlPrediction ? JSON.stringify(result.mlPrediction) : null,
            acmgEvaluation: result.acmgEvaluation ? JSON.stringify(result.acmgEvaluation) : null,
            conflicts: JSON.stringify(result.conflicts),
            summaryStatus: result.summaryStatus,
          },
        });
    } catch (error) {
      console.warn('Database save warning (saved to in-memory store):', error);
    }
  }

  return result.analysisId;
}

export async function getRecentAnalyses(limit: number = 20) {
  if (isDatabaseConfigured) {
    try {
      const rows = await db
        .select()
        .from(analyses)
        .orderBy(desc(analyses.createdAt))
        .limit(limit);

      if (rows.length > 0) {
        return rows.map((row) => ({
          analysisId: row.id,
          variantInput: row.variantInput,
          inputType: row.inputType,
          normalizedVariant: JSON.parse(row.normalizedVariant || '{}'),
          clinvarRecord: row.clinvarData ? JSON.parse(row.clinvarData) : null,
          annotationData: row.annotationData ? JSON.parse(row.annotationData) : null,
          mlPrediction: row.mlPrediction ? JSON.parse(row.mlPrediction) : null,
          acmgEvaluation: row.acmgEvaluation ? JSON.parse(row.acmgEvaluation) : null,
          conflicts: JSON.parse(row.conflicts || '[]'),
          summaryStatus: row.summaryStatus,
          createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.warn('Database query failed, returning in-memory analyses:', error);
    }
  }

  return Array.from(memoryAnalyses.values())
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function getAnalysisById(analysisId: string): Promise<FullAnalysisResult | null> {
  if (memoryAnalyses.has(analysisId)) {
    return memoryAnalyses.get(analysisId);
  }

  if (isDatabaseConfigured) {
    try {
      const rows = await db
        .select()
        .from(analyses)
        .where(eq(analyses.id, analysisId))
        .limit(1);

      if (rows.length > 0) {
        const row = rows[0];
        return {
          analysisId: row.id,
          normalizedVariant: JSON.parse(row.normalizedVariant),
          clinvarRecord: row.clinvarData ? JSON.parse(row.clinvarData) : undefined,
          annotationData: row.annotationData ? JSON.parse(row.annotationData) : undefined,
          mlPrediction: row.mlPrediction ? JSON.parse(row.mlPrediction) : undefined,
          acmgEvaluation: row.acmgEvaluation ? JSON.parse(row.acmgEvaluation) : undefined,
          conflicts: JSON.parse(row.conflicts || '[]'),
          summaryStatus: row.summaryStatus as any,
          executionLog: [],
          createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
        };
      }
    } catch (error) {
      console.warn(`Database query failed for analysis ${analysisId}:`, error);
    }
  }

  return null;
}

export async function deleteAnalysisById(analysisId: string): Promise<boolean> {
  memoryAnalyses.delete(analysisId);

  if (isDatabaseConfigured) {
    try {
      await db.delete(bookmarks).where(eq(bookmarks.analysisId, analysisId));
      await db.delete(analyses).where(eq(analyses.id, analysisId));
    } catch (error) {
      console.warn(`Database delete failed for analysis ${analysisId}:`, error);
    }
  }

  return true;
}
