import React from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-pitch">
      <View className="flex-1 px-6 justify-between py-12">
        {/* Logo / Brand */}
        <View className="items-center mt-8">
          <View className="w-20 h-20 rounded-2xl bg-green-primary items-center justify-center mb-4">
            <Text className="text-pitch text-4xl font-black">FP</Text>
          </View>
          <Text className="text-white text-3xl font-black tracking-tight">FootballPath</Text>
          <Text className="text-text-secondary text-base mt-2 text-center">
            GrowFit Football Academy
          </Text>
        </View>

        {/* Tagline */}
        <View className="items-center">
          <Text className="text-white text-2xl font-bold text-center leading-8">
            Every player deserves{'\n'}
            <Text className="text-green-primary">to be seen.</Text>
          </Text>
          <Text className="text-text-secondary text-base text-center mt-4 leading-6">
            Digital passports. Real progress.{'\n'}
            Coaches, players, and parents connected.
          </Text>
        </View>

        {/* CTA */}
        <View className="gap-3">
          <Button
            label="Get Started"
            onPress={() => router.push('/(auth)/login')}
          />
          <Text className="text-text-muted text-xs text-center">
            By continuing you agree to our Terms of Use
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
