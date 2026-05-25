import {
  loginSchema,
  otpSchema,
  createPlayerSchema,
  createTeamSchema,
  createFixtureSchema,
  playerRatingSchema,
  linkChildSchema,
} from "@/lib/validation";

describe("loginSchema", () => {
  it("accepts a valid 10-digit number starting with 0", () => {
    expect(loginSchema.safeParse({ phone: "0712345678" }).success).toBe(true);
  });

  it("accepts a +27 international format", () => {
    expect(loginSchema.safeParse({ phone: "+27712345678" }).success).toBe(true);
  });

  it("rejects a landline (starts with 01)", () => {
    expect(loginSchema.safeParse({ phone: "0112345678" }).success).toBe(false);
  });

  it("rejects a number that is too short", () => {
    expect(loginSchema.safeParse({ phone: "071234" }).success).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(loginSchema.safeParse({ phone: "" }).success).toBe(false);
  });
});

describe("otpSchema", () => {
  it("accepts exactly 6 digits", () => {
    expect(otpSchema.safeParse({ token: "123456" }).success).toBe(true);
  });

  it("rejects 5 digits", () => {
    expect(otpSchema.safeParse({ token: "12345" }).success).toBe(false);
  });

  it("rejects 7 digits", () => {
    expect(otpSchema.safeParse({ token: "1234567" }).success).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(otpSchema.safeParse({ token: "" }).success).toBe(false);
  });
});

describe("createPlayerSchema", () => {
  it("accepts valid full player data", () => {
    const result = createPlayerSchema.safeParse({
      full_name: "Sipho Dlamini",
      position: "striker",
      preferred_foot: "right",
      date_of_birth: "2008-03-15",
    });
    expect(result.success).toBe(true);
  });

  it("accepts with only required field", () => {
    expect(
      createPlayerSchema.safeParse({ full_name: "Jo" }).success
    ).toBe(true);
  });

  it("rejects a name that is too short", () => {
    expect(
      createPlayerSchema.safeParse({ full_name: "J" }).success
    ).toBe(false);
  });

  it("rejects an invalid position value", () => {
    expect(
      createPlayerSchema.safeParse({ full_name: "Sam", position: "coach" }).success
    ).toBe(false);
  });

  it("rejects an invalid preferred_foot value", () => {
    expect(
      createPlayerSchema.safeParse({ full_name: "Sam", preferred_foot: "center" }).success
    ).toBe(false);
  });
});

describe("createTeamSchema", () => {
  it("accepts valid team data", () => {
    expect(
      createTeamSchema.safeParse({ name: "GrowFit U17", age_group: "U17" }).success
    ).toBe(true);
  });

  it("accepts without optional age_group", () => {
    expect(createTeamSchema.safeParse({ name: "GrowFit U17" }).success).toBe(true);
  });

  it("rejects a name that is too short", () => {
    expect(createTeamSchema.safeParse({ name: "A" }).success).toBe(false);
  });
});

describe("createFixtureSchema", () => {
  it("accepts a valid fixture", () => {
    expect(
      createFixtureSchema.safeParse({
        opponent: "Sundowns Academy",
        fixture_date: "2026-06-01T10:00",
        is_home: true,
      }).success
    ).toBe(true);
  });

  it("rejects when opponent is too short", () => {
    expect(
      createFixtureSchema.safeParse({
        opponent: "X",
        fixture_date: "2026-06-01T10:00",
        is_home: false,
      }).success
    ).toBe(false);
  });

  it("rejects when fixture_date is empty", () => {
    expect(
      createFixtureSchema.safeParse({
        opponent: "Sundowns Academy",
        fixture_date: "",
        is_home: true,
      }).success
    ).toBe(false);
  });
});

describe("playerRatingSchema", () => {
  it("accepts ratings 1–5", () => {
    [1, 2, 3, 4, 5].forEach((rating) => {
      expect(playerRatingSchema.safeParse({ rating }).success).toBe(true);
    });
  });

  it("rejects 0 and 6", () => {
    expect(playerRatingSchema.safeParse({ rating: 0 }).success).toBe(false);
    expect(playerRatingSchema.safeParse({ rating: 6 }).success).toBe(false);
  });

  it("rejects a non-integer", () => {
    expect(playerRatingSchema.safeParse({ rating: 3.5 }).success).toBe(false);
  });

  it("accepts an optional note under 200 chars", () => {
    expect(
      playerRatingSchema.safeParse({ rating: 4, note: "Great work" }).success
    ).toBe(true);
  });

  it("rejects a note over 200 chars", () => {
    expect(
      playerRatingSchema.safeParse({ rating: 4, note: "x".repeat(201) }).success
    ).toBe(false);
  });
});

describe("linkChildSchema", () => {
  it("accepts a valid share token", () => {
    expect(
      linkChildSchema.safeParse({ share_token: "a1b2c3d4e5" }).success
    ).toBe(true);
  });

  it("rejects a token under 6 characters", () => {
    expect(linkChildSchema.safeParse({ share_token: "abc" }).success).toBe(false);
  });
});
