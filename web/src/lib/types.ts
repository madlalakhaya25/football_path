/**
 * Domain types — ported from the Expo app (framework-agnostic).
 * These mirror the Supabase schema and are shared across screens.
 */

export type UserRole = "admin" | "coach" | "player" | "parent";

export type FixtureStatus = "upcoming" | "completed" | "cancelled" | "postponed";

export type Position =
  | "goalkeeper"
  | "defender"
  | "midfielder"
  | "winger"
  | "striker";

export type Foot = "left" | "right" | "both";

export interface Academy {
  id: string;
  name: string;
  location: string | null;
  province: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  academy_id: string | null;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Player {
  id: string;
  profile_id: string | null;
  academy_id: string;
  full_name: string;
  date_of_birth: string | null;
  position: Position | null;
  secondary_pos: Position | null;
  preferred_foot: Foot | null;
  photo_url: string | null;
  share_token: string;
  active: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  academy_id: string;
  name: string;
  age_group: string | null;
  coach_id: string | null;
  invite_code: string;
  active: boolean;
  created_at: string;
}

export interface Fixture {
  id: string;
  team_id: string;
  opponent: string;
  venue: string | null;
  fixture_date: string;
  is_home: boolean;
  status: FixtureStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PlayerRating {
  id: string;
  fixture_id: string;
  player_id: string;
  coach_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  note: string | null;
  created_at: string;
}

export const POSITIONS: { value: Position; label: string }[] = [
  { value: "goalkeeper", label: "Goalkeeper" },
  { value: "defender", label: "Defender" },
  { value: "midfielder", label: "Midfielder" },
  { value: "winger", label: "Winger" },
  { value: "striker", label: "Striker" },
];

export const FEET: { value: Foot; label: string }[] = [
  { value: "right", label: "Right" },
  { value: "left", label: "Left" },
  { value: "both", label: "Both" },
];

export const AGE_GROUPS = [
  "U10",
  "U12",
  "U13",
  "U15",
  "U17",
  "U19",
  "U21",
  "Senior",
];
