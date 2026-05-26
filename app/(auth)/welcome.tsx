import React from 'react';
import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';

const FEATURES = [
  { emoji: '🪪', text: 'Digital player passports' },
  { emoji: '⭐', text: 'Coach ratings after every match' },
  { emoji: '👨‍👦', text: 'Parents follow progress live' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-pitch">
      <View className="flex-1 px-6 justify-between py-10">
        {/* Logo + Academy */}
        <View className="items-center mt-6">
          <Image source={require('../../assets/growfit.png')} style={{ width: 80, height: 80, borderRadius: 16 }} resizeMode="contain" />
          <Text className="text-white text-3xl font-black tracking-tight mt-4">Growfit FA</Text>
        </View>

        {/* Hero tagline */}
        <View className="items-center">
          <Text className="text-white text-2xl font-bold text-center leading-9">
            Every player deserves{'\n'}
            <Text className="text-green">to be seen.</Text>
          </Text>
          <Text className="text-ink-secondary text-base text-center mt-4 leading-6">
            Digital passports. Real progress.{'\n'}
            Coaches, players, and parents — connected.
          </Text>

          {/* Feature bullets */}
          <View className="mt-8 gap-3 w-full">
            {FEATURES.map((f) => (
              <View key={f.emoji} className="flex-row items-center bg-surface-1 border border-border rounded-card px-4 py-3">
                <Text className="text-xl mr-3">{f.emoji}</Text>
                <Text className="text-ink-primary text-sm font-medium">{f.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View className="gap-3">
          <Button
            label="Create Account"
            onPress={() => router.push('/(auth)/register')}
          />
          <Button
            label="Sign In"
            variant="ghost"
            onPress={() => router.push('/(auth)/login')}
          />
          <Text className="text-ink-tertiary text-xs text-center leading-4">
            By continuing you agree to our Terms of Use
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
