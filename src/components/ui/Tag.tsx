import React from 'react';
import { View, Text } from 'react-native';

type TagVariant = 'green' | 'amber' | 'neutral' | 'red';

interface TagProps {
  label: string;
  variant?: TagVariant;
}

const styles: Record<TagVariant, { container: string; text: string }> = {
  green: { container: 'bg-green-primary/10 border border-green-primary/30', text: 'text-green-primary' },
  amber: { container: 'bg-amber-primary/10 border border-amber-primary/30', text: 'text-amber-primary' },
  neutral: { container: 'bg-pitch-card border border-pitch-border', text: 'text-text-secondary' },
  red: { container: 'bg-red-500/10 border border-red-500/30', text: 'text-red-400' },
};

export function Tag({ label, variant = 'neutral' }: TagProps) {
  const s = styles[variant];
  return (
    <View className={`px-2 py-0.5 rounded-full ${s.container}`}>
      <Text className={`text-xs font-medium ${s.text}`}>{label}</Text>
    </View>
  );
}
