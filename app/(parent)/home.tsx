import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';
import { StarRow } from '@/components/ui/StarRow';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export default function ParentHomeScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const clear = useAuthStore((s) => s.clear);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clear();
  };

  // Get linked children
  const { data: children, isLoading } = useQuery({
    queryKey: ['my-children', profile?.userId],
    enabled: !!profile?.userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parent_player_links')
        .select(`
          player_id,
          players (
            id, full_name, position, photo_url, date_of_birth, share_token,
            team_members(teams(id, name, age_group)),
            player_ratings(id, rating, note, created_at, fixtures(opponent, fixture_date)),
            match_appearances(id, played)
          )
        `)
        .eq('parent_id', profile!.userId);
      if (error) throw error;
      return data?.map((l: any) => l.players) ?? [];
    },
  });

  const hasChildren = (children?.length ?? 0) > 0;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-pitch items-center justify-center">
        <Text className="text-ink-secondary">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!hasChildren) {
    return (
      <SafeAreaView className="flex-1 bg-pitch" edges={['top']}>
        <View className="px-4 pt-6 pb-2 flex-row justify-end">
          <TouchableOpacity onPress={handleLogout}>
            <Text className="text-ink-tertiary text-caption">Logout</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 px-6 items-center justify-center">
          <Text className="text-4xl mb-4">👨‍👦</Text>
          <Text className="text-ink-primary text-title font-bold text-center mb-2">
            Link Your Child
          </Text>
          <Text className="text-ink-secondary text-body text-center mb-8">
            Enter the code provided by your child's coach to follow their progress.
          </Text>
          <Button
            label="Link Child"
            onPress={() => router.push('/(parent)/link-child')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-pitch" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-6 pb-4 flex-row items-center justify-between">
          <Text className="text-ink-primary text-hero font-black">My Child</Text>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={() => router.push('/(parent)/link-child')}>
              <Text className="text-green text-caption font-semibold">+ Add</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Text className="text-ink-tertiary text-caption">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {children!.map((player: any) => {
          const ratings: any[] = player.player_ratings ?? [];
          const latestRating = [...ratings].sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          const avgRating = ratings.length > 0
            ? ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length
            : null;
          const playedCount = (player.match_appearances ?? []).filter((a: any) => a.played).length;
          const team = player.team_members?.[0]?.teams;

          return (
            <TouchableOpacity
              key={player.id}
              onPress={() => router.push(`/(parent)/child/${player.id}`)}
              activeOpacity={0.85}
              className="mx-4 mb-4 bg-surface-2 rounded-card border border-border overflow-hidden"
            >
              {/* Green top bar */}
              <View className="h-1 bg-green" />
              <View className="p-5">
                <View className="flex-row items-center mb-4">
                  <Avatar uri={player.photo_url} name={player.full_name} size="lg" />
                  <View className="ml-4 flex-1">
                    <Text className="text-ink-primary font-black text-title">{player.full_name}</Text>
                    {team && (
                      <Text className="text-green text-caption font-semibold mt-0.5">
                        {team.name}{team.age_group ? ` · ${team.age_group}` : ''}
                      </Text>
                    )}
                    {player.position && (
                      <View className="mt-2">
                        <Tag
                          label={player.position.charAt(0).toUpperCase() + player.position.slice(1)}
                          variant="neutral"
                        />
                      </View>
                    )}
                  </View>
                  <Text className="text-ink-tertiary">›</Text>
                </View>

                {/* Stats */}
                <View className="flex-row border-t border-border pt-4 gap-0">
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

                {/* Latest rating */}
                {latestRating && (
                  <View className="mt-4 pt-4 border-t border-border">
                    <Text className="text-ink-tertiary text-caption mb-1">
                      Last rated — vs {latestRating.fixtures?.opponent}
                    </Text>
                    <StarRow rating={latestRating.rating} />
                    {latestRating.note && (
                      <Text className="text-ink-secondary text-caption mt-1 italic">
                        "{latestRating.note}"
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
