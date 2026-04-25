// Mirror of brands.json palette — kept in TS for type safety in compositions.
export type BrandMode = 'dark' | 'light';

export interface BrandPalette {
  bg: string;
  surface: string;
  ink: string;
  ink_muted: string;
  accent: string;
  accent2: string;
  alert: string;
}

export interface Brand {
  name: string;
  url: string;
  audience: 'artist' | 'publisher';
  voice: 'forensic' | 'emotional';
  cta: string;
  mode: BrandMode;
  palette: BrandPalette;
}

export const BRANDS: Record<string, Brand> = {
  'heyroya': {
    name: 'HeyRoya',
    url: 'heyroya.se',
    audience: 'publisher',
    voice: 'forensic',
    cta: 'Get your free Metadata Health Audit — heyroya.se',
    mode: 'dark',
    palette: {
      bg: '#0A0A0A', surface: '#1A1A1A', ink: '#E0E0E0', ink_muted: '#9CA3AF',
      accent: '#22D3EE', accent2: '#FBBF24', alert: '#F43F5E',
    },
  },
  'trp-pro': {
    name: 'TrapRoyaltiesPro',
    url: 'traproyaltiespro.com',
    audience: 'publisher',
    voice: 'forensic',
    cta: 'Get your free Metadata Health Audit — traproyaltiespro.com',
    mode: 'dark',
    palette: {
      bg: '#020617', surface: '#1E293B', ink: '#F1F5F9', ink_muted: '#CBD5E1',
      accent: '#6366F1', accent2: '#FACC15', alert: '#F43F5E',
    },
  },
  'verseiq': {
    name: 'VerseIQ',
    url: 'useverseiq.com',
    audience: 'artist',
    voice: 'emotional',
    cta: 'Free catalog scan — useverseiq.com',
    mode: 'light',
    palette: {
      bg: '#FCFEFD', surface: '#D8EEE6', ink: '#111413', ink_muted: '#57625F',
      accent: '#73BCA8', accent2: '#9C7D42', alert: '#B55A66',
    },
  },
  'traproyalties': {
    name: 'TrapRoyalties',
    url: 'traproyalties.com',
    audience: 'artist',
    voice: 'emotional',
    cta: 'Scan your catalog for free — traproyalties.com',
    mode: 'dark',
    palette: {
      bg: '#020818', surface: '#0B1F4E', ink: '#E7ECFF', ink_muted: '#C5CDEE',
      accent: '#5E6DFF', accent2: '#7C65FF', alert: '#F43F5E',
    },
  },
};
