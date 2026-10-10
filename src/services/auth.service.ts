// src/services/auth.service.ts
import { supabase, Database, getSupabaseConfig } from '../lib/supabase.ts';
import { User, Session } from '@supabase/supabase-js';

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export interface AppUser {
  uid: string;
  id: string; // compatibility alias for uid
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role?: string;
  institution?: string;
  createdAt?: string;
}

export interface AuthResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Map Supabase Auth User object to AppUser interface
 */
export function mapSupabaseUserToAppUser(user: User): AppUser {
  return {
    uid: user.id,
    id: user.id,
    displayName:
      user.user_metadata?.full_name ||
      user.user_metadata?.display_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Clinician',
    email: user.email || null,
    photoURL:
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null,
    role: user.user_metadata?.role || 'Clinical Geneticist',
    institution: user.user_metadata?.institution || 'Genomics Medical Center',
    createdAt: user.created_at,
  };
}

class AuthService {
  /**
   * Check if Supabase project is configured with valid non-placeholder credentials
   */
  isConfigured(): boolean {
    return getSupabaseConfig().isConfigured;
  }

  /**
   * Get active Supabase Auth session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('Session retrieval notice:', error.message);
        return null;
      }
      return data.session;
    } catch (err) {
      console.warn('Session verification exception:', err);
      return null;
    }
  }

  /**
   * Get JWT access token for authenticating backend API requests
   */
  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.access_token || null;
  }

  /**
   * Get current authenticated user (null if unauthenticated)
   */
  async getCurrentUser(): Promise<AppUser | null> {
    try {
      const session = await this.getSession();
      if (session?.user) {
        return mapSupabaseUserToAppUser(session.user);
      }
    } catch (err) {
      console.warn('Error fetching current user:', err);
    }
    return null;
  }

  /**
   * Sign Up with Email and Password
   */
  async signUp(
    email: string,
    password: string,
    displayName?: string,
    role: string = 'Clinical Geneticist',
    institution: string = 'Genomics Medical Center'
  ): Promise<AuthResponse<{ user: AppUser | null; session: Session | null; emailConfirmationRequired: boolean }>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: displayName?.trim() || email.split('@')[0],
            display_name: displayName?.trim() || email.split('@')[0],
            role,
            institution,
          },
        },
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      const emailConfirmationRequired = Boolean(data.user && !data.session);
      const appUser = data.user ? mapSupabaseUserToAppUser(data.user) : null;

      // Sync user profile to database if session is immediate
      if (data.user && data.session) {
        try {
          await (supabase.from('user_profiles' as any) as any).upsert({
            id: data.user.id,
            email: data.user.email,
            display_name: appUser?.displayName,
            photo_url: appUser?.photoURL,
            role,
            updated_at: new Date().toISOString(),
          });
        } catch (syncErr) {
          console.warn('Initial profile sync warning:', syncErr);
        }
      }

      return {
        data: {
          user: appUser,
          session: data.session,
          emailConfirmationRequired,
        },
        error: null,
        success: true,
      };
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Failed to complete registration.',
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
        email: email.trim(),
        password,
      });

      if (error) {
        return { data: null, error: error.message, success: false };
      }

      if (!data.user || !data.session) {
        return {
          data: null,
          error: 'No active session received. Please verify your email if confirmation is enabled.',
          success: false,
        };
      }

      const appUser = mapSupabaseUserToAppUser(data.user);
      return {
        data: { user: appUser, session: data.session },
        error: null,
        success: true,
      };
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Failed to sign in. Please check your credentials.',
        success: false,
      };
    }
  }

  /**
   * Request Password Reset Email
   */
  async resetPassword(email: string): Promise<AuthResponse<null>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/?tab=reset-password`,
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
   * Update Password (for recovery or profile update)
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
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out notice:', err);
    }
  }

  /**
   * Subscribe to Auth State Changes
   */
  onAuthStateChange(
    callback: (user: AppUser | null, session: Session | null) => void
  ): () => void {
    // Check initial active session
    this.getSession().then((session) => {
      if (session?.user) {
        callback(mapSupabaseUserToAppUser(session.user), session);
      } else {
        callback(null, null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback(mapSupabaseUserToAppUser(session.user), session);
      } else {
        callback(null, null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Fetch User Profile from database
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await (supabase.from('user_profiles' as any) as any)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return null;
      }
      return data as UserProfile;
    } catch (err) {
      return null;
    }
  }

  /**
   * Update User Profile in database & auth metadata
   */
  async updateUserProfile(
    userId: string,
    updates: {
      displayName?: string;
      role?: string;
      institution?: string;
      photoURL?: string;
    }
  ): Promise<AuthResponse<AppUser>> {
    try {
      // 1. Update Supabase Auth user metadata
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: updates.displayName,
          display_name: updates.displayName,
          role: updates.role,
          institution: updates.institution,
          avatar_url: updates.photoURL,
        },
      });

      if (authError) {
        return { data: null, error: authError.message, success: false };
      }

      // 2. Sync to profiles / user_profiles table if accessible
      try {
        await (supabase.from('user_profiles' as any) as any).upsert({
          id: userId,
          display_name: updates.displayName,
          photo_url: updates.photoURL,
          role: updates.role,
          updated_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn('Profile table sync info:', dbErr);
      }

      const updatedAppUser = authData.user
        ? mapSupabaseUserToAppUser(authData.user)
        : null;

      return {
        data: updatedAppUser,
        error: null,
        success: true,
      };
    } catch (err: any) {
      return {
        data: null,
        error: err.message || 'Failed to update profile.',
        success: false,
      };
    }
  }
}

export const authService = new AuthService();


