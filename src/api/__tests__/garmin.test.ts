import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearGarminTokens,
  fetchGarminActivities,
  getGarminAuthUrl,
  getStoredGarminTokens
} from '@/api/garmin';

describe('garmin service', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_GARMIN_CLIENT_ID', 'client-id');
    vi.stubEnv('VITE_GARMIN_AUTH_URL', 'https://garmin.example/oauth');
    vi.stubEnv('VITE_GARMIN_API_BASE', 'https://garmin.example/api');
    vi.stubEnv('VITE_GARMIN_REDIRECT_URI', 'https://app.example/callback');
  });

  it('builds the Garmin auth URL', () => {
    const url = getGarminAuthUrl();

    expect(url).toContain('https://garmin.example/oauth');
    expect(url).toContain('client_id=client-id');
    expect(url).toContain(
      `redirect_uri=${encodeURIComponent('https://app.example/callback')}`
    );
  });

  it('stores and clears Garmin tokens', () => {
    window.localStorage.setItem(
      'garminTokens',
      JSON.stringify({ access_token: 'token', expires_at: 123 })
    );

    expect(getStoredGarminTokens()?.access_token).toBe('token');

    clearGarminTokens();
    expect(getStoredGarminTokens()).toBeNull();
  });

  it('fetches mapped Garmin activities', async () => {
    window.localStorage.setItem(
      'garminTokens',
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
          activityId: 1,
          activityName: 'Trail Session',
          activityType: 'trail run',
          distanceInMeters: 12500,
          durationInSeconds: 3600,
          elevationGainInMeters: 540,
          startTimeLocal: '2024-01-01T10:00:00Z',
          calories: 612
        }
      ]
    });
    vi.stubGlobal('fetch', fetchMock);

    const activities = await fetchGarminActivities();

    expect(fetchMock).toHaveBeenCalled();
    expect(activities).toHaveLength(1);
    expect(activities[0]).toEqual(
      expect.objectContaining({
        name: 'Trail Session',
        type: 'TrailRun',
        distance: 12.5,
        duration: 60,
        elevationGain: 540,
        date: '2024-01-01',
        calories: 612
      })
    );
  });
});
