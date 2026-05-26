import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { registerSchema, type RegisterInput } from '@/lib/validation';

const ROLES: { value: 'player' | 'coach' | 'parent'; label: string; description: string }[] = [
  { value: 'player', label: 'Player', description: 'Build your passport and get seen.' },
  { value: 'coach',  label: 'Coach',  description: 'Manage your squad and log results.' },
  { value: 'parent', label: 'Parent', description: "Follow your child's progress." },
];

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: '', phone: '', role: undefined },
  });

  const selectedRole = watch('role');

  const onSubmit = async ({ full_name, phone, role }: RegisterInput) => {
    setLoading(true);
    setErrorMsg(null);
    const normalised = phone.startsWith('0') ? '+27' + phone.slice(1) : phone;

    const { error } = await supabase.auth.signInWithOtp({ phone: normalised });
    setLoading(false);

    if (error) { setErrorMsg(error.message); return; }

    router.push({
      pathname: '/(auth)/verify',
      params: { phone: normalised, full_name, role },
    });
  };

  return (
    <Screen scroll>
      <TouchableOpacity className="mb-6" onPress={() => router.back()}>
        <Text className="text-ink-secondary text-sm">← Back</Text>
      </TouchableOpacity>

      <Text className="text-white text-3xl font-black mb-1">Create account</Text>
      <Text className="text-ink-secondary text-base mb-8">
        Already have an account?{' '}
        <Text className="text-green font-semibold" onPress={() => router.replace('/(auth)/login')}>
          Sign in
        </Text>
      </Text>

      {/* Full name */}
      <Controller
        control={control}
        name="full_name"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Full name"
            placeholder="Sipho Dlamini"
            autoCapitalize="words"
            value={value}
            onChangeText={onChange}
            error={errors.full_name?.message}
          />
        )}
      />

      {/* Phone */}
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
            hint="South African numbers only"
          />
        )}
      />

      {/* Role picker */}
      <View className="mb-4">
        <Text className="text-ink-secondary text-sm mb-2">I am a…</Text>
        <View className="gap-2">
          {ROLES.map(({ value, label, description }) => (
            <TouchableOpacity
              key={value}
              onPress={() => setValue('role', value, { shouldValidate: true })}
              className={`rounded-xl border p-4 ${selectedRole === value ? 'border-green bg-green-bg' : 'border-border-light'}`}
              activeOpacity={0.7}
            >
              <Text className={`font-bold text-base ${selectedRole === value ? 'text-green' : 'text-white'}`}>
                {label}
              </Text>
              <Text className="text-ink-secondary text-sm mt-0.5">{description}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.role && <Text className="text-red text-sm mt-1">{errors.role.message}</Text>}
      </View>

      {errorMsg && <Text className="text-red text-body mb-3">{errorMsg}</Text>}

      <Button label="Send Code" loading={loading} onPress={handleSubmit(onSubmit)} />
    </Screen>
  );
}
