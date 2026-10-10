// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Database Schema Interfaces for Genomic Analysis Workflows
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          photo_url: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          photo_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          photo_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      analysis_records: {
        Row: {
          id: string;
          user_id: string;
          variant_input: string;
          assembly: string;
          chromosome: string;
          position: number;
          ref_allele: string;
          alt_allele: string;
          gene_symbol: string | null;
          hgvsc: string | null;
          hgvsp: string | null;
          clinvar_id: string | null;
          acmg_classification: string | null;
          acmg_score: number | null;
          ml_pathogenicity_score: number | null;
          full_result: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          variant_input: string;
          assembly?: string;
          chromosome: string;
          position: number;
          ref_allele: string;
          alt_allele: string;
          gene_symbol?: string | null;
          hgvsc?: string | null;
          hgvsp?: string | null;
          clinvar_id?: string | null;
          acmg_classification?: string | null;
          acmg_score?: number | null;
          ml_pathogenicity_score?: number | null;
          full_result?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          variant_input?: string;
          assembly?: string;
          chromosome?: string;
          position?: number;
          ref_allele?: string;
          alt_allele?: string;
          gene_symbol?: string | null;
          hgvsc?: string | null;
          hgvsp?: string | null;
          clinvar_id?: string | null;
          acmg_classification?: string | null;
          acmg_score?: number | null;
          ml_pathogenicity_score?: number | null;
          full_result?: any;
          created_at?: string;
        };
      };
      trio_analyses: {
        Row: {
          id: string;
          user_id: string;
          family_id: string;
          gene_symbol: string;
          hgvs: string;
          child_zygosity: string;
          mother_zygosity: string;
          father_zygosity: string;
          child_vaf: number;
          mother_vaf: number;
          father_vaf: number;
          inheritance_call: string;
          pathogenicity_verdict: string;
          disease_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          family_id?: string;
          gene_symbol: string;
          hgvs: string;
          child_zygosity: string;
          mother_zygosity: string;
          father_zygosity: string;
          child_vaf?: number;
          mother_vaf?: number;
          father_vaf?: number;
          inheritance_call: string;
          pathogenicity_verdict: string;
          disease_status: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          family_id?: string;
          gene_symbol?: string;
          hgvs?: string;
          child_zygosity?: string;
          mother_zygosity?: string;
          father_zygosity?: string;
          child_vaf?: number;
          mother_vaf?: number;
          father_vaf?: number;
          inheritance_call?: string;
          pathogenicity_verdict?: string;
          disease_status?: string;
          created_at?: string;
        };
      };
      assay_experiments: {
        Row: {
          id: string;
          user_id: string;
          assay_type: string;
          gene_symbol: string;
          hgvs: string;
          sample_id: string;
          parameters: any;
          readout: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          assay_type: string;
          gene_symbol: string;
          hgvs: string;
          sample_id: string;
          parameters?: any;
          readout?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          assay_type?: string;
          gene_symbol?: string;
          hgvs?: string;
          sample_id?: string;
          parameters?: any;
          readout?: any;
          created_at?: string;
        };
      };
      acmg_evaluations: {
        Row: {
          id: string;
          user_id: string;
          variant_id: string;
          applied_criteria: string[];
          bayesian_score: number;
          overall_classification: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          variant_id: string;
          applied_criteria: string[];
          bayesian_score: number;
          overall_classification: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          variant_id?: string;
          applied_criteria?: string[];
          bayesian_score?: number;
          overall_classification?: string;
          created_at?: string;
        };
      };
    };
  };
}

// Supabase configuration with support for environment variables and dynamic overrides
const DEFAULT_SUPABASE_URL = 'https://nvxuuradeoxznbhipaer.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_0rrORMBosLIL4q2u5Pc9Ew_VvU91jtt';

export function getSupabaseConfig(): {
  url: string;
  anonKey: string;
  isCustom: boolean;
  isPlaceholder: boolean;
  isConfigured: boolean;
} {
  let localUrl = typeof window !== 'undefined' ? localStorage.getItem('custom_supabase_url') : null;
  let localKey = typeof window !== 'undefined' ? localStorage.getItem('custom_supabase_anon_key') : null;

  // Clear obsolete or placeholder custom configs stored previously
  if (localUrl && (localUrl.includes('placeholder') || !localUrl.startsWith('http'))) {
    if (typeof window !== 'undefined') localStorage.removeItem('custom_supabase_url');
    localUrl = null;
  }
  if (localKey && (localKey.includes('placeholder') || localKey.length < 10)) {
    if (typeof window !== 'undefined') localStorage.removeItem('custom_supabase_anon_key');
    localKey = null;
  }

  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || '';
  const envKey = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY)) || (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY || process.env?.SUPABASE_KEY)) || '';

  const url = localUrl || envUrl || DEFAULT_SUPABASE_URL;
  const anonKey = localKey || envKey || DEFAULT_SUPABASE_ANON_KEY;

  const isCustom = Boolean(localUrl && localKey);
  const isPlaceholder = !url || url.includes('placeholder-project') || !anonKey || anonKey.includes('placeholder') || anonKey.includes('your-anon-key');
  const isConfigured = !isPlaceholder && url.startsWith('http');

  return { url, anonKey, isCustom, isPlaceholder, isConfigured };
}

const initialConfig = getSupabaseConfig();

export let supabase = createClient<Database>(initialConfig.url, initialConfig.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function reinitSupabaseClient(): typeof supabase {
  const config = getSupabaseConfig();
  supabase = createClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return supabase;
}

export function setSupabaseConfig(url: string, anonKey: string) {
  if (url.trim() && anonKey.trim()) {
    localStorage.setItem('custom_supabase_url', url.trim());
    localStorage.setItem('custom_supabase_anon_key', anonKey.trim());
    reinitSupabaseClient();
  }
}

export function resetSupabaseConfig() {
  localStorage.removeItem('custom_supabase_url');
  localStorage.removeItem('custom_supabase_anon_key');
  reinitSupabaseClient();
}

