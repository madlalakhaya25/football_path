import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useMyTeam } from '@/hooks/useTeam';
import { useCreateFixture } from '@/hooks/useFixtures';
import { showAlert } from '@/lib/alert';
import { createFixtureSchema, type CreateFixtureInput } from '@/lib/validation';

export default function NewFixtureScreen() {
  const router = useRouter();
  const { data: team } = useMyTeam();
  const createFixture = useCreateFixture(team?.id ?? '');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFixtureInput>({
    resolver: zodResolver(createFixtureSchema),
    defaultValues: {
      is_home: true,
      fixture_date: '',
      opponent: '',
    },
  });

  const onSubmit = async (data: CreateFixtureInput) => {
    if (!team) {
      showAlert('Error', 'No team found. Create a team first.');
      return;
    }
    try {
      await createFixture.mutateAsync(data);
      showAlert('Fixture added!', 'Share the details with your squad.', () => router.back());
    } catch (e: any) {
      showAlert('Error', e.message ?? 'Failed to create fixture');
    }
  };

  return (
    <Screen scroll>
      {/* Header */}
      <View className="flex-row items-center mt-2 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-ink-secondary text-body">← Back</Text>
        </TouchableOpacity>
        <Text className="text-ink-primary text-title font-bold">New Fixture</Text>
      </View>

      <Controller
        control={control}
        name="opponent"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Opponent"
            placeholder="e.g. Soweto United FC"
            value={value}
            onChangeText={onChange}
            error={errors.opponent?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="fixture_date"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Date & Time"
            placeholder="YYYY-MM-DDTHH:MM (e.g. 2026-06-01T10:00)"
            value={value}
            onChangeText={onChange}
            error={errors.fixture_date?.message}
            hint="Format: 2026-06-01T10:00"
          />
        )}
      />

      <Controller
        control={control}
        name="venue"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Venue (optional)"
            placeholder="e.g. GrowFit Training Ground"
            value={value ?? ''}
            onChangeText={onChange}
          />
        )}
      />

      {/* Home / Away toggle */}
      <Controller
        control={control}
        name="is_home"
        render={({ field: { onChange, value } }) => (
          <View className="flex-row items-center justify-between bg-surface-1 border border-border rounded-card px-4 py-4 mb-4">
            <View>
              <Text className="text-ink-primary font-semibold text-body">Home Game</Text>
              <Text className="text-ink-tertiary text-caption mt-0.5">
                {value ? 'GrowFit is the home team' : 'GrowFit is playing away'}
              </Text>
            </View>
            <Switch
              value={value}
              onValueChange={onChange}
              trackColor={{ false: '#2A2A2A', true: '#00FF7F40' }}
              thumbColor={value ? '#00FF7F' : '#5A5A5A'}
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Notes (optional)"
            placeholder="Any extra info for the squad..."
            value={value ?? ''}
            onChangeText={onChange}
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top' }}
          />
        )}
      />

      <View className="mt-2">
        <Button
          label="Add Fixture"
          loading={createFixture.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </Screen>
  );
}
