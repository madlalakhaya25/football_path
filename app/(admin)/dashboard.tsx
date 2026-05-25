import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

function StatCard({ value: val, label, color = 'text-green' }: { value: string | number; label: string; color?: string }) {
  return (
    <View className="flex-1 bg-surface-2 border border-border rounded-card p-4 items-center">
      <Text className={`${color} font-black text-display`}>{val}</Text>
      <Text className="text-ink-secondary text-caption text-center mt-1">{label}</Text>
    </View>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);

  const { data: stats } = useQuery({
    queryKey: ['admin-stats', profile?.academyId],
    enabled: !!profile?.academyId,
    queryFn: async () => {
      const [teams, players, fixtures, ratings] = await Promise.all([
        supabase.from('teams').select('id', { count: 'exact' }).eq('academy_id', profile!.academyId!).eq('active', true),
        supabase.from('players').select('id', { count: 'exact' }).eq('academy_id', profile!.academyId!).eq('active', true),
        supabase.from('fixtures').select('id, status', { count: 'exact' }),
        supabase.from('player_ratings').select('id', { count: 'exact' }),
      ]);
      return {
        teams: teams.count ?? 0,
        players: players.count ?? 0,
        upcomingFixtures: fixtures.data?.filter((f: any) => f.status === 'upcoming').length ?? 0,
        ratingsLogged: ratings.count ?? 0,
      };
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-pitch" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-6 pb-4">
          <Text className="text-ink-tertiary text-caption uppercase tracking-wide">Admin</Text>
          <Text className="text-ink-primary text-hero font-black">GrowFit Academy</Text>
        </View>

        {/* Stats grid */}
        <View className="px-4 mb-6">
          <View className="flex-row gap-3 mb-3">
            <StatCard value={stats?.teams ?? 0} label="Teams" />
            <StatCard value={stats?.players ?? 0} label="Players" />
          </View>
          <View className="flex-row gap-3">
            <StatCard value={stats?.upcomingFixtures ?? 0} label="Upcoming Fixtures" color="text-amber" />
            <StatCard value={stats?.ratingsLogged ?? 0} label="Ratings Logged" color="text-blue" />
          </View>
        </View>

        {/* Quick actions */}
        <View className="px-4 mb-8">
          <Text className="text-ink-primary text-heading font-bold mb-3">Quick Actions</Text>
          {[
            { label: 'Manage Teams', emoji: '🏟️', route: '/(admin)/teams' },
            { label: 'Manage Players', emoji: '👤', route: '/(admin)/players' },
            { label: 'Add New Player', emoji: '➕', route: '/(admin)/players/new' },
          ].map(({ label, emoji, route }) => (
            <TouchableOpacity
              key={label}
              onPress={() => router.push(route as any)}
              activeOpacity={0.8}
              className="flex-row items-center bg-surface-1 border border-border rounded-card px-4 py-4 mb-3"
            >
              <Text className="text-2xl mr-4">{emoji}</Text>
              <Text className="text-ink-primary font-semibold text-body flex-1">{label}</Text>
              <Text className="text-ink-tertiary">›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
