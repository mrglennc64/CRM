import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Brand } from '../brands';

/** Pull a punchy $/% number out of the text (e.g. CA$2,000, 10-30%, €47,000). */
function extractBigNumber(text: string): string {
  const money = text.match(/(?:CA\$|US\$|€|\$|£)\s?[\d,]+(?:\.\d+)?/);
  if (money) return money[0].replace(/\s/g, '');
  const pct = text.match(/\d+\s?[–\-]\s?\d+\s?%/);
  if (pct) return pct[0].replace(/\s/g, '');
  const num = text.match(/\d[\d,]*/);
  return num ? num[0] : '!';
}

export const ExampleScreen: React.FC<{ text: string; brand: Brand }> = ({ text, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const bigSpring = spring({ frame, fps, config: { damping: 10, stiffness: 80 } });
  const big = extractBigNumber(text);

  return (
    <AbsoluteFill style={{
      backgroundColor: brand.palette.bg,
      padding: 80,
      justifyContent: 'center',
    }}>
      <div style={{
        fontSize: 24, fontWeight: 700, letterSpacing: 3,
        textTransform: 'uppercase', color: brand.palette.accent2,
        marginBottom: 30, opacity: fadeIn,
      }}>
        Real example
      </div>

      <div style={{
        fontSize: 240, fontWeight: 900, lineHeight: 1,
        color: brand.palette.accent, letterSpacing: -6,
        transform: `scale(${bigSpring})`,
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        {big}
      </div>

      <div style={{
        fontSize: 44, fontWeight: 500, lineHeight: 1.3,
        color: brand.palette.ink_muted, marginTop: 40,
        opacity: fadeIn,
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};
