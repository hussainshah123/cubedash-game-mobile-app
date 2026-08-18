import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import GameCanvas, { EngineHandles } from '../components/game/GameCanvas';
import ReText from '../components/ReText';
import Btn from '../components/Btn';
import { generateLevel } from '../game/levelGen';
import { getSkin } from '../game/skins';
import { THEMES, UI } from '../theme/themes';
import {
  DEATH_OVERLAY_DELAY,
  FINISH_OVERLAY_DELAY,
  TOTAL_LEVELS,
} from '../game/constants';
import { useProgress } from '../store/ProgressContext';
import { SoundManager } from '../audio/SoundManager';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

type Phase = 'ready' | 'playing' | 'paused' | 'dead' | 'complete';

interface RunResult {
  score: number;
  coins: number;
  stars: number;
}

export default function GameScreen({ navigation, route }: Props) {
  const level = route.params.level;
  const insets = useSafeAreaInsets();
  const progressStore = useProgress();

  const [runKey, setRunKey] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [result, setResult] = useState<RunResult | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const data = useMemo(() => generateLevel(level), [level]);
  const theme = THEMES[data.world];
  const skin = useMemo(
    () => getSkin(progressStore.selectedSkin),
    [progressStore.selectedSkin],
  );

  const best = progressStore.levels[level]?.best ?? 0;

  // engine <-> HUD bridge
  const scoreText = useSharedValue('0');
  const coinText = useSharedValue('0');
  const progress = useSharedValue(0);
  const paused = useSharedValue(false);
  const handles = useMemo<EngineHandles>(
    () => ({ scoreText, coinText, progress }),
    [scoreText, coinText, progress],
  );

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const onStart = useCallback(() => setPhase('playing'), []);

  const onDeath = useCallback(
    (score: number, coins: number) => {
      progressStore.reportRun(level, score, 0);
      progressStore.addCoins(coins);
      timer.current = setTimeout(() => {
        setResult({ score, coins, stars: 0 });
        setPhase('dead');
      }, DEATH_OVERLAY_DELAY);
    },
    [level, progressStore],
  );

  const onComplete = useCallback(
    (score: number, coins: number) => {
      const total = data.coins.length;
      const pct = total === 0 ? 1 : coins / total;
      const stars = pct >= 0.95 ? 3 : pct >= 0.6 ? 2 : 1;
      progressStore.reportRun(level, score, stars);
      progressStore.addCoins(coins);
      SoundManager.play('complete');
      timer.current = setTimeout(() => {
        setResult({ score, coins, stars });
        setPhase('complete');
        // star reveal chimes
        for (let i = 0; i < stars; i++) {
          setTimeout(() => SoundManager.play('star'), 420 + i * 320);
        }
      }, FINISH_OVERLAY_DELAY);
    },
    [level, data.coins.length, progressStore],
  );

  const retry = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    paused.value = false;
    scoreText.value = '0';
    coinText.value = '0';
    progress.value = 0;
    setResult(null);
    setPhase('ready');
    setRunKey(k => k + 1);
  }, [paused, scoreText, coinText, progress]);

  const goHome = useCallback(() => navigation.popToTop(), [navigation]);

  const nextLevel = useCallback(() => {
    if (level < TOTAL_LEVELS) {
      navigation.replace('Game', { level: level + 1 });
    } else {
      navigation.popToTop();
    }
  }, [navigation, level]);

  const pauseGame = useCallback(() => {
    if (phase !== 'playing') return;
    SoundManager.play('click');
    paused.value = true;
    setPhase('paused');
  }, [phase, paused]);

  const resumeGame = useCallback(() => {
    paused.value = false;
    setPhase('playing');
  }, [paused]);

  return (
    <View style={styles.root}>
      <GameCanvas
        key={runKey}
        data={data}
        skin={skin}
        theme={theme}
        paused={paused}
        handles={handles}
        onStart={onStart}
        onDeath={onDeath}
        onComplete={onComplete}
      />

      {/* HUD */}
      <View
        pointerEvents="box-none"
        style={[styles.hud, { top: insets.top + 8 }]}
      >
        <View style={styles.hudRow}>
          <View style={styles.scoreBox}>
            <Text style={styles.hudLabel}>SCORE</Text>
            <ReText text={scoreText} style={styles.scoreText} />
          </View>
          <View style={styles.hudRight}>
            <View style={styles.coinBox}>
              <View style={styles.coinIcon} />
              <ReText text={coinText} style={styles.coinText} />
            </View>
            <Pressable
              onPress={pauseGame}
              hitSlop={12}
              style={styles.pauseBtn}
            >
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </Pressable>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: theme.groundLine },
              progressBarStyle,
            ]}
          />
        </View>
      </View>

      {/* ready overlay */}
      {phase === 'ready' && (
        <Animated.View
          pointerEvents="none"
          entering={FadeIn.duration(300)}
          style={styles.centerOverlay}
        >
          <Text style={styles.levelTitle}>
            {theme.emoji} LEVEL {level}
          </Text>
          <Text style={styles.tapHint}>TAP TO START</Text>
          <Text style={styles.subHint}>tap = jump · hold = high jump</Text>
        </Animated.View>
      )}

      {/* pause overlay */}
      {phase === 'paused' && (
        <View style={styles.dimOverlay}>
          <Animated.View entering={FadeInDown.duration(220)} style={styles.card}>
            <Text style={styles.cardTitle}>PAUSED</Text>
            <Btn label="RESUME" onPress={resumeGame} />
            <Btn label="RETRY" variant="secondary" onPress={retry} />
            <Btn label="HOME" variant="secondary" onPress={goHome} />
          </Animated.View>
        </View>
      )}

      {/* game over overlay */}
      {phase === 'dead' && result && (
        <View style={styles.dimOverlay}>
          <Animated.View entering={ZoomIn.duration(260)} style={styles.card}>
            <Text style={[styles.cardTitle, { color: UI.danger }]}>
              GAME OVER
            </Text>
            <Text style={styles.bigScore}>{result.score}</Text>
            <Text style={styles.bestText}>
              Best : {Math.max(best, result.score)}
            </Text>
            <View style={styles.coinRow}>
              <View style={styles.coinIcon} />
              <Text style={styles.coinEarned}>+{result.coins}</Text>
            </View>
            <Btn label="RETRY" onPress={retry} />
            <Btn label="HOME" variant="secondary" onPress={goHome} />
          </Animated.View>
        </View>
      )}

      {/* level complete overlay */}
      {phase === 'complete' && result && (
        <View style={styles.dimOverlay}>
          <Animated.View entering={ZoomIn.duration(280)} style={styles.card}>
            <Text style={[styles.cardTitle, { color: UI.accentAlt }]}>
              LEVEL COMPLETE
            </Text>
            <View style={styles.starsRow}>
              {[0, 1, 2].map(i => (
                <Animated.Text
                  key={i}
                  entering={
                    i < result.stars
                      ? ZoomIn.delay(420 + i * 320).springify()
                      : FadeIn.delay(200)
                  }
                  style={[
                    styles.star,
                    i >= result.stars && styles.starDim,
                  ]}
                >
                  ★
                </Animated.Text>
              ))}
            </View>
            <Text style={styles.bigScore}>{result.score}</Text>
            <View style={styles.coinRow}>
              <View style={styles.coinIcon} />
              <Text style={styles.coinEarned}>
                +{result.coins} / {data.coins.length}
              </Text>
            </View>
            <Btn
              label={level < TOTAL_LEVELS ? 'NEXT' : 'FINISH'}
              variant="gold"
              onPress={nextLevel}
            />
            <Btn label="RETRY" variant="secondary" onPress={retry} />
            <Btn label="HOME" variant="secondary" onPress={goHome} />
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  hud: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  scoreBox: {},
  hudLabel: {
    color: '#ffffff99',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  scoreText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  hudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coinBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00000055',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  coinIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: UI.gold,
    borderWidth: 2.5,
    borderColor: '#ffe9a8',
  },
  coinText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  pauseBtn: {
    flexDirection: 'row',
    gap: 5,
    backgroundColor: '#00000055',
    borderRadius: 20,
    padding: 11,
  },
  pauseBar: {
    width: 5,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  progressTrack: {
    marginTop: 10,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ffffff2e',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 14,
  },
  tapHint: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 4,
    opacity: 0.95,
  },
  subHint: {
    color: '#ffffff99',
    fontSize: 13,
    marginTop: 10,
    letterSpacing: 1,
  },
  dimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000a8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: UI.card,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 30,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: UI.cardBorder,
    minWidth: 280,
  },
  cardTitle: {
    color: UI.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  bigScore: {
    color: UI.text,
    fontSize: 44,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  bestText: {
    color: UI.textDim,
    fontSize: 15,
    fontWeight: '700',
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  coinEarned: {
    color: UI.gold,
    fontSize: 18,
    fontWeight: '800',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 14,
    marginVertical: 4,
  },
  star: {
    fontSize: 44,
    color: UI.gold,
  },
  starDim: {
    color: '#3a4270',
  },
});
