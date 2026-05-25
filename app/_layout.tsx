import '../global.css';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { WebContainer } from '@/components/ui/WebContainer';
import type { AuthSession } from '@/types/app';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { session, profile, setSession, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    // Listen for Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('id, role, academy_id, full_name')
          .eq('id', session.user.id)
          .single();

        if (data) {
          setProfile({
            userId: data.id,
            role: data.role,
            academyId: data.academy_id,
            fullName: data.full_name,
          } as AuthSession);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (session && profile && inAuthGroup) {
      // Route to role-specific home
      switch (profile.role) {
        case 'admin':  router.replace('/(admin)/dashboard'); break;
        case 'coach':  router.replace('/(coach)/dashboard'); break;
        case 'player': router.replace('/(player)/passport'); break;
        case 'parent': router.replace('/(parent)/home'); break;
      }
    }
  }, [session, profile, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <WebContainer>
        <QueryClientProvider client={queryClient}>
          <AuthGate>
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(admin)" />
              <Stack.Screen name="(coach)" />
              <Stack.Screen name="(player)" />
              <Stack.Screen name="(parent)" />
              <Stack.Screen name="passport/[token]" />
            </Stack>
          </AuthGate>
        </QueryClientProvider>
      </WebContainer>
    </GestureHandlerRootView>
  );
}
