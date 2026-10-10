// src/components/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Dna,
  Home,
  Layers,
  ShieldCheck,
  Scale,
  History,
  BookOpen,
  Plus,
  Activity,
  User as UserIcon,
  LogOut,
  Sparkles,
  X,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { subscribeToAuth, logoutUser, AppUser } from '../lib/authService.ts';

export interface SidebarProps {
  activeTab: 'home' | 'workbench' | 'matrix' | 'compare' | 'history' | 'methodology' | 'assays' | 'profile' | 'settings' | 'account';
  setActiveTab: (tab: 'home' | 'workbench' | 'matrix' | 'compare' | 'history' | 'methodology' | 'assays' | 'profile' | 'settings' | 'account') => void;
  analysisCount?: number;
  onNewAnalysis?: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onSelectBenchmark?: (clinvarId: string) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  analysisCount = 0,
  onNewAnalysis,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  onSelectBenchmark,
}) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Close mobile drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsMobileOpen]);

  const handleLogin = async () => {
    setActiveTab('account');
    setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  const navItems = [
    {
      id: 'home' as const,
      label: 'Overview',
      shortLabel: 'Overview',
      description: 'System overview & quick launch',
      icon: Home,
      badge: null,
    },
    {
      id: 'workbench' as const,
      label: 'Variant Analysis',
      shortLabel: 'Analysis',
      description: 'Clinical Tri-Pillar engine & Trio',
      icon: Layers,
      badge: null,
    },
    {
      id: 'assays' as const,
      label: 'Genetic Testing Methods',
      shortLabel: 'Methods',
      description: 'Diagnostic Assay Lab (2D/3D simulations)',
      icon: Activity,
      badge: '2D/3D',
    },
    {
      id: 'matrix' as const,
      label: 'Evidence Explorer',
      shortLabel: 'ACMG Matrix',
      description: 'ACMG 28-Rules & Bayesian auditor',
      icon: ShieldCheck,
      badge: null,
    },
    {
      id: 'history' as const,
      label: 'Analysis History',
      shortLabel: 'History',
      description: 'Persistent database audit archive',
      icon: History,
      badge: analysisCount > 0 ? `${analysisCount}` : null,
    },
    {
      id: 'profile' as const,
      label: 'Profile',
      shortLabel: 'Profile',
      description: 'Clinician identity & credentials',
      icon: UserIcon,
      badge: null,
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      shortLabel: 'Settings',
      description: 'Supabase connection & preferences',
      icon: Settings,
      badge: null,
    },
  ];

  const benchmarkShortcuts = [
    { id: '17661', gene: 'BRCA1', label: 'c.5266dupC' },
    { id: '13961', gene: 'BRAF', label: 'V600E' },
    { id: '7105', gene: 'CFTR', label: 'F508del' },
    { id: '12374', gene: 'TP53', label: 'R175H' },
  ];

  const handleNavClick = (tabId: 'home' | 'workbench' | 'matrix' | 'compare' | 'history' | 'methodology' | 'assays' | 'profile' | 'settings' | 'account') => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // Content shared between desktop sidebar and mobile drawer
  const renderSidebarContent = (collapsed: boolean, isMobile: boolean = false) => (
    <div className="flex flex-col h-full select-none">
      {/* Brand & Collapse Header */}
      <div
        className={`flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 shrink-0 ${
          collapsed && !isMobile ? 'h-16 px-3 justify-center' : 'h-16 px-4'
        }`}
      >
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 text-left focus:outline-none group overflow-hidden"
          title="DNA Doctor - Home"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:border-teal-500/60 transition-colors shrink-0">
            <Dna className="w-5 h-5 text-teal-400" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <span className="font-bold text-base tracking-tight text-slate-100 group-hover:text-white truncate block">
                DNA Doctor
              </span>
              <span className="text-[10px] text-teal-400 font-mono tracking-wider uppercase block">
                Clinical Console
              </span>
            </div>
          )}
        </button>

        {/* Desktop Collapse / Mobile Close Button */}
        {isMobile ? (
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        ) : !collapsed ? (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="w-8 h-8 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-teal-300 flex items-center justify-center border border-slate-800 transition-colors"
            title="Collapse Sidebar (Three Bars ☰)"
            aria-label="Collapse sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Primary New Analysis Button */}
      {onNewAnalysis && (
        <div className={`p-3 border-b border-slate-800/60 ${collapsed && !isMobile ? 'flex justify-center' : ''}`}>
          <button
            onClick={() => {
              onNewAnalysis();
              if (isMobile) setIsMobileOpen(false);
            }}
            className={`flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-teal-900/20 ${
              collapsed && !isMobile
                ? 'w-10 h-10 p-0'
                : 'w-full px-3.5 py-2.5 text-xs'
            }`}
            title="Start New Analysis"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {(!collapsed || isMobile) && <span>New Analysis</span>}
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {(!collapsed || isMobile) && (
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Diagnostic Suites
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full text-left rounded-xl transition-all flex items-center group relative ${
                collapsed && !isMobile
                  ? 'justify-center p-2.5'
                  : 'gap-3 px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-slate-900 border border-teal-500/40 text-teal-300 shadow-sm'
                  : 'hover:bg-slate-900/60 border border-transparent text-slate-400 hover:text-slate-100'
              }`}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <div
                className={`flex items-center justify-center rounded-lg transition-colors shrink-0 ${
                  collapsed && !isMobile ? 'w-8 h-8' : 'w-7 h-7'
                } ${
                  isActive
                    ? 'bg-teal-500/20 text-teal-300'
                    : 'text-slate-400 group-hover:text-teal-300'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {(!collapsed || isMobile) && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isActive ? 'text-teal-300' : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-teal-300 border border-slate-700 ml-1.5">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight truncate mt-0.5">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Active bar indicator on collapsed mode */}
              {collapsed && !isMobile && isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-teal-400 rounded-r-full" />
              )}
            </button>
          );
        })}

        {/* Quick Benchmarks section (expanded only) */}
        {(!collapsed || isMobile) && onSelectBenchmark && (
          <div className="pt-4 mt-2 border-t border-slate-800/60">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Preset Quick Jumps
            </div>
            <div className="grid grid-cols-2 gap-1.5 px-1">
              {benchmarkShortcuts.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onSelectBenchmark(preset.id);
                    if (isMobile) setIsMobileOpen(false);
                  }}
                  className="px-2 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 hover:border-teal-500/30 text-left transition-colors"
                >
                  <div className="text-[11px] font-bold text-teal-400 leading-tight">
                    {preset.gene}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 truncate">
                    {preset.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Area: Engine Status & Auth */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 shrink-0 space-y-2.5">
        {(!collapsed || isMobile) ? (
          <>


            {user ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <button
                  onClick={() => handleNavClick('profile')}
                  className="flex items-center gap-2 min-w-0 text-left hover:opacity-80 transition-opacity"
                  title="View Profile"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="User avatar"
                      className="w-6 h-6 rounded-full border border-slate-700 shrink-0 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                      <UserIcon className="w-3 h-3" />
                    </div>
                  )}
                  <span className="text-xs text-slate-300 truncate">
                    {user.displayName || user.email || 'Clinician'}
                  </span>
                </button>
                <button
                  onClick={handleLogout}
                  className="text-xs text-slate-400 hover:text-rose-400 p-1 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('profile')}
                className="w-full py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <UserIcon className="w-3 h-3 text-teal-400" />
                <span>Sign In / Register</span>
              </button>
            )}
          </>
        ) : (
          /* Collapsed Mini Footer */
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-400 flex items-center justify-center border border-slate-800"
              title="Expand Sidebar (Three Bars)"
            >
              <Menu className="w-4 h-4" />
            </button>
            {user ? (
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-full border border-slate-700 overflow-hidden flex items-center justify-center"
                title={`Signed in as ${user.email} (Click to Sign Out)`}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 text-slate-400" />
                )}
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800"
                title="Sign In"
              >
                <UserIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop & Tablet Persistent Sidebar (Docked on the side) */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-slate-800/90 bg-slate-950/95 sticky top-0 h-screen z-30 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-18' : 'w-64 xl:w-72'
        }`}
      >
        {renderSidebarContent(isCollapsed, false)}
      </aside>

      {/* 2. Mobile Slide-Over Drawer (Accessed via Three Bars on mobile) */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            className="relative z-10 w-72 max-w-[85vw] bg-slate-950 border-r border-slate-800/90 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-250 ease-out"
            role="dialog"
            aria-modal="true"
          >
            {renderSidebarContent(false, true)}
          </div>
        </div>
      )}
    </>
  );
};
