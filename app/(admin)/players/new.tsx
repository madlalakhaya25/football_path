import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { createPlayerSchema, type CreatePlayerInput } from '@/lib/validation';
import { POSITIONS } from '@/types/app';

export default function NewPlayerScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const { data: teams } = useQuery({
    queryKey: ['teams-for-add', profile?.academyId],
    enabled: !!profile?.academyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('teams')
        .select('id, name, age_group')
        .eq('academy_id', profile!.academyId!)
        .eq('active', true);
      return data ?? [];
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePlayerInput>({
    resolver: zodResolver(createPlayerSchema),
    defaultValues: { full_name: '' },
  });

  const createPlayer = useMutation({
    mutationFn: async (data: CreatePlayerInput) => {
      // Create player
      const { data: player, error } = await supabase
        .from('players')
        .insert({ ...data, academy_id: profile!.academyId! })
        .select()
        .single();
      if (error) throw error;

      // Assign to team if selected
      if (selectedTeam && player) {
        await supabase.from('team_members').insert({
          team_id: selectedTeam,
          player_id: player.id,
        });
      }
      return player;
    },
    onSuccess: (player: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-players'] });
      queryClient.invalidateQueries({ queryKey: ['squad'] });
      Alert.alert(
        'Player added!',
        `${player.full_name}'s passport code is: ${player.share_token}`,
        [{ text: 'Done', onPress: () => router.back() }]
      );
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  return (
    <Screen scroll>
      <View className="flex-row items-center mt-2 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-ink-secondary">← Back</Text>
        </TouchableOpacity>
        <Text className="text-ink-primary text-title font-bold">Add Player</Text>
      </View>

      <Controller
        control={control}
        name="full_name"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Full Name *"
            placeholder="Player's full name"
            value={value}
            onChangeText={onChange}
            error={errors.full_name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="date_of_birth"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Date of Birth"
            placeholder="YYYY-MM-DD (e.g. 2010-03-15)"
            value={value ?? ''}
            onChangeText={onChange}
            error={errors.date_of_birth?.message}
          />
        )}
      />

      {/* Position picker */}
      <Text className="text-ink-secondary text-caption font-medium mb-2 uppercase tracking-wide">
        Position
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {POSITIONS.map((p) => (
          <Controller
            key={p.value}
            control={control}
            name="position"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                onPress={() => onChange(p.value)}
                className={`px-3 py-2 rounded-chip border
                  ${value === p.value
                    ? 'bg-green-bg border-green-border'
                    : 'bg-surface-1 border-border'}`}
              >
                <Text className={`text-caption font-semibold
                  ${value === p.value ? 'text-green' : 'text-ink-secondary'}`}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        ))}
      </View>

      {/* Foot */}
      <Text className="text-ink-secondary text-caption font-medium mb-2 uppercase tracking-wide">
        Preferred Foot
      </Text>
      <View className="flex-row gap-2 mb-4">
        {(['right', 'left', 'both'] as const).map((foot) => (
          <Controller
            key={foot}
            control={control}
            name="preferred_foot"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                onPress={() => onChange(foot)}
                className={`px-4 py-2 rounded-chip border
                  ${value === foot ? 'bg-green-bg border-green-border' : 'bg-surface-1 border-border'}`}
              >
                <Text className={`text-caption font-semibold capitalize
                  ${value === foot ? 'text-green' : 'text-ink-secondary'}`}>
                  {foot}
                </Text>
              </TouchableOpacity>
            )}
          />
        ))}
      </View>

      {/* Assign to team */}
      {(teams?.length ?? 0) > 0 && (
        <>
          <Text className="text-ink-secondary text-caption font-medium mb-2 uppercase tracking-wide">
            Assign to Team (optional)
          </Text>
          <View className="gap-2 mb-4">
            <TouchableOpacity
              onPress={() => setSelectedTeam(null)}
              className={`px-4 py-3 rounded-card border
                ${!selectedTeam ? 'bg-surface-3 border-green-border' : 'bg-surface-1 border-border'}`}
            >
              <Text className={`text-body ${!selectedTeam ? 'text-green' : 'text-ink-secondary'}`}>
                No team (add later)
              </Text>
            </TouchableOpacity>
            {teams!.map((t: any) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setSelectedTeam(t.id)}
                className={`px-4 py-3 rounded-card border
                  ${selectedTeam === t.id ? 'bg-green-bg border-green-border' : 'bg-surface-1 border-border'}`}
              >
                <Text className={`text-body ${selectedTeam === t.id ? 'text-green' : 'text-ink-primary'}`}>
                  {t.name}{t.age_group ? ` · ${t.age_group}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <View className="mt-4">
        <Button
          label="Add Player"
          loading={createPlayer.isPending}
          onPress={handleSubmit((data) => createPlayer.mutate(data))}
        />
      </View>
    </Screen>
  );
}
