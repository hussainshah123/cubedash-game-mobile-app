import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SCREEN_W = width;
export const SCREEN_H = height;

// World layout
export const GROUND_Y = Math.round(SCREEN_H * 0.72); // top of the ground
export const CUBE_SIZE = 46;
export const PLAYER_X = Math.round(SCREEN_W * 0.24); // cube's fixed screen x (left edge)

// Physics (px, seconds)
export const GRAVITY = 3000;
export const HOLD_GRAVITY = 1500; // reduced gravity while holding and rising
export const JUMP_VELOCITY = -840;
export const JUMP_CUT_VELOCITY = -380; // cap when released early -> small jump
export const MAX_FALL_SPEED = 1600;
export const COYOTE_TIME = 0.08;
export const JUMP_BUFFER = 0.12;

// Speed
export const BASE_SPEED = 270;
export const SPEED_PER_WORLD = 26;

// Obstacles
export const SPIKE_W = 38;
export const SPIKE_H = 40;
export const SAW_R = 34;
export const LASER_H = 12;
export const BLOCK_SIZE = 52;
export const COIN_R = 13;

// Collision forgiveness (inset of the cube hitbox per side)
export const HITBOX_INSET = 7;

// Scoring
export const SCORE_PER_PX = 1 / 14;
export const SCORE_PER_COIN = 10;

// Run lifecycle
export const DEATH_OVERLAY_DELAY = 900; // ms after explosion before overlay
export const FINISH_OVERLAY_DELAY = 1400;

export const WORLD_COUNT = 6;
export const LEVELS_PER_WORLD = 10;
export const TOTAL_LEVELS = WORLD_COUNT * LEVELS_PER_WORLD;
