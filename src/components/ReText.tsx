import React from 'react';
import { TextInput, TextStyle, StyleProp } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedProps,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface Props {
  text: SharedValue<string>;
  style?: StyleProp<TextStyle>;
}

/**
 * Text bound directly to a shared value — updates on the UI thread
 * without re-rendering React (used for the live score/coin HUD).
 */
export default function ReText({ text, style }: Props) {
  const animatedProps = useAnimatedProps(() => ({
    text: text.value,
    defaultValue: text.value,
  }));

  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      style={[{ padding: 0, color: '#fff' }, style]}
      animatedProps={animatedProps}
    />
  );
}
