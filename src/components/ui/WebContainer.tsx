import React from 'react';
import { View, Platform } from 'react-native';

interface WebContainerProps {
  children: React.ReactNode;
}

export function WebContainer({ children }: WebContainerProps) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#0D0D0D' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 480 }}>
        {children}
      </View>
    </View>
  );
}
