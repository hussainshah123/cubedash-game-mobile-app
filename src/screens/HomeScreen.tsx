import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import MenuBackground from '../components/MenuBackground';
import CubePreview from '../components/CubePreview';
import Btn from '../components/Btn';
import { useProgress } from '../store/ProgressContext';
import { getSkin } from '../game/skins';
import { TOTAL_LEVELS } from '../game/constants';
import { UI } from '../theme/themes';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { coins, selectedSkin, maxUnlockedLevel, totalStars } = useProgress();
  const skin = getSkin(selectedSkin);

  const bob = useSharedValue(0);
  const tilt = useSharedValue(0);

  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-14, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    tilt.value = withRepeat(
      withSequence(
        withTiming(-0.06, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.06, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [bob, tilt]);

  const cubeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }, { rotate: `${tilt.value}rad` }],
  }));

  const playLevel = Math.min(maxUnlockedLevel, TOTAL_LEVELS);

  return (
    <View style={styles.root}>
      <MenuBackground />

      <View style={[styles.statsRow, { top: insets.top + 12 }]}>
        <View style={styles.statPill}>
          <View style={styles.coinIcon} />
          <Text style={styles.statText}>{coins}</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.starIcon}>★</Text>
          <Text style={styles.statText}>{totalStars}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.cubeWrap, cubeStyle]}>
          <CubePreview skin={skin} size={104} />
        </Animated.View>

        <Text style={styles.title}>CUBE DASH</Text>
        <Text style={styles.subtitle}>tap to jump · dodge everything</Text>

        <View style={styles.menu}>
          <Btn
            label={`▶  PLAY  ·  LEVEL ${playLevel}`}
            onPress={() => navigation.navigate('Game', { level: playLevel })}
          />
          <Btn
            label="🗺  LEVELS"
            variant="secondary"
            onPress={() => navigation.navigate('Levels')}
          />
          <Btn
            label="🎨  SKINS"
            variant="secondary"
            onPress={() => navigation.navigate('Skins')}
          />
          <Btn
            label="⚙  SETTINGS"
            variant="secondary"
            onPress={() => navigation.navigate('Settings')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: UI.bg,
  },
  statsRow: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    gap: 10,
    zIndex: 2,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#ffffff14',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  coinIcon: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: UI.gold,
    borderWidth: 2.5,
    borderColor: '#ffe9a8',
  },
  starIcon: {
    color: UI.gold,
    fontSize: 15,
  },
  statText: {
    color: UI.text,
    fontWeight: '800',
    fontSize: 15,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cubeWrap: {
    marginBottom: 30,
    shadowColor: '#4d7bff',
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  title: {
    color: UI.text,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 7,
  },
  subtitle: {
    color: UI.textDim,
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 1.5,
  },
  menu: {
    marginTop: 44,
    gap: 14,
    width: 260,
  },
});
