import {
  BASE_SPEED,
  BLOCK_SIZE,
  COIN_R,
  GROUND_Y,
  LEVELS_PER_WORLD,
  SAW_R,
  SPEED_PER_WORLD,
  SPIKE_H,
  SPIKE_W,
  LASER_H,
} from './constants';
import type { Coin, LevelData, Obstacle } from './types';

/** Deterministic RNG so every level is identical on every run/device. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type PatternId =
  | 'spike1'
  | 'spike2'
  | 'spike3'
  | 'spikePair'
  | 'movingSpike'
  | 'saw'
  | 'sawHigh'
  | 'laser'
  | 'fallingBlock';

function patternsForLevel(level: number): PatternId[] {
  const p: PatternId[] = ['spike1', 'spike1', 'spike2'];
  if (level >= 4) p.push('spike3', 'spikePair');
  if (level >= 10) p.push('movingSpike', 'movingSpike');
  if (level >= 20) p.push('saw', 'saw', 'sawHigh');
  if (level >= 30) p.push('fallingBlock');
  if (level >= 40) p.push('laser', 'laser');
  if (level >= 60) p.push('movingSpike', 'saw', 'laser');
  return p;
}

function coinArc(coins: Coin[], centerX: number, topY: number, count: number) {
  const spread = 46;
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1) - 0.5; // -0.5 .. 0.5
    coins.push({
      x: centerX + t * spread * count,
      y: topY - Math.cos(t * Math.PI) * 34,
    });
  }
}

function coinLine(coins: Coin[], startX: number, y: number, count: number) {
  for (let i = 0; i < count; i++) {
    coins.push({ x: startX + i * 40, y });
  }
}

export function generateLevel(level: number): LevelData {
  const world = Math.min(5, Math.floor((level - 1) / LEVELS_PER_WORLD));
  const rnd = mulberry32(level * 7919 + 17);

  const speed =
    BASE_SPEED + world * SPEED_PER_WORLD + ((level - 1) % LEVELS_PER_WORLD) * 2;
  const length = Math.min(8200, 2600 + level * 85);

  const obstacles: Obstacle[] = [];
  const coins: Coin[] = [];
  const pool = patternsForLevel(level);

  // difficulty 0..1 across all levels — shrinks gaps between patterns
  const diff = Math.min(1, level / 60);
  const minGap = speed * (1.55 - 0.45 * diff);
  const maxGap = speed * (2.4 - 0.7 * diff);

  let x = speed * 2.2; // breathing room at the start
  while (x < length - speed * 2.5) {
    const pick = pool[Math.floor(rnd() * pool.length)];

    switch (pick) {
      case 'spike1': {
        obstacles.push(spike(x));
        coinArc(coins, x + SPIKE_W / 2, GROUND_Y - SPIKE_H - 30, 3);
        x += SPIKE_W;
        break;
      }
      case 'spike2': {
        obstacles.push(spike(x), spike(x + SPIKE_W));
        coinArc(coins, x + SPIKE_W, GROUND_Y - SPIKE_H - 34, 3);
        x += SPIKE_W * 2;
        break;
      }
      case 'spike3': {
        obstacles.push(spike(x), spike(x + SPIKE_W), spike(x + SPIKE_W * 2));
        coinArc(coins, x + SPIKE_W * 1.5, GROUND_Y - SPIKE_H - 40, 3);
        x += SPIKE_W * 3;
        break;
      }
      case 'spikePair': {
        // two singles with a landing gap between them — rhythm jump
        const gap = speed * (0.78 - 0.12 * diff);
        obstacles.push(spike(x), spike(x + SPIKE_W + gap));
        coinLine(coins, x + SPIKE_W + gap * 0.28, GROUND_Y - SPIKE_H - 44, 2);
        x += SPIKE_W * 2 + gap;
        break;
      }
      case 'movingSpike': {
        const range = 34 + rnd() * 30;
        obstacles.push({
          type: 'movingSpike',
          x: x + range,
          y: GROUND_Y - SPIKE_H,
          w: SPIKE_W,
          h: SPIKE_H,
          a: range,
          b: 2.2 + rnd() * 1.6,
        });
        coinArc(coins, x + range + SPIKE_W / 2, GROUND_Y - SPIKE_H - 42, 3);
        x += range * 2 + SPIKE_W;
        break;
      }
      case 'saw': {
        obstacles.push({
          type: 'saw',
          x: x + SAW_R,
          y: GROUND_Y - SAW_R + 6,
          w: SAW_R * 2,
          h: SAW_R * 2,
          a: 5 + rnd() * 3,
          b: 0,
        });
        coinArc(coins, x + SAW_R, GROUND_Y - SAW_R * 2 - 34, 3);
        x += SAW_R * 2;
        break;
      }
      case 'sawHigh': {
        // hangs low enough that you must NOT jump — run under it
        obstacles.push({
          type: 'saw',
          x: x + SAW_R,
          y: GROUND_Y - 104,
          w: SAW_R * 2,
          h: SAW_R * 2,
          a: -(5 + rnd() * 3),
          b: 0,
        });
        coinLine(coins, x + SAW_R - 20, GROUND_Y - 22, 2);
        x += SAW_R * 2;
        break;
      }
      case 'laser': {
        const w = 190 + rnd() * 90;
        obstacles.push({
          type: 'laser',
          x,
          y: GROUND_Y - 34,
          w,
          h: LASER_H,
          a: 1.5 + rnd() * 0.7, // on/off period (s)
          b: rnd() * 2, // phase
        });
        coinLine(coins, x + 20, GROUND_Y - 96, Math.floor(w / 44));
        x += w;
        break;
      }
      case 'fallingBlock': {
        obstacles.push({
          type: 'fallingBlock',
          x,
          y: GROUND_Y - 330,
          w: BLOCK_SIZE,
          h: BLOCK_SIZE,
          a: 0,
          b: speed * 1.05, // trigger distance
        });
        x += BLOCK_SIZE;
        break;
      }
    }

    x += minGap + rnd() * (maxGap - minGap);

    // occasional free coin trail on open ground
    if (rnd() < 0.22 && x < length - speed * 3) {
      coinLine(coins, x, GROUND_Y - 26 - COIN_R, 3);
      x += 40 * 3 + speed * 0.7;
    }
  }

  return { level, world, length, speed, obstacles, coins };
}

function spike(x: number): Obstacle {
  return {
    type: 'spike',
    x,
    y: GROUND_Y - SPIKE_H,
    w: SPIKE_W,
    h: SPIKE_H,
    a: 0,
    b: 0,
  };
}
