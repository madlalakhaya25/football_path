import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tag } from '@/components/ui/Tag';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function ParentFixturesScreen() {
  const profile = useAuthStore((s) => s.profile);

  const { data: fixtures, isLoading, refetch } = useQuery({
    queryKey: ['parent-fixtures', profile?.userId],
    enabled: !!profile?.userId,
    queryFn: async () => {
      // Get team_id via linked child
      const { data: link } = await supabase
        .from('parent_player_links')
        .select('players(team_members(team_id))')
        .eq('parent_id', profile!.userId)
        .limit(1)
        .single();

      const teamId = (link as any)?.players?.team_members?.[0]?.team_id;
      if (!teamId) return [];

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
        <Text className="text-ink-secondary text-body mt-1">Team schedule & results</Text>
      </View>

      <FlatList
        data={fixtures ?? []}
        keyExtractor={(item: any) => item.id}
        contentContainerClassName="px-4 pb-8"
        showsVerticalScrollIndicator={false}
        onRefresh={() => { refetch(); }}
        refreshing={isLoading}
        renderItem={({ item: f }: { item: any }) => {
          const result = f.match_results?.[0];
          const isHome = f.is_home;
          return (
            <View className="bg-surface-1 border border-border rounded-card p-4 mb-3">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-ink-tertiary text-caption">
                  {new Date(f.fixture_date).toLocaleDateString('en-ZA', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </Text>
                <Tag
                  label={f.status === 'upcoming' ? 'Upcoming' : f.status === 'completed' ? 'Final' : f.status}
                  variant={f.status === 'upcoming' ? 'amber' : f.status === 'completed' ? 'green' : 'neutral'}
                />
              </View>
              <View className="flex-row items-center">
                <Text className={`flex-1 font-bold text-heading ${isHome ? 'text-green' : 'text-ink-primary'}`}>
                  {isHome ? 'GrowFit' : f.opponent}
                </Text>
                {result ? (
                  <Text className="text-ink-primary font-black text-title mx-4">
                    {isHome ? result.team_score : result.opponent_score}
                    {' – '}
                    {isHome ? result.opponent_score : result.team_score}
                  </Text>
                ) : (
                  <Text className="text-ink-tertiary mx-4">
                    {new Date(f.fixture_date).toLocaleTimeString('en-ZA', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                )}
                <Text className={`flex-1 font-bold text-heading text-right ${!isHome ? 'text-green' : 'text-ink-primary'}`}>
                  {isHome ? f.opponent : 'GrowFit'}
                </Text>
              </View>
              {f.venue && (
                <Text className="text-ink-tertiary text-caption mt-2">📍 {f.venue}</Text>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-4xl mb-4">📅</Text>
            <Text className="text-ink-secondary text-body text-center">
              {isLoading ? 'Loading...' : 'No fixtures yet.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
