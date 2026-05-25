import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { loginSchema, type LoginInput } from '@/lib/validation';

// react-hook-form needs @hookform/resolvers
export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '' },
  });

  const onSubmit = async ({ phone }: LoginInput) => {
    setLoading(true);
    // Normalise: ensure +27 prefix
    const normalised = phone.startsWith('0')
      ? '+27' + phone.slice(1)
      : phone;

    const { error } = await supabase.auth.signInWithOtp({
      phone: normalised,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    router.push({ pathname: '/(auth)/verify', params: { phone: normalised } });
  };

  return (
    <Screen>
      <TouchableOpacity className="mt-2 mb-8" onPress={() => router.back()}>
        <Text className="text-text-secondary text-sm">← Back</Text>
      </TouchableOpacity>

      <Text className="text-white text-3xl font-black mb-1">Sign in</Text>
      <Text className="text-text-secondary text-base mb-8">
        We'll send a one-time code to your phone.
      </Text>

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Phone number"
            placeholder="071 234 5678"
            keyboardType="phone-pad"
            value={value}
            onChangeText={onChange}
            error={errors.phone?.message}
            hint="South African numbers only (e.g. 071 234 5678)"
          />
        )}
      />

      <View className="mt-4">
        <Button label="Send Code" loading={loading} onPress={handleSubmit(onSubmit)} />
      </View>
    </Screen>
  );
}
