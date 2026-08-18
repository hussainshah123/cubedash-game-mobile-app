import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { UI } from '../theme/themes';
import { SoundManager } from '../audio/SoundManager';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'gold';
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}

const BG: Record<NonNullable<Props['variant']>, string> = {
  primary: UI.accent,
  secondary: UI.card,
  danger: UI.danger,
  gold: UI.gold,
};

export default function Btn({
  label,
  onPress,
  variant = 'primary',
  style,
  small,
}: Props) {
  return (
    <Pressable
      onPress={() => {
        SoundManager.play('click');
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        small && styles.small,
        {
          backgroundColor: BG[variant],
          transform: [{ scale: pressed ? 0.96 : 1 }],
          opacity: pressed ? 0.9 : 1,
        },
        variant === 'secondary' && styles.secondaryBorder,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          small && styles.smallLabel,
          variant === 'gold' && styles.goldLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 15,
    paddingHorizontal: 34,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
  },
  small: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 0,
    borderRadius: 12,
  },
  secondaryBorder: {
    borderWidth: 1.5,
    borderColor: UI.cardBorder,
  },
  label: {
    color: UI.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  smallLabel: {
    fontSize: 14,
  },
  goldLabel: {
    color: '#4a3300',
  },
});
