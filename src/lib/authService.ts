// src/lib/authService.ts
import { authService, AppUser, DEFAULT_CLINICIAN, getStoredGuestUser, setStoredGuestUser } from '../services/auth.service.ts';

export type { AppUser };
export { DEFAULT_CLINICIAN, getStoredGuestUser, setStoredGuestUser };

export async function loginWithGoogleOrFallback(): Promise<AppUser | null> {
  const result = await authService.signInWithGoogle();
  if (!result.success) {
    console.warn('Fallback to local guest clinician');
  }
  return authService.getCurrentUser();
}

export async function logoutUser(): Promise<void> {
  await authService.signOut();
}

export function subscribeToAuth(callback: (user: AppUser | null) => void): () => void {
  return authService.onAuthStateChange((user) => callback(user));
}
