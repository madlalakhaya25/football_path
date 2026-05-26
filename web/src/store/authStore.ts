"use client";
import { create } from "zustand";
import type { UserRole } from "@/lib/types";

export interface AuthProfile {
  userId: string;
  role: UserRole;
  academyId: string | null;
  fullName: string;
}

interface AuthState {
  profile: AuthProfile | null;
  setProfile: (profile: AuthProfile | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  clear: () => set({ profile: null }),
}));
