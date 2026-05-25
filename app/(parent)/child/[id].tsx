import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { Tag } from '@/components/ui/Tag';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

function StarRow({ rating }: { rating: number }) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} className={`text-sm ${n <= rating ? 'text-amber' : 'text-ink-tertiary'}`}>★</Text>
      ))}
    </View>
  );
}

export default function ChildPassportScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: player, isLoading } = useQuery({
    queryKey: ['child-passport', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          team_members(teams(name, age_group, academies(name))),
          player_ratings(id, rating, note, created_at, fixtures(opponent, fixture_date, is_home)),
          match_appearances(id, played)
        `)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !player) {
    return (
      <SafeAreaView className="flex-1 bg-pitch items-center justify-center">
        <Text className="text-ink-secondary">{isLoading ? 'Loading...' : 'Player not found'}</Text>
      </SafeAreaView>
    );
  }

  const ratings: any[] = player.player_ratings ?? [];
  const appearances: any[] = player.match_appearances ?? [];
  const playedCount = appearances.filter((a: any) => a.played).length;
  const avgRating = ratings.length > 0
    ? ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length
    : null;
  const age = player.date_of_birth
    ? Math.floor((Date.now() - new Date(player.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const team = player.team_members?.[0]?.teams;

  return (
    <SafeAreaView className="flex-1 bg-pitch" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity className="px-4 pt-4 mb-2" onPress={() => router.back()}>
          <Text className="text-ink-secondary">← Back</Text>
        </TouchableOpacity>

        {/* Hero card */}
        <View className="mx-4 mb-4 bg-surface-2 rounded-card border border-border overflow-hidden">
          <View className="h-1 bg-green" />
          <View className="p-5">
            <View className="flex-row items-center mb-4">
              <Avatar uri={player.photo_url} name={player.full_name} size="xl" />
              <View className="ml-4 flex-1">
                <Text className="text-ink-primary font-black text-title">{player.full_name}</Text>
                {team && (
                  <Text className="text-green text-caption font-semibold mt-0.5">
                    {team.name}{team.age_group ? ` · ${team.age_group}` : ''}
                  </Text>
                )}
                <View className="flex-row flex-wrap gap-2 mt-2">
                  {player.position && (
                    <Tag label={player.position.charAt(0).toUpperCase() + player.position.slice(1)} variant="green" />
                  )}
                  {age && <Tag label={`Age ${age}`} variant="neutral" />}
                </View>
              </View>
            </View>

            <View className="flex-row border-t border-border pt-4">
              <View className="flex-1 items-center">
                <Text className="text-green font-black text-title">
                  {avgRating ? avgRating.toFixed(1) : '–'}
                </Text>
                <Text className="text-ink-tertiary text-caption">Avg Rating</Text>
              </View>
              <View className="w-px bg-border" />
              <View className="flex-1 items-center">
                <Text className="text-green font-black text-title">{playedCount}</Text>
                <Text className="text-ink-tertiary text-caption">Games</Text>
              </View>
              <View className="w-px bg-border" />
              <View className="flex-1 items-center">
                <Text className="text-green font-black text-title">{ratings.length}</Text>
                <Text className="text-ink-tertiary text-caption">Ratings</Text>
              </View>
            </View>
          </View>
        </View>

        {/* All ratings */}
        <View className="px-4 mb-8">
          <Text className="text-ink-primary text-heading font-bold mb-3">Match Ratings</Text>
          {ratings.length === 0 ? (
            <View className="bg-surface-1 border border-border rounded-card p-6 items-center">
              <Text className="text-ink-tertiary text-body text-center">
                No match ratings yet. Ratings appear here after each game.
              </Text>
            </View>
          ) : (
            [...ratings]
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((r: any) => (
                <View key={r.id} className="bg-surface-1 border border-border rounded-card p-4 mb-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-ink-secondary text-caption">
                      vs {r.fixtures?.opponent}
                    </Text>
                    <Text className="text-ink-tertiary text-caption">
                      {new Date(r.fixtures?.fixture_date).toLocaleDateString('en-ZA', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <StarRow rating={r.rating} />
                  {r.note && (
                    <Text className="text-ink-secondary text-caption mt-2 italic">"{r.note}"</Text>
                  )}
                </View>
              ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
