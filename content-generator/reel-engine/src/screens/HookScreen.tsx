import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Brand } from '../brands';

export const HookScreen: React.FC<{ text: string; brand: Brand }> = ({ text, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const slideY = interpolate(frame, [0, 20], [40, 0], { extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [0, 18], [0.92, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: brand.palette.bg, padding: 80 }}>
      {/* Top accent bar */}
      <div style={{
        width: 120, height: 8, borderRadius: 4,
        backgroundColor: brand.palette.accent, marginBottom: 40,
        opacity: fadeIn,
      }} />

      {/* Kicker */}
      <div style={{
        fontSize: 28, fontWeight: 700, letterSpacing: 2,
        textTransform: 'uppercase', color: brand.palette.accent,
        marginBottom: 30, opacity: fadeIn,
      }}>
        {brand.name}
      </div>

      {/* The hook text — huge, emotional */}
      <div style={{
        fontSize: 112, fontWeight: 900, lineHeight: 1.05,
        color: brand.palette.ink, letterSpacing: -2,
        transform: `translateY(${slideY}px) scale(${scale})`,
        opacity: fadeIn,
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};
