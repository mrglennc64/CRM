/**
 * Spotify Web API client (Client Credentials Flow).
 * Used by the scan engine to fetch artist info + top tracks for catalog audit.
 *
 * Reads SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET from env.
 */

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

let _token: { value: string; exp: number } | null = null;

async function getToken(): Promise<string> {
  if (_token && Date.now() < _token.exp) return _token.value;

  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET missing in .env.local');
  }

  const creds = Buffer.from(`${id}:${secret}`).toString('base64');
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!r.ok) throw new Error(`Spotify token failed: ${r.status}`);
  const data = await r.json();
  _token = { value: data.access_token, exp: Date.now() + (data.expires_in - 60) * 1000 };
  return _token.value;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  followers: number;
  popularity: number;
  genres: string[];
  external_url: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  isrc?: string;
  popularity: number;
  album: { name: string; release_date: string };
  duration_ms: number;
  artists: { id: string; name: string }[];
}

/** Extract Spotify artist ID from various URL formats. */
export function extractArtistId(input: string): string | null {
  const m = input.match(/artist[/:]([a-zA-Z0-9]{22})/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9]{22}$/.test(input)) return input;
  return null;
}

export async function getArtist(artistId: string): Promise<SpotifyArtist> {
  const token = await getToken();
  const r = await fetch(`${API_BASE}/artists/${artistId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Spotify artist failed: ${r.status}`);
  const a = await r.json();
  return {
    id: a.id,
    name: a.name,
    followers: a.followers?.total ?? 0,
    popularity: a.popularity,
    genres: a.genres ?? [],
    external_url: a.external_urls?.spotify ?? '',
  };
}

export async function getTopTracks(artistId: string, market = 'US'): Promise<SpotifyTrack[]> {
  const token = await getToken();
  const r = await fetch(`${API_BASE}/artists/${artistId}/top-tracks?market=${market}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Spotify top-tracks failed: ${r.status}`);
  const data = await r.json();
  return (data.tracks ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    isrc: t.external_ids?.isrc,
    popularity: t.popularity,
    album: { name: t.album?.name, release_date: t.album?.release_date },
    duration_ms: t.duration_ms,
    artists: (t.artists ?? []).map((x: any) => ({ id: x.id, name: x.name })),
  }));
}

/** Search artists by name. Returns top 10. */
export async function searchArtists(query: string): Promise<SpotifyArtist[]> {
  const token = await getToken();
  const r = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&type=artist&limit=10`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Spotify search failed: ${r.status}`);
  const data = await r.json();
  return (data.artists?.items ?? []).map((a: any) => ({
    id: a.id,
    name: a.name,
    followers: a.followers?.total ?? 0,
    popularity: a.popularity,
    genres: a.genres ?? [],
    external_url: a.external_urls?.spotify ?? '',
  }));
}
