import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { Tag } from '@/components/ui/Tag';
import { StarRow } from '@/components/ui/StarRow';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import * as Clipboard from 'expo-clipboard';
import { showAlert } from '@/lib/alert';

export default function AdminPlayerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: player, isLoading } = useQuery({
    queryKey: ['admin-player-detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          team_members(teams(name, age_group)),
          player_ratings(
            id, rating, note, created_at,
            fixtures(opponent, fixture_date, is_home)
          )
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
        <Text className="text-ink-secondary">Loading...</Text>
      </SafeAreaView>
    );
  }

  const ratings: any[] = player.player_ratings ?? [];
  const avgRating = ratings.length > 0
    ? ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length
    : null;

  const age = player.date_of_birth
    ? Math.floor((Date.now() - new Date(player.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const team = player.team_members?.[0]?.teams;

  const sharePassport = async () => {
    const url = `https://footballpath.app/p/${player.share_token}`;
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(url);
    } else {
      await Clipboard.setStringAsync(url);
    }
    showAlert('Link copied!', 'Paste the passport link into WhatsApp.');
  };

  return (
    <SafeAreaView className="flex-1 bg-pitch" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity className="px-4 pt-4 mb-4" onPress={() => router.back()}>
          <Text className="text-ink-secondary">← Players</Text>
        </TouchableOpacity>

        <View className="mx-4 mb-4 bg-surface-2 rounded-card p-5 border border-border">
          <View className="flex-row items-center mb-4">
            <Avatar uri={player.photo_url} name={player.full_name} size="xl" />
            <View className="ml-4 flex-1">
              <Text className="text-ink-primary font-black text-title">{player.full_name}</Text>
              <View className="flex-row flex-wrap gap-2 mt-2">
                {player.position && (
                  <Tag
                    label={player.position.charAt(0).toUpperCase() + player.position.slice(1)}
                    variant="green"
                  />
                )}
                {age && <Tag label={`Age ${age}`} variant="neutral" />}
                {player.preferred_foot && <Tag label={`${player.preferred_foot} foot`} variant="neutral" />}
                {team && <Tag label={team.name} variant="amber" />}
              </View>
            </View>
          </View>

          <View className="flex-row border-t border-border pt-4 gap-4">
            <View className="flex-1 items-center">
              <Text className="text-green font-black text-title">
                {avgRating ? avgRating.toFixed(1) : '–'}
              </Text>
              <Text className="text-ink-secondary text-caption">Avg Rating</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-green font-black text-title">{ratings.length}</Text>
              <Text className="text-ink-secondary text-caption">Match Ratings</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={sharePassport}
          className="mx-4 mb-6 flex-row items-center bg-blue-bg border border-blue-border rounded-card px-4 py-3"
        >
          <Text className="text-blue flex-1 font-semibold text-body">Share passport link</Text>
          <Text className="text-blue">📤</Text>
        </TouchableOpacity>

        <View className="px-4 mb-8">
          <Text className="text-ink-primary text-heading font-bold mb-3">Match Ratings</Text>
          {ratings.length === 0 ? (
            <Text className="text-ink-secondary text-body">No ratings logged yet.</Text>
          ) : (
            [...ratings]
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((r: any) => (
                <View key={r.id} className="bg-surface-1 border border-border rounded-card p-4 mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-ink-secondary text-caption">
                      vs {r.fixtures?.opponent} ·{' '}
                      {new Date(r.fixtures?.fixture_date).toLocaleDateString('en-ZA', {
                        day: 'numeric', month: 'short',
                      })}
                    </Text>
                    <StarRow rating={r.rating} />
                  </View>
                  {r.note && (
                    <Text className="text-ink-secondary text-caption mt-1 italic">"{r.note}"</Text>
                  )}
                </View>
              ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
