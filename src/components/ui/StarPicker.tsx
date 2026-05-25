import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface StarPickerProps {
  value: number;
  onChange: (v: number) => void;
  size?: 'sm' | 'lg';
}

export function StarPicker({ value, onChange, size = 'lg' }: StarPickerProps) {
  const textClass = size === 'lg' ? 'text-2xl' : 'text-xl';
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => onChange(n)}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          activeOpacity={0.7}
        >
          <Text className={`${textClass} ${n <= value ? 'text-amber' : 'text-ink-tertiary'}`}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
