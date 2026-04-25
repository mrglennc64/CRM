import React from 'react';
import { Composition } from 'remotion';
import { TRTrapReel, FPS, VideoProps } from './Video';
import { BRANDS } from './brands';
import { ParsedScript } from './parseScript';

// Default preview script — used when you run `remotion studio` with no inputProps.
// When rendering, real props are injected via --props or inputProps.
const DEFAULT_SCRIPT: ParsedScript = {
  hook: "You're getting streams but not getting paid.",
  pain: 'Unmatched ISRCs across DSPs. Royalties get stuck in DSP reconciliation. 10-30% leakage is typical.',
  example: 'We scanned a catalog: 12 tracks, CA$2,000 missing due to metadata gaps.',
  fix: 'Clean metadata + align ISRCs across DSPs.',
  cta: 'Scan your catalog for free.',
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TrapReel"
        component={TRTrapReel}
        durationInFrames={20 * FPS}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          script: DEFAULT_SCRIPT,
          brand: BRANDS['traproyalties'],
          audioSrc: '',
        } satisfies VideoProps}
      />
    </>
  );
};
