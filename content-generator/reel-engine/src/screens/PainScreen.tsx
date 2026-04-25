import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { Brand } from '../brands';

export const PainScreen: React.FC<{ text: string; brand: Brand }> = ({ text, brand }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const slideX = interpolate(frame, [0, 22], [-60, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      backgroundColor: brand.palette.bg,
      padding: 80,
      justifyContent: 'center',
    }}>
      <div style={{
        fontSize: 24, fontWeight: 700, letterSpacing: 3,
        textTransform: 'uppercase', color: brand.palette.alert,
        marginBottom: 32, opacity: fadeIn,
      }}>
        The problem
      </div>

      <div style={{
        fontSize: 68, fontWeight: 800, lineHeight: 1.2,
        color: brand.palette.ink, letterSpacing: -1,
        transform: `translateX(${slideX}px)`, opacity: fadeIn,
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};
