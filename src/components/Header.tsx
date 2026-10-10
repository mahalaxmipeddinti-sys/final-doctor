// src/components/Header.tsx
import React, { useState, useEffect } from 'react';
import {
  Menu,
  Dna,
  Plus,
  User as UserIcon,
  ChevronRight,
  Sparkles,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { subscribeToAuth, logoutUser, AppUser } from '../lib/authService.ts';
import { AuthModal } from './AuthModal.tsx';

interface HeaderProps {
  activeTab: 'home' | 'workbench' | 'matrix' | 'compare' | 'history' | 'methodology' | 'assays' | 'account';
  setActiveTab: (tab: 'home' | 'workbench' | 'matrix' | 'compare' | 'history' | 'methodology' | 'assays' | 'account') => void;
  analysisCount?: number;
  onNewAnalysis?: () => void;
  onToggleSidebar: () => void;
  isSidebarCollapsed?: boolean;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  home: { title: 'Home', subtitle: 'Search & Overview' },
  workbench: { title: 'Clinical Workbench', subtitle: 'Tri-Pillar Analysis' },
  assays: { title: 'Diagnostic Assay Lab', subtitle: 'PCR, Sanger, NGS, CMA 2D/3D Simulations' },
  matrix: { title: 'ACMG 28-Rules', subtitle: 'Richards 2015 Auditor' },
  compare: { title: 'Compare Variants', subtitle: 'Differential Matrix' },
  history: { title: 'Audit History', subtitle: 'Database Archive' },
  methodology: { title: 'Methodology', subtitle: 'Guidelines & Bayes' },
  account: { title: 'User Account Portal', subtitle: 'Supabase Authentication & Profile Settings' },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  analysisCount = 0,
  onNewAnalysis,
  onToggleSidebar,
  isSidebarCollapsed = false,
}) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  const currentInfo = TAB_TITLES[activeTab] || { title: 'Console', subtitle: '' };


  return (
    <header className="border-b border-slate-800/90 bg-slate-950/85 sticky top-0 z-20 backdrop-blur-md">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* Left Zone: Three-Bar Menu Toggle + Active View Indicator */}
          <div className="flex items-center gap-3 min-w-0">
            {/* The Three-Bar (☰) Button */}
            <button
              type="button"
              onClick={onToggleSidebar}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-teal-300 border border-slate-800 hover:border-teal-500/40 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/40 shadow-sm shrink-0"
              aria-label="Toggle navigation sidebar (Three Bars ☰)"
              title="Toggle navigation sidebar (Three Bars ☰)"
            >
              <Menu className="w-5 h-5 text-teal-400" />
              <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Menu</span>
            </button>

            {/* Mobile Brand Icon (< md) */}
            <button
              onClick={() => {
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="md:hidden flex items-center gap-2 text-slate-100 hover:text-white transition-colors shrink-0 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Dna className="w-4 h-4 text-teal-400" />
              </div>
              <span className="font-bold text-sm sm:text-base tracking-tight truncate">
                DNA Doctor
              </span>
            </button>

            {/* Active Route Breadcrumb Header */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800/80 min-w-0">
              <span className="text-slate-600 font-mono text-xs">/</span>
              <span className="text-sm font-semibold text-slate-100 truncate">
                {currentInfo.title}
              </span>
              {currentInfo.subtitle && (
                <span className="text-xs text-slate-500 hidden md:inline truncate">
                  • {currentInfo.subtitle}
                </span>
              )}
            </div>
          </div>

          {/* Right Zone: Primary CTA & User Authentication */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {onNewAnalysis && (
              <button
                onClick={onNewAnalysis}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Analysis</span>
                <span className="sm:hidden">New</span>
              </button>
            )}

            {user ? (
              <div
                onClick={() => setActiveTab('account')}
                className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl px-2.5 py-1 cursor-pointer transition-colors"
                title="View Profile & Credentials"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="User avatar"
                    className="w-6 h-6 rounded-full border border-teal-500/50 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="hidden lg:flex flex-col text-left pr-1">
                  <span className="text-[11px] font-semibold text-slate-200 truncate max-w-[140px]">
                    {user.displayName || 'Clinician'}
                  </span>
                  <span className="text-[9px] text-teal-400 font-mono">
                    {user.role || 'Clinical Geneticist'}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  title="Sign Out"
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('account')}
                className="text-xs text-slate-200 hover:text-white px-3 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/40 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Sign In / Register</span>
              </button>
            )}

          </div>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(loggedUser) => setUser(loggedUser)}
      />
    </header>
  );
};

