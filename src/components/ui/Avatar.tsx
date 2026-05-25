import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-14 h-14', text: 'text-lg' },
  xl: { container: 'w-20 h-20', text: 'text-2xl' },
};

function initials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const { container, text } = sizeMap[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={`${container} rounded-full`}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View className={`${container} rounded-full bg-green-dark items-center justify-center`}>
      <Text className={`${text} text-white font-bold`}>{initials(name)}</Text>
    </View>
  );
}
