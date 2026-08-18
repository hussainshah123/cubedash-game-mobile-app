import React from 'react';
import {
  Canvas,
  LinearGradient,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';
import type { CubeSkin } from '../game/skins';

interface Props {
  skin: CubeSkin;
  size: number;
}

/** Mini Skia rendering of the cube — used on Home and the skin shop. */
export default function CubePreview({ skin, size }: Props) {
  const r = size * 0.2;
  const eyeW = size * 0.17;
  const eyeH = size * 0.28;
  const eyeY = size * 0.24;
  return (
    <Canvas style={{ width: size, height: size }}>
      <RoundedRect x={0} y={0} width={size} height={size} r={r}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(size, size)}
          colors={[skin.colors[0], skin.colors[1]]}
        />
      </RoundedRect>
      <RoundedRect
        x={size * 0.026}
        y={size * 0.026}
        width={size * 0.948}
        height={size * 0.948}
        r={r * 0.9}
        color={skin.border}
        style="stroke"
        strokeWidth={size * 0.052}
      />
      <RoundedRect
        x={size * 0.26}
        y={eyeY}
        width={eyeW}
        height={eyeH}
        r={eyeW * 0.4}
        color={skin.eye}
      />
      <RoundedRect
        x={size * 0.6}
        y={eyeY}
        width={eyeW}
        height={eyeH}
        r={eyeW * 0.4}
        color={skin.eye}
      />
    </Canvas>
  );
}
