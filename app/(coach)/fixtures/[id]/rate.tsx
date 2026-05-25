import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useFixture } from '@/hooks/useFixtures';
import { useQueryClient } from '@tanstack/react-query';

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={8}>
          <Text className={`text-xl ${n <= value ? 'text-amber' : 'text-ink-tertiary'}`}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

interface RatingState { rating: number; note: string; }

export default function RatePlayersScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore((s) => s.profile);
  const { data: fixture } = useFixture(id);
  const queryClient = useQueryClient();

  const appearances = fixture?.match_appearances?.filter((a: any) => a.played) ?? [];

  const [ratings, setRatings] = useState<Record<string, RatingState>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initial: Record<string, RatingState> = {};
    appearances.forEach((a: any) => {
      const existing = fixture?.player_ratings?.find(
        (r: any) => r.player_id === a.player_id && r.coach_id === profile?.userId
      );
      initial[a.player_id] = {
        rating: existing?.rating ?? 3,
        note: existing?.note ?? '',
      };
    });
    setRatings(initial);
  }, [fixture]);

  const onSave = async () => {
    setSaving(true);
    const rows = appearances.map((a: any) => ({
      fixture_id: id,
      player_id: a.player_id,
      coach_id: profile!.userId,
      rating: ratings[a.player_id]?.rating ?? 3,
      note: ratings[a.player_id]?.note || null,
    }));

    const { error } = await supabase
      .from('player_ratings')
      .upsert(rows, { onConflict: 'fixture_id,player_id,coach_id' });

    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['fixture', id] });
    Alert.alert('Ratings saved!', '', [
      { text: 'Done', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-pitch" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-ink-secondary">← Back</Text>
        </TouchableOpacity>
        <Text className="text-ink-primary text-hero font-black">Rate Players</Text>
        <Text className="text-ink-secondary text-body mt-1">
          vs {fixture?.opponent}
        </Text>
      </View>

      <FlatList
        data={appearances}
        keyExtractor={(a: any) => a.player_id}
        contentContainerClassName="px-4 pb-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: a }: { item: any }) => (
          <View className="bg-surface-1 border border-border rounded-card p-4 mt-3">
            <View className="flex-row items-center mb-3">
              <Avatar uri={a.players?.photo_url} name={a.players?.full_name} size="sm" />
              <Text className="text-ink-primary font-bold text-body ml-3">{a.players?.full_name}</Text>
            </View>
            <StarPicker
              value={ratings[a.player_id]?.rating ?? 3}
              onChange={(v) =>
                setRatings((prev) => ({ ...prev, [a.player_id]: { ...prev[a.player_id], rating: v } }))
              }
            />
            <Input
              placeholder="Short note for player/parent..."
              value={ratings[a.player_id]?.note ?? ''}
              onChangeText={(t) =>
                setRatings((prev) => ({ ...prev, [a.player_id]: { ...prev[a.player_id], note: t } }))
              }
              style={{ marginTop: 10, marginBottom: 0 }}
            />
          </View>
        )}
        ListFooterComponent={
          <View className="mt-6 mb-8">
            <Button label="Save Ratings" loading={saving} onPress={onSave} />
          </View>
        }
      />
    </SafeAreaView>
  );
}
