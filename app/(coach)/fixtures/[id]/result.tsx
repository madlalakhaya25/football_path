import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFixture, useLogMatch } from '@/hooks/useFixtures';
import { useMyTeam, useSquad } from '@/hooks/useTeam';

interface PlayerRatingState {
  player_id: string;
  full_name: string;
  photo_url: string | null;
  played: boolean;
  rating: number;
  note: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={8}>
          <Text className={`text-2xl ${n <= value ? 'text-amber' : 'text-ink-tertiary'}`}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function LogResultScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: fixture } = useFixture(id);
  const { data: team } = useMyTeam();
  const { data: squad } = useSquad(team?.id);
  const logMatch = useLogMatch();

  const [teamScore, setTeamScore] = useState('0');
  const [opponentScore, setOpponentScore] = useState('0');
  const [matchNotes, setMatchNotes] = useState('');
  const [players, setPlayers] = useState<PlayerRatingState[]>(() =>
    (squad ?? []).map((m: any) => ({
      player_id: m.player_id,
      full_name: m.players?.full_name ?? '',
      photo_url: m.players?.photo_url ?? null,
      played: true,
      rating: 3,
      note: '',
    }))
  );

  // Populate players from squad once squad loads
  React.useEffect(() => {
    if (squad && players.length === 0) {
      setPlayers(
        squad.map((m: any) => ({
          player_id: m.player_id,
          full_name: m.players?.full_name ?? '',
          photo_url: m.players?.photo_url ?? null,
          played: true,
          rating: 3,
          note: '',
        }))
      );
    }
  }, [squad]);

  const updatePlayer = (playerId: string, patch: Partial<PlayerRatingState>) => {
    setPlayers((prev) =>
      prev.map((p) => (p.player_id === playerId ? { ...p, ...patch } : p))
    );
  };

  const onSubmit = async () => {
    const ts = parseInt(teamScore, 10);
    const os = parseInt(opponentScore, 10);
    if (isNaN(ts) || isNaN(os)) {
      Alert.alert('Invalid score', 'Please enter valid scores.');
      return;
    }

    try {
      await logMatch.mutateAsync({
        fixture_id: id!,
        team_score: ts,
        opponent_score: os,
        match_notes: matchNotes || undefined,
        appearances: players.map((p) => ({ player_id: p.player_id, played: p.played })),
        ratings: players
          .filter((p) => p.played)
          .map((p) => ({ player_id: p.player_id, rating: p.rating, note: p.note || undefined })),
      });
      Alert.alert('Result logged!', 'Great game. Parents can see the result now.', [
        { text: 'Done', onPress: () => router.replace(`/(coach)/fixtures/${id}`) },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to log result');
    }
  };

  const isHome = fixture?.is_home ?? true;

  return (
    <SafeAreaView className="flex-1 bg-pitch" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Nav */}
        <TouchableOpacity className="px-4 pt-4 mb-4" onPress={() => router.back()}>
          <Text className="text-ink-secondary">← Back</Text>
        </TouchableOpacity>

        <View className="px-4">
          <Text className="text-ink-primary text-hero font-black mb-1">Log Result</Text>
          <Text className="text-ink-secondary text-body mb-6">
            vs {fixture?.opponent}
          </Text>

          {/* Score input */}
          <View className="bg-surface-2 border border-border rounded-card p-5 mb-6">
            <Text className="text-ink-secondary text-caption text-center mb-4 uppercase tracking-wide">
              Full-time Score
            </Text>
            <View className="flex-row items-center justify-between">
              <View className="items-center flex-1">
                <Text className={`font-bold text-body mb-2 ${isHome ? 'text-green' : 'text-ink-primary'}`}>
                  {isHome ? 'GrowFit' : fixture?.opponent}
                </Text>
                <Input
                  value={teamScore}
                  onChangeText={setTeamScore}
                  keyboardType="number-pad"
                  style={{ fontSize: 36, fontWeight: '900', textAlign: 'center', height: 64 }}
                  maxLength={2}
                />
              </View>
              <Text className="text-ink-tertiary text-title font-black mx-4">–</Text>
              <View className="items-center flex-1">
                <Text className={`font-bold text-body mb-2 ${!isHome ? 'text-green' : 'text-ink-primary'}`}>
                  {isHome ? fixture?.opponent : 'GrowFit'}
                </Text>
                <Input
                  value={opponentScore}
                  onChangeText={setOpponentScore}
                  keyboardType="number-pad"
                  style={{ fontSize: 36, fontWeight: '900', textAlign: 'center', height: 64 }}
                  maxLength={2}
                />
              </View>
            </View>
          </View>

          {/* Match notes */}
          <Input
            label="Match Notes (optional)"
            placeholder="How did the game go?"
            value={matchNotes}
            onChangeText={setMatchNotes}
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top' }}
          />

          {/* Player ratings */}
          <Text className="text-ink-primary text-heading font-bold mt-2 mb-3">Rate Players</Text>
          <Text className="text-ink-secondary text-caption mb-4">
            Toggle off players who didn't play. Star ratings are saved to their passports.
          </Text>

          {players.map((player) => (
            <View
              key={player.player_id}
              className={`bg-surface-1 border rounded-card p-4 mb-3
                ${player.played ? 'border-border' : 'border-border opacity-40'}`}
            >
              <View className="flex-row items-center mb-3">
                <Avatar uri={player.photo_url} name={player.full_name} size="sm" />
                <Text className="text-ink-primary font-semibold text-body ml-3 flex-1">
                  {player.full_name}
                </Text>
                <TouchableOpacity
                  onPress={() => updatePlayer(player.player_id, { played: !player.played })}
                  className={`px-3 py-1.5 rounded-chip border
                    ${player.played
                      ? 'bg-green-bg border-green-border'
                      : 'bg-surface-3 border-border'}`}
                >
                  <Text className={`text-caption font-semibold
                    ${player.played ? 'text-green' : 'text-ink-tertiary'}`}>
                    {player.played ? 'Played' : 'Did not play'}
                  </Text>
                </TouchableOpacity>
              </View>

              {player.played && (
                <>
                  <StarPicker
                    value={player.rating}
                    onChange={(v) => updatePlayer(player.player_id, { rating: v })}
                  />
                  <Input
                    placeholder="Short note (optional)"
                    value={player.note}
                    onChangeText={(t) => updatePlayer(player.player_id, { note: t })}
                    style={{ marginTop: 8, marginBottom: 0 }}
                  />
                </>
              )}
            </View>
          ))}

          <View className="mt-4 mb-8">
            <Button
              label="Save Result + Ratings"
              loading={logMatch.isPending}
              onPress={onSubmit}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
