import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Fixture, MatchResult, MatchAppearance, PlayerRating } from '@/types/database';

export function useFixtures(teamId: string | undefined) {
  return useQuery({
    queryKey: ['fixtures', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fixtures')
        .select('*, match_results(*)')
        .eq('team_id', teamId!)
        .order('fixture_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFixture(fixtureId: string | undefined) {
  return useQuery({
    queryKey: ['fixture', fixtureId],
    enabled: !!fixtureId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fixtures')
        .select(`
          *,
          match_results(*),
          match_appearances(*, players(id, full_name, photo_url, position)),
          player_ratings(*, players(id, full_name))
        `)
        .eq('id', fixtureId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateFixture(teamId: string) {
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);

  return useMutation({
    mutationFn: async (payload: {
      opponent: string;
      venue?: string;
      fixture_date: string;
      is_home: boolean;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('fixtures')
        .insert({ ...payload, team_id: teamId, created_by: profile!.userId })
        .select()
        .single();
      if (error) throw error;
      return data as Fixture;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fixtures', teamId] }),
  });
}

export function useLogMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      fixture_id: string;
      team_score: number;
      opponent_score: number;
      match_notes?: string;
      appearances: { player_id: string; played: boolean }[];
      ratings: { player_id: string; rating: number; note?: string }[];
    }) => {
      const { data, error } = await supabase.functions.invoke('log-match', {
        body: payload,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['fixture', vars.fixture_id] });
      queryClient.invalidateQueries({ queryKey: ['fixtures'] });
    },
  });
}

export function useFixtureRatings(fixtureId: string | undefined) {
  return useQuery({
    queryKey: ['ratings', fixtureId],
    enabled: !!fixtureId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_ratings')
        .select('*, players(id, full_name, photo_url)')
        .eq('fixture_id', fixtureId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}
