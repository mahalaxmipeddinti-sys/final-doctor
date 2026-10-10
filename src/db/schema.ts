import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (keyed by Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Analyses table: persistent record of each analyzed variant and its tri-pillar evidence
export const analyses = pgTable('analyses', {
  id: text('id').primaryKey(),
  userId: text('user_id'), // Optional Firebase UID if authenticated, or 'anonymous'
  variantInput: text('variant_input').notNull(),
  inputType: text('input_type').notNull(), // 'clinvar_id' | 'hgvs' | 'coordinates'
  normalizedVariant: text('normalized_variant').notNull(), // JSON string
  clinvarData: text('clinvar_data'), // JSON string of ClinVar records & submitters
  annotationData: text('annotation_data'), // JSON string of VEP, in silico & population AF
  mlPrediction: text('ml_prediction'), // JSON string of statistical ML model score & attributions
  acmgEvaluation: text('acmg_evaluation'), // JSON string of 28 criteria & combination result
  conflicts: text('conflicts'), // JSON string of cross-pillar discrepancies
  summaryStatus: text('summary_status').notNull(), // 'COMPLETED' | 'CONFLICTS_DETECTED' | 'INSUFFICIENT_EVIDENCE'
  createdAt: timestamp('created_at').defaultNow(),
});

// Saved bookmarks / watchlist table
export const bookmarks = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  analysisId: text('analysis_id').references(() => analyses.id),
  variantLabel: text('variant_label').notNull(),
  geneSymbol: text('gene_symbol'),
  clinvarClinsig: text('clinvar_clinsig'),
  acmgClass: text('acmg_class'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  bookmarks: many(bookmarks),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  analysis: one(analyses, {
    fields: [bookmarks.analysisId],
    references: [analyses.id],
  }),
}));
