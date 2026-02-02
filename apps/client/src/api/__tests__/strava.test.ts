import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearStravaTokens,
  fetchStravaActivities,
  getStoredStravaTokens,
  getStravaAuthUrl
} from '@/api/strava';

describe('strava service', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_STRAVA_CLIENT_ID', 'strava-client');
    vi.stubEnv('VITE_STRAVA_REDIRECT_URI', 'https://app.example/strava');
  });

  it('builds the Strava auth URL', () => {
    const url = getStravaAuthUrl();

    expect(url).toContain('https://www.strava.com/oauth/authorize');
    expect(url).toContain('client_id=strava-client');
    expect(url).toContain(
      `redirect_uri=${encodeURIComponent('https://app.example/strava')}`
    );
  });

  it('stores and clears Strava tokens', () => {
    window.localStorage.setItem(
      'stravaTokens',
      JSON.stringify({
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: 123
      })
    );

    expect(getStoredStravaTokens()?.access_token).toBe('token');

    clearStravaTokens();
    expect(getStoredStravaTokens()).toBeNull();
  });

  it('fetches mapped Strava activities', async () => {
    window.localStorage.setItem(
      'stravaTokens',
      JSON.stringify({
        access_token: 'token',
        refresh_token: 'refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      })
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 42,
          name: 'Easy Run',
          type: 'Run',
          distance: 7000,
          moving_time: 2100,
          total_elevation_gain: 120,
          start_date: '2024-01-02T08:00:00Z',
          calories: 350
        }
      ]
    });
    vi.stubGlobal('fetch', fetchMock);

    const activities = await fetchStravaActivities();

    expect(fetchMock).toHaveBeenCalled();
    expect(activities).toHaveLength(1);
    expect(activities[0]).toEqual(
      expect.objectContaining({
        name: 'Easy Run',
        type: 'Run',
        distance: 7,
        duration: 35,
        elevationGain: 120,
        date: '2024-01-02',
        calories: 350
      })
    );
  });
});
