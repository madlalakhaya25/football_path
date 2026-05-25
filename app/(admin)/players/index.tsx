import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Tag } from '@/components/ui/Tag';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function PlayersScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const [search, setSearch] = useState('');

  const { data: players, isLoading, refetch } = useQuery({
    queryKey: ['admin-players', profile?.academyId],
    enabled: !!profile?.academyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select(`*, team_members(teams(name, age_group)), player_ratings(rating)`)
        .eq('academy_id', profile!.academyId!)
        .eq('active', true)
        .order('full_name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (players ?? []).filter((p: any) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Screen padded={false}>
      <View className="px-4 pt-6 pb-4 flex-row items-center justify-between">
        <Text className="text-ink-primary text-hero font-black">Players</Text>
        <Button label="+ Add" size="sm" fullWidth={false} onPress={() => router.push('/(admin)/players/new')} />
      </View>

      <View className="px-4 mb-4">
        <View className="flex-row items-center bg-surface-3 border border-border rounded-card px-3">
          <Text className="text-ink-tertiary mr-2">🔍</Text>
          <TextInput
            placeholder="Search..."
            placeholderTextColor="#5A5A5A"
            className="flex-1 py-3 text-ink-primary text-body"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p: any) => p.id}
        contentContainerClassName="px-4 pb-8"
        onRefresh={() => { refetch(); }}
        refreshing={isLoading}
        renderItem={({ item: player }: { item: any }) => {
          const team = player.team_members?.[0]?.teams;
          const ratings: any[] = player.player_ratings ?? [];
          const avg = ratings.length > 0
            ? (ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length).toFixed(1)
            : null;
          return (
            <TouchableOpacity
              onPress={() => router.push(`/(admin)/players/${player.id}`)}
              activeOpacity={0.8}
              className="flex-row items-center bg-surface-1 border border-border rounded-card p-4 mb-3"
            >
              <Avatar uri={player.photo_url} name={player.full_name} size="md" />
              <View className="flex-1 ml-3">
                <Text className="text-ink-primary font-bold text-body">{player.full_name}</Text>
                <View className="flex-row gap-2 mt-1">
                  {player.position && (
                    <Tag label={player.position.charAt(0).toUpperCase() + player.position.slice(1)} variant="neutral" />
                  )}
                  {team && <Tag label={team.name} variant="green" />}
                </View>
              </View>
              <View className="items-end">
                {avg && <Text className="text-amber font-bold">★ {avg}</Text>}
                <Text className="text-ink-tertiary text-caption">{ratings.length} rated</Text>
              </View>
              <Text className="text-ink-tertiary ml-2">›</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-4xl mb-3">👤</Text>
            <Text className="text-ink-secondary text-body text-center">
              {isLoading ? 'Loading players...' : 'No players yet. Tap + Add to create one.'}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
