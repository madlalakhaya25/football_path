import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tag } from '@/components/ui/Tag';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

function FixtureCard({ fixture }: { fixture: any }) {
  const result = fixture.match_results?.[0];
  const isHome = fixture.is_home;

  return (
    <View className="bg-surface-1 border border-border rounded-card p-4 mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-ink-tertiary text-caption">
          {new Date(fixture.fixture_date).toLocaleDateString('en-ZA', {
            weekday: 'short', day: 'numeric', month: 'short',
          })}
        </Text>
        <Tag
          label={fixture.status === 'upcoming' ? 'Upcoming' : fixture.status === 'completed' ? 'Final' : fixture.status}
          variant={fixture.status === 'upcoming' ? 'amber' : fixture.status === 'completed' ? 'green' : 'neutral'}
        />
      </View>
      <View className="flex-row items-center">
        <Text className={`flex-1 font-bold text-heading ${isHome ? 'text-green' : 'text-ink-primary'}`}>
          {isHome ? 'GrowFit' : fixture.opponent}
        </Text>
        {result ? (
          <Text className="text-ink-primary font-black text-title mx-4">
            {isHome ? result.team_score : result.opponent_score}
            {' – '}
            {isHome ? result.opponent_score : result.team_score}
          </Text>
        ) : (
          <Text className="text-ink-tertiary text-body mx-4">
            {new Date(fixture.fixture_date).toLocaleTimeString('en-ZA', {
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        )}
        <Text className={`flex-1 font-bold text-heading text-right ${!isHome ? 'text-green' : 'text-ink-primary'}`}>
          {isHome ? fixture.opponent : 'GrowFit'}
        </Text>
      </View>
      {fixture.venue && (
        <Text className="text-ink-tertiary text-caption mt-2">📍 {fixture.venue}</Text>
      )}
    </View>
  );
}

export default function PlayerFixturesScreen() {
  const profile = useAuthStore((s) => s.profile);

  const { data: fixtures, isLoading, refetch } = useQuery({
    queryKey: ['player-fixtures', profile?.userId],
    enabled: !!profile?.userId,
    queryFn: async () => {
      // Get player's team via profile_id
      const { data: player } = await supabase
        .from('players')
        .select('id, team_members(team_id)')
        .eq('profile_id', profile!.userId)
        .single();

      if (!player?.team_members?.[0]?.team_id) return [];

      const teamId = player.team_members[0].team_id;
      const { data, error } = await supabase
        .from('fixtures')
        .select('*, match_results(*)')
        .eq('team_id', teamId)
        .order('fixture_date', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-pitch" edges={['top']}>
      <View className="px-4 pt-6 pb-4">
        <Text className="text-ink-primary text-hero font-black">Fixtures</Text>
        <Text className="text-ink-secondary text-body mt-1">Your team's schedule & results</Text>
      </View>

      <FlatList
        data={fixtures ?? []}
        keyExtractor={(item: any) => item.id}
        contentContainerClassName="px-4 pb-8"
        showsVerticalScrollIndicator={false}
        onRefresh={() => { refetch(); }}
        refreshing={isLoading}
        renderItem={({ item }) => <FixtureCard fixture={item} />}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-4xl mb-4">📅</Text>
            <Text className="text-ink-secondary text-body text-center">
              {isLoading ? 'Loading fixtures...' : 'No fixtures yet.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
