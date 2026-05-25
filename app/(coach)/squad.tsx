import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMyTeam, useSquad, useCreateTeam } from '@/hooks/useTeam';
import { showAlert } from '@/lib/alert';

function StarRating({ avg }: { avg: number | null }) {
  if (!avg) return <Text className="text-ink-tertiary text-caption">No ratings yet</Text>;
  return (
    <View className="flex-row items-center gap-1">
      <Text className="text-amber text-caption">★</Text>
      <Text className="text-ink-primary text-caption font-bold">{avg.toFixed(1)}</Text>
    </View>
  );
}

function PlayerCard({ member, onPress }: { member: any; onPress: () => void }) {
  const player = member.players;
  const ratings: any[] = player?.player_ratings ?? [];
  const avg = ratings.length > 0
    ? ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length
    : null;

  const age = player?.date_of_birth
    ? Math.floor((Date.now() - new Date(player.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-row items-center bg-surface-1 border border-border rounded-card p-4 mb-3"
    >
      <Avatar uri={player?.photo_url} name={player?.full_name} size="md" />
      <View className="flex-1 ml-3">
        <Text className="text-ink-primary font-bold text-body">{player?.full_name}</Text>
        <View className="flex-row items-center gap-2 mt-0.5">
          {player?.position && (
            <Tag label={player.position.charAt(0).toUpperCase() + player.position.slice(1)} variant="neutral" />
          )}
          {age && <Text className="text-ink-tertiary text-caption">Age {age}</Text>}
        </View>
      </View>
      <View className="items-end">
        <StarRating avg={avg} />
        <Text className="text-ink-tertiary text-caption mt-1">{ratings.length} rated</Text>
      </View>
      <Text className="text-ink-tertiary ml-2">›</Text>
    </TouchableOpacity>
  );
}

export default function SquadScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [teamName, setTeamName] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const { data: team, isLoading: teamLoading } = useMyTeam();
  const { data: squad, isLoading, refetch } = useSquad(team?.id);
  const createTeam = useCreateTeam();

  const filtered = (squad ?? []).filter((m: any) =>
    m.players?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const onCreateTeam = async () => {
    if (!teamName.trim()) {
      showAlert('Required', 'Please enter a team name.');
      return;
    }
    try {
      await createTeam.mutateAsync({ name: teamName.trim(), age_group: ageGroup.trim() || undefined });
      setTeamName('');
      setAgeGroup('');
    } catch (e: any) {
      showAlert('Error', e.message ?? 'Could not create team');
    }
  };

  if (!teamLoading && !team) {
    return (
      <Screen>
        <View className="mt-4 mb-6">
          <Text className="text-ink-primary text-hero font-black mb-1">Create Your Team</Text>
          <Text className="text-ink-secondary text-body">Set up your squad to get started.</Text>
        </View>
        <Input
          label="Team Name *"
          placeholder="e.g. GrowFit U15 A"
          value={teamName}
          onChangeText={setTeamName}
        />
        <Input
          label="Age Group (optional)"
          placeholder="e.g. U15"
          value={ageGroup}
          onChangeText={setAgeGroup}
        />
        <View className="mt-4">
          <Button label="Create Team" loading={createTeam.isPending} onPress={onCreateTeam} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-ink-primary text-hero font-black mb-1">Squad</Text>
        {team && (
          <Text className="text-ink-secondary text-body">{team.name} · {squad?.length ?? 0} players</Text>
        )}
      </View>

      {/* Search */}
      <View className="px-4 mb-4">
        <View className="flex-row items-center bg-surface-3 border border-border rounded-card px-3">
          <Text className="text-ink-tertiary mr-2">🔍</Text>
          <TextInput
            placeholder="Search player..."
            placeholderTextColor="#5A5A5A"
            className="flex-1 py-3 text-ink-primary text-body"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Invite code banner */}
      {team && (
        <View className="mx-4 mb-4 flex-row items-center bg-green-bg border border-green-border rounded-card px-4 py-3">
          <Text className="text-ink-secondary text-caption flex-1">
            Share invite code to add players
          </Text>
          <Text className="text-green font-black text-heading tracking-widest">{team.invite_code}</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item.player_id}
        contentContainerClassName="px-4 pb-8"
        showsVerticalScrollIndicator={false}
        onRefresh={() => { refetch(); }}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <PlayerCard
            member={item}
            onPress={() => router.push(`/(coach)/player/${item.player_id}`)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-4xl mb-4">👥</Text>
            <Text className="text-ink-secondary text-body text-center">
              {isLoading ? 'Loading squad...' : 'No players yet.\nShare your invite code to add players.'}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
