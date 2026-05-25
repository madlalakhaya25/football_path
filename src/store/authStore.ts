import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { AuthSession } from '@/types/app';

interface AuthState {
  session: Session | null;
  profile: AuthSession | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: AuthSession | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ session: null, profile: null, isLoading: false }),
}));
