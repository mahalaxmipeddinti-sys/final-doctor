// src/components/CustomVariantModal.tsx
import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Dna,
  User,
  Users,
  Check,
  Copy,
  Shuffle,
  FileCode,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Hash,
} from 'lucide-react';
import { TrioMemberInput, TrioZygosity, GenomeAssembly } from '../types/genomics.ts';

interface CustomVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: 'child' | 'mother' | 'father' | 'family';
  initialMember?: TrioMemberInput;
  assembly: GenomeAssembly;
  onApply: (params: {
    target: 'child' | 'mother' | 'father';
    sampleId: string;
    variantInput: string;
    zygosity: TrioZygosity;
    isAffected: boolean;
    familyId?: string;
    customDetails?: {
      gene: string;
      chromosome: string;
      position: number;
      refAllele: string;
      altAllele: string;
      hgvsC: string;
      hgvsP: string;
      notes: string;
    };
  }) => void;
  onApplyAll?: (trioParams: {
    familyId: string;
    child: { sampleId: string; variantInput: string; zygosity: TrioZygosity; isAffected: boolean };
    mother: { sampleId: string; variantInput: string; zygosity: TrioZygosity; isAffected: boolean };
    father: { sampleId: string; variantInput: string; zygosity: TrioZygosity; isAffected: boolean };
  }) => void;
}

const COMMON_GENES = [
  { symbol: 'BRCA1', chr: '17', defaultHgvs: 'c.5266dupC', pos: 43044295, ref: 'G', alt: 'A' },
  { symbol: 'CFTR', chr: '7', defaultHgvs: 'c.1521_1523delCTT', pos: 117559590, ref: 'ATCT', alt: 'A' },
  { symbol: 'BRAF', chr: '7', defaultHgvs: 'c.1799T>A', pos: 140753336, ref: 'T', alt: 'A' },
  { symbol: 'TP53', chr: '17', defaultHgvs: 'c.524G>A', pos: 7675088, ref: 'G', alt: 'A' },
  { symbol: 'SCN1A', chr: '2', defaultHgvs: 'c.3985C>T', pos: 166014234, ref: 'C', alt: 'T' },
  { symbol: 'MYH7', chr: '14', defaultHgvs: 'c.1208G>A', pos: 23425022, ref: 'G', alt: 'A' },
  { symbol: 'LDLR', chr: '19', defaultHgvs: 'c.2054C>T', pos: 11107432, ref: 'C', alt: 'T' },
];

export const CustomVariantModal: React.FC<CustomVariantModalProps> = ({
  isOpen,
  onClose,
  targetRole: defaultTargetRole,
  initialMember,
  assembly,
  onApply,
  onApplyAll,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<'child' | 'mother' | 'father' | 'family'>(
    defaultTargetRole
  );

  // Custom Sample IDs
  const [sampleId, setSampleId] = useState<string>(
    initialMember?.sampleId ||
      (defaultTargetRole === 'child'
        ? 'CH-2025-01'
        : defaultTargetRole === 'mother'
        ? 'MO-2025-01'
        : defaultTargetRole === 'father'
        ? 'FA-2025-01'
        : 'FAM-2025-01')
  );
  const [familyId, setFamilyId] = useState<string>('FAM-2025-88');

  // Custom Variant Attributes
  const [geneSymbol, setGeneSymbol] = useState<string>('BRCA1');
  const [chromosome, setChromosome] = useState<string>('17');
  const [genomicPosition, setGenomicPosition] = useState<string>('43044295');
  const [refAllele, setRefAllele] = useState<string>('G');
  const [altAllele, setAltAllele] = useState<string>('A');
  const [hgvsC, setHgvsC] = useState<string>('c.5266dupC');
  const [hgvsP, setHgvsP] = useState<string>('p.Gln1756Profs*74');
  const [customLabId, setCustomLabId] = useState<string>('LAB-VAR-001');

  // Input Type selection
  const [primaryInputFormat, setPrimaryInputFormat] = useState<
    'custom_lab_id' | 'coordinates' | 'hgvs' | 'clinvar_scv'
  >('custom_lab_id');

  // Clinical Status
  const [zygosity, setZygosity] = useState<TrioZygosity>(
    initialMember?.zygosity || (selectedTarget === 'child' ? 'HETEROZYGOUS' : 'HOMOZYGOUS_REF_WILDTYPE')
  );
  const [isAffected, setIsAffected] = useState<boolean>(
    initialMember?.isAffected !== undefined ? initialMember.isAffected : selectedTarget === 'child'
  );
  const [inHouseNotes, setInHouseNotes] = useState<string>(
    'Novel laboratory-derived variant identified through internal trio exome panel.'
  );

  const [copiedSubmission, setCopiedSubmission] = useState(false);

  if (!isOpen) return null;

  // Quick generator for Sample IDs
  const generateRandomSampleId = (role: 'child' | 'mother' | 'father' | 'family') => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const year = new Date().getFullYear();
    if (role === 'child') return `CH-${year}-${randomNum}`;
    if (role === 'mother') return `MO-${year}-${randomNum}`;
    if (role === 'father') return `FA-${year}-${randomNum}`;
    return `FAM-${year}-${randomNum}`;
  };

  const handleRandomizeIds = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const year = new Date().getFullYear();
    setFamilyId(`FAM-${year}-${randomNum}`);
    if (selectedTarget === 'child') {
      setSampleId(`CH-${year}-${randomNum}`);
    } else if (selectedTarget === 'mother') {
      setSampleId(`MO-${year}-${randomNum}`);
    } else if (selectedTarget === 'father') {
      setSampleId(`FA-${year}-${randomNum}`);
    } else {
      setSampleId(`CH-${year}-${randomNum}`);
    }
    setCustomLabId(`LAB-VAR-${randomNum}`);
  };

  const handleSelectGenePreset = (gene: (typeof COMMON_GENES)[0]) => {
    setGeneSymbol(gene.symbol);
    setChromosome(gene.chr);
    setGenomicPosition(String(gene.pos));
    setRefAllele(gene.ref);
    setAltAllele(gene.alt);
    setHgvsC(gene.defaultHgvs);
    setCustomLabId(`LAB-${gene.symbol}-${Math.floor(100 + Math.random() * 900)}`);
  };

  // Build the effective variant string based on selected format
  const getConstructedVariantString = () => {
    if (primaryInputFormat === 'custom_lab_id') {
      return customLabId || `LAB-${geneSymbol}-01`;
    }
    if (primaryInputFormat === 'coordinates') {
      const cleanChr = chromosome.replace(/^chr/i, '');
      return `chr${cleanChr}:${genomicPosition || 1}:${refAllele || 'N'}>${altAllele || 'N'}`;
    }
    if (primaryInputFormat === 'hgvs') {
      return hgvsC.startsWith('c.') ? `${geneSymbol}:${hgvsC}` : hgvsC;
    }
    return customLabId;
  };

  const constructedVariant = getConstructedVariantString();

  // ClinVar Submission SCV Mock Generator
  const generateClinVarSubmissionJson = () => {
    return JSON.stringify(
      {
        clinical_submission: {
          assertion_criteria: 'ACMG/AMP 2015 Guidelines with ClinGen Sequence Variant Interpretation',
          clinical_significance: isAffected ? 'Pathogenic' : 'Uncertain significance',
          date_evaluated: new Date().toISOString().split('T')[0],
          target_subject: {
            role: selectedTarget,
            individual_id: sampleId,
            family_id: familyId,
            phenotype: isAffected ? 'Affected / Symptomatic' : 'Unaffected / Normal',
            zygosity,
          },
          variant_definition: {
            custom_lab_accession: customLabId,
            gene_symbol: geneSymbol,
            assembly,
            genomic_coordinates: `chr${chromosome}:${genomicPosition}:${refAllele}>${altAllele}`,
            cdna_hgvs: hgvsC,
            protein_hgvs: hgvsP,
          },
          curator_notes: inHouseNotes,
        },
      },
      null,
      2
    );
  };

  const handleCopySubmission = () => {
    navigator.clipboard.writeText(generateClinVarSubmissionJson());
    setCopiedSubmission(true);
    setTimeout(() => setCopiedSubmission(false), 2000);
  };

  const handleApplySingle = (target: 'child' | 'mother' | 'father') => {
    onApply({
      target,
      sampleId: sampleId || generateRandomSampleId(target),
      variantInput: constructedVariant,
      zygosity,
      isAffected,
      familyId,
      customDetails: {
        gene: geneSymbol,
        chromosome,
        position: Number(genomicPosition) || 0,
        refAllele,
        altAllele,
        hgvsC,
        hgvsP,
        notes: inHouseNotes,
      },
    });
    onClose();
  };

  const handleApplyToAllTrio = () => {
    if (onApplyAll) {
      const baseNum = Math.floor(100 + Math.random() * 900);
      const year = new Date().getFullYear();
      onApplyAll({
        familyId: familyId || `FAM-${year}-${baseNum}`,
        child: {
          sampleId: `CH-${year}-${baseNum}`,
          variantInput: constructedVariant,
          zygosity: 'HETEROZYGOUS',
          isAffected: true,
        },
        mother: {
          sampleId: `MO-${year}-${baseNum}`,
          variantInput: constructedVariant,
          zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
          isAffected: false,
        },
        father: {
          sampleId: `FA-${year}-${baseNum}`,
          variantInput: constructedVariant,
          zygosity: 'HOMOZYGOUS_REF_WILDTYPE',
          isAffected: false,
        },
      });
    } else {
      handleApplySingle('child');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Dna className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Create Custom ID &amp; In-House Variant</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                  ID BUILDER
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Define your own Child, Mother, Father IDs and novel in-house genomic alterations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRandomizeIds}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
              title="Generate fresh sample & family IDs"
            >
              <Shuffle className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Auto-Generate IDs</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-200">
          {/* Section 1: Target Member & Subject ID */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                <User className="w-4 h-4 text-teal-400" />
                <span>1. Select Family Member &amp; Custom Subject ID</span>
              </span>
              <span className="text-[11px] text-teal-400 font-mono">
                Assigned to: {selectedTarget.toUpperCase()}
              </span>
            </div>

            {/* Target Role Selector Tabs */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedTarget('child');
                  setSampleId('CH-2025-01');
                  setZygosity('HETEROZYGOUS');
                  setIsAffected(true);
                }}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all flex flex-col items-center gap-1 ${
                  selectedTarget === 'child'
                    ? 'bg-teal-950/60 border-teal-500 text-teal-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-bold">🧒 Child ID</span>
                <span className="text-[10px] text-slate-400 font-mono">Proband / Index</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTarget('mother');
                  setSampleId('MO-2025-01');
                  setZygosity('HOMOZYGOUS_REF_WILDTYPE');
                  setIsAffected(false);
                }}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all flex flex-col items-center gap-1 ${
                  selectedTarget === 'mother'
                    ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-bold">👩 Mother ID</span>
                <span className="text-[10px] text-slate-400 font-mono">Maternal Line</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTarget('father');
                  setSampleId('FA-2025-01');
                  setZygosity('HOMOZYGOUS_REF_WILDTYPE');
                  setIsAffected(false);
                }}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all flex flex-col items-center gap-1 ${
                  selectedTarget === 'father'
                    ? 'bg-sky-950/60 border-sky-500 text-sky-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-bold">👨 Father ID</span>
                <span className="text-[10px] text-slate-400 font-mono">Paternal Line</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedTarget('family');
                  setSampleId('CH-2025-01');
                }}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition-all flex flex-col items-center gap-1 ${
                  selectedTarget === 'family'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-bold">👨‍👩‍👧 Full Trio</span>
                <span className="text-[10px] text-slate-400 font-mono">Batch All 3</span>
              </button>
            </div>

            {/* Custom ID Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Custom Subject / Sample ID (
                  {selectedTarget === 'child'
                    ? 'Child ID'
                    : selectedTarget === 'mother'
                    ? 'Mother ID'
                    : selectedTarget === 'father'
                    ? 'Father ID'
                    : 'Proband ID'}
                  ):
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={sampleId}
                    onChange={(e) => setSampleId(e.target.value)}
                    placeholder="e.g. CH-2025-01 or PROBAND-88"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-teal-300 text-xs focus:border-teal-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSampleId(
                        generateRandomSampleId(
                          selectedTarget === 'family' ? 'child' : selectedTarget
                        )
                      )
                    }
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono border border-slate-700"
                    title="Generate Random"
                  >
                    🎲
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Family / Case ID:
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={familyId}
                    onChange={(e) => setFamilyId(e.target.value)}
                    placeholder="e.g. FAM-2025-01"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-slate-200 text-xs focus:border-teal-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setFamilyId(generateRandomSampleId('family'))}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono border border-slate-700"
                    title="Generate Random"
                  >
                    🎲
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Custom Variant Generator */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                <Dna className="w-4 h-4 text-teal-400" />
                <span>2. In-House Variant Definition (Novel / Custom Mutation)</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Use gene templates or define custom coordinates
              </span>
            </div>

            {/* Quick Gene Templates */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">
                Quick Template (Click to prefill gene &amp; coordinate blueprint):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_GENES.map((gene) => (
                  <button
                    key={gene.symbol}
                    type="button"
                    onClick={() => handleSelectGenePreset(gene)}
                    className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
                      geneSymbol === gene.symbol
                        ? 'bg-teal-950/80 border-teal-500 text-teal-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {gene.symbol} ({gene.defaultHgvs})
                  </button>
                ))}
              </div>
            </div>

            {/* Format Mode Picker */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
              <span className="text-[11px] text-slate-400">Primary Identifier Format:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPrimaryInputFormat('custom_lab_id')}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    primaryInputFormat === 'custom_lab_id'
                      ? 'bg-teal-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Lab Accession (LAB-VAR-001)
                </button>
                <button
                  type="button"
                  onClick={() => setPrimaryInputFormat('coordinates')}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    primaryInputFormat === 'coordinates'
                      ? 'bg-teal-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Genomic Coordinates (chr:pos:ref&gt;alt)
                </button>
                <button
                  type="button"
                  onClick={() => setPrimaryInputFormat('hgvs')}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    primaryInputFormat === 'hgvs'
                      ? 'bg-teal-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  HGVS Nomenclature (c. &amp; p.)
                </button>
              </div>
            </div>

            {/* Custom Input Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Gene Symbol:</label>
                <input
                  type="text"
                  value={geneSymbol}
                  onChange={(e) => setGeneSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. BRCA1"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 text-xs focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Chromosome:</label>
                <input
                  type="text"
                  value={chromosome}
                  onChange={(e) => setChromosome(e.target.value.replace(/^chr/i, ''))}
                  placeholder="e.g. 17 or X"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 text-xs focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Genomic Position:</label>
                <input
                  type="number"
                  value={genomicPosition}
                  onChange={(e) => setGenomicPosition(e.target.value)}
                  placeholder="e.g. 43044295"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 text-xs focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Ref / Alt Allele:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={refAllele}
                    onChange={(e) => setRefAllele(e.target.value.toUpperCase())}
                    placeholder="Ref (G)"
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-slate-100 text-xs focus:border-teal-400 focus:outline-none"
                  />
                  <span className="text-slate-500 font-bold">&gt;</span>
                  <input
                    type="text"
                    value={altAllele}
                    onChange={(e) => setAltAllele(e.target.value.toUpperCase())}
                    placeholder="Alt (A)"
                    className="w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-slate-100 text-xs focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">cDNA HGVS (c.):</label>
                <input
                  type="text"
                  value={hgvsC}
                  onChange={(e) => setHgvsC(e.target.value)}
                  placeholder="e.g. c.5266dupC"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 text-xs focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Protein HGVS (p.):</label>
                <input
                  type="text"
                  value={hgvsP}
                  onChange={(e) => setHgvsP(e.target.value)}
                  placeholder="e.g. p.Gln1756Profs*74"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-100 text-xs focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[10px] text-slate-400 block mb-1">
                  Custom In-House Variant / Accession ID:
                </label>
                <input
                  type="text"
                  value={customLabId}
                  onChange={(e) => setCustomLabId(e.target.value)}
                  placeholder="e.g. LAB-VAR-001 or CUSTOM-BRCA1-01"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-teal-300 font-bold text-xs focus:border-teal-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Live Variant Output String Banner */}
            <div className="bg-slate-900 border border-teal-500/40 rounded-lg p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="text-slate-400 font-medium">Constructed Value:</span>
                <span className="font-mono text-teal-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-teal-500/30 truncate">
                  {constructedVariant}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {assembly} • {geneSymbol}
              </span>
            </div>
          </div>

          {/* Section 3: Zygosity & Phenotypic Status */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>3. Zygosity &amp; Phenotypic State for {selectedTarget.toUpperCase()}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Zygosity Status:</label>
                <select
                  value={zygosity}
                  onChange={(e) => setZygosity(e.target.value as TrioZygosity)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-teal-400 focus:outline-none"
                >
                  <option value="HETEROZYGOUS">Heterozygous (0/1) - Single allele copy</option>
                  <option value="HOMOZYGOUS_ALT">Homozygous Alt (1/1) - Biallelic variant</option>
                  <option value="HOMOZYGOUS_REF_WILDTYPE">Wildtype (0/0) - Negative / Normal</option>
                  <option value="HEMIZYGOUS">Hemizygous - X/Y chromosome single copy</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Clinical Phenotype:</label>
                <select
                  value={isAffected ? 'affected' : 'unaffected'}
                  onChange={(e) => setIsAffected(e.target.value === 'affected')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-teal-400 focus:outline-none"
                >
                  <option value="affected">Affected (Exhibits clinical symptoms/disease)</option>
                  <option value="unaffected">Unaffected (Asymptomatic or unaffected)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">In-House Laboratory Notes:</label>
              <input
                type="text"
                value={inHouseNotes}
                onChange={(e) => setInHouseNotes(e.target.value)}
                placeholder="Clinical observations or internal assay notes..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-teal-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 4: ClinVar Submission Mock */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
                <FileCode className="w-3.5 h-3.5 text-teal-400" />
                <span>NCBI ClinVar Submission Blueprint (SCV Standard Format)</span>
              </span>
              <button
                type="button"
                onClick={handleCopySubmission}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-mono flex items-center gap-1 transition-colors"
              >
                {copiedSubmission ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSubmission ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-2.5 bg-slate-950 rounded-lg text-[10px] font-mono text-slate-400 overflow-x-auto max-h-28 border border-slate-800">
              {generateClinVarSubmissionJson()}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono text-teal-400 font-bold">{sampleId}</span>
            <span>•</span>
            <span className="font-mono text-slate-300">{constructedVariant}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            {selectedTarget === 'family' ? (
              <button
                type="button"
                onClick={handleApplyToAllTrio}
                className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Apply to Entire Trio (Child, Mother, Father)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  handleApplySingle(selectedTarget as 'child' | 'mother' | 'father')
                }
                className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  Apply to{' '}
                  {selectedTarget === 'child'
                    ? 'Child'
                    : selectedTarget === 'mother'
                    ? 'Mother'
                    : 'Father'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
