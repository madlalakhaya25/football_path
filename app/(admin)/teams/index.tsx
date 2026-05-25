import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { showAlert } from '@/lib/alert';
import { AGE_GROUPS } from '@/types/app';

export default function TeamsScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [ageGroup, setAgeGroup] = useState('');

  const { data: teams, isLoading, refetch } = useQuery({
    queryKey: ['admin-teams', profile?.academyId],
    enabled: !!profile?.academyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*, profiles(full_name)')
        .eq('academy_id', profile!.academyId!)
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const createTeam = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .insert({ name: teamName, age_group: ageGroup || null, academy_id: profile!.academyId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      setShowCreate(false);
      setTeamName('');
      setAgeGroup('');
    },
    onError: (e: any) => showAlert('Error', e.message),
  });

  return (
    <Screen padded={false}>
      <View className="px-4 pt-6 pb-4 flex-row items-center justify-between">
        <Text className="text-ink-primary text-hero font-black">Teams</Text>
        <Button label="+ New Team" size="sm" fullWidth={false} onPress={() => setShowCreate(true)} />
      </View>

      {/* Create form */}
      {showCreate && (
        <View className="mx-4 mb-4 bg-surface-2 border border-green-border rounded-card p-4">
          <Text className="text-green font-bold text-body mb-3">New Team</Text>
          <Input
            label="Team Name"
            placeholder="e.g. GrowFit U15 A"
            value={teamName}
            onChangeText={setTeamName}
          />
          <Input
            label="Age Group"
            placeholder="e.g. U15"
            value={ageGroup}
            onChangeText={setAgeGroup}
          />
          <View className="flex-row gap-3">
            <Button label="Create" size="md" onPress={() => createTeam.mutate()} loading={createTeam.isPending} />
            <Button label="Cancel" size="md" variant="ghost" onPress={() => setShowCreate(false)} />
          </View>
        </View>
      )}

      <FlatList
        data={teams ?? []}
        keyExtractor={(t: any) => t.id}
        contentContainerClassName="px-4 pb-8"
        onRefresh={() => { refetch(); }}
        refreshing={isLoading}
        renderItem={({ item: team }: { item: any }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(admin)/teams/${team.id}`)}
            activeOpacity={0.8}
            className="bg-surface-1 border border-border rounded-card p-4 mb-3"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-ink-primary font-bold text-body">{team.name}</Text>
                <Text className="text-green text-caption mt-0.5">{team.age_group ?? 'No age group'}</Text>
                {team.profiles?.full_name && (
                  <Text className="text-ink-tertiary text-caption">Coach: {team.profiles.full_name}</Text>
                )}
              </View>
              <View className="items-end">
                <View className="bg-green-bg border border-green-border rounded-card px-2 py-1">
                  <Text className="text-green font-bold text-caption tracking-widest">{team.invite_code}</Text>
                </View>
                <Text className="text-ink-tertiary mt-1">›</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-4xl mb-3">🏟️</Text>
            <Text className="text-ink-secondary text-body text-center">No teams yet.</Text>
          </View>
        }
      />
    </Screen>
  );
}
