export type ObstacleType =
  | 'spike'
  | 'movingSpike'
  | 'saw'
  | 'laser'
  | 'fallingBlock';

export interface Obstacle {
  type: ObstacleType;
  /** world x of the obstacle's anchor (left edge for rects, center for saws) */
  x: number;
  /** world y (top edge for rects, center for saws). Ground-relative values are precomputed. */
  y: number;
  w: number;
  h: number;
  /** movingSpike: oscillation range px; saw: spin speed rad/s; laser: on/off period s */
  a: number;
  /** movingSpike: oscillation speed rad/s; laser: phase offset s; fallingBlock: trigger distance px */
  b: number;
}

export interface Coin {
  x: number;
  y: number;
}

export interface LevelData {
  level: number;
  world: number;
  length: number;
  speed: number;
  obstacles: Obstacle[];
  coins: Coin[];
}

export type RunPhase = 'ready' | 'playing' | 'dead' | 'complete';
