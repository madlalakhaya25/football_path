import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { StarRow } from '@/components/ui/StarRow';
import { useFixture } from '@/hooks/useFixtures';
import { useMyTeam } from '@/hooks/useTeam';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import * as Clipboard from 'expo-clipboard';

export default function FixtureDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: fixture, isLoading } = useFixture(id);
  const { data: team } = useMyTeam();
  const teamName = team?.name ?? 'Home';
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState(false);

  const cancelFixture = () => {
    Alert.alert('Cancel fixture', 'Mark this fixture as cancelled?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel fixture', style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          const { error } = await supabase
            .from('fixtures')
            .update({ status: 'cancelled' })
            .eq('id', id!);
          setCancelling(false);
          if (error) { Alert.alert('Error', error.message); return; }
          queryClient.invalidateQueries({ queryKey: ['fixture', id] });
          queryClient.invalidateQueries({ queryKey: ['fixtures'] });
        },
      },
    ]);
  };

  if (isLoading || !fixture) {
    return (
      <SafeAreaView className="flex-1 bg-pitch items-center justify-center">
        <Text className="text-ink-secondary">Loading...</Text>
      </SafeAreaView>
    );
  }

  const result = fixture.match_results?.[0];
  const appearances: any[] = fixture.match_appearances ?? [];
  const ratings: any[] = fixture.player_ratings ?? [];
  const isHome = fixture.is_home;
  const isUpcoming = fixture.status === 'upcoming';

  const shareFixture = async () => {
    const url = `https://footballpath.app/fixture/${fixture.id}`;
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(url);
      window.alert('Fixture link copied — paste into WhatsApp.');
    } else {
      await Clipboard.setStringAsync(url);
      Alert.alert('Copied!', 'Fixture link copied — paste into WhatsApp.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-pitch" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Nav */}
        <TouchableOpacity className="px-4 pt-4 mb-2" onPress={() => router.back()}>
          <Text className="text-ink-secondary">← Fixtures</Text>
        </TouchableOpacity>

        {/* Match hero card */}
        <View className="mx-4 mb-4 bg-surface-2 rounded-card p-5 border border-border">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-ink-tertiary text-caption">
              {new Date(fixture.fixture_date).toLocaleDateString('en-ZA', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
            <Tag
              label={isUpcoming ? 'Upcoming' : fixture.status === 'completed' ? 'Final' : fixture.status}
              variant={isUpcoming ? 'amber' : fixture.status === 'completed' ? 'green' : 'neutral'}
            />
          </View>

          {/* Score row */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1 items-center">
              <Text className="text-ink-tertiary text-caption mb-1">{isHome ? 'Home' : 'Away'}</Text>
              <Text className={`font-black text-heading ${isHome ? 'text-green' : 'text-ink-primary'}`}>
                {isHome ? teamName : fixture.opponent}
              </Text>
            </View>
            <View className="items-center px-4">
              {result ? (
                <Text className="text-ink-primary font-black text-display">
                  {isHome ? result.team_score : result.opponent_score}
                  <Text className="text-ink-tertiary"> – </Text>
                  {isHome ? result.opponent_score : result.team_score}
                </Text>
              ) : (
                <Text className="text-ink-tertiary font-bold text-title">
                  {new Date(fixture.fixture_date).toLocaleTimeString('en-ZA', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              )}
            </View>
            <View className="flex-1 items-center">
              <Text className="text-ink-tertiary text-caption mb-1">{isHome ? 'Away' : 'Home'}</Text>
              <Text className={`font-black text-heading ${!isHome ? 'text-green' : 'text-ink-primary'}`}>
                {isHome ? fixture.opponent : teamName}
              </Text>
            </View>
          </View>

          {fixture.venue && (
            <Text className="text-ink-tertiary text-caption text-center mt-3">📍 {fixture.venue}</Text>
          )}

          {result?.match_notes && (
            <Text className="text-ink-secondary text-body mt-3 pt-3 border-t border-border">
              {result.match_notes}
            </Text>
          )}
        </View>

        {/* Action buttons */}
        <View className="px-4 gap-3 mb-6">
          {isUpcoming && (
            <>
              <Button
                label="Log Result + Rate Players"
                onPress={() => router.push(`/(coach)/fixtures/${id}/result`)}
              />
              <Button
                label="Share Fixture"
                variant="secondary"
                onPress={shareFixture}
              />
              <Button
                label={cancelling ? 'Cancelling…' : 'Cancel Fixture'}
                variant="ghost"
                loading={cancelling}
                onPress={cancelFixture}
              />
            </>
          )}
          {fixture.status === 'completed' && ratings.length === 0 && (
            <Button
              label="Rate Players"
              onPress={() => router.push(`/(coach)/fixtures/${id}/rate`)}
            />
          )}
          {fixture.status === 'completed' && (
            <Button
              label="Share Result"
              variant="secondary"
              onPress={shareFixture}
            />
          )}
        </View>

        {/* Player ratings */}
        {ratings.length > 0 && (
          <View className="px-4 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-ink-primary text-heading font-bold">Player Ratings</Text>
              <TouchableOpacity onPress={() => router.push(`/(coach)/fixtures/${id}/rate`)}>
                <Text className="text-green text-caption font-semibold">Edit</Text>
              </TouchableOpacity>
            </View>
            {ratings.map((r: any) => (
              <View key={r.id} className="flex-row items-center bg-surface-1 border border-border rounded-card p-3 mb-2">
                <Avatar uri={r.players?.photo_url} name={r.players?.full_name} size="sm" />
                <View className="flex-1 ml-3">
                  <Text className="text-ink-primary font-semibold text-body">{r.players?.full_name}</Text>
                  {r.note && <Text className="text-ink-secondary text-caption mt-0.5">{r.note}</Text>}
                </View>
                <StarRow rating={r.rating} />
              </View>
            ))}
          </View>
        )}

        {/* Squad appearances */}
        {appearances.length > 0 && (
          <View className="px-4 mb-8">
            <Text className="text-ink-primary text-heading font-bold mb-3">Squad</Text>
            {appearances.map((a: any) => (
              <View key={a.id} className="flex-row items-center py-2 border-b border-border">
                <Avatar uri={a.players?.photo_url} name={a.players?.full_name} size="sm" />
                <Text className="text-ink-primary font-medium text-body ml-3 flex-1">
                  {a.players?.full_name}
                </Text>
                <Tag label={a.played ? 'Played' : 'Named'} variant={a.played ? 'green' : 'neutral'} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
