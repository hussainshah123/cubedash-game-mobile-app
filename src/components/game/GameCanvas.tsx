import React, { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Path,
  Rect,
  RoundedRect,
  Skia,
  BlurMask,
  vec,
  type SkPath,
} from '@shopify/react-native-skia';
import {
  GestureDetector,
  useLongPressGesture,
} from 'react-native-gesture-handler';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import {
  COIN_R,
  COYOTE_TIME,
  CUBE_SIZE,
  GRAVITY,
  GROUND_Y,
  HITBOX_INSET,
  HOLD_GRAVITY,
  JUMP_BUFFER,
  JUMP_CUT_VELOCITY,
  JUMP_VELOCITY,
  MAX_FALL_SPEED,
  PLAYER_X,
  SAW_R,
  SCORE_PER_COIN,
  SCORE_PER_PX,
  SCREEN_H,
  SCREEN_W,
} from '../../game/constants';
import type { LevelData, Obstacle } from '../../game/types';
import type { CubeSkin } from '../../game/skins';
import type { WorldTheme } from '../../theme/themes';
import { SoundManager } from '../../audio/SoundManager';

export interface EngineHandles {
  scoreText: SharedValue<string>;
  coinText: SharedValue<string>;
  progress: SharedValue<number>;
}

interface Props {
  data: LevelData;
  skin: CubeSkin;
  theme: WorldTheme;
  paused: SharedValue<boolean>;
  handles: EngineHandles;
  onStart: () => void;
  onDeath: (score: number, coins: number) => void;
  onComplete: (score: number, coins: number) => void;
}

const POOL = 30;

interface ParticleSlot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  born: number;
  life: number;
  size: number;
  color: string;
}

function makePool(): ParticleSlot[] {
  return Array.from({ length: POOL }, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    g: 0,
    born: -1,
    life: 1,
    size: 3,
    color: '#ffffff',
  }));
}

// ---------- static path builders (built once per level) ----------

function buildSpikesPath(obstacles: Obstacle[]): SkPath {
  const p = Skia.Path.Make();
  for (const o of obstacles) {
    if (o.type !== 'spike') continue;
    p.moveTo(o.x, o.y + o.h);
    p.lineTo(o.x + o.w / 2, o.y);
    p.lineTo(o.x + o.w, o.y + o.h);
    p.close();
  }
  return p;
}

function buildSpikeShape(w: number, h: number): SkPath {
  const p = Skia.Path.Make();
  p.moveTo(0, h);
  p.lineTo(w / 2, 0);
  p.lineTo(w, h);
  p.close();
  return p;
}

function buildSawPath(r: number): SkPath {
  const p = Skia.Path.Make();
  const teeth = 8;
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = ((i + 0.5) / teeth) * Math.PI * 2;
    const a2 = ((i + 1) / teeth) * Math.PI * 2;
    p.moveTo(Math.cos(a0) * r * 0.72, Math.sin(a0) * r * 0.72);
    p.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    p.lineTo(Math.cos(a2) * r * 0.72, Math.sin(a2) * r * 0.72);
    p.close();
  }
  return p;
}

function buildTicksPath(length: number): SkPath {
  const p = Skia.Path.Make();
  for (let x = -200; x < length + SCREEN_W; x += 96) {
    p.addRect(Skia.XYWHRect(x, GROUND_Y + 18, 30, 5));
  }
  return p;
}

function buildHillsPath(): SkPath {
  // one repeating parallax silhouette, wide enough to tile by translation
  const p = Skia.Path.Make();
  const period = SCREEN_W * 1.6;
  const base = GROUND_Y + 2;
  for (let rep = 0; rep < 3; rep++) {
    const off = rep * period;
    p.moveTo(off, base);
    p.lineTo(off + period * 0.18, base - 150);
    p.lineTo(off + period * 0.34, base - 60);
    p.lineTo(off + period * 0.52, base - 190);
    p.lineTo(off + period * 0.7, base - 80);
    p.lineTo(off + period * 0.86, base - 140);
    p.lineTo(off + period, base);
    p.close();
  }
  return p;
}

function buildDotsPath(seedNum: number): SkPath {
  const p = Skia.Path.Make();
  let s = seedNum;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const period = SCREEN_W * 2;
  for (let i = 0; i < 46; i++) {
    const x = rnd() * period;
    const y = rnd() * GROUND_Y * 0.85;
    const r = 1 + rnd() * 2.2;
    p.addCircle(x, y, r);
    p.addCircle(x + period, y, r);
  }
  return p;
}

const SAW_PATH = buildSawPath(SAW_R);
const HILLS_PATH = buildHillsPath();
const DOTS_PATH = buildDotsPath(77);

// ---------------- sub-components ----------------

function MovingSpike({
  o,
  clock,
  theme,
}: {
  o: Obstacle;
  clock: SharedValue<number>;
  theme: WorldTheme;
}) {
  const shape = useMemo(() => buildSpikeShape(o.w, o.h), [o.w, o.h]);
  const transform = useDerivedValue(() => [
    { translateX: o.x + Math.sin(clock.value * o.b) * o.a },
    { translateY: o.y },
  ]);
  return (
    <Group transform={transform}>
      <Path path={shape} color={theme.obstacle} />
      <Path
        path={shape}
        color={theme.obstacleAccent}
        style="stroke"
        strokeWidth={2}
      />
    </Group>
  );
}

function Saw({
  o,
  clock,
  theme,
}: {
  o: Obstacle;
  clock: SharedValue<number>;
  theme: WorldTheme;
}) {
  const transform = useDerivedValue(() => [
    { translateX: o.x },
    { translateY: o.y },
    { rotate: clock.value * o.a },
  ]);
  return (
    <Group transform={transform}>
      <Path path={SAW_PATH} color={theme.obstacleAccent} />
      <Circle cx={0} cy={0} r={SAW_R * 0.72} color={theme.obstacle} />
      <Circle cx={0} cy={0} r={SAW_R * 0.2} color={theme.obstacleAccent} />
      <Circle
        cx={0}
        cy={0}
        r={SAW_R * 0.72}
        color="#00000055"
        style="stroke"
        strokeWidth={3}
      />
    </Group>
  );
}

function Laser({
  o,
  clock,
  theme,
}: {
  o: Obstacle;
  clock: SharedValue<number>;
  theme: WorldTheme;
}) {
  const beamOpacity = useDerivedValue(() => {
    const active = ((clock.value + o.b) % (o.a * 2)) < o.a;
    return active ? 0.75 + 0.25 * Math.sin(clock.value * 42) : 0.1;
  });
  return (
    <Group>
      <RoundedRect
        x={o.x - 10}
        y={o.y - 8}
        width={12}
        height={o.h + 16}
        r={3}
        color={theme.obstacleAccent}
      />
      <RoundedRect
        x={o.x + o.w - 2}
        y={o.y - 8}
        width={12}
        height={o.h + 16}
        r={3}
        color={theme.obstacleAccent}
      />
      <Group opacity={beamOpacity}>
        <Rect
          x={o.x}
          y={o.y - 2}
          width={o.w}
          height={o.h + 4}
          color={theme.obstacle}
        >
          <BlurMask blur={8} style="normal" />
        </Rect>
        <Rect
          x={o.x}
          y={o.y + 2}
          width={o.w}
          height={o.h - 4}
          color="#ffffff"
        />
      </Group>
    </Group>
  );
}

function FallingBlock({
  o,
  fallIndex,
  fallOffsets,
  theme,
}: {
  o: Obstacle;
  fallIndex: number;
  fallOffsets: SharedValue<number[]>;
  theme: WorldTheme;
}) {
  const transform = useDerivedValue(() => [
    { translateY: fallOffsets.value[fallIndex] ?? 0 },
  ]);
  return (
    <Group transform={transform}>
      <RoundedRect
        x={o.x}
        y={o.y}
        width={o.w}
        height={o.h}
        r={6}
        color={theme.obstacle}
      />
      <RoundedRect
        x={o.x}
        y={o.y}
        width={o.w}
        height={o.h}
        r={6}
        color={theme.obstacleAccent}
        style="stroke"
        strokeWidth={3}
      />
      <Circle
        cx={o.x + o.w / 2}
        cy={o.y + o.h / 2}
        r={7}
        color={theme.obstacleAccent}
      />
    </Group>
  );
}

function CoinDot({
  index,
  x,
  y,
  flags,
}: {
  index: number;
  x: number;
  y: number;
  flags: SharedValue<number[]>;
}) {
  const opacity = useDerivedValue(() =>
    flags.value[index] ? 0 : 1,
  );
  return (
    <Group opacity={opacity}>
      <Circle cx={x} cy={y} r={COIN_R} color="#ffcf4d" />
      <Circle cx={x} cy={y} r={COIN_R - 4.5} color="#ffe9a8" />
      <Circle cx={x - 3} cy={y - 4} r={2.4} color="#ffffff" />
    </Group>
  );
}

function Particle({
  index,
  particles,
  clock,
}: {
  index: number;
  particles: SharedValue<ParticleSlot[]>;
  clock: SharedValue<number>;
}) {
  const cx = useDerivedValue(() => {
    const s = particles.value[index];
    const t = clock.value - s.born;
    return s.x + s.vx * t;
  });
  const cy = useDerivedValue(() => {
    const s = particles.value[index];
    const t = clock.value - s.born;
    return s.y + s.vy * t + 0.5 * s.g * t * t;
  });
  const r = useDerivedValue(() => {
    const s = particles.value[index];
    const t = clock.value - s.born;
    if (s.born < 0 || t >= s.life) return 0;
    return Math.max(0.1, s.size * (1 - (t / s.life) * 0.7));
  });
  const opacity = useDerivedValue(() => {
    const s = particles.value[index];
    const t = clock.value - s.born;
    if (s.born < 0 || t >= s.life) return 0;
    return 1 - t / s.life;
  });
  const color = useDerivedValue(() => particles.value[index].color);
  return <Circle cx={cx} cy={cy} r={r} opacity={opacity} color={color} />;
}

// ---------------- main canvas ----------------

export default function GameCanvas({
  data,
  skin,
  theme,
  paused,
  handles,
  onStart,
  onDeath,
  onComplete,
}: Props) {
  const { obstacles, coins, speed, length } = data;

  // parallel array: index into fallOffsets for fallingBlocks, -1 otherwise
  const { fallIndexes, fallCount } = useMemo(() => {
    let n = 0;
    const idx = obstacles.map(o => (o.type === 'fallingBlock' ? n++ : -1));
    return { fallIndexes: idx, fallCount: n };
  }, [obstacles]);

  const spikesPath = useMemo(
    () => buildSpikesPath(obstacles),
    [obstacles],
  );
  const ticksPath = useMemo(() => buildTicksPath(length), [length]);

  const flagPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(length + 8, GROUND_Y - 210);
    p.lineTo(length + 78, GROUND_Y - 186);
    p.lineTo(length + 8, GROUND_Y - 162);
    p.close();
    return p;
  }, [length]);

  // ---- engine state ----
  const clock = useSharedValue(0);
  const cameraX = useSharedValue(0);
  const cubeY = useSharedValue(GROUND_Y - CUBE_SIZE);
  const vy = useSharedValue(0);
  const rot = useSharedValue(0);
  const squash = useSharedValue(0);
  const grounded = useSharedValue(1);
  const pressed = useSharedValue(0);
  const jumpBufferedAt = useSharedValue(-10);
  const lastGroundedAt = useSharedValue(0);
  const phase = useSharedValue(0); // 0 ready, 1 playing, 2 dead, 3 complete
  const shake = useSharedValue(0);
  const coinsCollected = useSharedValue(0);
  const coinFlags = useSharedValue<number[]>(coins.map(() => 0));
  const fallOffsets = useSharedValue<number[]>(
    Array.from({ length: fallCount }, () => 0),
  );
  const lastDust = useSharedValue(0);
  const lastFirework = useSharedValue(0);
  const nextParticle = useSharedValue(0);
  const seed = useSharedValue(1234567);
  const particles = useSharedValue<ParticleSlot[]>(makePool());

  const playJump = useCallback(() => SoundManager.play('jump'), []);
  const playCoin = useCallback(() => SoundManager.play('coin'), []);
  const playExplosion = useCallback(() => SoundManager.play('explosion'), []);

  const rnd = useCallback(
    () => {
      'worklet';
      let s = seed.value | 0;
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      seed.value = s | 0;
      return ((s >>> 0) % 100000) / 100000;
    },
    [seed],
  );

  const spawnBurst = useCallback(
    (
      x: number,
      y: number,
      count: number,
      colors: string[],
      speedMin: number,
      speedMax: number,
      life: number,
      size: number,
      g: number,
      upward: boolean,
    ) => {
      'worklet';
      const t = clock.value;
      particles.modify(arr => {
        for (let k = 0; k < count; k++) {
          const i = nextParticle.value;
          nextParticle.value = (i + 1) % POOL;
          const ang = upward
            ? -Math.PI * (0.15 + 0.7 * rnd())
            : rnd() * Math.PI * 2;
          const sp = speedMin + rnd() * (speedMax - speedMin);
          const slot = arr[i];
          slot.x = x;
          slot.y = y;
          slot.vx = Math.cos(ang) * sp;
          slot.vy = Math.sin(ang) * sp;
          slot.g = g;
          slot.born = t;
          slot.life = life * (0.7 + 0.6 * rnd());
          slot.size = size * (0.7 + 0.6 * rnd());
          slot.color = colors[Math.floor(rnd() * colors.length)];
        }
        return arr;
      });
    },
    [clock, particles, nextParticle, rnd],
  );

  const reportDeath = useCallback(
    (score: number, c: number) => {
      playExplosion();
      onDeath(score, c);
    },
    [playExplosion, onDeath],
  );

  const groundTop = GROUND_Y - CUBE_SIZE;

  useFrameCallback(info => {
    const dtms = info.timeSincePreviousFrame ?? 16;
    let dt = Math.min(dtms / 1000, 1 / 30);
    if (paused.value) return;

    const ph = phase.value;
    if (ph === 0) return;

    clock.value += dt;
    const t = clock.value;
    shake.value = Math.max(0, shake.value - dt * 1.8);

    if (ph === 2) return; // dead: particles/clock only

    if (ph === 3) {
      // fireworks over the finish
      if (t - lastFirework.value > 0.42) {
        lastFirework.value = t;
        spawnBurst(
          SCREEN_W * (0.25 + rnd() * 0.5),
          SCREEN_H * (0.18 + rnd() * 0.3),
          9,
          ['#ffcf4d', '#ff6bd6', '#4dffe1', '#ffffff', skin.trail],
          60,
          230,
          0.9,
          4.5,
          220,
          false,
        );
      }
      return;
    }

    // ---- playing ----
    cameraX.value += speed * dt;

    // buffered jump
    const canJump =
      grounded.value === 1 ||
      (t - lastGroundedAt.value < COYOTE_TIME && vy.value >= 0);
    if (t - jumpBufferedAt.value <= JUMP_BUFFER && canJump) {
      jumpBufferedAt.value = -10;
      vy.value = JUMP_VELOCITY;
      grounded.value = 0;
      squash.value = -0.9;
      spawnBurst(
        PLAYER_X + CUBE_SIZE / 2,
        GROUND_Y - 4,
        4,
        [theme.particle, '#ffffff'],
        30,
        90,
        0.4,
        3.5,
        500,
        true,
      );
      scheduleOnRN(playJump);
    }

    // gravity (reduced while holding on the way up -> high jump)
    const g = pressed.value === 1 && vy.value < 0 ? HOLD_GRAVITY : GRAVITY;
    vy.value = Math.min(vy.value + g * dt, MAX_FALL_SPEED);
    cubeY.value += vy.value * dt;

    if (cubeY.value >= groundTop) {
      cubeY.value = groundTop;
      if (grounded.value === 0) {
        // landing: snap rotation, squash, dust
        rot.value =
          Math.round(rot.value / (Math.PI / 2)) * (Math.PI / 2);
        squash.value = 0.85;
        spawnBurst(
          PLAYER_X + CUBE_SIZE / 2,
          GROUND_Y - 3,
          5,
          [theme.particle],
          40,
          110,
          0.35,
          3,
          400,
          true,
        );
      }
      vy.value = 0;
      grounded.value = 1;
      lastGroundedAt.value = t;
    } else {
      grounded.value = 0;
      rot.value += dt * 4.4;
    }

    squash.value += (0 - squash.value) * Math.min(1, dt * 10);

    // running dust trail
    if (grounded.value === 1 && t - lastDust.value > 0.07) {
      lastDust.value = t;
      spawnBurst(
        PLAYER_X + 4,
        GROUND_Y - 5,
        1,
        [theme.particle, skin.trail],
        30,
        70,
        0.45,
        3,
        -60,
        true,
      );
    }

    // ---- collisions ----
    const wx = cameraX.value + PLAYER_X + HITBOX_INSET;
    const wy = cubeY.value + HITBOX_INSET;
    const sz = CUBE_SIZE - HITBOX_INSET * 2;
    let died = false;

    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      if (o.x + o.w + 200 < wx) continue;
      if (o.x - 700 > wx + sz) break;

      let hit = false;
      if (o.type === 'spike' || o.type === 'movingSpike') {
        const ox =
          o.type === 'movingSpike'
            ? o.x + Math.sin(t * o.b) * o.a
            : o.x;
        const bx0 = ox + o.w * 0.3;
        const bx1 = ox + o.w * 0.7;
        const by0 = o.y + o.h * 0.42;
        const by1 = o.y + o.h;
        hit = wx < bx1 && wx + sz > bx0 && wy < by1 && wy + sz > by0;
      } else if (o.type === 'saw') {
        const r = SAW_R * 0.8;
        const px = Math.max(wx, Math.min(o.x, wx + sz));
        const py = Math.max(wy, Math.min(o.y, wy + sz));
        const dx = o.x - px;
        const dy = o.y - py;
        hit = dx * dx + dy * dy < r * r;
      } else if (o.type === 'laser') {
        const active = ((t + o.b) % (o.a * 2)) < o.a;
        if (active) {
          hit =
            wx < o.x + o.w &&
            wx + sz > o.x &&
            wy < o.y + o.h &&
            wy + sz > o.y;
        }
      } else if (o.type === 'fallingBlock') {
        const fi = fallIndexes[i];
        const maxFall = GROUND_Y - o.h - o.y;
        const off = fallOffsets.value[fi] ?? 0;
        if (off === 0 && wx + sz + o.b > o.x) {
          fallOffsets.modify(a => {
            a[fi] = 0.001;
            return a;
          });
        } else if (off > 0 && off < maxFall) {
          fallOffsets.modify(a => {
            a[fi] = Math.min(a[fi] + 1400 * dt, maxFall);
            return a;
          });
        }
        const oy = o.y + (fallOffsets.value[fi] ?? 0);
        hit =
          wx < o.x + o.w - 4 &&
          wx + sz > o.x + 4 &&
          wy < oy + o.h - 4 &&
          wy + sz > oy + 4;
      }

      if (hit) {
        died = true;
        break;
      }
    }

    if (died) {
      phase.value = 2;
      shake.value = 1;
      spawnBurst(
        PLAYER_X + CUBE_SIZE / 2,
        cubeY.value + CUBE_SIZE / 2,
        16,
        [skin.colors[0], skin.colors[1], '#ffffff', theme.obstacle],
        120,
        420,
        0.8,
        5.5,
        900,
        false,
      );
      const score =
        Math.floor(cameraX.value * SCORE_PER_PX) +
        coinsCollected.value * SCORE_PER_COIN;
      scheduleOnRN(reportDeath, score, coinsCollected.value);
      return;
    }

    // ---- coins ----
    const ccx = wx + sz / 2;
    const ccy = wy + sz / 2;
    const bob = Math.sin(t * 3) * 4;
    for (let i = 0; i < coins.length; i++) {
      const c = coins[i];
      if (c.x < wx - 80 || c.x > wx + sz + 80) continue;
      if (coinFlags.value[i]) continue;
      const dx = c.x - ccx;
      const dy = c.y + bob - ccy;
      const rr = COIN_R + sz * 0.58;
      if (dx * dx + dy * dy < rr * rr) {
        coinFlags.modify(a => {
          a[i] = 1;
          return a;
        });
        coinsCollected.value += 1;
        handles.coinText.value = String(coinsCollected.value);
        spawnBurst(
          c.x - cameraX.value,
          c.y + bob,
          5,
          ['#ffcf4d', '#ffe9a8', '#ffffff'],
          50,
          160,
          0.5,
          3.5,
          150,
          false,
        );
        scheduleOnRN(playCoin);
      }
    }

    // ---- score / progress ----
    handles.scoreText.value = String(
      Math.floor(cameraX.value * SCORE_PER_PX) +
        coinsCollected.value * SCORE_PER_COIN,
    );
    handles.progress.value = Math.min(
      1,
      (cameraX.value + PLAYER_X) / length,
    );

    // ---- finish ----
    if (cameraX.value + PLAYER_X >= length) {
      phase.value = 3;
      handles.progress.value = 1;
      const score =
        Math.floor(cameraX.value * SCORE_PER_PX) +
        coinsCollected.value * SCORE_PER_COIN;
      scheduleOnRN(onComplete, score, coinsCollected.value);
    }
  });

  // ---- input ----
  const gesture = useLongPressGesture({
    minDuration: 1,
    maxDistance: 10000,
    shouldCancelWhenOutside: false,
    onBegin: () => {
      'worklet';
      if (phase.value === 0) {
        phase.value = 1;
        pressed.value = 1;
        scheduleOnRN(onStart);
      } else if (phase.value === 1) {
        pressed.value = 1;
        jumpBufferedAt.value = clock.value;
      }
    },
    onFinalize: () => {
      'worklet';
      pressed.value = 0;
      // early release -> cut the jump short (small jump)
      if (vy.value < JUMP_CUT_VELOCITY) {
        vy.value = JUMP_CUT_VELOCITY;
      }
    },
  });

  // ---- render transforms ----
  const shakeTransform = useDerivedValue(() => {
    const s = shake.value;
    if (s <= 0) return [{ translateX: 0 }, { translateY: 0 }];
    const amp = s * s * 9;
    return [
      { translateX: Math.sin(clock.value * 63) * amp },
      { translateY: Math.cos(clock.value * 71) * amp * 0.8 },
    ];
  });

  const worldTransform = useDerivedValue(() => [
    { translateX: -cameraX.value },
  ]);

  const hillsTransform = useDerivedValue(() => {
    const period = SCREEN_W * 1.6;
    return [{ translateX: -((cameraX.value * 0.25) % period) }];
  });

  const dotsTransform = useDerivedValue(() => {
    const period = SCREEN_W * 2;
    return [{ translateX: -((cameraX.value * 0.1) % period) }];
  });

  const coinsBobTransform = useDerivedValue(() => [
    { translateY: Math.sin(clock.value * 3) * 4 },
  ]);

  const cubeTransform = useDerivedValue(() => {
    const q = squash.value;
    return [
      { translateX: PLAYER_X + CUBE_SIZE / 2 },
      { translateY: cubeY.value + CUBE_SIZE / 2 + q * CUBE_SIZE * 0.12 },
      { rotate: rot.value },
      { scaleX: 1 + q * 0.2 },
      { scaleY: 1 - q * 0.24 },
    ];
  });

  const cubeOpacity = useDerivedValue(() => (phase.value === 2 ? 0 : 1));

  const half = CUBE_SIZE / 2;

  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={styles.canvas}>
        {/* sky */}
        <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, SCREEN_H)}
            colors={[theme.bgTop, theme.bgMid, theme.bgBottom]}
          />
        </Rect>

        <Group transform={shakeTransform}>
          {/* parallax */}
          <Group transform={dotsTransform}>
            <Path path={DOTS_PATH} color="#ffffff" opacity={0.35} />
          </Group>
          <Group transform={hillsTransform}>
            <Path path={HILLS_PATH} color={theme.hills} opacity={0.9} />
          </Group>

          {/* ground (screen space – endless) */}
          <Rect
            x={0}
            y={GROUND_Y}
            width={SCREEN_W}
            height={SCREEN_H - GROUND_Y}
            color={theme.ground}
          />
          <Rect
            x={0}
            y={GROUND_Y}
            width={SCREEN_W}
            height={4}
            color={theme.groundLine}
          />
          <Rect
            x={0}
            y={GROUND_Y}
            width={SCREEN_W}
            height={10}
            color={theme.groundLine}
            opacity={0.25}
          >
            <BlurMask blur={6} style="normal" />
          </Rect>

          {/* world (scrolls with the camera) */}
          <Group transform={worldTransform}>
            <Path
              path={ticksPath}
              color={theme.groundLine}
              opacity={0.28}
            />

            <Path path={spikesPath} color={theme.obstacle} />
            <Path
              path={spikesPath}
              color={theme.obstacleAccent}
              style="stroke"
              strokeWidth={2}
            />

            {obstacles.map((o, i) => {
              if (o.type === 'movingSpike') {
                return (
                  <MovingSpike key={i} o={o} clock={clock} theme={theme} />
                );
              }
              if (o.type === 'saw') {
                return <Saw key={i} o={o} clock={clock} theme={theme} />;
              }
              if (o.type === 'laser') {
                return <Laser key={i} o={o} clock={clock} theme={theme} />;
              }
              if (o.type === 'fallingBlock') {
                return (
                  <FallingBlock
                    key={i}
                    o={o}
                    fallIndex={fallIndexes[i]}
                    fallOffsets={fallOffsets}
                    theme={theme}
                  />
                );
              }
              return null;
            })}

            {/* coins */}
            <Group transform={coinsBobTransform}>
              {coins.map((c, i) => (
                <CoinDot
                  key={i}
                  index={i}
                  x={c.x}
                  y={c.y}
                  flags={coinFlags}
                />
              ))}
            </Group>

            {/* finish */}
            <Rect
              x={length}
              y={GROUND_Y - 210}
              width={8}
              height={210}
              color="#ffffff"
            />
            <Path path={flagPath} color="#ffcf4d" />
            <Rect
              x={length - 2}
              y={GROUND_Y - 214}
              width={16}
              height={218}
              color="#ffffff"
              opacity={0.25}
            >
              <BlurMask blur={10} style="normal" />
            </Rect>
          </Group>

          {/* cube (fixed screen x) */}
          <Group transform={cubeTransform} opacity={cubeOpacity}>
            <RoundedRect
              x={-half}
              y={-half}
              width={CUBE_SIZE}
              height={CUBE_SIZE}
              r={9}
            >
              <LinearGradient
                start={vec(-half, -half)}
                end={vec(half, half)}
                colors={[skin.colors[0], skin.colors[1]]}
              />
            </RoundedRect>
            <RoundedRect
              x={-half}
              y={-half}
              width={CUBE_SIZE}
              height={CUBE_SIZE}
              r={9}
              color={skin.border}
              style="stroke"
              strokeWidth={2.5}
            />
            <RoundedRect
              x={-half * 0.42}
              y={-half * 0.5}
              width={8}
              height={13}
              r={3}
              color={skin.eye}
            />
            <RoundedRect
              x={half * 0.18}
              y={-half * 0.5}
              width={8}
              height={13}
              r={3}
              color={skin.eye}
            />
          </Group>

          {/* particles (screen space) */}
          {Array.from({ length: POOL }, (_, i) => (
            <Particle key={i} index={i} particles={particles} clock={clock} />
          ))}
        </Group>
      </Canvas>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
});
