export interface CubeSkin {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  /** gradient colors, top-left -> bottom-right */
  colors: [string, string];
  border: string;
  eye: string;
  /** trail particle color */
  trail: string;
}

export const SKINS: CubeSkin[] = [
  {
    id: 'classic',
    name: 'Classic',
    emoji: '🟦',
    cost: 0,
    colors: ['#5b8cff', '#2f5fe0'],
    border: '#dbe6ff',
    eye: '#ffffff',
    trail: '#7ea4ff',
  },
  {
    id: 'fire',
    name: 'Fire',
    emoji: '🔥',
    cost: 100,
    colors: ['#ffb347', '#ff3d2e'],
    border: '#ffe8b0',
    eye: '#fff6e0',
    trail: '#ff8c42',
  },
  {
    id: 'ice',
    name: 'Ice',
    emoji: '❄️',
    cost: 150,
    colors: ['#d9f6ff', '#5fc9f0'],
    border: '#ffffff',
    eye: '#0e2c50',
    trail: '#aee9ff',
  },
  {
    id: 'neon',
    name: 'Neon',
    emoji: '⚡',
    cost: 200,
    colors: ['#00ffd1', '#00a3ff'],
    border: '#b8fff1',
    eye: '#04122e',
    trail: '#4dffe1',
  },
  {
    id: 'crystal',
    name: 'Crystal',
    emoji: '💎',
    cost: 300,
    colors: ['#e8d5ff', '#9b5bff'],
    border: '#ffffff',
    eye: '#3d1a6e',
    trail: '#cba1ff',
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    emoji: '🌌',
    cost: 500,
    colors: ['#ff6bd6', '#2a0a6e'],
    border: '#ffd1f3',
    eye: '#ffffff',
    trail: '#ff9de4',
  },
];

export function getSkin(id: string): CubeSkin {
  return SKINS.find(s => s.id === id) ?? SKINS[0];
}
