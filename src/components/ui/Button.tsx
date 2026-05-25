import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, TouchableOpacityProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

const variantMap: Record<Variant, { bg: string; border: string; text: string }> = {
  primary:   { bg: 'bg-green',          border: '',                        text: 'text-ink-inverse font-bold' },
  secondary: { bg: 'bg-surface-2',      border: 'border border-border',    text: 'text-ink-primary font-semibold' },
  outline:   { bg: 'bg-transparent',    border: 'border border-green',     text: 'text-green font-semibold' },
  ghost:     { bg: 'bg-transparent',    border: '',                        text: 'text-green font-semibold' },
  danger:    { bg: 'bg-red-bg',         border: 'border border-red-border',text: 'text-red font-semibold' },
};

const sizeMap: Record<Size, { container: string; text: string }> = {
  sm: { container: 'px-4 py-2.5 rounded-button',   text: 'text-sm' },
  md: { container: 'px-5 py-3.5 rounded-button',   text: 'text-base' },
  lg: { container: 'px-6 py-4   rounded-button',   text: 'text-base' },
};

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  loading = false,
  fullWidth = true,
  disabled,
  leftIcon,
  ...props
}: ButtonProps) {
  const v = variantMap[variant];
  const s = sizeMap[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      {...props}
      disabled={isDisabled}
      activeOpacity={0.75}
      className={`${v.bg} ${v.border} ${s.container}
        flex-row items-center justify-center
        ${fullWidth ? 'w-full' : 'self-start'}
        ${isDisabled ? 'opacity-40' : ''}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#0D0D0D' : '#00FF7F'} />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={`${v.text} ${s.text}`}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
