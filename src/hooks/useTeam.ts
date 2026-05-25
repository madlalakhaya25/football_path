import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Team, Player, TeamMember } from '@/types/database';

export function useMyTeam() {
  const profile = useAuthStore((s) => s.profile);

  return useQuery({
    queryKey: ['my-team', profile?.userId],
    enabled: !!profile?.userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('coach_id', profile!.userId)
        .eq('active', true)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as Team | null;
    },
  });
}

export function useSquad(teamId: string | undefined) {
  return useQuery({
    queryKey: ['squad', teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          player_id, active, joined_at,
          players (
            id, full_name, position, photo_url, date_of_birth, share_token,
            player_ratings ( rating, created_at, fixture_id )
          )
        `)
        .eq('team_id', teamId!)
        .eq('active', true)
        .order('joined_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);

  return useMutation({
    mutationFn: async (payload: { name: string; age_group?: string }) => {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          ...payload,
          academy_id: profile!.academyId,
          coach_id: profile!.userId,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Team;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-team'] }),
  });
}

export function useAddPlayerToTeam(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playerId: string) => {
      const { error } = await supabase
        .from('team_members')
        .insert({ team_id: teamId, player_id: playerId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['squad', teamId] }),
  });
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);

  return useMutation({
    mutationFn: async (payload: {
      full_name: string;
      position?: string;
      date_of_birth?: string;
      preferred_foot?: string;
      photo_url?: string;
    }) => {
      const { data, error } = await supabase
        .from('players')
        .insert({ ...payload, academy_id: profile!.academyId })
        .select()
        .single();
      if (error) throw error;
      return data as Player;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['academy-players'] }),
  });
}
