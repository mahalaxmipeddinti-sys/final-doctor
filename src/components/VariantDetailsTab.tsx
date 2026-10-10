// src/components/VariantDetailsTab.tsx
import React from 'react';
import { NormalizedVariant, AnnotationData } from '../types/genomics.ts';
import { Dna, Globe, CheckCircle2, AlertCircle } from 'lucide-react';

interface VariantDetailsTabProps {
  variant: NormalizedVariant;
  annotation?: AnnotationData;
}

export const VariantDetailsTab: React.FC<VariantDetailsTabProps> = ({ variant, annotation }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core Coordinates */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-1.5">
            <Globe className="h-4 w-4 text-teal-400" />
            <span>Genomic Coordinates & Alleles</span>
          </h3>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-500">Assembly:</dt>
              <dd className="font-mono font-semibold text-slate-200">{variant.assembly}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Chromosome:</dt>
              <dd className="font-mono font-semibold text-slate-200">chr{variant.chromosome || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Position (1-based):</dt>
              <dd className="font-mono font-semibold text-slate-200">
                {variant.position ? variant.position.toLocaleString() : 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Ref &gt; Alt Alleles:</dt>
              <dd className="font-mono font-semibold text-teal-300">
                {variant.referenceAllele || '?'} &gt; {variant.alternateAllele || '?'}
              </dd>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-800">
              <dt className="text-slate-500">Normalized VCF String:</dt>
              <dd className="font-mono text-slate-300 bg-slate-950 px-2 py-1 rounded mt-0.5 text-[11px] select-all">
                {variant.normalizedRepresentation}
              </dd>
            </div>
          </dl>
        </div>

        {/* Nomenclature & Identifiers */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-1.5">
            <Dna className="h-4 w-4 text-teal-400" />
            <span>Nomenclature & Identifiers</span>
          </h3>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-500">Gene Symbol:</dt>
              <dd className="font-semibold text-teal-300 text-sm">{variant.geneSymbol || 'Not Specified'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">dbSNP Accession:</dt>
              <dd className="font-mono text-slate-200">
                {variant.dbsnpRsid ? (
                  <a
                    href={`https://www.ncbi.nlm.nih.gov/snp/${variant.dbsnpRsid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-400 hover:underline"
                  >
                    {variant.dbsnpRsid}
                  </a>
                ) : (
                  'None linked'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">cDNA (HGVS.c):</dt>
              <dd className="font-mono text-slate-300">{variant.hgvsc || annotation?.cdnaChange || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Protein (HGVS.p):</dt>
              <dd className="font-mono text-slate-300">{variant.hgvsp || annotation?.proteinChange || 'N/A'}</dd>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-800">
              <dt className="text-slate-500">Canonical Transcript:</dt>
              <dd className="font-mono text-slate-300 text-[11px] truncate">
                {annotation?.maneTranscript || 'MANE Select not resolved'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Validation Warnings */}
      {variant.validationWarnings && variant.validationWarnings.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-3 text-xs text-amber-300 flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Validation Notice:</span>
            <ul className="list-disc list-inside mt-1 text-[11px] text-amber-200/90">
              {variant.validationWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
