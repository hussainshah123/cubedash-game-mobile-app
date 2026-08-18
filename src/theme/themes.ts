export interface WorldTheme {
  id: number;
  name: string;
  emoji: string;
  /** background gradient, top -> bottom */
  bgTop: string;
  bgMid: string;
  bgBottom: string;
  ground: string;
  groundLine: string;
  obstacle: string;
  obstacleAccent: string;
  particle: string;
  /** distant parallax silhouette color */
  hills: string;
}

export const THEMES: WorldTheme[] = [
  {
    id: 0,
    name: 'Lava',
    emoji: '🌋',
    bgTop: '#2b0a0a',
    bgMid: '#5c1414',
    bgBottom: '#9a2c0f',
    ground: '#3a0f0b',
    groundLine: '#ff6b35',
    obstacle: '#ff4d2e',
    obstacleAccent: '#ffd166',
    particle: '#ff9f45',
    hills: '#471011',
  },
  {
    id: 1,
    name: 'Ice',
    emoji: '❄️',
    bgTop: '#0a1e3f',
    bgMid: '#14477c',
    bgBottom: '#3f8fc9',
    ground: '#0e2c50',
    groundLine: '#9fe8ff',
    obstacle: '#bfefff',
    obstacleAccent: '#5fc9f0',
    particle: '#d9f6ff',
    hills: '#123a66',
  },
  {
    id: 2,
    name: 'Forest',
    emoji: '🌳',
    bgTop: '#0c2415',
    bgMid: '#14502a',
    bgBottom: '#3d8f4e',
    ground: '#0f3018',
    groundLine: '#8fe26e',
    obstacle: '#65c94f',
    obstacleAccent: '#eaff8f',
    particle: '#b6f27d',
    hills: '#12401f',
  },
  {
    id: 3,
    name: 'Space',
    emoji: '🌌',
    bgTop: '#05010f',
    bgMid: '#190a3d',
    bgBottom: '#3d1a6e',
    ground: '#150a2e',
    groundLine: '#b06bff',
    obstacle: '#9b5bff',
    obstacleAccent: '#ff6bd6',
    particle: '#cba1ff',
    hills: '#221046',
  },
  {
    id: 4,
    name: 'Neon',
    emoji: '⚡',
    bgTop: '#050510',
    bgMid: '#0d0d2b',
    bgBottom: '#131347',
    ground: '#0a0a1e',
    groundLine: '#00ffd1',
    obstacle: '#ff2ea6',
    obstacleAccent: '#00ffd1',
    particle: '#4dffe1',
    hills: '#12123a',
  },
  {
    id: 5,
    name: 'Desert',
    emoji: '🏜',
    bgTop: '#3a1c4f',
    bgMid: '#b3502e',
    bgBottom: '#e8a23d',
    ground: '#5b2e17',
    groundLine: '#ffd98a',
    obstacle: '#d97c2b',
    obstacleAccent: '#fff0c2',
    particle: '#ffe0a1',
    hills: '#7c3b1e',
  },
];

export const UI = {
  bg: '#0b1026',
  card: '#171d3d',
  cardBorder: '#262e5c',
  text: '#f2f4ff',
  textDim: '#8b93c4',
  accent: '#4d7bff',
  accentAlt: '#00e0b0',
  gold: '#ffcf4d',
  danger: '#ff4d6b',
};
