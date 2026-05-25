import type { Position } from './database';

export interface AuthSession {
  userId: string;
  role: import('./database').UserRole;
  academyId: string | null;
  fullName: string;
}

export interface PassportPublicData {
  share_token: string;
  full_name: string;
  position: Position | null;
  age: number | null;
  team_name: string | null;
  academy_name: string | null;
  photo_url: string | null;
  appearances_count: number;
  rating_average: number | null;
  recent_ratings: Array<{
    rating: number;
    note: string | null;
    fixture_opponent: string;
    fixture_date: string;
  }>;
}

export const POSITIONS: { value: Position; label: string }[] = [
  { value: 'goalkeeper', label: 'Goalkeeper' },
  { value: 'defender', label: 'Defender' },
  { value: 'midfielder', label: 'Midfielder' },
  { value: 'winger', label: 'Winger' },
  { value: 'striker', label: 'Striker' },
];

export const FEET: { value: import('./database').Foot; label: string }[] = [
  { value: 'right', label: 'Right' },
  { value: 'left', label: 'Left' },
  { value: 'both', label: 'Both' },
];

export const AGE_GROUPS = ['U10', 'U12', 'U13', 'U15', 'U17', 'U19', 'U21', 'Senior'];

export const PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Free State',
  'Northern Cape',
];
