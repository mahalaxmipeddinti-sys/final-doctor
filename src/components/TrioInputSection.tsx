// src/components/TrioInputSection.tsx
import React, { useRef, useState } from 'react';
import { TrioMemberInput, TrioZygosity, GenomeAssembly } from '../types/genomics.ts';
import { extractVariantFromReportText } from '../services/trioService.ts';
import { SAMPLE_REPORT_PRESETS } from '../services/sampleReports.ts';
import { CustomVariantModal } from './CustomVariantModal.tsx';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  CheckCircle,
  Users,
  Sparkles,
  Eye,
  X,
  FileCheck,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  User,
  Wrench,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Shuffle,
  Dna,
  Tag,
  Hash,
} from 'lucide-react';

interface TrioInputSectionProps {
  childInput: TrioMemberInput;
  motherInput: TrioMemberInput;
  fatherInput: TrioMemberInput;
  onChangeChild: (data: Partial<TrioMemberInput>) => void;
  onChangeMother: (data: Partial<TrioMemberInput>) => void;
  onChangeFather: (data: Partial<TrioMemberInput>) => void;
  onApplyTrioPreset: (presetKey: 'denovo' | 'recessive' | 'maternal') => void;
  familyId?: string;
  onFamilyIdChange?: (id: string) => void;
  assembly?: GenomeAssembly;
}

export const TrioInputSection: React.FC<TrioInputSectionProps> = ({
  childInput,
  motherInput,
  fatherInput,
  onChangeChild,
  onChangeMother,
  onChangeFather,
  onApplyTrioPreset,
  familyId = 'FAM-2025-01',
  onFamilyIdChange,
  assembly = 'GRCh38',
}) => {
  const childFileRef = useRef<HTMLInputElement>(null);
  const motherFileRef = useRef<HTMLInputElement>(null);
  const fatherFileRef = useRef<HTMLInputElement>(null);

  const [parsingTarget, setParsingTarget] = useState<'child' | 'mother' | 'father' | null>(null);
  const [customModalTarget, setCustomModalTarget] = useState<'child' | 'mother' | 'father' | 'family' | null>(null);
  const [showIdGuide, setShowIdGuide] = useState<boolean>(false);

  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    fileName: string;
    dataUrl?: string;
    mimeType?: string;
    extracted?: any;
  }>({
    isOpen: false,
    title: '',
    fileName: '',
  });

  // Call the multimodal backend parser with local fallback
  const processReportUpload = async (
    file: { name: string; size?: number; type?: string },
    dataUrl: string,
    target: 'child' | 'mother' | 'father'
  ) => {
    setParsingTarget(target);

    // Initial local heuristic extraction
    const localDetected = extractVariantFromReportText(file.name);
    let extractedPayload = {
      detectedId: localDetected.detectedId,
      detectedHgvs: localDetected.detectedHgvs,
      detectedGene: localDetected.detectedGene,
      detectedZygosity: localDetected.detectedZygosity,
      summary: '',
    };

    try {
      const res = await fetch('/api/parse-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          dataUrl,
          mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.detectedId) extractedPayload.detectedId = json.detectedId;
        if (json.detectedHgvs) extractedPayload.detectedHgvs = json.detectedHgvs;
        if (json.detectedGene) extractedPayload.detectedGene = json.detectedGene;
        if (json.detectedZygosity) extractedPayload.detectedZygosity = json.detectedZygosity;
        if (json.summary) extractedPayload.summary = json.summary;
      }
    } catch (err) {
      console.warn('Backend parse failed, using local extraction:', err);
    } finally {
      setParsingTarget(null);
    }

    const updatePayload: Partial<TrioMemberInput> = {
      uploadedReportFileName: file.name,
      uploadedReportDataUrl: dataUrl,
      uploadedReportMimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
      uploadedReportFileSize: file.size || 1024,
      uploadedReportExtracted: extractedPayload,
    };

    // Auto-fill variant input if detected and currently empty
    if (extractedPayload.detectedId) {
      updatePayload.variantInput = extractedPayload.detectedId;
    } else if (extractedPayload.detectedHgvs) {
      updatePayload.variantInput = extractedPayload.detectedHgvs;
    }

    if (extractedPayload.detectedZygosity) {
      updatePayload.zygosity = extractedPayload.detectedZygosity;
    }

    // Auto-assign sample ID from filename if not yet set
    const currentMember = target === 'child' ? childInput : target === 'mother' ? motherInput : fatherInput;
    if (!currentMember.sampleId) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      updatePayload.sampleId = `${target.toUpperCase()}_${cleanName.slice(0, 16)}`;
    }

    if (target === 'child') {
      onChangeChild(updatePayload);
    } else if (target === 'mother') {
      onChangeMother(updatePayload);
    } else if (target === 'father') {
      onChangeFather(updatePayload);
    }
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'child' | 'mother' | 'father'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      processReportUpload(
        { name: file.name, size: file.size, type: file.type },
        dataUrl,
        target
      );
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSampleReport = (presetId: string) => {
    const preset = SAMPLE_REPORT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const dataUrl = preset.generateDataUrl();
    processReportUpload(
      { name: preset.fileName, size: 45200, type: preset.mimeType },
      dataUrl,
      preset.targetRole
    );
  };

  const removeFile = (target: 'child' | 'mother' | 'father') => {
    const clearPayload: Partial<TrioMemberInput> = {
      uploadedReportFileName: undefined,
      uploadedReportDataUrl: undefined,
      uploadedReportMimeType: undefined,
      uploadedReportFileSize: undefined,
      uploadedReportExtracted: undefined,
    };

    if (target === 'child') {
      onChangeChild(clearPayload);
      if (childFileRef.current) childFileRef.current.value = '';
    } else if (target === 'mother') {
      onChangeMother(clearPayload);
      if (motherFileRef.current) motherFileRef.current.value = '';
    } else if (target === 'father') {
      onChangeFather(clearPayload);
      if (fatherFileRef.current) fatherFileRef.current.value = '';
    }
  };

  // 1-Click Synchronized Trio ID Generator
  const handleGenerateSynchronizedTrioIds = () => {
    const seq = Math.floor(100 + Math.random() * 900);
    const year = new Date().getFullYear();
    const newFamilyId = `FAM-${year}-${seq}`;

    if (onFamilyIdChange) onFamilyIdChange(newFamilyId);

    onChangeChild({ sampleId: `CH-${year}-${seq}` });
    onChangeMother({ sampleId: `MO-${year}-${seq}` });
    onChangeFather({ sampleId: `FA-${year}-${seq}` });
  };

  return (
    <div className="space-y-4">
      {/* Trio Presets & Custom ID Management Bar */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
        {/* Top Presets Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-bold text-slate-200">
              Clinical Trio Presets (Child • Mother • Father):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => onApplyTrioPreset('denovo')}
              className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 font-medium transition-colors"
              title="Child heterozygous, both parents wildtype negative"
            >
              ✨ De Novo (BRCA1 17661)
            </button>
            <button
              type="button"
              onClick={() => onApplyTrioPreset('recessive')}
              className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/80 font-medium transition-colors"
              title="Child homozygous 1/1, both parents heterozygous 0/1 carriers"
            >
              🧬 Recessive Biparental (CFTR 7105)
            </button>
            <button
              type="button"
              onClick={() => onApplyTrioPreset('maternal')}
              className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/80 font-medium transition-colors"
              title="Child & mother heterozygous, father negative"
            >
              👩 Maternal Hotspot (BRAF 13961)
            </button>
          </div>
        </div>

        {/* Custom ID & Trio Management Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Family Case ID */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1">
              <Users className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-slate-400 text-[11px] font-semibold">Family ID:</span>
              <input
                type="text"
                value={familyId}
                onChange={(e) => onFamilyIdChange && onFamilyIdChange(e.target.value)}
                placeholder="FAM-2025-01"
                className="bg-transparent font-mono text-teal-300 font-bold text-xs w-28 focus:outline-none"
              />
            </div>

            {/* 1-Click Auto Generate Trio IDs */}
            <button
              type="button"
              onClick={handleGenerateSynchronizedTrioIds}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Generate matching Child, Mother, and Father Sample IDs"
            >
              <Shuffle className="w-3.5 h-3.5 text-teal-400" />
              <span>Generate Trio IDs</span>
            </button>

            {/* Custom Variant & ID Builder Modal Opener */}
            <button
              type="button"
              onClick={() => setCustomModalTarget('family')}
              className="px-2.5 py-1 rounded-lg bg-teal-950/60 hover:bg-teal-900/80 text-teal-300 border border-teal-800/80 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Open Custom Variant & ID Builder Modal"
            >
              <Wrench className="w-3.5 h-3.5 text-teal-400" />
              <span>Custom Variant &amp; ID Builder</span>
            </button>
          </div>

          {/* Toggle "How to create your own IDs" Guide */}
          <button
            type="button"
            onClick={() => setShowIdGuide((prev) => !prev)}
            className="text-xs text-slate-400 hover:text-teal-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-900"
          >
            <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
            <span>How to create your own IDs?</span>
            {showIdGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible Educational Guide on Creating Custom IDs */}
        {showIdGuide && (
          <div className="bg-slate-900/90 border border-teal-500/30 rounded-xl p-3.5 space-y-2.5 text-xs text-slate-300 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-bold text-teal-300">
              <Info className="w-4 h-4 text-teal-400 shrink-0" />
              <span>How to Create Your Own Child, Mother, or Father ID:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-[11px] pt-1">
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] font-mono">1</span>
                  Direct ID Entry
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Type your clinical subject/sample ID (e.g. <span className="text-teal-300 font-mono">CH-2025-01</span>, <span className="text-purple-300 font-mono">MO-2025-01</span>, <span className="text-sky-300 font-mono">FA-2025-01</span>) directly into the Subject/Sample ID field in each card.
                </p>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] font-mono">2</span>
                  1-Click Auto-ID
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Click the <span className="text-teal-300 font-semibold">🎲 Auto</span> button on any card or <span className="text-teal-300 font-semibold">Generate Trio IDs</span> above to automatically construct synchronized identifiers (<span className="text-slate-300 font-mono">FAM-2025-XXX</span>).
                </p>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] font-mono">3</span>
                  Custom Variant Builder
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Click <span className="text-teal-300 font-semibold">🛠️ Build</span> on any card to define novel mutations with gene symbols, coordinates (<span className="text-slate-300 font-mono">chr17:43044295:G&gt;A</span>), cDNA HGVS, or in-house lab accession numbers (<span className="text-teal-300 font-mono">LAB-VAR-001</span>).
                </p>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] font-mono">4</span>
                  Report Scan Extract
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Upload a PDF or image sequencing report. The multimodal AI extractor will automatically detect and populate the sample ID and ClinVar variant!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 1-Click Sample PDF / Image Report Injectors */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
            <span>Test with Sample Reports:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleLoadSampleReport('child-brca1-pdf')}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-teal-300 transition-colors flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-teal-400" />
              <span>Load Child PDF (17661)</span>
            </button>
            <button
              type="button"
              onClick={() => handleLoadSampleReport('child-cftr-img')}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-teal-300 transition-colors flex items-center gap-1"
            >
              <ImageIcon className="w-3 h-3 text-teal-400" />
              <span>Load Child Image (7105)</span>
            </button>
            <button
              type="button"
              onClick={() => handleLoadSampleReport('mother-wildtype-pdf')}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-300 transition-colors flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-purple-400" />
              <span>Load Mother PDF (0/0)</span>
            </button>
            <button
              type="button"
              onClick={() => handleLoadSampleReport('father-wildtype-img')}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 transition-colors flex items-center gap-1"
            >
              <ImageIcon className="w-3 h-3 text-sky-400" />
              <span>Load Father Image (0/0)</span>
            </button>
          </div>
        </div>
      </div>

      {/* THREE INPUT CARDS: CHILD, MOTHER, FATHER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD 1: CHILD (PROBAND) */}
        <div className="bg-slate-900/90 border-2 border-teal-500/50 rounded-xl p-4 space-y-3.5 relative shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs border border-teal-500/30">
                1
              </div>
              <div>
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wide block">
                  Child (Proband ↗)
                </span>
                <span className="text-[10px] text-teal-400 font-mono">Index Patient</span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
              PRIMARY
            </span>
          </div>

          {/* Child ID (Sample / Subject ID) Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span>Child ID (Subject / Sample):</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    onChangeChild({
                      sampleId: `CH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                    })
                  }
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition-colors"
                  title="Auto-generate Child Sample ID"
                >
                  🎲 Auto
                </button>
                <button
                  type="button"
                  onClick={() => setCustomModalTarget('child')}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-950/60 hover:bg-teal-900 text-teal-300 border border-teal-800/80 transition-colors"
                  title="Open Custom Variant & ID Builder"
                >
                  🛠️ Build
                </button>
              </div>
            </div>
            <input
              type="text"
              value={childInput.sampleId || ''}
              onChange={(e) => onChangeChild({ sampleId: e.target.value })}
              placeholder="e.g. CH-2025-01 or PROBAND-01"
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-400 rounded-lg px-2.5 py-1.5 text-xs text-teal-300 font-mono focus:outline-none placeholder:text-slate-600"
            />
          </div>

          {/* ClinVar ID / Variant Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-200 flex items-center justify-between">
              <span>Child ClinVar ID / Variant:</span>
              <span className="text-[10px] font-mono text-teal-400">Required</span>
            </label>
            <input
              type="text"
              value={childInput.variantInput}
              onChange={(e) => onChangeChild({ variantInput: e.target.value })}
              placeholder="e.g. 17661, c.5266dupC, chr17:43044295:G>A, or LAB-001"
              className="w-full bg-slate-950 border border-teal-500/40 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Genotype & Phenotype */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Zygosity:</label>
              <select
                value={childInput.zygosity}
                onChange={(e) => onChangeChild({ zygosity: e.target.value as TrioZygosity })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:border-teal-500 focus:outline-none"
              >
                <option value="HETEROZYGOUS">Heterozygous (0/1)</option>
                <option value="HOMOZYGOUS_ALT">Homozygous (1/1)</option>
                <option value="HEMIZYGOUS">Hemizygous (Chr X/Y)</option>
                <option value="HOMOZYGOUS_REF_WILDTYPE">Wildtype (0/0)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Phenotype:</label>
              <select
                value={childInput.isAffected ? 'affected' : 'unaffected'}
                onChange={(e) => onChangeChild({ isAffected: e.target.value === 'affected' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:border-teal-500 focus:outline-none"
              >
                <option value="affected">Affected Patient</option>
                <option value="unaffected">Asymptomatic</option>
              </select>
            </div>
          </div>

          {/* Report Upload by PDF or Image */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300">Child Report (PDF / Image):</span>
              {childInput.uploadedReportFileName && (
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Attached
                </span>
              )}
            </div>

            <input
              type="file"
              ref={childFileRef}
              onChange={(e) => handleFileInputChange(e, 'child')}
              accept=".pdf,image/*"
              className="hidden"
            />

            {childInput.uploadedReportFileName ? (
              <div className="bg-slate-950 border border-teal-500/40 rounded-lg p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate text-teal-300 font-mono">
                    {childInput.uploadedReportMimeType?.includes('pdf') ||
                    childInput.uploadedReportFileName.endsWith('.pdf') ? (
                      <FileText className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                    )}
                    <span className="truncate max-w-[130px] font-semibold">
                      {childInput.uploadedReportFileName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewModal({
                          isOpen: true,
                          title: 'Child (Proband) Clinical Report',
                          fileName: childInput.uploadedReportFileName!,
                          dataUrl: childInput.uploadedReportDataUrl,
                          mimeType: childInput.uploadedReportMimeType,
                          extracted: childInput.uploadedReportExtracted,
                        })
                      }
                      className="p-1 text-slate-400 hover:text-teal-300 rounded transition-colors"
                      title="View Report Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile('child')}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                      title="Remove report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {childInput.uploadedReportExtracted?.detectedId && (
                  <div className="text-[10px] text-slate-400 font-mono bg-teal-950/40 px-2 py-0.5 rounded border border-teal-900 flex items-center justify-between">
                    <span>Parsed ID:</span>
                    <span className="text-teal-300 font-bold">
                      {childInput.uploadedReportExtracted.detectedId}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled={parsingTarget === 'child'}
                onClick={() => childFileRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-dashed border-teal-500/40 hover:border-teal-400 text-slate-300 hover:text-teal-300 text-xs flex items-center justify-center gap-2 transition-all group"
              >
                {parsingTarget === 'child' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                    <span>Extracting Report...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
                    <span>Upload Report (PDF / Image)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* CARD 2: MOTHER */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3.5 relative shadow-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs border border-purple-500/30">
                2
              </div>
              <div>
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wide block">
                  Mother (Maternal ♀)
                </span>
                <span className="text-[10px] text-purple-400 font-mono">Biological Mother</span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
              MATERNAL
            </span>
          </div>

          {/* Mother ID (Sample / Subject ID) Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span>Mother ID (Subject / Sample):</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    onChangeMother({
                      sampleId: `MO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                    })
                  }
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 transition-colors"
                  title="Auto-generate Mother Sample ID"
                >
                  🎲 Auto
                </button>
                <button
                  type="button"
                  onClick={() => setCustomModalTarget('mother')}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/80 transition-colors"
                  title="Open Custom Variant & ID Builder"
                >
                  🛠️ Build
                </button>
              </div>
            </div>
            <input
              type="text"
              value={motherInput.sampleId || ''}
              onChange={(e) => onChangeMother({ sampleId: e.target.value })}
              placeholder="e.g. MO-2025-01 or MATERNAL-01"
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-400 rounded-lg px-2.5 py-1.5 text-xs text-purple-300 font-mono focus:outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Mother ClinVar ID / Variant Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-200 flex items-center justify-between">
              <span>Mother ClinVar ID / Variant:</span>
              <span className="text-[10px] font-mono text-slate-500">Optional / 0/0</span>
            </label>
            <input
              type="text"
              value={motherInput.variantInput}
              onChange={(e) => onChangeMother({ variantInput: e.target.value })}
              placeholder="e.g. 17661 (or empty for Wildtype)"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-purple-400 focus:ring-1 focus:ring-purple-400 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Genotype & Phenotype */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Maternal Genotype:</label>
              <select
                value={motherInput.zygosity}
                onChange={(e) => onChangeMother({ zygosity: e.target.value as TrioZygosity })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="HOMOZYGOUS_REF_WILDTYPE">Wildtype / Negative (0/0)</option>
                <option value="HETEROZYGOUS">Heterozygous Carrier (0/1)</option>
                <option value="HOMOZYGOUS_ALT">Homozygous Affected (1/1)</option>
                <option value="UNKNOWN">Not Tested / Unknown</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Phenotype:</label>
              <select
                value={motherInput.isAffected ? 'affected' : 'unaffected'}
                onChange={(e) => onChangeMother({ isAffected: e.target.value === 'affected' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="unaffected">Unaffected / Carrier</option>
                <option value="affected">Affected</option>
              </select>
            </div>
          </div>

          {/* Mother Report Upload */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300">Mother Report (PDF / Image):</span>
              {motherInput.uploadedReportFileName && (
                <span className="text-[10px] text-purple-400 font-mono flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Attached
                </span>
              )}
            </div>

            <input
              type="file"
              ref={motherFileRef}
              onChange={(e) => handleFileInputChange(e, 'mother')}
              accept=".pdf,image/*"
              className="hidden"
            />

            {motherInput.uploadedReportFileName ? (
              <div className="bg-slate-950 border border-purple-500/40 rounded-lg p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate text-purple-300 font-mono">
                    {motherInput.uploadedReportMimeType?.includes('pdf') ||
                    motherInput.uploadedReportFileName.endsWith('.pdf') ? (
                      <FileText className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                    )}
                    <span className="truncate max-w-[130px] font-semibold">
                      {motherInput.uploadedReportFileName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewModal({
                          isOpen: true,
                          title: 'Mother (Maternal) Clinical Report',
                          fileName: motherInput.uploadedReportFileName!,
                          dataUrl: motherInput.uploadedReportDataUrl,
                          mimeType: motherInput.uploadedReportMimeType,
                          extracted: motherInput.uploadedReportExtracted,
                        })
                      }
                      className="p-1 text-slate-400 hover:text-purple-300 rounded transition-colors"
                      title="View Report Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile('mother')}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                      title="Remove report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {motherInput.uploadedReportExtracted?.summary && (
                  <p className="text-[10px] text-slate-400 truncate">
                    {motherInput.uploadedReportExtracted.summary}
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled={parsingTarget === 'mother'}
                onClick={() => motherFileRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-dashed border-purple-500/40 hover:border-purple-400 text-slate-300 hover:text-purple-300 text-xs flex items-center justify-center gap-2 transition-all group"
              >
                {parsingTarget === 'mother' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                    <span>Extracting Report...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span>Upload Report (PDF / Image)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* CARD 3: FATHER */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3.5 relative shadow-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs border border-sky-500/30">
                3
              </div>
              <div>
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wide block">
                  Father (Paternal ♂)
                </span>
                <span className="text-[10px] text-sky-400 font-mono">Biological Father</span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30">
              PATERNAL
            </span>
          </div>

          {/* Father ID (Sample / Subject ID) Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>Father ID (Subject / Sample):</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    onChangeFather({
                      sampleId: `FA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                    })
                  }
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition-colors"
                  title="Auto-generate Father Sample ID"
                >
                  🎲 Auto
                </button>
                <button
                  type="button"
                  onClick={() => setCustomModalTarget('father')}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950/60 hover:bg-sky-900 text-sky-300 border border-sky-800/80 transition-colors"
                  title="Open Custom Variant & ID Builder"
                >
                  🛠️ Build
                </button>
              </div>
            </div>
            <input
              type="text"
              value={fatherInput.sampleId || ''}
              onChange={(e) => onChangeFather({ sampleId: e.target.value })}
              placeholder="e.g. FA-2025-01 or PATERNAL-01"
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-400 rounded-lg px-2.5 py-1.5 text-xs text-sky-300 font-mono focus:outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Father ClinVar ID / Variant Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-200 flex items-center justify-between">
              <span>Father ClinVar ID / Variant:</span>
              <span className="text-[10px] font-mono text-slate-500">Optional / 0/0</span>
            </label>
            <input
              type="text"
              value={fatherInput.variantInput}
              onChange={(e) => onChangeFather({ variantInput: e.target.value })}
              placeholder="e.g. 17661 (or empty for Wildtype)"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-sky-400 focus:ring-1 focus:ring-sky-400 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          {/* Genotype & Phenotype */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Paternal Genotype:</label>
              <select
                value={fatherInput.zygosity}
                onChange={(e) => onChangeFather({ zygosity: e.target.value as TrioZygosity })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                <option value="HOMOZYGOUS_REF_WILDTYPE">Wildtype / Negative (0/0)</option>
                <option value="HETEROZYGOUS">Heterozygous Carrier (0/1)</option>
                <option value="HOMOZYGOUS_ALT">Homozygous Affected (1/1)</option>
                <option value="UNKNOWN">Not Tested / Unknown</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Phenotype:</label>
              <select
                value={fatherInput.isAffected ? 'affected' : 'unaffected'}
                onChange={(e) => onChangeFather({ isAffected: e.target.value === 'affected' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                <option value="unaffected">Unaffected / Carrier</option>
                <option value="affected">Affected</option>
              </select>
            </div>
          </div>

          {/* Father Report Upload */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300">Father Report (PDF / Image):</span>
              {fatherInput.uploadedReportFileName && (
                <span className="text-[10px] text-sky-400 font-mono flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Attached
                </span>
              )}
            </div>

            <input
              type="file"
              ref={fatherFileRef}
              onChange={(e) => handleFileInputChange(e, 'father')}
              accept=".pdf,image/*"
              className="hidden"
            />

            {fatherInput.uploadedReportFileName ? (
              <div className="bg-slate-950 border border-sky-500/40 rounded-lg p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate text-sky-300 font-mono">
                    {fatherInput.uploadedReportMimeType?.includes('pdf') ||
                    fatherInput.uploadedReportFileName.endsWith('.pdf') ? (
                      <FileText className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                    )}
                    <span className="truncate max-w-[130px] font-semibold">
                      {fatherInput.uploadedReportFileName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewModal({
                          isOpen: true,
                          title: 'Father (Paternal) Clinical Report',
                          fileName: fatherInput.uploadedReportFileName!,
                          dataUrl: fatherInput.uploadedReportDataUrl,
                          mimeType: fatherInput.uploadedReportMimeType,
                          extracted: fatherInput.uploadedReportExtracted,
                        })
                      }
                      className="p-1 text-slate-400 hover:text-sky-300 rounded transition-colors"
                      title="View Report Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile('father')}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                      title="Remove report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {fatherInput.uploadedReportExtracted?.summary && (
                  <p className="text-[10px] text-slate-400 truncate">
                    {fatherInput.uploadedReportExtracted.summary}
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled={parsingTarget === 'father'}
                onClick={() => fatherFileRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-dashed border-sky-500/40 hover:border-sky-400 text-slate-300 hover:text-sky-300 text-xs flex items-center justify-center gap-2 transition-all group"
              >
                {parsingTarget === 'father' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                    <span>Extracting Report...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                    <span>Upload Report (PDF / Image)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOM VARIANT & ID BUILDER MODAL */}
      {customModalTarget && (
        <CustomVariantModal
          isOpen={!!customModalTarget}
          onClose={() => setCustomModalTarget(null)}
          targetRole={customModalTarget}
          initialMember={
            customModalTarget === 'child'
              ? childInput
              : customModalTarget === 'mother'
              ? motherInput
              : customModalTarget === 'father'
              ? fatherInput
              : childInput
          }
          assembly={assembly}
          onApply={({ target, sampleId: sId, variantInput: vInput, zygosity: zyg, isAffected: aff, familyId: fId }) => {
            if (fId && onFamilyIdChange) onFamilyIdChange(fId);
            if (target === 'child') {
              onChangeChild({ sampleId: sId, variantInput: vInput, zygosity: zyg, isAffected: aff });
            } else if (target === 'mother') {
              onChangeMother({ sampleId: sId, variantInput: vInput, zygosity: zyg, isAffected: aff });
            } else if (target === 'father') {
              onChangeFather({ sampleId: sId, variantInput: vInput, zygosity: zyg, isAffected: aff });
            }
          }}
          onApplyAll={({ familyId: fId, child, mother, father }) => {
            if (onFamilyIdChange) onFamilyIdChange(fId);
            onChangeChild(child);
            onChangeMother(mother);
            onChangeFather(father);
          }}
        />
      )}

      {/* REPORT PREVIEW MODAL */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{previewModal.title}</h4>
                  <p className="text-xs text-slate-400 font-mono">{previewModal.fileName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* If it's an image or SVG dataUrl, render image preview */}
              {previewModal.dataUrl &&
              (previewModal.dataUrl.startsWith('data:image/') ||
                previewModal.fileName.match(/\.(png|jpe?g|webp|svg)$/i)) ? (
                <div className="bg-slate-950 rounded-xl p-2 border border-slate-800 flex justify-center">
                  <img
                    src={previewModal.dataUrl}
                    alt={previewModal.fileName}
                    className="max-h-96 object-contain rounded-lg shadow"
                  />
                </div>
              ) : previewModal.dataUrl && previewModal.dataUrl.startsWith('data:application/pdf') ? (
                /* PDF Embed / Preview Container */
                <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 text-center space-y-3">
                  <FileText className="w-12 h-12 text-teal-400 mx-auto" />
                  <div>
                    <h5 className="text-sm font-bold text-slate-200">
                      Clinical PDF Document Ready
                    </h5>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      {previewModal.fileName}
                    </p>
                  </div>
                  <a
                    href={previewModal.dataUrl}
                    download={previewModal.fileName}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <span>Download PDF Document</span>
                  </a>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Document content attached to pedigree analysis.
                </div>
              )}

              {/* Extraction Summary */}
              {previewModal.extracted && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="font-bold text-teal-300 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                    <span>Bioinformatics Extraction Metadata:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                    <div>
                      Gene:{' '}
                      <span className="text-white font-bold">
                        {previewModal.extracted.detectedGene || 'N/A'}
                      </span>
                    </div>
                    <div>
                      ClinVar ID:{' '}
                      <span className="text-teal-400 font-bold">
                        {previewModal.extracted.detectedId || 'N/A'}
                      </span>
                    </div>
                    <div>
                      HGVS:{' '}
                      <span className="text-white">
                        {previewModal.extracted.detectedHgvs || 'N/A'}
                      </span>
                    </div>
                    <div>
                      Zygosity:{' '}
                      <span className="text-teal-300">
                        {previewModal.extracted.detectedZygosity || 'N/A'}
                      </span>
                    </div>
                  </div>
                  {previewModal.extracted.summary && (
                    <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      {previewModal.extracted.summary}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
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
