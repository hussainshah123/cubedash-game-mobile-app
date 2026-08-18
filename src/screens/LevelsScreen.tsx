import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import MenuBackground from '../components/MenuBackground';
import { useProgress } from '../store/ProgressContext';
import { THEMES, UI } from '../theme/themes';
import { LEVELS_PER_WORLD, WORLD_COUNT } from '../game/constants';
import { SoundManager } from '../audio/SoundManager';

type Props = NativeStackScreenProps<RootStackParamList, 'Levels'>;

export default function LevelsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { levels, maxUnlockedLevel, totalStars } = useProgress();

  return (
    <View style={styles.root}>
      <MenuBackground />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          hitSlop={12}
          onPress={() => {
            SoundManager.play('click');
            navigation.goBack();
          }}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>LEVELS</Text>
        <View style={styles.starPill}>
          <Text style={styles.starIcon}>★</Text>
          <Text style={styles.starCount}>{totalStars}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {Array.from({ length: WORLD_COUNT }, (_, w) => {
          const theme = THEMES[w];
          return (
            <View key={w} style={styles.world}>
              <View style={styles.worldHeader}>
                <Text style={styles.worldEmoji}>{theme.emoji}</Text>
                <Text style={[styles.worldName, { color: theme.groundLine }]}>
                  {theme.name.toUpperCase()}
                </Text>
                <View
                  style={[styles.worldLine, { backgroundColor: theme.groundLine }]}
                />
              </View>
              <View style={styles.grid}>
                {Array.from({ length: LEVELS_PER_WORLD }, (__, i) => {
                  const lvl = w * LEVELS_PER_WORLD + i + 1;
                  const unlocked = lvl <= maxUnlockedLevel;
                  const stars = levels[lvl]?.stars ?? 0;
                  return (
                    <Pressable
                      key={lvl}
                      disabled={!unlocked}
                      onPress={() => {
                        SoundManager.play('click');
                        navigation.navigate('Game', { level: lvl });
                      }}
                      style={({ pressed }) => [
                        styles.cell,
                        {
                          backgroundColor: unlocked
                            ? theme.ground
                            : '#ffffff0a',
                          borderColor: unlocked
                            ? theme.groundLine
                            : '#ffffff1a',
                          transform: [{ scale: pressed ? 0.93 : 1 }],
                        },
                      ]}
                    >
                      {unlocked ? (
                        <>
                          <Text style={styles.cellNum}>{lvl}</Text>
                          <Text style={styles.cellStars}>
                            {stars > 0 ? '★'.repeat(stars) : ' '}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.lock}>🔒</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const CELL = 68;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: UI.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: UI.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: -3,
  },
  title: {
    color: UI.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    flex: 1,
  },
  starPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff14',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  starIcon: {
    color: UI.gold,
    fontSize: 14,
  },
  starCount: {
    color: UI.text,
    fontWeight: '800',
  },
  scroll: {
    paddingHorizontal: 18,
  },
  world: {
    marginBottom: 26,
  },
  worldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  worldEmoji: {
    fontSize: 18,
  },
  worldName: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  worldLine: {
    flex: 1,
    height: 1.5,
    opacity: 0.3,
    marginLeft: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellNum: {
    color: UI.text,
    fontSize: 20,
    fontWeight: '900',
  },
  cellStars: {
    color: UI.gold,
    fontSize: 11,
    height: 14,
  },
  lock: {
    fontSize: 20,
    opacity: 0.55,
  },
});
