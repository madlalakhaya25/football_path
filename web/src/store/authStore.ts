"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      clear: () => set({ profile: null }),
    }),
    { name: "gf-auth" }
  )
);
