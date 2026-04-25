import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { Brand } from '../brands';

export const FixScreen: React.FC<{ text: string; brand: Brand }> = ({ text, brand }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const slideY = interpolate(frame, [0, 22], [40, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      backgroundColor: brand.palette.bg,
      padding: 80,
      justifyContent: 'center',
    }}>
      <div style={{
        fontSize: 24, fontWeight: 700, letterSpacing: 3,
        textTransform: 'uppercase', color: brand.palette.accent,
        marginBottom: 32, opacity: fadeIn,
      }}>
        The fix
      </div>

      <div style={{
        fontSize: 76, fontWeight: 800, lineHeight: 1.15,
        color: brand.palette.ink, letterSpacing: -1,
        transform: `translateY(${slideY}px)`, opacity: fadeIn,
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};
