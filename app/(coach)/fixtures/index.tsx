import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';
import { useMyTeam } from '@/hooks/useTeam';
import { useFixtures } from '@/hooks/useFixtures';

type FilterTab = 'all' | 'upcoming' | 'completed';

function FixtureCard({ fixture, onPress }: { fixture: any; onPress: () => void }) {
  const result = fixture.match_results?.[0];
  const statusVariant =
    fixture.status === 'upcoming' ? 'amber' :
    fixture.status === 'completed' ? 'green' : 'neutral';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-surface-1 border border-border rounded-card p-4 mb-3"
    >
      {/* Date + Status */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-ink-tertiary text-caption">
          {new Date(fixture.fixture_date).toLocaleDateString('en-ZA', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </Text>
        <Tag
          label={fixture.status === 'upcoming' ? 'Upcoming' : fixture.status === 'completed' ? 'Final' : fixture.status}
          variant={statusVariant}
        />
      </View>

      {/* Score row */}
      <View className="flex-row items-center">
        {/* Home team */}
        <View className="flex-1">
          <Text className={`font-bold text-heading ${fixture.is_home ? 'text-green' : 'text-ink-primary'}`}>
            {fixture.is_home ? 'GrowFit' : fixture.opponent}
          </Text>
          <Text className="text-ink-tertiary text-caption mt-0.5">
            {fixture.is_home ? 'Home' : 'Away'}
          </Text>
        </View>

        {/* Score */}
        <View className="items-center mx-4">
          {result ? (
            <Text className="text-ink-primary font-black text-title">
              {fixture.is_home ? result.team_score : result.opponent_score}
              {' – '}
              {fixture.is_home ? result.opponent_score : result.team_score}
            </Text>
          ) : (
            <Text className="text-ink-tertiary text-body font-semibold">
              {new Date(fixture.fixture_date).toLocaleTimeString('en-ZA', {
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          )}
        </View>

        {/* Away team */}
        <View className="flex-1 items-end">
          <Text className={`font-bold text-heading ${!fixture.is_home ? 'text-green' : 'text-ink-primary'}`}>
            {fixture.is_home ? fixture.opponent : 'GrowFit'}
          </Text>
          <Text className="text-ink-tertiary text-caption mt-0.5">
            {fixture.is_home ? 'Away' : 'Home'}
          </Text>
        </View>
      </View>

      {fixture.venue && (
        <Text className="text-ink-tertiary text-caption mt-2">📍 {fixture.venue}</Text>
      )}

      {/* Action hint for upcoming */}
      {fixture.status === 'upcoming' && (
        <View className="mt-3 pt-3 border-t border-border flex-row justify-end">
          <Text className="text-green text-caption font-semibold">Log Result →</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function FixturesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>('all');
  const { data: team } = useMyTeam();
  const { data: fixtures, isLoading, refetch } = useFixtures(team?.id);

  const filtered = (fixtures ?? []).filter((f: any) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return f.status === 'upcoming';
    if (filter === 'completed') return f.status === 'completed';
    return true;
  });

  return (
    <Screen padded={false}>
      {/* Header */}
      <View className="px-4 pt-4 pb-4 flex-row items-center justify-between">
        <Text className="text-ink-primary text-hero font-black">Fixtures</Text>
        <Button
          label="+ Add"
          variant="outline"
          size="sm"
          fullWidth={false}
          onPress={() => router.push('/(coach)/fixtures/new')}
        />
      </View>

      {/* Filter tabs */}
      <View className="flex-row px-4 mb-4 gap-2">
        {(['all', 'upcoming', 'completed'] as FilterTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab)}
            className={`px-4 py-2 rounded-chip border
              ${filter === tab
                ? 'bg-green-bg border-green-border'
                : 'bg-surface-1 border-border'}`}
          >
            <Text className={`text-caption font-semibold capitalize
              ${filter === tab ? 'text-green' : 'text-ink-secondary'}`}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item.id}
        contentContainerClassName="px-4 pb-8"
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <FixtureCard
            fixture={item}
            onPress={() => router.push(`/(coach)/fixtures/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-4xl mb-4">📅</Text>
            <Text className="text-ink-secondary text-body text-center">
              {isLoading ? 'Loading fixtures...' : 'No fixtures yet.\nTap + Add to create one.'}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
