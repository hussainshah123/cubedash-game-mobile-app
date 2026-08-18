import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Group,
  LinearGradient,
  RoundedRect,
  Rect,
  vec,
  useClock,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

const CUBES = [
  { x: 0.12, y: 0.16, s: 34, spin: 0.35, drift: 22, color: '#4d7bff' },
  { x: 0.82, y: 0.12, s: 26, spin: -0.5, drift: 16, color: '#00e0b0' },
  { x: 0.72, y: 0.4, s: 40, spin: 0.22, drift: 26, color: '#ff6bd6' },
  { x: 0.18, y: 0.58, s: 22, spin: -0.4, drift: 18, color: '#ffcf4d' },
  { x: 0.88, y: 0.72, s: 30, spin: 0.45, drift: 24, color: '#9b5bff' },
  { x: 0.3, y: 0.85, s: 26, spin: -0.3, drift: 20, color: '#4dffe1' },
];

function FloatingCube({
  clock,
  cfg,
  w,
  h,
}: {
  clock: SharedValue<number>;
  cfg: (typeof CUBES)[number];
  w: number;
  h: number;
}) {
  const transform = useDerivedValue(() => {
    const t = clock.value / 1000;
    return [
      { translateX: cfg.x * w + Math.sin(t * 0.6 + cfg.x * 9) * cfg.drift },
      { translateY: cfg.y * h + Math.cos(t * 0.5 + cfg.y * 7) * cfg.drift },
      { rotate: t * cfg.spin },
    ];
  });
  return (
    <Group transform={transform} opacity={0.16}>
      <RoundedRect
        x={-cfg.s / 2}
        y={-cfg.s / 2}
        width={cfg.s}
        height={cfg.s}
        r={cfg.s * 0.22}
        color={cfg.color}
      />
    </Group>
  );
}

export default function MenuBackground() {
  const { width, height } = useWindowDimensions();
  const clock = useClock();
  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, height)}
          colors={['#0b1026', '#141a3d', '#1b1145']}
        />
      </Rect>
      {CUBES.map((cfg, i) => (
        <FloatingCube key={i} clock={clock} cfg={cfg} w={width} h={height} />
      ))}
    </Canvas>
  );
}
