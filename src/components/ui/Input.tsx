import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
}

export function Input({ label, error, hint, rightElement, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-ink-secondary text-caption font-medium mb-1.5 uppercase tracking-wide">
          {label}
        </Text>
      )}
      <View className={`flex-row items-center bg-surface-3 rounded-card border
        ${error   ? 'border-red' : focused ? 'border-green' : 'border-border'}`}>
        <TextInput
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
          className="flex-1 px-4 py-3.5 text-ink-primary text-body"
          placeholderTextColor="#5A5A5A"
          selectionColor="#00FF7F"
        />
        {rightElement && <View className="pr-3">{rightElement}</View>}
      </View>
      {error && <Text className="text-red text-caption mt-1.5">{error}</Text>}
      {hint && !error && <Text className="text-ink-tertiary text-caption mt-1.5">{hint}</Text>}
    </View>
  );
}
