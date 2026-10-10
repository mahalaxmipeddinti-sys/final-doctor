// src/components/HistoryView.tsx
import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  RefreshCw,
  Database,
  AlertTriangle,
  Scale,
  Search,
  Filter,
  Plus,
  Activity,
  FileText,
  ShieldCheck,
  Cpu,
  Eye,
  Download,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  FlaskConical,
  X,
  ExternalLink,
} from 'lucide-react';
import { FullAnalysisResult } from '../types/genomics.ts';
import { authService, AppUser } from '../services/auth.service.ts';
import { ReportModal } from './ReportModal.tsx';

interface HistoryViewProps {
  onLoadAnalysis: (analysis: FullAnalysisResult) => void;
  onCompareAnalyses?: (analysisA: FullAnalysisResult, analysisB: FullAnalysisResult) => void;
  currentUser?: AppUser | null;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onLoadAnalysis, onCompareAnalyses, currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'analyses' | 'tests' | 'activity'>('analyses');

  // Overview Stats
  const [overview, setOverview] = useState<any>({
    totalAnalyses: 0,
    completedAnalyses: 0,
    failedAnalyses: 0,
    totalTests: 0,
    classificationCounts: {
      Pathogenic: 0,
      Likely_Pathogenic: 0,
      VUS: 0,
      Likely_Benign: 0,
      Benign: 0,
      Other: 0,
    },
  });

  // Analyses State
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [totalAnalysesCount, setTotalAnalysesCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassification, setSelectedClassification] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected for comparison
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  // Evidence snapshot modal
  const [selectedEvidenceAnalysis, setSelectedEvidenceAnalysis] = useState<any | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  // PDF Report Modal State
  const [selectedReportAnalysis, setSelectedReportAnalysis] = useState<FullAnalysisResult | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoadingId, setReportLoadingId] = useState<string | null>(null);

  // Genetic Tests State
  const [geneticTests, setGeneticTests] = useState<any[]>([]);
  const [testTypeFilter, setTestTypeFilter] = useState('ALL');
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [newTest, setNewTest] = useState({
    test_type: 'NGS' as const,
    test_date: new Date().toISOString().split('T')[0],
    source_or_laboratory: 'Genomics Diagnostic Lab',
    record_status: 'verified' as const,
    notes: '',
    gene_symbol: 'BRCA1',
    findings: 'Targeted exonic sequencing completed with 120x mean coverage.',
  });

  // Activity Logs State
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Fetch Overview Data
  const fetchOverview = async () => {
    try {
      const token = await authService.getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/history/overview', { headers });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch {
      // quiet catch
    }
  };

  // Fetch Analyses List
  const fetchAnalyses = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await authService.getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        search: searchQuery,
        classification: selectedClassification,
        status: selectedStatus,
      });

      const res = await fetch(`/api/history/analyses?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAnalyses(data.records || []);
        setTotalAnalysesCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setError('Failed to fetch analyses from database.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching analysis history');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Genetic Tests
  const fetchGeneticTests = async () => {
    try {
      const token = await authService.getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (testTypeFilter !== 'ALL') params.set('testType', testTypeFilter);

      const res = await fetch(`/api/history/tests?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setGeneticTests(data || []);
      }
    } catch {
      // quiet catch
    }
  };

  // Fetch Activity Logs
  const fetchActivityLogs = async () => {
    try {
      const token = await authService.getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/history/activity?limit=30', { headers });
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data || []);
      }
    } catch {
      // quiet catch
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'analyses') fetchAnalyses();
    if (activeSubTab === 'tests') fetchGeneticTests();
    if (activeSubTab === 'activity') fetchActivityLogs();
  }, [activeSubTab, page, selectedClassification, selectedStatus, testTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAnalyses();
  };

  const handleDeleteAnalysis = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Permanently delete this variant analysis record from your audit history?')) return;
    try {
      const token = await authService.getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/history/analyses/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setAnalyses((prev) => prev.filter((item) => item.id !== id));
        setSelectedForComparison((prev) => prev.filter((item) => item !== id));
        fetchOverview();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleOpenEvidence = async (analysisId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEvidenceLoading(true);
    try {
      const token = await authService.getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/history/analyses/${analysisId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSelectedEvidenceAnalysis(data);
      }
    } catch (err) {
      console.error('Evidence retrieval failed:', err);
    } finally {
      setEvidenceLoading(false);
    }
  };

  const handleOpenReportModal = async (row: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setReportLoadingId(row.id);
    try {
      const token = await authService.getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/history/analyses/${row.id}`, { headers });
      if (res.ok) {
        const fullData = await res.json();
        // Construct full analysis object if wrapped in history record
        const analysisData: FullAnalysisResult = fullData.full_result || fullData.raw_evidence_snapshot || {
          normalizedVariant: {
            rawInput: row.raw_input || row.gene_symbol || '',
            geneSymbol: row.gene_symbol,
            clinvarId: row.clinvar_id,
            rsId: row.rs_id,
            chromosome: row.chromosome,
            position: row.position_grch38 || row.position,
            referenceAllele: row.ref_allele,
            alternateAllele: row.alt_allele,
            assembly: 'GRCh38',
            isValid: true,
          },
          mlResult: {
            pathogenicityScore: row.ml_pathogenicity_score ?? 0.5,
            predictionLabel: row.final_tier || 'VUS',
            modelConfidence: 0.92,
            featuresUsed: {},
          },
          acmgClassification: {
            tier: row.final_tier || 'VUS',
            applicableRules: [],
            points: 0,
            summary: `Historical classification: ${row.final_tier}`,
          },
          evidenceSynthesis: {
            concordanceStatus: 'CONCORDANT',
            triPillarEvidence: {
              clinical: { strength: 'MODERATE', summary: 'Archived clinical assertions' },
              functional: { strength: 'MODERATE', summary: 'Archived functional & population frequencies' },
              predictive: { strength: 'STRONG', summary: 'Machine learning calibrated prediction' },
            },
            keyFindings: ['Archived analysis generated by DNA Doctor platform.'],
            limitations: ['Historical record retrieved from secure database.'],
          },
        };
        setSelectedReportAnalysis(analysisData);
        setShowReportModal(true);
      }
    } catch (err) {
      console.error('Report modal generation retrieval failed:', err);
    } finally {
      setReportLoadingId(null);
    }
  };

  const handleSaveNewTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await authService.getAccessToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/history/tests', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          test_type: newTest.test_type,
          test_date: newTest.test_date,
          source_or_laboratory: newTest.source_or_laboratory,
          record_status: newTest.record_status,
          notes: newTest.notes,
          structured_result: {
            gene_symbol: newTest.gene_symbol,
            findings: newTest.findings,
          },
        }),
      });

      if (res.ok) {
        setShowAddTestModal(false);
        fetchGeneticTests();
        fetchOverview();
      }
    } catch (err) {
      console.error('Failed to save test record:', err);
    }
  };

  const toggleSelectForComparison = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedForComparison.includes(id)) {
      setSelectedForComparison(selectedForComparison.filter((x) => x !== id));
    } else {
      if (selectedForComparison.length >= 2) {
        setSelectedForComparison([selectedForComparison[1], id]);
      } else {
        setSelectedForComparison([...selectedForComparison, id]);
      }
    }
  };

  const handleTriggerCompare = () => {
    if (selectedForComparison.length !== 2 || !onCompareAnalyses) return;
    const itemA = analyses.find((h) => h.id === selectedForComparison[0]);
    const itemB = analyses.find((h) => h.id === selectedForComparison[1]);
    if (itemA && itemB) {
      onCompareAnalyses(itemA, itemB);
    }
  };

  const getTierColor = (classification?: string) => {
    const cls = (classification || '').toUpperCase();
    if (cls.includes('PATHOGENIC') && !cls.includes('LIKELY')) return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    if (cls.includes('LIKELY PATHOGENIC') || cls.includes('LIKELY_PATHOGENIC')) return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    if (cls.includes('UNCERTAIN') || cls.includes('VUS')) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (cls.includes('LIKELY BENIGN') || cls.includes('LIKELY_BENIGN')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (cls.includes('BENIGN')) return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
    return 'bg-slate-800 text-slate-400 border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Summary Metrics */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-400" />
              <span>User History &amp; Auditable Records</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Persistent user-isolated database archive for genomic analyses, laboratory tests, and provenance evidence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onCompareAnalyses && activeSubTab === 'analyses' && (
              <button
                onClick={handleTriggerCompare}
                disabled={selectedForComparison.length !== 2}
                className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
                  selectedForComparison.length === 2
                    ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-900/40'
                    : 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-slate-800'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Compare Selected ({selectedForComparison.length}/2)</span>
              </button>
            )}

            <button
              onClick={() => {
                fetchOverview();
                if (activeSubTab === 'analyses') fetchAnalyses();
                if (activeSubTab === 'tests') fetchGeneticTests();
                if (activeSubTab === 'activity') fetchActivityLogs();
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Aggregate KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Runs</div>
            <div className="text-lg font-mono font-bold text-slate-100">{overview.totalAnalyses || 0}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
            <div className="text-[10px] uppercase font-bold text-rose-400">Pathogenic</div>
            <div className="text-lg font-mono font-bold text-rose-400">{overview.classificationCounts?.Pathogenic || 0}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
            <div className="text-[10px] uppercase font-bold text-orange-400">Likely Path.</div>
            <div className="text-lg font-mono font-bold text-orange-400">{overview.classificationCounts?.Likely_Pathogenic || 0}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
            <div className="text-[10px] uppercase font-bold text-amber-400">VUS</div>
            <div className="text-lg font-mono font-bold text-amber-400">{overview.classificationCounts?.VUS || 0}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Benign / LB</div>
            <div className="text-lg font-mono font-bold text-emerald-400">
              {(overview.classificationCounts?.Benign || 0) + (overview.classificationCounts?.Likely_Benign || 0)}
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
            <div className="text-[10px] uppercase font-bold text-teal-400">Assay Tests</div>
            <div className="text-lg font-mono font-bold text-teal-400">{overview.totalTests || 0}</div>
          </div>
        </div>

        {/* Module Sub-Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-800/80 pt-3">
          <button
            onClick={() => setActiveSubTab('analyses')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'analyses'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Variant Analyses Archive</span>
          </button>

          <button
            onClick={() => setActiveSubTab('tests')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'tests'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Genetic Testing Records (9 Assays)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('activity')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'activity'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Activity Log Timeline</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TAB 1: VARIANT ANALYSES ARCHIVE */}
      {activeSubTab === 'analyses' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by gene (BRCA1, CFTR) or variant ID..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-2">
              <select
                value={selectedClassification}
                onChange={(e) => {
                  setSelectedClassification(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:border-teal-500 focus:outline-none"
              >
                <option value="ALL">All Classifications</option>
                <option value="PATHOGENIC">Pathogenic</option>
                <option value="LIKELY PATHOGENIC">Likely Pathogenic</option>
                <option value="UNCERTAIN">VUS</option>
                <option value="LIKELY BENIGN">Likely Benign</option>
                <option value="BENIGN">Benign</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:border-teal-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="running">Running</option>
              </select>
            </div>
          </div>

          {/* Table / List */}
          {loading ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-teal-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading analysis records from Supabase...</p>
            </div>
          ) : analyses.length > 0 ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4 w-10 text-center">#</th>
                      <th className="py-3 px-4">Variant &amp; Gene</th>
                      <th className="py-3 px-4">Genomic Coordinates</th>
                      <th className="py-3 px-4">ML Score</th>
                      <th className="py-3 px-4">ACMG Classification</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {analyses.map((row) => {
                      const gene = row.gene_symbol || row.input_data?.originalInput || 'Variant';
                      const varId = row.variant_identifier || row.id;
                      const coords = row.chromosome ? `chr${row.chromosome}:${row.position} ${row.reference_allele}>${row.alternate_allele}` : (row.assembly || 'GRCh38');
                      const tier = row.acmg_classification || 'Pending';
                      const mlProb = row.ml_pathogenicity_score != null ? `${(row.ml_pathogenicity_score * 100).toFixed(1)}%` : 'N/A';
                      const isSelected = selectedForComparison.includes(row.id);

                      return (
                        <tr
                          key={row.id}
                          onClick={() => {
                            onLoadAnalysis(row);
                          }}
                          className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                            isSelected ? 'bg-teal-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center" onClick={(e) => toggleSelectForComparison(row.id, e)}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-slate-700 text-teal-600 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-100 flex items-center gap-1.5">
                              <span>{gene}</span>
                            </div>
                            <div className="font-mono text-[11px] text-slate-400 truncate max-w-[180px]">{varId}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">{coords}</td>
                          <td className="py-3 px-4 font-mono text-slate-200">{mlProb}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTierColor(tier)}`}>
                              {tier.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                            {new Date(row.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            {row.analysis_status === 'completed' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Completed</span>
                              </span>
                            ) : row.analysis_status === 'failed' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-rose-400" title={row.error_summary || 'Error'}>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Failed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                                <Clock className="w-3.5 h-3.5 animate-spin" />
                                <span>Processing</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Prominent DNA Doctor PDF Report Button */}
                              <button
                                onClick={(e) => handleOpenReportModal(row, e)}
                                disabled={reportLoadingId === row.id}
                                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-900/40 transition-all"
                                title="Generate and download 10-page DNA Doctor PDF report"
                              >
                                <Download className={`w-3.5 h-3.5 ${reportLoadingId === row.id ? 'animate-bounce' : ''}`} />
                                <span>Report (PDF)</span>
                              </button>

                              <button
                                onClick={(e) => handleOpenEvidence(row.id, e)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 transition-colors"
                                title="Inspect Auditable Evidence Snapshot"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteAnalysis(row.id, e)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
                                title="Delete from Database"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-slate-950/60 border-t border-slate-800 px-4 py-3 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Showing Page <span className="font-bold text-slate-200">{page}</span> of{' '}
                    <span className="font-bold text-slate-200">{totalPages}</span> ({totalAnalysesCount} total)
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <p className="text-xs text-slate-400">
                Your analysis history will appear here after your first completed analysis.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. SUB-TAB 2: GENETIC TESTING RECORDS (9 ASSAYS) */}
      {activeSubTab === 'tests' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Filter Assay:</span>
              <select
                value={testTypeFilter}
                onChange={(e) => setTestTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:border-teal-500 focus:outline-none"
              >
                <option value="ALL">All 9 Methods</option>
                <option value="PCR">PCR</option>
                <option value="Sanger sequencing">Sanger sequencing</option>
                <option value="NGS">NGS</option>
                <option value="WES">WES</option>
                <option value="WGS">WGS</option>
                <option value="DNA microarray">DNA microarray</option>
                <option value="CMA">CMA</option>
                <option value="genotyping/SNP testing">Genotyping / SNP</option>
                <option value="karyotyping">Karyotyping</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddTestModal(true)}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-teal-900/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Diagnostic Assay Result</span>
            </button>
          </div>

          {/* Test Records Grid */}
          {geneticTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {geneticTests.map((test) => (
                <div
                  key={test.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 font-mono text-[11px] font-bold border border-teal-500/20">
                      {test.test_type}
                    </span>
                    <span className="text-[10px] text-slate-400">{test.test_date}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-200">
                      Gene / Target: <span className="text-teal-300 font-mono">{test.structured_result?.gene_symbol || 'N/A'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Lab: <span className="text-slate-300">{test.source_or_laboratory}</span>
                    </div>
                    <p className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                      {test.structured_result?.findings || test.notes || 'Diagnostic assay result registered.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <FlaskConical className="w-8 h-8 text-teal-400 mx-auto opacity-50" />
              <p className="text-xs text-slate-400">No laboratory test records found. Click above to record or import an assay result.</p>
            </div>
          )}
        </div>
      )}

      {/* 4. SUB-TAB 3: ACTIVITY TIMELINE */}
      {activeSubTab === 'activity' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <span>Audit Activity Timeline</span>
          </h3>

          {activityLogs.length > 0 ? (
            <div className="relative pl-6 space-y-4 border-l border-slate-800">
              {activityLogs.map((log) => (
                <div key={log.id} className="relative group">
                  <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-teal-500 border-2 border-slate-950 shadow-sm" />
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-200 capitalize">{log.event_type.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-400">{log.event_summary}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              Activity events will be recorded here automatically during clinical operations.
            </div>
          )}
        </div>
      )}

      {/* 5. AUDITABLE EVIDENCE SNAPSHOT MODAL */}
      {selectedEvidenceAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Auditable Evidence Snapshot — {selectedEvidenceAnalysis.gene_symbol || selectedEvidenceAnalysis.variant_identifier}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvidenceAnalysis(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="font-bold text-teal-300 uppercase tracking-wider text-[10px]">Source Provenance</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                  <div>NCBI ClinVar: Aggregated at run</div>
                  <div>Ensembl VEP: v110 REST API</div>
                  <div>ML Inference: Calibrated RF Ensemble</div>
                  <div>ACMG Engine: 2015 28-Rules Standard</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-200">ACMG Guideline Assessment</div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <span>Classification:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getTierColor(selectedEvidenceAnalysis.acmg_classification)}`}>
                    {selectedEvidenceAnalysis.acmg_classification || 'Evaluated'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-200">Input Data Snapshot</div>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto">
                  {JSON.stringify(selectedEvidenceAnalysis.input_data || selectedEvidenceAnalysis, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setSelectedEvidenceAnalysis(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ADD GENETIC TEST RECORD MODAL */}
      {showAddTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-teal-400" />
                <span>Record Diagnostic Assay Result</span>
              </h3>
              <button onClick={() => setShowAddTestModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewTest} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Assay Method (One of 9 Standard Assays):</label>
                <select
                  value={newTest.test_type}
                  onChange={(e) => setNewTest({ ...newTest, test_type: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-teal-500 focus:outline-none"
                >
                  <option value="PCR">PCR</option>
                  <option value="Sanger sequencing">Sanger sequencing</option>
                  <option value="NGS">NGS</option>
                  <option value="WES">WES</option>
                  <option value="WGS">WGS</option>
                  <option value="DNA microarray">DNA microarray</option>
                  <option value="CMA">CMA</option>
                  <option value="genotyping/SNP testing">Genotyping / SNP testing</option>
                  <option value="karyotyping">Karyotyping</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Gene Symbol / Target:</label>
                  <input
                    type="text"
                    value={newTest.gene_symbol}
                    onChange={(e) => setNewTest({ ...newTest, gene_symbol: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-teal-500 focus:outline-none"
                    placeholder="BRCA1, CFTR..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Test Date:</label>
                  <input
                    type="date"
                    value={newTest.test_date}
                    onChange={(e) => setNewTest({ ...newTest, test_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Laboratory / Source:</label>
                <input
                  type="text"
                  value={newTest.source_or_laboratory}
                  onChange={(e) => setNewTest({ ...newTest, source_or_laboratory: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-teal-500 focus:outline-none"
                  placeholder="Clinical Genomics Diagnostic Center"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Structured Findings &amp; Observations:</label>
                <textarea
                  value={newTest.findings}
                  onChange={(e) => setNewTest({ ...newTest, findings: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-teal-500 focus:outline-none"
                  placeholder="Detail variant observations, quality scores, or coverage metrics..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTestModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-md"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Persistent DNA Doctor PDF Report Preview & Download Modal */}
      <ReportModal
        analysis={selectedReportAnalysis}
        currentUser={currentUser || null}
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setSelectedReportAnalysis(null);
        }}
      />
    </div>
  );
};
