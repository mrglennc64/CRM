import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Brand } from '../brands';

export const CTAScreen: React.FC<{ text: string; brand: Brand }> = ({ text, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const pillSpring = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 100 } });

  return (
    <AbsoluteFill style={{
      backgroundColor: brand.palette.accent,
      padding: 80,
      justifyContent: 'center',
      alignItems: 'flex-start',
    }}>
      {/* Big headline */}
      <div style={{
        fontSize: 96, fontWeight: 900, lineHeight: 1.05,
        color: brand.mode === 'dark' ? '#000' : brand.palette.bg,
        letterSpacing: -2, opacity: fadeIn,
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        {text}
      </div>

      {/* URL pill */}
      <div style={{
        marginTop: 60,
        padding: '24px 48px',
        borderRadius: 999,
        backgroundColor: brand.palette.bg,
        color: brand.palette.ink,
        fontSize: 44, fontWeight: 700,
        transform: `scale(${pillSpring})`,
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        → {brand.url}
      </div>
    </AbsoluteFill>
  );
};
