import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/database';

interface RoleOption {
  role: UserRole;
  title: string;
  description: string;
  emoji: string;
}

const ROLES: RoleOption[] = [
  {
    role: 'player',
    title: 'Player',
    description: 'View your passport & fixtures',
    emoji: '⚽',
  },
  {
    role: 'coach',
    title: 'Coach',
    description: 'Manage your squad & log results',
    emoji: '📋',
  },
  {
    role: 'parent',
    title: 'Parent',
    description: 'Follow your child\'s progress',
    emoji: '👨‍👦',
  },
];

export default function RoleScreen() {
  const router = useRouter();
  const { session, setProfile } = useAuthStore();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onConfirm = async () => {
    if (!selected || !session) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: selected, academy_id: '00000000-0000-0000-0000-000000000001' })
      .eq('id', session.user.id)
      .select('id, role, academy_id, full_name')
      .single();

    setLoading(false);

    if (error || !data) {
      setErrorMsg('Could not save your role. Please try again.');
      return;
    }

    setProfile(data as any);
  };

  return (
    <Screen>
      <View className="mt-8 mb-10">
        <Text className="text-white text-3xl font-black mb-1">Who are you?</Text>
        <Text className="text-ink-secondary text-base">
          Select your role to get the right view.
        </Text>
      </View>

      <View className="gap-3 mb-8">
        {ROLES.map((option) => (
          <TouchableOpacity
            key={option.role}
            onPress={() => setSelected(option.role)}
            activeOpacity={0.8}
            className={`flex-row items-center p-4 rounded-xl border
              ${selected === option.role
                ? 'border-green bg-green/10'
                : 'border-border bg-surface-1'
              }`}
          >
            <Text className="text-3xl mr-4">{option.emoji}</Text>
            <View className="flex-1">
              <Text className={`font-bold text-base ${selected === option.role ? 'text-green' : 'text-white'}`}>
                {option.title}
              </Text>
              <Text className="text-ink-secondary text-sm mt-0.5">{option.description}</Text>
            </View>
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center
              ${selected === option.role ? 'border-green' : 'border-ink-tertiary'}`}>
              {selected === option.role && (
                <View className="w-2.5 h-2.5 rounded-full bg-green" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {errorMsg && (
        <Text className="text-red text-body mb-3">{errorMsg}</Text>
      )}

      <Button
        label="Continue"
        disabled={!selected}
        loading={loading}
        onPress={onConfirm}
      />
    </Screen>
  );
}
