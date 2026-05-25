import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen } from '@/components/ui/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { linkChildSchema, type LinkChildInput } from '@/lib/validation';
import { useQueryClient } from '@tanstack/react-query';

export default function LinkChildScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LinkChildInput>({
    resolver: zodResolver(linkChildSchema),
    defaultValues: { share_token: '' },
  });

  const onSubmit = async ({ share_token }: LinkChildInput) => {
    setLoading(true);
    // Look up player by share_token
    const { data: player, error: lookupError } = await supabase
      .from('players')
      .select('id, full_name')
      .eq('share_token', share_token.trim())
      .single();

    if (lookupError || !player) {
      setLoading(false);
      Alert.alert('Not found', 'We couldn\'t find a player with that code. Check with your coach.');
      return;
    }

    // Create the link
    const { error: linkError } = await supabase
      .from('parent_player_links')
      .insert({ parent_id: profile!.userId, player_id: player.id });

    setLoading(false);

    if (linkError) {
      if (linkError.code === '23505') {
        Alert.alert('Already linked', `You're already following ${player.full_name}.`);
      } else {
        Alert.alert('Error', linkError.message);
      }
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['my-children'] });
    Alert.alert(
      'Linked!',
      `You're now following ${player.full_name}. You'll see their fixtures and ratings.`,
      [{ text: 'Great!', onPress: () => router.replace('/(parent)/home') }]
    );
  };

  return (
    <Screen>
      <TouchableOpacity className="mt-2 mb-8" onPress={() => router.back()}>
        <Text className="text-ink-secondary text-body">← Back</Text>
      </TouchableOpacity>

      <Text className="text-ink-primary text-hero font-black mb-1">Link Your Child</Text>
      <Text className="text-ink-secondary text-body mb-8">
        Enter the 10-character code from your child's coach. You'll find it on the squad list or team card.
      </Text>

      <Controller
        control={control}
        name="share_token"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Player code"
            placeholder="e.g. a3f9c2b1e0"
            value={value}
            onChangeText={(t) => onChange(t.toLowerCase().trim())}
            error={errors.share_token?.message}
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
      />

      <View className="mt-4">
        <Button label="Link Player" loading={loading} onPress={handleSubmit(onSubmit)} />
      </View>
    </Screen>
  );
}
