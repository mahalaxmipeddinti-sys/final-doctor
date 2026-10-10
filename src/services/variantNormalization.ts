// src/services/variantNormalization.ts
import { NormalizedVariant, InputType, GenomeAssembly } from '../types/genomics.ts';
import { BENCHMARK_VARIANTS } from './benchmarkVariants.ts';

export function normalizeVariantInput(
  rawInput: string,
  targetAssembly: GenomeAssembly = 'GRCh38'
): NormalizedVariant {
  const trimmed = rawInput.trim();
  const warnings: string[] = [];

  if (!trimmed) {
    return {
      originalInput: '',
      inputType: 'coordinates',
      normalizedRepresentation: '',
      assembly: targetAssembly,
      chromosome: '',
      position: 0,
      referenceAllele: '',
      alternateAllele: '',
      validationStatus: 'INVALID',
      validationWarnings: ['Input string is empty.'],
    };
  }

  // Check if it's a bare gene symbol without variant details (e.g., 'BRCA1', 'TP53')
  const bareGeneRegex = /^[A-Za-z0-9_-]{2,10}$/;
  if (bareGeneRegex.test(trimmed) && isNaN(Number(trimmed))) {
    const matchingPreset = BENCHMARK_VARIANTS.find(
      (b) => b.geneSymbol.toLowerCase() === trimmed.toLowerCase()
    );
    const suggestion = matchingPreset
      ? `Did you mean '${matchingPreset.label}' (ClinVar ID: ${matchingPreset.clinvarId})?`
      : 'Please provide an HGVS alteration (e.g., c.1799T>A) or ClinVar Variation ID.';

    return {
      originalInput: trimmed,
      inputType: 'hgvs',
      normalizedRepresentation: trimmed,
      assembly: targetAssembly,
      chromosome: '',
      position: 0,
      referenceAllele: '',
      alternateAllele: '',
      geneSymbol: trimmed.toUpperCase(),
      validationStatus: 'AMBIGUOUS',
      validationWarnings: [
        `Gene name '${trimmed}' does not uniquely identify a variant. ${suggestion}`,
      ],
    };
  }

  // 1. Check for preset benchmark variants
  const presetMatch = BENCHMARK_VARIANTS.find(
    (b) =>
      b.clinvarId === trimmed ||
      b.label.toLowerCase() === trimmed.toLowerCase() ||
      b.hgvs.toLowerCase() === trimmed.toLowerCase() ||
      b.normalized.dbsnpRsid?.toLowerCase() === trimmed.toLowerCase()
  );
  if (presetMatch) {
    return {
      ...presetMatch.normalized,
      assembly: targetAssembly,
    };
  }

  // 2. Check for ClinVar Variation ID (numeric or VCV prefixed)
  const clinvarMatch = trimmed.match(/^(?:VCV)?(\d{4,9})$/i);
  if (clinvarMatch) {
    const varId = clinvarMatch[1];
    return {
      originalInput: trimmed,
      inputType: 'clinvar_id',
      normalizedRepresentation: `ClinVar:${varId}`,
      assembly: targetAssembly,
      chromosome: '',
      position: 0,
      referenceAllele: '',
      alternateAllele: '',
      validationStatus: 'VALID',
      validationWarnings: warnings,
    };
  }

  // 3. Check for Coordinate notation: chr:pos:ref>alt or chr-pos-ref-alt
  const coordRegex = /^(?:chr)?([0-9]{1,2}|[XYM]|MT)[:\-_](\d+)[:\-_]([ACGTN]+)(?:>|[:\-_])([ACGTN]+)$/i;
  const coordMatch = trimmed.match(coordRegex);
  if (coordMatch) {
    const rawChr = coordMatch[1].toUpperCase();
    const chr = rawChr === 'MT' ? 'M' : rawChr;
    const pos = parseInt(coordMatch[2], 10);
    const ref = coordMatch[3].toUpperCase();
    const alt = coordMatch[4].toUpperCase();

    if (pos <= 0) {
      warnings.push(`Genomic coordinate position (${pos}) must be positive.`);
    }

    return {
      originalInput: trimmed,
      inputType: 'coordinates',
      normalizedRepresentation: `chr${chr}:${pos}:${ref}>${alt}`,
      assembly: targetAssembly,
      chromosome: chr,
      position: pos,
      referenceAllele: ref,
      alternateAllele: alt,
      validationStatus: warnings.length === 0 ? 'VALID' : 'INVALID',
      validationWarnings: warnings,
    };
  }

  // 4. Check for HGVS notation (c., p., g.)
  const hgvsRegex = /(?:([A-Za-z0-9_.-]+):)?([cpg]\.[0-9A-Za-z_+*><-]+)/;
  const hgvsMatch = trimmed.match(hgvsRegex);
  if (hgvsMatch) {
    const transcriptOrGene = hgvsMatch[1] || '';
    const hgvsBody = hgvsMatch[2];
    const isProtein = hgvsBody.startsWith('p.');
    const isCoding = hgvsBody.startsWith('c.');

    return {
      originalInput: trimmed,
      inputType: 'hgvs',
      normalizedRepresentation: trimmed,
      assembly: targetAssembly,
      chromosome: '',
      position: 0,
      referenceAllele: '',
      alternateAllele: '',
      geneSymbol: transcriptOrGene.replace(/[^A-Za-z0-9]/g, ''),
      hgvsc: isCoding ? hgvsBody : undefined,
      hgvsp: isProtein ? hgvsBody : undefined,
      validationStatus: 'VALID',
      validationWarnings: warnings,
    };
  }

  // 5. Check for Custom / In-House Lab Variant ID (e.g. LAB-001, CUSTOM-BRCA1, PROBAND-MUT, CH-2025-01)
  const customIdRegex = /^(?:CUSTOM|LAB|INHOUSE|NOVEL|SAMPLE|PROBAND|PATIENT|CH|MO|FA|FAM|VAR|CASE|SUBMISSION)[-_][A-Za-z0-9_.-]+$/i;
  if (customIdRegex.test(trimmed)) {
    return {
      originalInput: trimmed,
      inputType: 'custom_id',
      normalizedRepresentation: trimmed.toUpperCase(),
      assembly: targetAssembly,
      chromosome: '',
      position: 0,
      referenceAllele: '',
      alternateAllele: '',
      validationStatus: 'VALID',
      validationWarnings: [
        `Custom in-house or patient identifier '${trimmed}'. Evaluated via in-silico annotation, ML predictor, and ACMG criteria.`,
      ],
    };
  }

  // Fallback: unparseable format
  return {
    originalInput: trimmed,
    inputType: 'hgvs',
    normalizedRepresentation: trimmed,
    assembly: targetAssembly,
    chromosome: '',
    position: 0,
    referenceAllele: '',
    alternateAllele: '',
    validationStatus: 'INVALID',
    validationWarnings: [
      `Unsupported or malformed variant format '${trimmed}'. Expected ClinVar Variation ID (e.g. 17661), HGVS (e.g. NM_007294.4:c.5266dupC), or coordinates (e.g. chr17:43044295:G>A).`,
    ],
  };
}
