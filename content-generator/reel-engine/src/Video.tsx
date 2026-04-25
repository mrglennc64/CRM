import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { Brand } from './brands';
import { ParsedScript } from './parseScript';
import { HookScreen } from './screens/HookScreen';
import { PainScreen } from './screens/PainScreen';
import { ExampleScreen } from './screens/ExampleScreen';
import { FixScreen } from './screens/FixScreen';
import { CTAScreen } from './screens/CTAScreen';

export interface VideoProps {
  script: ParsedScript;
  brand: Brand;
  audioSrc: string;
}

export const FPS = 30;
const SECONDS = (s: number) => s * FPS;

function resolveAudio(src: string): string {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return staticFile(src);
}

export const TRTrapReel: React.FC<VideoProps> = ({ script, brand, audioSrc }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: brand.palette.bg, fontFamily: 'Inter, sans-serif' }}>
      {audioSrc ? <Audio src={resolveAudio(audioSrc)} /> : null}

      <Sequence from={0} durationInFrames={SECONDS(2)}>
        <HookScreen text={script.hook} brand={brand} />
      </Sequence>

      <Sequence from={SECONDS(2)} durationInFrames={SECONDS(5)}>
        <PainScreen text={script.pain} brand={brand} />
      </Sequence>

      <Sequence from={SECONDS(7)} durationInFrames={SECONDS(5)}>
        <ExampleScreen text={script.example} brand={brand} />
      </Sequence>

      <Sequence from={SECONDS(12)} durationInFrames={SECONDS(4)}>
        <FixScreen text={script.fix} brand={brand} />
      </Sequence>

      <Sequence from={SECONDS(16)} durationInFrames={SECONDS(4)}>
        <CTAScreen text={script.cta} brand={brand} />
      </Sequence>
    </AbsoluteFill>
  );
};
