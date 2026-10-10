// src/services/auth.service.ts
import { supabase, Database } from '../lib/supabase.ts';
import { User, Session } from '@supabase/supabase-js';

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role?: string;
  isAnonymous?: boolean;
}

export interface AuthResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
}

const LOCAL_GUEST_KEY = 'dna_doctor_supabase_user';

export const DEFAULT_CLINICIAN: AppUser = {
  uid: 'guest-clinician-vance-01',
  displayName: 'Dr. Alex Vance (Clinical Geneticist)',
  email: 'alex.vance@genomics.hospital.org',
  photoURL: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
  role: 'Clinical Geneticist',
  isAnonymous: false,
};

export function getStoredGuestUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_GUEST_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading stored user from storage:', err);
  }
  return null;
}

export function setStoredGuestUser(user: AppUser | null) {
  try {
    if (user) {
      localStorage.setItem(LOCAL_GUEST_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_GUEST_KEY);
    }
  } catch (err) {
    console.error('Error writing stored user to storage:', err);
  }
}

/**
 * Map Supabase User to AppUser
 */
export function mapSupabaseUserToAppUser(user: User): AppUser {
  return {
    uid: user.id,
    displayName:
      user.user_metadata?.full_name ||
      user.user_metadata?.display_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Clinical User',
    email: user.email || null,
    photoURL:
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      DEFAULT_CLINICIAN.photoURL,
    role: user.user_metadata?.role || 'Clinical Geneticist',
    isAnonymous: false,
  };
}

class AuthService {
  /**
   * Get active session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('Get session notice:', error.message);
        return null;
      }
      return data.session;
    } catch (err) {
      console.warn('Session check exception:', err);
      return null;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AppUser | null> {
    try {
      const session = await this.getSession();
      if (session?.user) {
        const appUser = mapSupabaseUserToAppUser(session.user);
        setStoredGuestUser(appUser);
        return appUser;
      }
    } catch (err) {
      console.warn('Current user check exception:', err);
    }

    return getStoredGuestUser() || DEFAULT_CLINICIAN;
  }

  /**
   * Sign Up with Email and Password
   */
  async signUp(
    email: string,
    password: string,
    displayName?: string,
    role: string = 'Clinical Geneticist'
  ): Promise<AuthResponse<{ user: AppUser | null; session: Session | null }>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName || email.split('@')[0],
            display_name: displayName || email.split('@')[0],
            role,
          },
        },
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      if (data.user) {
        const appUser = mapSupabaseUserToAppUser(data.user);
        setStoredGuestUser(appUser);

        // Sync or create record in user_profiles table
        try {
          await (supabase.from('user_profiles' as any) as any).upsert({
            id: data.user.id,
            email: data.user.email,
            display_name: appUser.displayName,
            photo_url: appUser.photoURL,
            role,
            updated_at: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.warn('Profile sync notice:', dbErr);
        }

        return {
          data: { user: appUser, session: data.session },
          error: null,
          success: true,
        };
      }

      return {
        data: null,
        error: 'Sign up succeeded. Please check your email for confirmation.',
        success: true,
      };
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Failed to complete sign up.',
        success: false,
      };
    }
  }

  /**
   * Sign In with Email and Password
   */
  async signIn(
    email: string,
    password: string
  ): Promise<AuthResponse<{ user: AppUser; session: Session }>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      if (!data.user || !data.session) {
        return { data: null, error: 'No session returned from Supabase.', success: false };
      }

      const appUser = mapSupabaseUserToAppUser(data.user);
      setStoredGuestUser(appUser);

      return {
        data: { user: appUser, session: data.session },
        error: null,
        success: true,
      };
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Failed to sign in.',
        success: false,
      };
    }
  }

  /**
   * Sign In with Google OAuth
   */
  async signInWithGoogle(): Promise<AuthResponse<null>> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: null, error: null, success: true };
    } catch (err: any) {
      return { data: null, error: err.message || 'Google OAuth failed.', success: false };
    }
  }

  /**
   * Request Password Reset Email
   */
  async resetPassword(email: string): Promise<AuthResponse<null>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: null, error: null, success: true };
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Failed to send password recovery email.',
        success: false,
      };
    }
  }

  /**
   * Update Password (e.g., after clicking password recovery link)
   */
  async updatePassword(newPassword: string): Promise<AuthResponse<null>> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: null, error: null, success: true };
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Failed to update password.',
        success: false,
      };
    }
  }

  /**
   * Sign Out
   */
  async signOut(): Promise<void> {
    setStoredGuestUser(null);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out notice:', err);
    }
  }

  /**
   * Subscribe to Auth State Changes
   */
  onAuthStateChange(callback: (user: AppUser | null, session: Session | null) => void): () => void {
    // Emit initial user immediately
    const stored = getStoredGuestUser() || DEFAULT_CLINICIAN;
    callback(stored, null);

    this.getSession().then((session) => {
      if (session?.user) {
        const appUser = mapSupabaseUserToAppUser(session.user);
        setStoredGuestUser(appUser);
        callback(appUser, session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const appUser = mapSupabaseUserToAppUser(session.user);
        setStoredGuestUser(appUser);
        callback(appUser, session);
      } else {
        const currentUser = getStoredGuestUser() || DEFAULT_CLINICIAN;
        callback(currentUser, null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Fetch User Profile from Supabase database
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await (supabase.from('user_profiles' as any) as any)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Get user profile error:', error.message);
        return null;
      }

      return data as UserProfile;
    } catch (err) {
      console.warn('Fetch profile exception:', err);
      return null;
    }
  }

  /**
   * Update User Profile in Supabase database
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<Database['public']['Tables']['user_profiles']['Update']>
  ): Promise<AuthResponse<UserProfile>> {
    try {
      const { data, error } = await (supabase.from('user_profiles' as any) as any)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      return { data: data as UserProfile, error: null, success: true };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to update profile.', success: false };
    }
  }

  /**
   * Quick guest clinician login helper
   */
  loginAsGuestClinician(): AppUser {
    setStoredGuestUser(DEFAULT_CLINICIAN);
    return DEFAULT_CLINICIAN;
  }

  /**
   * Explicitly set stored user session
   */
  setStoredGuestUser(user: AppUser | null): void {
    setStoredGuestUser(user);
  }
}

export const authService = new AuthService();

