// src/components/ProfileSettingsView.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  Mail,
  Building,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Check,
  Upload,
  Camera,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { authService, AppUser } from '../services/auth.service.ts';

interface ProfileSettingsViewProps {
  currentUser: AppUser;
  onUserUpdate: (user: AppUser) => void;
  onLogout: () => void;
  onNavigateToTab?: (tab: 'home' | 'workbench' | 'matrix' | 'assays' | 'history') => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  currentUser,
  onUserUpdate,
  onLogout,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security'>('profile');

  // Profile fields
  const [displayName, setDisplayName] = useState(currentUser.displayName || '');
  const [role, setRole] = useState(currentUser.role || 'Clinical Geneticist');
  const [institution, setInstitution] = useState(currentUser.institution || 'Genomics Medical Center');
  const [photoURL, setPhotoURL] = useState(currentUser.photoURL || '');

  // Password change fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayName(currentUser.displayName || '');
    setRole(currentUser.role || 'Clinical Geneticist');
    setInstitution(currentUser.institution || 'Genomics Medical Center');
    setPhotoURL(currentUser.photoURL || '');
  }, [currentUser]);

  const clearMessages = () => {
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit. Please upload a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPhotoURL(base64);
      setSuccessMsg('Photo selected! Click "Save Profile Changes" to update your account.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoURL('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSuccessMsg('Photo removed. Click "Save Profile Changes" to update.');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const res = await authService.updateUserProfile(currentUser.uid, {
        displayName: displayName.trim(),
        role,
        institution: institution.trim(),
        photoURL: photoURL.trim(),
      });

      if (!res.success || !res.data) {
        setErrorMsg(res.error || 'Failed to update profile.');
      } else {
        setSuccessMsg('Profile updated successfully!');
        onUserUpdate(res.data);
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!newPassword) {
      setErrorMsg('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.updatePassword(newPassword);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to change password.');
      } else {
        setSuccessMsg('Password updated successfully!');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error changing password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {photoURL ? (
            <img
              src={photoURL}
              alt="User profile"
              className="w-16 h-16 rounded-2xl border-2 border-teal-500/40 object-cover shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <UserIcon className="w-8 h-8" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              {currentUser.displayName || 'Clinician'}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-normal border border-teal-500/30">
                {currentUser.role || 'Clinical Geneticist'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentUser.email}</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <Building className="w-3 h-3" />
              <span>{currentUser.institution || 'Genomics Medical Center'}</span>
              <span>•</span>
              <span className="font-mono text-[10px]">ID: {currentUser.uid.substring(0, 12)}...</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Navigation Tabs (Only Profile & Credentials and Security & Password) */}
      <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('profile');
            clearMessages();
          }}
          className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'profile'
              ? 'bg-teal-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profile &amp; Credentials</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSubTab('security');
            clearMessages();
          }}
          className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'security'
              ? 'bg-teal-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security &amp; Password</span>
        </button>
      </div>

      {/* Notification banners */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SUB-TAB 1: PROFILE FORM WITH REAL PHOTO UPLOAD */}
      {activeSubTab === 'profile' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-100">Clinician Profile Information</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Update your diagnostic credentials, institutional affiliation, and profile photo for generated clinical reports.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            {/* Real Photo Uploader */}
            <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-4 space-y-3">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                Profile Photo (Embedded on PDF Reports)
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="relative group">
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt="Avatar Preview"
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-teal-500/50 shadow-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                      <Camera className="w-7 h-7 mb-1 text-slate-400" />
                      <span className="text-[10px]">No Photo</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="profile-photo-upload"
                    />
                    <label
                      htmlFor="profile-photo-upload"
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Real Photo</span>
                    </label>

                    {photoURL && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-medium transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Supports JPG, PNG, or WebP (max 5MB). Photo is scaled and embedded into the top corner of your downloadable PDF reports.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name &amp; Title
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Dr. Eleanor Vance, MD"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Institutional Email (Read Only)
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email || ''}
                  className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800/60 rounded-xl text-xs text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Clinical Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  <option value="Clinical Geneticist">Clinical Geneticist</option>
                  <option value="Chief Molecular Pathologist">Chief Molecular Pathologist</option>
                  <option value="Senior Bioinformatician">Senior Bioinformatician</option>
                  <option value="Variant Curation Specialist">Variant Curation Specialist</option>
                  <option value="Genetic Counselor">Genetic Counselor</option>
                  <option value="Genomic Researcher">Genomic Researcher</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Hospital / Research Institution
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Genomics Medical Center"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 2: SECURITY & PASSWORD */}
      {activeSubTab === 'security' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-100">Security &amp; Password Management</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Update your account password securely using Supabase authentication encryption.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                New Password (minimum 6 characters)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Update Account Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
