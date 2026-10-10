// src/components/LoginAccountView.tsx
import React, { useState, useEffect } from 'react';
import {
  Shield,
  User as UserIcon,
  Mail,
  Lock,
  Building,
  Sparkles,
  KeyRound,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Database,
  Sliders,
  LogOut,
  Dna,
  ExternalLink,
  Layers,
  History,
  Check,
  Zap,
  Globe,
  Settings,
  ShieldCheck,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { authService, AppUser, DEFAULT_CLINICIAN } from '../services/auth.service.ts';
import {
  getSupabaseConfig,
  setSupabaseConfig,
  resetSupabaseConfig,
  supabase,
} from '../lib/supabase.ts';
import { FullAnalysisResult } from '../types/genomics.ts';

interface LoginAccountViewProps {
  currentUser: AppUser | null;
  onUserChange: (user: AppUser | null) => void;
  onSelectVariant?: (variantInput: string) => void;
}

export const SAMPLE_CLINICIANS: AppUser[] = [
  {
    uid: 'dr-alex-vance-01',
    displayName: 'Dr. Alex Vance',
    email: 'alex.vance@genomics.hospital.org',
    photoURL: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    role: 'Clinical Geneticist',
    isAnonymous: false,
  },
  {
    uid: 'dr-sophia-chen-02',
    displayName: 'Dr. Sophia Chen',
    email: 'sophia.chen@molecular.pathology.org',
    photoURL: 'https://images.unsplash.com/photo-1594824813571-2153349aed06?w=150&auto=format&fit=crop&q=80',
    role: 'Chief Molecular Pathologist',
    isAnonymous: false,
  },
  {
    uid: 'dr-marcus-brody-03',
    displayName: 'Dr. Marcus Brody',
    email: 'm.brody@bioinformatics.institute.org',
    photoURL: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    role: 'Senior Bioinformatician',
    isAnonymous: false,
  },
  {
    uid: 'dr-elena-rostova-04',
    displayName: 'Dr. Elena Rostova',
    email: 'elena.rostova@rare.genomics.edu',
    photoURL: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    role: 'Variant Curation Specialist',
    isAnonymous: false,
  },
];

export const LoginAccountView: React.FC<LoginAccountViewProps> = ({
  currentUser,
  onUserChange,
  onSelectVariant,
}) => {
  // Navigation sub-tab inside Account View
  const [activeTab, setActiveTab] = useState<'login' | 'profile' | 'supabase_config' | 'user_history'>(
    currentUser ? 'profile' : 'login'
  );

  // Form Mode: 'signin' | 'signup' | 'forgot'
  const [formMode, setFormMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Input states for Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('Clinical Geneticist');
  const [organization, setOrganization] = useState('National Precision Genomics Center');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile editing state
  const [editName, setEditName] = useState(currentUser?.displayName || '');
  const [editRole, setEditRole] = useState(currentUser?.role || 'Clinical Geneticist');
  const [editPhoto, setEditPhoto] = useState(currentUser?.photoURL || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Supabase Custom Config state
  const [sbConfig, setSbConfig] = useState(getSupabaseConfig());
  const [customUrlInput, setCustomUrlInput] = useState(sbConfig.url);
  const [customKeyInput, setCustomKeyInput] = useState(sbConfig.anonKey);
  const [showConnectPanel, setShowConnectPanel] = useState(true);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });

  // User History from Supabase
  const [userRecords, setUserRecords] = useState<FullAnalysisResult[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.displayName || '');
      setEditRole(currentUser.role || 'Clinical Geneticist');
      setEditPhoto(currentUser.photoURL || '');
      fetchUserHistory(currentUser.uid);
    }
  }, [currentUser]);

  const fetchUserHistory = async (userId: string) => {
    setLoadingRecords(true);
    try {
      // First try fetching user records from API
      const res = await fetch(`/api/analyses?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUserRecords(data);
        }
      }
    } catch {
      // quiet fallback
    } finally {
      setLoadingRecords(false);
    }
  };

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Handle Email Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    const res = await authService.signIn(email, password);
    setLoading(false);

    if (res.success && res.data?.user) {
      onUserChange(res.data.user);
      setSuccessMsg(`Welcome back, ${res.data.user.displayName}!`);
      setActiveTab('profile');
    } else {
      setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  // Handle Registration
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please provide a valid clinical email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const res = await authService.signUp(email, password, displayName, role);
    setLoading(false);

    if (res.success) {
      if (res.data?.user) {
        onUserChange(res.data.user);
        setSuccessMsg(`Account created successfully! Welcome, ${res.data.user.displayName}.`);
        setActiveTab('profile');
      } else {
        setSuccessMsg('Registration request submitted! Please check your email inbox to verify.');
      }
    } else {
      setErrorMsg(res.error || 'Registration failed.');
    }
  };

  // Handle Reset Password Request
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!email.trim()) {
      setErrorMsg('Enter your email address to receive password reset instructions.');
      return;
    }

    setLoading(true);
    const res = await authService.resetPassword(email);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(`Password reset instructions sent to ${email}.`);
    } else {
      setErrorMsg(res.error || 'Unable to send password reset email.');
    }
  };

  // Preset Sample Login
  const handleSelectSampleClinician = (sample: AppUser) => {
    authService.loginAsGuestClinician(); // Stores in local session
    authService.setStoredGuestUser(sample);
    onUserChange(sample);
    setSuccessMsg(`Signed in as preset clinician: ${sample.displayName}`);
    setActiveTab('profile');
  };

  // Google OAuth Trigger
  const handleGoogleAuth = async () => {
    resetMessages();
    setLoading(true);
    const res = await authService.signInWithGoogle();
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Google authentication notice.');
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    await authService.signOut();
    onUserChange(null);
    setActiveTab('login');
    setSuccessMsg('Successfully signed out.');
  };

  // Update Profile Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsUpdatingProfile(true);
    resetMessages();

    const updatedUser: AppUser = {
      ...currentUser,
      displayName: editName.trim() || currentUser.displayName,
      role: editRole,
      photoURL: editPhoto.trim() || currentUser.photoURL,
    };

    authService.setStoredGuestUser(updatedUser);
    onUserChange(updatedUser);

    // Try updating Supabase database
    if (currentUser.uid && !currentUser.uid.startsWith('guest-')) {
      await authService.updateUserProfile(currentUser.uid, {
        display_name: updatedUser.displayName,
        role: updatedUser.role,
        photo_url: updatedUser.photoURL,
      });
    }

    setIsUpdatingProfile(false);
    setSuccessMsg('Clinical profile updated successfully!');
  };

  // Test Supabase Live Connection
  const handleTestSupabaseConnection = async () => {
    setTestResult({ status: 'testing', message: 'Testing connection to Supabase database...' });
    try {
      const { data, error } = await supabase.from('user_profiles' as any).select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        // Even if table empty, connection works if no network error
        setTestResult({
          status: 'error',
          message: `Supabase returned error code (${error.code}): ${error.message}`,
        });
      } else {
        setTestResult({
          status: 'success',
          message: `Successfully connected to Supabase backend! URL: ${sbConfig.url}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: `Network Exception connecting to Supabase: ${err?.message || 'Check URL and Anon Key'}`,
      });
    }
  };

  // Save Custom Supabase Credentials
  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim() || !customKeyInput.trim()) {
      setTestResult({ status: 'error', message: 'Please enter both Supabase URL and Anon Key.' });
      return;
    }
    setSupabaseConfig(customUrlInput, customKeyInput);
    const newConfig = getSupabaseConfig();
    setSbConfig(newConfig);
    setTestResult({
      status: 'success',
      message: 'Supabase credentials saved locally and client re-initialized!',
    });
  };

  const handleResetSupabaseConfig = () => {
    resetSupabaseConfig();
    const newConfig = getSupabaseConfig();
    setSbConfig(newConfig);
    setCustomUrlInput(newConfig.url);
    setCustomKeyInput(newConfig.anonKey);
    setTestResult({ status: 'idle', message: 'Reset to default workspace configuration.' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in text-slate-100">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Supabase Authentication & Clinical User Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {currentUser ? `Welcome, ${currentUser.displayName || 'Clinician'}` : 'Sign In to Clinical Workspace'}
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Secure multi-user session management, user-specific variant persistent storage, custom Supabase backend configuration, and clinical role credentials.
            </p>
          </div>

          {/* Supabase Connection Status Tag */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shrink-0">
            <div className={`p-2.5 rounded-xl ${sbConfig.isPlaceholder ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400">Supabase Backend Status</div>
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${sbConfig.isPlaceholder ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                {sbConfig.isPlaceholder ? 'Sandbox Mode (Placeholder Key)' : sbConfig.isCustom ? 'Connected (Custom Key)' : 'Connected (Environment Key)'}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-slate-800 overflow-x-auto no-scrollbar">
          {!currentUser ? (
            <button
              onClick={() => setActiveTab('login')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'login'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>User Profile & Credentials</span>
            </button>
          )}

          {currentUser && (
            <button
              onClick={() => setActiveTab('user_history')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'user_history'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>My Saved Variants ({userRecords.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('supabase_config')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'supabase_config'
                ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Supabase Connection Config</span>
          </button>
        </div>
      </div>

      {/* Global Notifications */}
      {errorMsg && (
        <div className="bg-rose-950/80 border border-rose-800/80 rounded-2xl p-4 text-xs text-rose-200 flex items-start gap-3 shadow-lg animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-rose-300 mb-0.5">Authentication Alert</div>
            <div>{errorMsg}</div>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-950/80 border border-emerald-800/80 rounded-2xl p-4 text-xs text-emerald-200 flex items-start gap-3 shadow-lg animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-emerald-300 mb-0.5">Success</div>
            <div>{successMsg}</div>
          </div>
        </div>
      )}

      {/* TAB 1: SIGN IN / REGISTER FORM & SAMPLE PRESETS */}
      {activeTab === 'login' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Auth Form */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            {/* Auth Form Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {formMode === 'signin' && 'Sign In to Your Account'}
                  {formMode === 'signup' && 'Register New Clinical Account'}
                  {formMode === 'forgot' && 'Reset Password'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {formMode === 'signin' && 'Enter your registered clinical credentials to continue.'}
                  {formMode === 'signup' && 'Create an account to store variant analyses in Supabase.'}
                  {formMode === 'forgot' && 'Enter your email address to receive password recovery details.'}
                </p>
              </div>

              {/* Toggle Mode Buttons */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setFormMode('signin');
                    resetMessages();
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    formMode === 'signin' ? 'bg-slate-800 text-teal-400 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormMode('signup');
                    resetMessages();
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    formMode === 'signup' ? 'bg-slate-800 text-teal-400 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* INLINE SUPABASE CONNECTION MANAGER */}
            <div className="bg-slate-950/90 border border-teal-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold text-white">Connect Supabase Backend</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    sbConfig.isCustom ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {sbConfig.isCustom ? 'Custom Connected' : 'Default Sandbox'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConnectPanel(!showConnectPanel)}
                  className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{showConnectPanel ? 'Hide Config' : 'Configure Credentials'}</span>
                </button>
              </div>

              {showConnectPanel && (
                <div className="pt-2 border-t border-slate-800 space-y-3 animate-fade-in text-xs">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Paste your Supabase Project URL and Anon Public Key below to connect your own Supabase database & auth.
                  </p>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-medium text-slate-300">Supabase Project URL</label>
                      <input
                        type="url"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="https://your-project.supabase.co"
                        className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 font-mono focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-300">Supabase Anon Public Key</label>
                      <input
                        type="password"
                        value={customKeyInput}
                        onChange={(e) => setCustomKeyInput(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 font-mono focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveSupabaseConfig}
                      className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Save & Connect Supabase</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTestSupabaseConnection}
                      disabled={testResult.status === 'testing'}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-teal-300 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testResult.status === 'testing' ? 'animate-spin' : ''}`} />
                      <span>Test Connection</span>
                    </button>
                  </div>

                  {testResult.message && (
                    <div
                      className={`p-2 rounded-lg text-[11px] border mt-2 ${
                        testResult.status === 'success'
                          ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                          : testResult.status === 'error'
                          ? 'bg-rose-950/70 border-rose-800 text-rose-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      {testResult.message}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SIGN IN FORM */}
            {formMode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. alex.vance@genomics.hospital.org"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500/80 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => setFormMode('forgot')}
                      className="text-xs text-teal-400 hover:text-teal-300 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500/80 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Sign In with Supabase</span>
                </button>
              </form>
            )}

            {/* SIGN UP FORM */}
            {formMode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Full Name</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Dr. Alex Vance"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500/80 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Clinical Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500/80 transition-colors"
                    >
                      <option value="Clinical Geneticist">Clinical Geneticist</option>
                      <option value="Chief Molecular Pathologist">Chief Molecular Pathologist</option>
                      <option value="Senior Bioinformatician">Senior Bioinformatician</option>
                      <option value="Variant Curation Specialist">Variant Curation Specialist</option>
                      <option value="Genetic Counselor">Genetic Counselor</option>
                      <option value="Laboratory Director">Laboratory Director</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. clinician@medical.org"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500/80 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500/80 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Create Account & Save Profile</span>
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {formMode === 'forgot' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Account Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@genomics.org"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500/80 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Send Password Reset Instructions</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setFormMode('signin')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Social / Google Auth Section */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="text-center text-xs text-slate-500">Or continue with third-party OAuth</div>
              <button
                onClick={handleGoogleAuth}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-200 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          </div>

          {/* Quick Presets & Demonstration Accounts */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <Zap className="w-4 h-4" />
                <span>1-Click Sample Clinician Logins</span>
              </div>
              <p className="text-xs text-slate-400">
                Click any pre-configured clinical profile below to test multi-user analysis, saved variant histories, and role-based views without typing credentials.
              </p>

              <div className="space-y-2.5 pt-2">
                {SAMPLE_CLINICIANS.map((clinician) => (
                  <button
                    key={clinician.uid}
                    onClick={() => handleSelectSampleClinician(clinician)}
                    className="w-full text-left bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 rounded-2xl p-3.5 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={clinician.photoURL!}
                        alt={clinician.displayName!}
                        className="w-9 h-9 rounded-full border border-slate-700 object-cover shrink-0"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-200 group-hover:text-teal-400 transition-colors">
                          {clinician.displayName}
                        </div>
                        <div className="text-[11px] text-slate-400">{clinician.role}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            {/* Sandbox Notice */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-3">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                <span>Database Synchronization</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                When signed in, variant evaluations, trio genetic runs, and ACMG rule overrides are tagged with your unique user ID and saved directly in Supabase table <code className="text-teal-300">user_profiles</code> and <code className="text-teal-300">analysis_records</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE USER PROFILE & CREDENTIALS DASHBOARD */}
      {activeTab === 'profile' && currentUser && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Identity & Stats Card */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col items-center text-center space-y-3 border-b border-slate-800 pb-6">
              <div className="relative">
                <img
                  src={currentUser.photoURL || DEFAULT_CLINICIAN.photoURL!}
                  alt={currentUser.displayName || 'User'}
                  className="w-24 h-24 rounded-full border-2 border-teal-500/50 shadow-xl object-cover"
                />
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-slate-950">
                  <Check className="w-3.5 h-3.5 font-extrabold" />
                </div>
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-white">{currentUser.displayName || 'Clinical User'}</h2>
                <p className="text-xs text-teal-400 font-medium">{currentUser.role || 'Clinical Geneticist'}</p>
                <p className="text-xs text-slate-400 mt-1">{currentUser.email || 'No email associated'}</p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono">
                <span>UID:</span>
                <span className="text-teal-300">{currentUser.uid.slice(0, 16)}...</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 text-center">
                <div className="text-xl font-black text-teal-400">{userRecords.length}</div>
                <div className="text-[11px] text-slate-400">Saved Analyses</div>
              </div>
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 text-center">
                <div className="text-xl font-black text-emerald-400">Active</div>
                <div className="text-[11px] text-slate-400">Supabase Session</div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-3 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/60 text-slate-300 hover:text-rose-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Account</span>
            </button>
          </div>

          {/* Edit Profile Form */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">Edit Clinical Credentials & Settings</h2>
              <p className="text-xs text-slate-400 mt-1">
                Updates will sync with your Supabase <code className="text-teal-300">user_profiles</code> record.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500/80 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Specialization / Clinical Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500/80 transition-colors"
                >
                  <option value="Clinical Geneticist">Clinical Geneticist</option>
                  <option value="Chief Molecular Pathologist">Chief Molecular Pathologist</option>
                  <option value="Senior Bioinformatician">Senior Bioinformatician</option>
                  <option value="Variant Curation Specialist">Variant Curation Specialist</option>
                  <option value="Genetic Counselor">Genetic Counselor</option>
                  <option value="Laboratory Director">Laboratory Director</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Avatar Image URL</label>
                <input
                  type="url"
                  value={editPhoto}
                  onChange={(e) => setEditPhoto(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500/80 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUpdatingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Save Changes to Supabase</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: USER SAVED VARIANTS */}
      {activeTab === 'user_history' && currentUser && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Saved Variants & ACMG Audit Records</h2>
              <p className="text-xs text-slate-400 mt-1">
                Persistent analyses for user UID: <span className="text-teal-400">{currentUser.uid}</span>
              </p>
            </div>
            <button
              onClick={() => fetchUserHistory(currentUser.uid)}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loadingRecords ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          </div>

          {userRecords.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Dna className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">No variant analyses saved yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Run a variant search or ACMG evaluation in the Clinical Workbench to automatically persist your results to Supabase!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userRecords.map((rec, i) => {
                const gene = rec.normalizedVariant?.geneSymbol || 'Variant';
                const asm = rec.normalizedVariant?.assembly || 'GRCh38';
                const inputStr = rec.normalizedVariant?.originalInput || 'Variant';
                const classif = rec.acmgEvaluation?.overallClassification || 'UNCERTAIN_SIGNIFICANCE';

                return (
                  <div
                    key={rec.analysisId || i}
                    className="bg-slate-950 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-4 space-y-3 transition-all hover:shadow-lg group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-400">{gene}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                        {asm}
                      </span>
                    </div>

                    <div className="text-xs text-slate-200 font-mono truncate">{inputStr}</div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-900">
                      <span
                        className={`font-semibold ${
                          classif.includes('PATHOGENIC')
                            ? 'text-rose-400'
                            : classif.includes('BENIGN')
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {classif.replace(/_/g, ' ')}
                      </span>

                      {onSelectVariant && (
                        <button
                          onClick={() => onSelectVariant(inputStr)}
                          className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>Open</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          )}
        </div>
      )}

      {/* TAB 4: SUPABASE BACKEND CONFIGURATION MANAGER */}
      {activeTab === 'supabase_config' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-400" />
                <span>Configure Custom Supabase Project</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                You can connect your own Supabase project by providing your Project URL and Anon Public Key below.
              </p>
            </div>

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Supabase Project URL</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="url"
                    required
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 font-mono focus:outline-none focus:border-teal-500/80 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Supabase Anon Public Key</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <textarea
                    rows={3}
                    required
                    value={customKeyInput}
                    onChange={(e) => setCustomKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-600 font-mono focus:outline-none focus:border-teal-500/80 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Save & Connect Custom Supabase</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetSupabaseConfig}
                  className="px-4 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Reset Defaults
                </button>
              </div>
            </form>

            {/* Test Connection Button */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <button
                type="button"
                onClick={handleTestSupabaseConnection}
                disabled={testResult.status === 'testing'}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-teal-300 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${testResult.status === 'testing' ? 'animate-spin' : ''}`} />
                <span>Test Live Database Connection</span>
              </button>

              {testResult.message && (
                <div
                  className={`p-3 rounded-xl text-xs border ${
                    testResult.status === 'success'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : testResult.status === 'error'
                      ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Database Schema Reference */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-400" />
              <span>Supabase Database Tables</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The application automatically syncs with these 5 structured PostgreSQL tables:
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="font-mono font-bold text-teal-300">user_profiles</div>
                <div className="text-[11px] text-slate-400">Stores clinician profiles, display names, and clinical roles.</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="font-mono font-bold text-teal-300">analysis_records</div>
                <div className="text-[11px] text-slate-400">Stores single-variant VEP annotations & ACMG score.</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="font-mono font-bold text-teal-300">trio_analyses</div>
                <div className="text-[11px] text-slate-400">Stores Proband / Mother / Father inherited variant runs.</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="font-mono font-bold text-teal-300">assay_experiments</div>
                <div className="text-[11px] text-slate-400">Stores 2D/3D assay simulation readouts.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
