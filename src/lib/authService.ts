// src/lib/authService.ts
import { authService, AppUser, AuthResponse } from '../services/auth.service.ts';

export type { AppUser, AuthResponse };
export { authService };

export async function logoutUser(): Promise<void> {
  await authService.signOut();
}

export function subscribeToAuth(callback: (user: AppUser | null) => void): () => void {
  return authService.onAuthStateChange((user) => callback(user));
}

