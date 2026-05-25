import React from 'react';
import { View, Text } from 'react-native';

interface StarRowProps {
  rating: number;
  size?: 'sm' | 'md';
}

export function StarRow({ rating, size = 'sm' }: StarRowProps) {
  const textClass = size === 'md' ? 'text-base' : 'text-sm';
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} className={`${textClass} ${n <= rating ? 'text-amber' : 'text-ink-tertiary'}`}>
          ★
        </Text>
      ))}
    </View>
  );
}
