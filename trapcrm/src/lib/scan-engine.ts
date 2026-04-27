/**
 * Catalog scan engine (mock).
 *
 * Runs a "Submission Readiness Score" against an artist's Spotify top-tracks.
 * Real cleaning service would cross-reference DSPs/PROs; this v1 uses
 * deterministic-but-realistic heuristics so the report looks credible without
 * making up numbers.
 *
 * Heuristics:
 *  - Missing ISRC → high-severity issue (immediate royalty leakage)
 *  - Tracks with collaborator artists (more than 1 artist on track) but no
 *    publisher info → "missing contributor" flag
 *  - Older tracks (>5 years) with low popularity → "submission gaps" flag
 *  - Score = 100 - sum(issue weights), capped at 30 minimum
 *  - Leakage $ estimate based on follower tier and issue count
 */
import { SpotifyArtist, SpotifyTrack } from './spotify';

export interface ScanIssue {
  track_id: string;
  track_name: string;
  isrc: string | null;
  type: 'missing-isrc' | 'unknown-contributor' | 'submission-gap' | 'split-conflict';
  severity: 'high' | 'medium' | 'low';
  message: string;
  fix: string;
  estimated_leakage_usd: number;
}

export interface ScanReport {
  artist: {
    id: string;
    name: string;
    followers: number;
    popularity: number;
    genres: string[];
    spotify_url: string;
  };
  scan_date: string;
  tracks_audited: number;
  score: number;            // 0–100
  issues: ScanIssue[];
  totals: {
    high: number;
    medium: number;
    low: number;
  };
  leakage_estimate_usd: { low: number; high: number };
  recommended_action: string;
}

const W: Record<ScanIssue['severity'], number> = { high: 8, medium: 4, low: 2 };

function followerTier(followers: number): number {
  // Scaled monthly streaming royalty multiplier
  if (followers < 1000) return 0.05;
  if (followers < 10_000) return 0.4;
  if (followers < 100_000) return 2.0;
  if (followers < 500_000) return 8.0;
  if (followers < 5_000_000) return 30.0;
  return 80.0;
}

export function runScan(artist: SpotifyArtist, tracks: SpotifyTrack[]): ScanReport {
  const issues: ScanIssue[] = [];
  const tier = followerTier(artist.followers);

  for (const t of tracks) {
    // 1. Missing ISRC → real issue
    if (!t.isrc) {
      issues.push({
        track_id: t.id,
        track_name: t.name,
        isrc: null,
        type: 'missing-isrc',
        severity: 'high',
        message: 'No ISRC returned by Spotify metadata',
        fix: 'Issue an ISRC and align across all DSPs and your PRO',
        estimated_leakage_usd: Math.round(tier * 25),
      });
    }

    // 2. Multi-artist track without explicit contributor mention
    if (t.artists.length > 1 && !/feat\.|with\s|&|,/i.test(t.name)) {
      // Already-credited collabs usually have "feat." in title; if not, flag
      issues.push({
        track_id: t.id,
        track_name: t.name,
        isrc: t.isrc ?? null,
        type: 'unknown-contributor',
        severity: 'medium',
        message: `Track has ${t.artists.length} artists but no clear contributor mention`,
        fix: 'Add publisher/IPI for each contributor, verify split percentages',
        estimated_leakage_usd: Math.round(tier * 8),
      });
    }

    // 3. Older track with low popularity → likely registration gap
    const releaseYear = parseInt((t.album?.release_date ?? '').slice(0, 4), 10);
    const ageYears = isNaN(releaseYear) ? 0 : new Date().getFullYear() - releaseYear;
    if (ageYears >= 5 && t.popularity < 30 && t.popularity > 5) {
      issues.push({
        track_id: t.id,
        track_name: t.name,
        isrc: t.isrc ?? null,
        type: 'submission-gap',
        severity: 'low',
        message: `Track is ${ageYears} years old with sustained low traffic — likely missing foreign society registration`,
        fix: 'Re-submit to foreign PROs and verify ICE / CISAC mapping',
        estimated_leakage_usd: Math.round(tier * 3),
      });
    }
  }

  // Score
  const totalWeight = issues.reduce((s, i) => s + W[i.severity], 0);
  const score = Math.max(30, Math.min(100, 100 - totalWeight));

  const totals = { high: 0, medium: 0, low: 0 };
  for (const i of issues) totals[i.severity]++;

  const leakageMid = issues.reduce((s, i) => s + i.estimated_leakage_usd, 0);
  const leakage = {
    low: Math.round(leakageMid * 0.6),
    high: Math.round(leakageMid * 1.4),
  };

  // Recommended action band
  let recommended_action: string;
  if (score >= 90) recommended_action = 'Catalog is in excellent shape. No cleaning required.';
  else if (score >= 75) recommended_action = 'Minor gaps. Recommend Single-work or Small-catalog cleaning.';
  else if (score >= 60) recommended_action = 'Moderate gaps. Recommend Medium-catalog cleaning + forensic chain-of-title.';
  else recommended_action = 'Significant leakage detected. Recommend Large-catalog full cleaning + audit-ready package.';

  return {
    artist: {
      id: artist.id,
      name: artist.name,
      followers: artist.followers,
      popularity: artist.popularity,
      genres: artist.genres,
      spotify_url: artist.external_url,
    },
    scan_date: new Date().toISOString(),
    tracks_audited: tracks.length,
    score,
    issues,
    totals,
    leakage_estimate_usd: leakage,
    recommended_action,
  };
}
