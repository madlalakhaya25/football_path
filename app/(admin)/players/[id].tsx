import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { Tag } from '@/components/ui/Tag';
import { StarRow } from '@/components/ui/StarRow';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { showAlert } from '@/lib/alert';

const ATTRS = [
  { key: 'pace',      label: 'Pace' },
  { key: 'shooting',  label: 'Shooting' },
  { key: 'passing',   label: 'Passing' },
  { key: 'dribbling', label: 'Dribbling' },
  { key: 'defending', label: 'Defending' },
  { key: 'physical',  label: 'Physical' },
] as const;

function AttrBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? '#4ade80' : value >= 65 ? '#fbbf24' : '#f87171';
  return (
    <View className="flex-row items-center gap-3 mb-2">
      <Text className="text-ink-secondary text-caption w-20">{label}</Text>
      <View className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
        <View style={{ width: `${value}%`, backgroundColor: color }} className="h-full rounded-full" />
      </View>
      <Text className="text-ink-primary font-bold text-caption w-7 text-right">{value}</Text>
    </View>
  );
}

export default function AdminPlayerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

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

  const uploadPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { showAlert('Permission needed', 'Allow photo library access to upload a photo.'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${id}.${ext}`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { error: uploadErr } = await supabase.storage
      .from('player-photos')
      .upload(path, blob, { upsert: true, contentType: `image/${ext}` });
    if (uploadErr) { showAlert('Upload failed', uploadErr.message); return; }

    const { data: { publicUrl } } = supabase.storage.from('player-photos').getPublicUrl(path);
    await supabase.from('players').update({ photo_url: publicUrl }).eq('id', id!);
    queryClient.invalidateQueries({ queryKey: ['admin-player-detail', id] });
  };

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
            <TouchableOpacity onPress={uploadPhoto} activeOpacity={0.8}>
              <Avatar uri={player.photo_url} name={player.full_name} size="xl" />
              <View className="absolute bottom-0 right-0 bg-green rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">+</Text>
              </View>
            </TouchableOpacity>
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

        {/* Attributes */}
        {ATTRS.some(({ key }) => player[key] != null) && (
          <View className="mx-4 mb-4 bg-surface-2 rounded-card p-5 border border-border">
            <Text className="text-ink-primary font-bold text-heading mb-3">Attributes</Text>
            {ATTRS.map(({ key, label }) => {
              const val = player[key];
              if (val == null) return null;
              return <AttrBar key={key} label={label} value={val} />;
            })}
          </View>
        )}

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
