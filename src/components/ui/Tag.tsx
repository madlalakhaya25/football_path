import React from 'react';
import { View, Text } from 'react-native';

type TagVariant = 'green' | 'amber' | 'neutral' | 'red';

interface TagProps {
  label: string;
  variant?: TagVariant;
}

const styles: Record<TagVariant, { container: string; text: string }> = {
  green:   { container: 'bg-green-bg border border-green-border',   text: 'text-green' },
  amber:   { container: 'bg-amber-bg border border-amber-border',   text: 'text-amber' },
  neutral: { container: 'bg-surface-1 border border-border',        text: 'text-ink-secondary' },
  red:     { container: 'bg-red-bg border border-red-border',       text: 'text-red' },
};

export function Tag({ label, variant = 'neutral' }: TagProps) {
  const s = styles[variant];
  return (
    <View className={`px-2 py-0.5 rounded-full ${s.container}`}>
      <Text className={`text-xs font-medium ${s.text}`}>{label}</Text>
    </View>
  );
}
