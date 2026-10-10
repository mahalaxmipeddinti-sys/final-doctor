import React, { useState } from 'react';
import { TrioAnalysisData } from '../types/genomics.ts';
import { ShieldCheck, Dna, FileText, Sparkles, User, Users, AlertCircle, ArrowDown } from 'lucide-react';

interface TrioPedigreeCardProps {
  trioData: TrioAnalysisData;
  onViewReportAttachment?: (fileName: string, dataUrl?: string) => void;
}

export const TrioPedigreeCard: React.FC<TrioPedigreeCardProps> = ({
  trioData,
  onViewReportAttachment,
}) => {
  const [internalModal, setInternalModal] = useState<{ isOpen: boolean; fileName: string; dataUrl?: string } | null>(null);
  const { child, mother, father, inheritancePattern, inheritanceSummary, acmgImplications } = trioData;

  const getPatternBadge = () => {
    switch (inheritancePattern) {
      case 'DE_NOVO_CONFIRMED':
        return {
          label: 'DE NOVO CONFIRMED',
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
          dot: 'bg-emerald-400',
          desc: 'Variant absent in both biological parents (triggers ACMG PS2/PM6).',
        };
      case 'BIPARENTAL_RECESSIVE':
        return {
          label: 'BIPARENTAL AUTOSOMAL RECESSIVE',
          bg: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300',
          dot: 'bg-indigo-400',
          desc: 'Both parents are asymptomatic carriers; proband is homozygous/biallelic (triggers ACMG PM3).',
        };
      case 'MATERNAL_TRANSMISSION':
        return {
          label: 'MATERNAL TRANSMISSION',
          bg: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
          dot: 'bg-purple-400',
          desc: 'Variant inherited from mother.',
        };
      case 'PATERNAL_TRANSMISSION':
        return {
          label: 'PATERNAL TRANSMISSION',
          bg: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
          dot: 'bg-sky-400',
          desc: 'Variant inherited from father.',
        };
      case 'X_LINKED_MATERNAL':
        return {
          label: 'X-LINKED MATERNAL',
          bg: 'bg-pink-500/15 border-pink-500/40 text-pink-300',
          dot: 'bg-pink-400',
          desc: 'Hemizygous alteration inherited via maternal X-chromosome.',
        };
      case 'AUTOSOMAL_DOMINANT':
        return {
          label: 'AUTOSOMAL DOMINANT',
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          dot: 'bg-amber-400',
          desc: 'Familial dominant transmission from affected parent.',
        };
      default:
        return {
          label: 'INDETERMINATE INHERITANCE',
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          dot: 'bg-slate-400',
          desc: 'Awaiting additional parental confirmation.',
        };
    }
  };

  const badge = getPatternBadge();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Family Trio Pedigree &amp; Segregation Analysis</span>
              {trioData.familyId && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                  Case ID: {trioData.familyId}
                </span>
              )}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Mendelian inheritance verification across Proband (Child), Mother, and Father.
          </p>
        </div>

        {/* Inheritance Badge */}
        <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold tracking-wide flex items-center gap-2 ${badge.bg}`}>
          <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Visual Pedigree Diagram */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-6">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Generation I: Parents */}
          <div className="flex items-center justify-around relative">
            {/* Horizontal Mating Line */}
            <div className="absolute top-7 left-1/4 right-1/4 h-0.5 bg-slate-700 -z-0" />
            {/* Vertical connector down to child */}
            <div className="absolute top-7 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-slate-700 -z-0" />

            {/* Father (Square in standard pedigree) */}
            <div className="flex flex-col items-center space-y-2 z-10">
              <div
                className={`w-14 h-14 rounded-lg flex items-center justify-center border-2 transition-all shadow-md ${
                  father.isAffected
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : father.zygosity === 'HETEROZYGOUS'
                    ? 'bg-amber-500/20 border-amber-500/80 text-amber-300'
                    : 'bg-slate-900 border-teal-500/40 text-teal-300'
                }`}
                title={`Father: ${father.zygosity.replace('_', ' ')} (${father.isAffected ? 'Affected' : 'Unaffected'})`}
              >
                <div className="text-center font-mono">
                  <span className="text-[10px] font-bold block">FATHER</span>
                  <span className="text-xs font-bold">
                    {father.zygosity === 'HOMOZYGOUS_REF_WILDTYPE' ? '0/0' : father.zygosity === 'HETEROZYGOUS' ? '0/1' : '1/1'}
                  </span>
                </div>
              </div>
              <div className="text-center space-y-0.5">
                <span className="text-xs font-bold text-sky-300 font-mono block">
                  {father.sampleId ? `Father (${father.sampleId})` : 'Father'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {father.zygosity.replace('_', ' ')}
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded inline-block ${
                  father.isAffected ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {father.isAffected ? 'Affected' : 'Unaffected'}
                </span>
                {father.uploadedReportFileName && (
                  <button
                    onClick={() => {
                      setInternalModal({
                        isOpen: true,
                        fileName: father.uploadedReportFileName!,
                        dataUrl: father.uploadedReportDataUrl,
                      });
                      if (onViewReportAttachment) onViewReportAttachment(father.uploadedReportFileName!, father.uploadedReportDataUrl);
                    }}
                    className="mt-1 text-[10px] text-teal-400 hover:text-teal-300 flex items-center justify-center gap-1 mx-auto font-mono underline"
                  >
                    <FileText className="w-2.5 h-2.5" />
                    <span className="truncate max-w-[90px]">{father.uploadedReportFileName}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mother (Circle in standard pedigree) */}
            <div className="flex flex-col items-center space-y-2 z-10">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all shadow-md ${
                  mother.isAffected
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : mother.zygosity === 'HETEROZYGOUS'
                    ? 'bg-amber-500/20 border-amber-500/80 text-amber-300'
                    : 'bg-slate-900 border-teal-500/40 text-teal-300'
                }`}
                title={`Mother: ${mother.zygosity.replace('_', ' ')} (${mother.isAffected ? 'Affected' : 'Unaffected'})`}
              >
                <div className="text-center font-mono">
                  <span className="text-[10px] font-bold block">MOTHER</span>
                  <span className="text-xs font-bold">
                    {mother.zygosity === 'HOMOZYGOUS_REF_WILDTYPE' ? '0/0' : mother.zygosity === 'HETEROZYGOUS' ? '0/1' : '1/1'}
                  </span>
                </div>
              </div>
              <div className="text-center space-y-0.5">
                <span className="text-xs font-bold text-purple-300 font-mono block">
                  {mother.sampleId ? `Mother (${mother.sampleId})` : 'Mother'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {mother.zygosity.replace('_', ' ')}
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded inline-block ${
                  mother.isAffected ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {mother.isAffected ? 'Affected' : 'Unaffected'}
                </span>
                {mother.uploadedReportFileName && (
                  <button
                    onClick={() => {
                      setInternalModal({
                        isOpen: true,
                        fileName: mother.uploadedReportFileName!,
                        dataUrl: mother.uploadedReportDataUrl,
                      });
                      if (onViewReportAttachment) onViewReportAttachment(mother.uploadedReportFileName!, mother.uploadedReportDataUrl);
                    }}
                    className="mt-1 text-[10px] text-teal-400 hover:text-teal-300 flex items-center justify-center gap-1 mx-auto font-mono underline"
                  >
                    <FileText className="w-2.5 h-2.5" />
                    <span className="truncate max-w-[90px]">{mother.uploadedReportFileName}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Generation II: Proband / Child */}
          <div className="flex flex-col items-center pt-2">
            <div className="w-0.5 h-6 bg-slate-700" />
            <div className="flex flex-col items-center space-y-2 relative">
              {/* Proband Diamond Symbol */}
              <div
                className={`w-14 h-14 rotate-45 rounded-lg flex items-center justify-center border-2 transition-all shadow-lg ${
                  child.isAffected
                    ? 'bg-rose-600/30 border-rose-400 text-rose-200 ring-2 ring-rose-500/20'
                    : 'bg-teal-600/30 border-teal-400 text-teal-200'
                }`}
                title={`Proband: ${child.zygosity.replace('_', ' ')}`}
              >
                <div className="-rotate-45 text-center font-mono">
                  <span className="text-[9px] font-extrabold block">PROBAND</span>
                  <span className="text-xs font-bold">
                    {child.zygosity === 'HOMOZYGOUS_ALT' ? '1/1' : child.zygosity === 'HETEROZYGOUS' ? '0/1' : '0/0'}
                  </span>
                </div>
              </div>
              <div className="text-center space-y-0.5 pt-1">
                <span className="text-xs font-bold text-teal-300 font-mono block">
                  {child.sampleId ? `Child (${child.sampleId})` : 'Child (Proband ↗)'}
                </span>
                <span className="text-[11px] font-mono text-slate-200 block">
                  {child.variantInput ? `Variant: ${child.variantInput}` : 'Proband Variant'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {child.zygosity.replace('_', ' ')} • {child.isAffected ? 'Affected Patient' : 'Asymptomatic'}
                </span>
                {child.uploadedReportFileName && (
                  <button
                    onClick={() => {
                      setInternalModal({
                        isOpen: true,
                        fileName: child.uploadedReportFileName!,
                        dataUrl: child.uploadedReportDataUrl,
                      });
                      if (onViewReportAttachment) onViewReportAttachment(child.uploadedReportFileName!, child.uploadedReportDataUrl);
                    }}
                    className="mt-1 text-[10px] text-teal-400 hover:text-teal-300 flex items-center justify-center gap-1 mx-auto font-mono underline"
                  >
                    <FileText className="w-2.5 h-2.5" />
                    <span className="truncate max-w-[120px]">{child.uploadedReportFileName}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Interpretation & ACMG Criteria Impact */}
      <div className="space-y-3">
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Mendelian Inheritance Synthesis</span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {inheritanceSummary}
          </p>
        </div>

        {acmgImplications.length > 0 && (
          <div className="bg-teal-950/30 border border-teal-800/60 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>ACMG/AMP Evidence Rules Activated by Trio Segregation</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {acmgImplications.map((imp, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">•</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Report Attachment Preview Modal */}
      {internalModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Attached Laboratory Report</h4>
                  <p className="text-xs text-slate-400 font-mono">{internalModal.fileName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInternalModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {internalModal.dataUrl &&
              (internalModal.dataUrl.startsWith('data:image/') ||
                internalModal.fileName.match(/\.(png|jpe?g|webp|svg)$/i)) ? (
                <div className="bg-slate-950 rounded-xl p-2 border border-slate-800 flex justify-center">
                  <img
                    src={internalModal.dataUrl}
                    alt={internalModal.fileName}
                    className="max-h-96 object-contain rounded-lg shadow"
                  />
                </div>
              ) : internalModal.dataUrl && internalModal.dataUrl.startsWith('data:application/pdf') ? (
                <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 text-center space-y-3">
                  <FileText className="w-12 h-12 text-teal-400 mx-auto" />
                  <div>
                    <h5 className="text-sm font-bold text-slate-200">Clinical PDF Document</h5>
                    <p className="text-xs text-slate-400 font-mono mt-1">{internalModal.fileName}</p>
                  </div>
                  <a
                    href={internalModal.dataUrl}
                    download={internalModal.fileName}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <span>Download PDF Document</span>
                  </a>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Clinical documentation file attached to pedigree.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                type="button"
                onClick={() => setInternalModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
