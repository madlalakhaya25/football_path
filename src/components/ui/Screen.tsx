import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  className?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  className,
  onRefresh,
  refreshing = false,
}: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName={`${padded ? 'px-4 pt-4 pb-10' : ''} ${className ?? ''}`}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00FF7F"
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 ${padded ? 'px-4 pt-4' : ''} ${className ?? ''}`}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-pitch" edges={['top', 'bottom']}>
      {Platform.OS === 'web' ? content : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {content}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
