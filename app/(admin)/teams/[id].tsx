import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function AdminTeamDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAgeGroup, setEditAgeGroup] = useState('');

  const { data: team, isLoading } = useQuery({
    queryKey: ['admin-team-detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          profiles(full_name),
          team_members(
            player_id,
            players(id, full_name, photo_url, position, player_ratings(rating))
          )
        `)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const updateTeam = useMutation({
    mutationFn: async ({ name, age_group }: { name: string; age_group: string }) => {
      const { error } = await supabase.from('teams').update({ name, age_group: age_group || null }).eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      setEditing(false);
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const deleteTeam = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('teams').update({ active: false }).eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      router.back();
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const confirmDelete = () => {
    Alert.alert('Delete team', `Delete "${team?.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTeam.mutate() },
    ]);
  };

  if (isLoading || !team) {
    return (
      <SafeAreaView className="flex-1 bg-pitch items-center justify-center">
        <Text className="text-ink-secondary">Loading...</Text>
      </SafeAreaView>
    );
  }

  const members: any[] = team.team_members ?? [];

  return (
    <SafeAreaView className="flex-1 bg-pitch" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity className="px-4 pt-4 mb-4" onPress={() => router.back()}>
          <Text className="text-ink-secondary">← Teams</Text>
        </TouchableOpacity>

        {/* Team header */}
        <View className="mx-4 mb-4 bg-surface-2 rounded-card p-5 border border-border">
          {editing ? (
            <View className="mb-4 gap-3">
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Team name"
                placeholderTextColor="#666"
                className="bg-surface-1 border border-border rounded-card px-4 py-3 text-ink-primary text-body"
              />
              <TextInput
                value={editAgeGroup}
                onChangeText={setEditAgeGroup}
                placeholder="Age group (e.g. U17)"
                placeholderTextColor="#666"
                className="bg-surface-1 border border-border rounded-card px-4 py-3 text-ink-primary text-body"
              />
              <View className="flex-row gap-2">
                <Button
                  label="Save"
                  loading={updateTeam.isPending}
                  onPress={() => updateTeam.mutate({ name: editName, age_group: editAgeGroup })}
                />
                <Button label="Cancel" variant="ghost" onPress={() => setEditing(false)} />
              </View>
            </View>
          ) : (
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-ink-tertiary text-caption uppercase tracking-wide">Team</Text>
                <Text className="text-ink-primary text-hero font-black mt-1">{team.name}</Text>
                {team.age_group && (
                  <Text className="text-green text-caption font-semibold mt-0.5">{team.age_group}</Text>
                )}
                {team.profiles?.full_name && (
                  <Text className="text-ink-secondary text-caption mt-1">
                    Coach: {team.profiles.full_name}
                  </Text>
                )}
              </View>
              <View className="bg-green-bg border border-green-border rounded-card px-3 py-2 items-center">
                <Text className="text-ink-tertiary text-caption">Invite code</Text>
                <Text className="text-green font-black text-title tracking-widest">{team.invite_code}</Text>
              </View>
            </View>
          )}

          {!editing && (
            <View className="flex-row gap-2 mb-4">
              <TouchableOpacity
                onPress={() => { setEditName(team.name); setEditAgeGroup(team.age_group ?? ''); setEditing(true); }}
                className="flex-1 bg-surface-1 border border-border rounded-card py-2 items-center"
              >
                <Text className="text-ink-primary text-caption font-semibold">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                className="flex-1 bg-red-bg border border-red-border rounded-card py-2 items-center"
              >
                <Text className="text-red text-caption font-semibold">Delete Team</Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="flex-row border-t border-border pt-4 gap-4">
            <View className="flex-1 items-center">
              <Text className="text-green font-black text-title">{members.length}</Text>
              <Text className="text-ink-secondary text-caption">Players</Text>
            </View>
          </View>
        </View>

        {/* Squad list */}
        <View className="px-4 mb-8">
          <Text className="text-ink-primary text-heading font-bold mb-3">Squad</Text>
          {members.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-4xl mb-3">👥</Text>
              <Text className="text-ink-secondary text-body text-center">
                No players yet. Share the invite code with players to join.
              </Text>
            </View>
          ) : (
            members.map(({ players: player }: any) => {
              if (!player) return null;
              const ratings: any[] = player.player_ratings ?? [];
              const avg = ratings.length > 0
                ? (ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length).toFixed(1)
                : null;
              return (
                <TouchableOpacity
                  key={player.id}
                  onPress={() => router.push(`/(admin)/players/${player.id}`)}
                  activeOpacity={0.8}
                  className="flex-row items-center bg-surface-1 border border-border rounded-card p-4 mb-3"
                >
                  <Avatar uri={player.photo_url} name={player.full_name} size="md" />
                  <View className="flex-1 ml-3">
                    <Text className="text-ink-primary font-bold text-body">{player.full_name}</Text>
                    {player.position && (
                      <Tag
                        label={player.position.charAt(0).toUpperCase() + player.position.slice(1)}
                        variant="neutral"
                      />
                    )}
                  </View>
                  {avg && <Text className="text-amber font-bold">★ {avg}</Text>}
                  <Text className="text-ink-tertiary ml-2">›</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
