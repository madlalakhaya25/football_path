import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { Tag } from '@/components/ui/Tag';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';

function StarRow({ rating }: { rating: number }) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} className={`text-sm ${n <= rating ? 'text-amber' : 'text-ink-tertiary'}`}>★</Text>
      ))}
    </View>
  );
}

export default function PlayerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: player, isLoading } = useQuery({
    queryKey: ['player-detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          player_ratings (
            id, rating, note, created_at,
            fixtures ( opponent, fixture_date, is_home )
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

  const sharePassport = async () => {
    await Clipboard.setStringAsync(`https://footballpath.app/p/${player.share_token}`);
    Alert.alert('Link copied!', 'Paste the passport link into WhatsApp.');
  };

  return (
    <SafeAreaView className="flex-1 bg-pitch" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity className="px-4 pt-4 mb-4" onPress={() => router.back()}>
          <Text className="text-ink-secondary">← Squad</Text>
        </TouchableOpacity>

        {/* Passport hero */}
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
              </View>
            </View>
          </View>

          {/* Stats */}
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

        {/* Share passport */}
        <TouchableOpacity
          onPress={sharePassport}
          className="mx-4 mb-6 flex-row items-center bg-blue-bg border border-blue-border rounded-card px-4 py-3"
        >
          <Text className="text-blue flex-1 font-semibold text-body">Share passport link</Text>
          <Text className="text-blue">📤</Text>
        </TouchableOpacity>

        {/* Ratings history */}
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
