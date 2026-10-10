// src/components/AuthModal.tsx
import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Shield, KeyRound, Sparkles, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { authService, AppUser } from '../services/auth.service.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: AppUser) => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot_password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('Clinical Geneticist');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const res = await authService.signIn(email, password);
    setLoading(false);

    if (res.success && res.data?.user) {
      if (onSuccess) onSuccess(res.data.user);
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to sign in. Please check your credentials.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please provide a valid email and password.');
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
        if (onSuccess) onSuccess(res.data.user);
        onClose();
      } else {
        setSuccessMsg(res.error || 'Sign-up completed! Check your email for confirmation link.');
      }
    } else {
      setErrorMsg(res.error || 'Failed to register account.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address to receive password reset instructions.');
      return;
    }

    setLoading(true);
    const res = await authService.resetPassword(email);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Password recovery instructions sent to your email.');
    } else {
      setErrorMsg(res.error || 'Failed to send password recovery email.');
    }
  };

  const handleGoogleAuth = async () => {
    resetForm();
    setLoading(true);
    const res = await authService.signInWithGoogle();
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Google authentication notice.');
    }
  };

  const handleGuestLogin = () => {
    const guest = authService.loginAsGuestClinician();
    if (onSuccess) onSuccess(guest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100 space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 mx-auto rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            {mode === 'signin' && 'Sign In to DNA Doctor'}
            {mode === 'signup' && 'Create Clinical Account'}
            {mode === 'forgot_password' && 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'signin' && 'Access genomic analysis, saved variants, and trio history.'}
            {mode === 'signup' && 'Register as a clinical geneticist, researcher, or clinician.'}
            {mode === 'forgot_password' && 'Enter your account email to receive reset instructions.'}
          </p>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="bg-rose-950/50 border border-rose-800/80 rounded-xl p-3 text-xs text-rose-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/50 border border-emerald-800/80 rounded-xl p-3 text-xs text-emerald-300 flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="clinician@hospital.org"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setMode('forgot_password');
                  }}
                  className="text-[11px] text-teal-400 hover:text-teal-300"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dr. Alex Vance"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="clinician@hospital.org"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (Min 6 characters)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Clinical Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                <option value="Clinical Geneticist">Clinical Geneticist</option>
                <option value="Bioinformatician">Bioinformatician</option>
                <option value="Molecular Pathologist">Molecular Pathologist</option>
                <option value="Genetic Counselor">Genetic Counselor</option>
                <option value="Medical Researcher">Medical Researcher</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 mt-2"
            >
              <span>{loading ? 'Creating Account...' : 'Register Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {mode === 'forgot_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Account Email Address</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="clinician@hospital.org"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Sending Request...' : 'Send Password Recovery Email'}</span>
            </button>
          </form>
        )}

        {/* OAuth & Guest Options */}
        <div className="relative border-t border-slate-800 pt-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="flex-1 py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 transition-colors flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Google Sign-In</span>
            </button>

            <button
              type="button"
              onClick={handleGuestLogin}
              className="flex-1 py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-teal-300 transition-colors flex items-center justify-center space-x-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>Guest Clinician</span>
            </button>
          </div>
        </div>

        {/* Mode Switcher Footer */}
        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          {mode === 'signin' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setMode('signup');
                }}
                className="text-teal-400 font-semibold hover:underline"
              >
                Create one now
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setMode('signin');
                }}
                className="text-teal-400 font-semibold hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
