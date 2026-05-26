import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { showAlert } from '@/lib/alert';
import { otpSchema, type OtpInput } from '@/lib/validation';

const DEFAULT_ACADEMY_ID = '00000000-0000-0000-0000-000000000001';

export default function VerifyScreen() {
  const router = useRouter();
  const { phone, full_name, role } = useLocalSearchParams<{
    phone: string;
    full_name?: string;
    role?: string;
  }>();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: { token: '' },
  });

  const onVerify = async ({ token }: OtpInput) => {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });

    if (error) {
      setLoading(false);
      showAlert('Invalid code', 'Please check the code and try again.');
      return;
    }

    // New registration: create profile with captured data
    if (full_name && role) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name,
          role,
          phone,
          academy_id: DEFAULT_ACADEMY_ID,
        });
      }
    }

    setLoading(false);
    // AuthGate in _layout.tsx handles redirect once session + profile are set
  };

  const onResend = async () => {
    setResending(true);
    await supabase.auth.signInWithOtp({ phone });
    setResending(false);
    showAlert('Code resent', `A new code has been sent to ${phone}`);
  };

  return (
    <Screen>
      <TouchableOpacity className="mb-8" onPress={() => router.back()}>
        <Text className="text-ink-secondary text-sm">← Back</Text>
      </TouchableOpacity>

      <Text className="text-white text-3xl font-black mb-1">Enter code</Text>
      <Text className="text-ink-secondary text-base mb-8">
        We sent a 6-digit code to{'\n'}
        <Text className="text-white font-semibold">{phone}</Text>
      </Text>

      <Controller
        control={control}
        name="token"
        render={({ field: { onChange, value } }) => (
          <Input
            label="One-time code"
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            value={value}
            onChangeText={onChange}
            error={errors.token?.message}
          />
        )}
      />

      <View className="mt-4 gap-3">
        <Button label="Verify" loading={loading} onPress={handleSubmit(onVerify)} />
        <Button
          label={resending ? 'Resending...' : 'Resend code'}
          variant="ghost"
          loading={resending}
          onPress={onResend}
        />
      </View>
    </Screen>
  );
}
