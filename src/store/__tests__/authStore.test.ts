import { useAuthStore } from "@/store/authStore";
import type { AuthSession } from "@/types/app";

const mockProfile: AuthSession = {
  userId: "user-abc",
  role: "coach",
  academyId: "academy-xyz",
  fullName: "Thembi Sithole",
};

beforeEach(() => {
  useAuthStore.getState().clear();
});

describe("authStore", () => {
  it("starts with null session and profile", () => {
    const { session, profile } = useAuthStore.getState();
    expect(session).toBeNull();
    expect(profile).toBeNull();
  });

  it("starts with isLoading = false after clear", () => {
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("setProfile stores the profile", () => {
    useAuthStore.getState().setProfile(mockProfile);
    expect(useAuthStore.getState().profile).toEqual(mockProfile);
  });

  it("setProfile(null) clears the profile", () => {
    useAuthStore.getState().setProfile(mockProfile);
    useAuthStore.getState().setProfile(null);
    expect(useAuthStore.getState().profile).toBeNull();
  });

  it("setLoading updates isLoading flag", () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("clear resets session, profile, and isLoading", () => {
    useAuthStore.getState().setProfile(mockProfile);
    useAuthStore.getState().setLoading(true);
    useAuthStore.getState().clear();
    const { session, profile, isLoading } = useAuthStore.getState();
    expect(session).toBeNull();
    expect(profile).toBeNull();
    expect(isLoading).toBe(false);
  });

  it("supports all user roles", () => {
    const roles = ["admin", "coach", "player", "parent", "scout"] as const;
    roles.forEach((role) => {
      useAuthStore.getState().setProfile({ ...mockProfile, role });
      expect(useAuthStore.getState().profile?.role).toBe(role);
      useAuthStore.getState().clear();
    });
  });

  it("allows null academyId (pre-onboarding state)", () => {
    useAuthStore.getState().setProfile({ ...mockProfile, academyId: null });
    expect(useAuthStore.getState().profile?.academyId).toBeNull();
  });
});
