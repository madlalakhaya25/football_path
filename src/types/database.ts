export type UserRole = 'admin' | 'coach' | 'player' | 'parent';

export type FixtureStatus = 'upcoming' | 'completed' | 'cancelled' | 'postponed';

export type Position =
  | 'goalkeeper'
  | 'defender'
  | 'midfielder'
  | 'winger'
  | 'striker';

export type Foot = 'left' | 'right' | 'both';

// ─── Database Row Types ────────────────────────────────────────────────────────

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

export interface TeamMember {
  team_id: string;
  player_id: string;
  joined_at: string;
  active: boolean;
}

export interface ParentPlayerLink {
  parent_id: string;
  player_id: string;
  linked_at: string;
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

export interface MatchResult {
  id: string;
  fixture_id: string;
  team_score: number;
  opponent_score: number;
  match_notes: string | null;
  logged_by: string | null;
  logged_at: string;
}

export interface MatchAppearance {
  id: string;
  fixture_id: string;
  player_id: string;
  played: boolean;
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

export interface Announcement {
  id: string;
  team_id: string;
  coach_id: string;
  title: string;
  body: string;
  created_at: string;
}

// ─── Joined/Enriched Types ─────────────────────────────────────────────────────

export interface PlayerWithTeam extends Player {
  team?: Team;
  latest_rating?: PlayerRating;
  rating_average?: number;
  appearances_count?: number;
}

export interface FixtureWithResult extends Fixture {
  result?: MatchResult;
  appearances?: MatchAppearance[];
}

export interface PlayerWithRatings extends Player {
  ratings: PlayerRating[];
  fixtures: FixtureWithResult[];
}
