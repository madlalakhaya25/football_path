import { useAuthStore } from "@/store/authStore";
import type { AuthProfile } from "@/store/authStore";

const profile: AuthProfile = {
  userId: "user-123",
  role: "coach",
  academyId: "academy-456",
  fullName: "Thabo Nkosi",
};

beforeEach(() => {
  useAuthStore.getState().clear();
});

describe("authStore", () => {
  it("starts with no profile", () => {
    expect(useAuthStore.getState().profile).toBeNull();
  });

  it("setProfile stores the profile", () => {
    useAuthStore.getState().setProfile(profile);
    expect(useAuthStore.getState().profile).toEqual(profile);
  });

  it("clear removes the profile", () => {
    useAuthStore.getState().setProfile(profile);
    useAuthStore.getState().clear();
    expect(useAuthStore.getState().profile).toBeNull();
  });

  it("setProfile with null clears the profile", () => {
    useAuthStore.getState().setProfile(profile);
    useAuthStore.getState().setProfile(null);
    expect(useAuthStore.getState().profile).toBeNull();
  });

  it("stores all profile fields correctly", () => {
    useAuthStore.getState().setProfile(profile);
    const stored = useAuthStore.getState().profile!;
    expect(stored.userId).toBe("user-123");
    expect(stored.role).toBe("coach");
    expect(stored.academyId).toBe("academy-456");
    expect(stored.fullName).toBe("Thabo Nkosi");
  });

  it("handles a null academyId", () => {
    const noAcademy: AuthProfile = { ...profile, academyId: null };
    useAuthStore.getState().setProfile(noAcademy);
    expect(useAuthStore.getState().profile?.academyId).toBeNull();
  });
});
