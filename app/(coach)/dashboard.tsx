import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useMyTeam, useSquad } from '@/hooks/useTeam';
import { useFixtures } from '@/hooks/useFixtures';
import { Avatar } from '@/components/ui/Avatar';
import { Tag } from '@/components/ui/Tag';
import { supabase } from '@/lib/supabase';

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <View className="flex-1 bg-surface-2 rounded-card p-4 items-center border border-border">
      <Text className="text-green text-display font-black">{value}</Text>
      <Text className="text-ink-secondary text-caption mt-1 text-center">{label}</Text>
    </View>
  );
}

function FixtureRow({ fixture }: { fixture: any }) {
  const router = useRouter();
  const result = fixture.match_results?.[0];
  const isUpcoming = fixture.status === 'upcoming';
  const isHome = fixture.is_home;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(coach)/fixtures/${fixture.id}`)}
      activeOpacity={0.8}
      className="bg-surface-1 border border-border rounded-card p-4 mb-3"
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-ink-secondary text-caption">
          {new Date(fixture.fixture_date).toLocaleDateString('en-ZA', {
            weekday: 'short', day: 'numeric', month: 'short',
          })}
          {fixture.venue ? ` · ${fixture.venue}` : ''}
        </Text>
        <Tag
          label={fixture.status === 'upcoming' ? 'Upcoming' : fixture.status === 'completed' ? 'Final' : fixture.status}
          variant={fixture.status === 'upcoming' ? 'neutral' : fixture.status === 'completed' ? 'green' : 'amber'}
        />
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-ink-primary font-bold text-heading flex-1">
          {isHome ? 'GrowFit' : fixture.opponent}
        </Text>
        {result ? (
          <Text className="text-green font-black text-title mx-4">
            {isHome ? result.team_score : result.opponent_score}
            {' – '}
            {isHome ? result.opponent_score : result.team_score}
          </Text>
        ) : (
          <Text className="text-ink-tertiary text-body mx-4">vs</Text>
        )}
        <Text className="text-ink-primary font-bold text-heading flex-1 text-right">
          {isHome ? fixture.opponent : 'GrowFit'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CoachDashboard() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const clear = useAuthStore((s) => s.clear);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clear();
  };
  const { data: team } = useMyTeam();
  const { data: squad } = useSquad(team?.id);
  const { data: fixtures } = useFixtures(team?.id);

  const upcoming = fixtures?.filter((f: any) => f.status === 'upcoming') ?? [];
  const recent   = fixtures?.filter((f: any) => f.status === 'completed').slice(0, 3) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-pitch" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-ink-tertiary text-caption">Welcome back</Text>
            <Text className="text-ink-primary text-hero font-black">
              {profile?.fullName?.split(' ')[0]}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Avatar name={profile?.fullName} size="md" />
            <TouchableOpacity onPress={handleLogout}>
              <Text className="text-ink-tertiary text-caption">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Team card */}
        {team ? (
          <View className="mx-4 mb-6 bg-surface-2 rounded-card p-5 border border-border">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-ink-tertiary text-caption uppercase tracking-wide">Your Team</Text>
                <Text className="text-ink-primary text-title font-bold mt-1">{team.name}</Text>
                {team.age_group && <Text className="text-green text-caption font-semibold mt-0.5">{team.age_group}</Text>}
              </View>
              <View className="bg-green-bg border border-green-border rounded-card px-3 py-2">
                <Text className="text-ink-tertiary text-caption">Invite code</Text>
                <Text className="text-green font-black text-title tracking-widest">{team.invite_code}</Text>
              </View>
            </View>
            {/* Stats row */}
            <View className="flex-row gap-3">
              <StatCard value={squad?.length ?? 0} label="Players" />
              <StatCard value={upcoming.length} label="Upcoming" />
              <StatCard value={recent.length > 0 ? `${recent[0]?.match_results?.[0]?.team_score ?? '-'}-${recent[0]?.match_results?.[0]?.opponent_score ?? '-'}` : '-'} label="Last result" />
            </View>
          </View>
        ) : (
          <TouchableOpacity
            className="mx-4 mb-6 bg-green-bg border border-green-border rounded-card p-5 items-center"
            onPress={() => router.push('/(coach)/squad')}
          >
            <Text className="text-green text-title font-bold">+ Create your team</Text>
            <Text className="text-ink-secondary text-body mt-1">Set up your squad to get started</Text>
          </TouchableOpacity>
        )}

        {/* Upcoming fixtures */}
        {upcoming.length > 0 && (
          <View className="px-4 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-ink-primary text-heading font-bold">Upcoming</Text>
              <TouchableOpacity onPress={() => router.push('/(coach)/fixtures')}>
                <Text className="text-green text-caption font-semibold">See all</Text>
              </TouchableOpacity>
            </View>
            {upcoming.slice(0, 2).map((f: any) => <FixtureRow key={f.id} fixture={f} />)}
          </View>
        )}

        {/* Recent results */}
        {recent.length > 0 && (
          <View className="px-4 mb-6">
            <Text className="text-ink-primary text-heading font-bold mb-3">Recent Results</Text>
            {recent.map((f: any) => <FixtureRow key={f.id} fixture={f} />)}
          </View>
        )}

        {/* Quick actions */}
        <View className="px-4 mb-8">
          <Text className="text-ink-primary text-heading font-bold mb-3">Quick Actions</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-surface-1 border border-border rounded-card p-4 items-center"
              onPress={() => router.push('/(coach)/fixtures/new')}
            >
              <Text className="text-2xl mb-2">📅</Text>
              <Text className="text-ink-primary text-caption font-semibold text-center">Add Fixture</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-surface-1 border border-border rounded-card p-4 items-center"
              onPress={() => router.push('/(coach)/squad')}
            >
              <Text className="text-2xl mb-2">👥</Text>
              <Text className="text-ink-primary text-caption font-semibold text-center">View Squad</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
