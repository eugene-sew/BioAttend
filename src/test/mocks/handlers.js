import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock login endpoint
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      accessToken: 'fake_access_token',
      refreshToken: 'fake_refresh_token',
      user: { id: 1, name: 'Test User', role: 'STUDENT' },
    });
  }),

  // Mock logout endpoint
  http.post('/api/auth/logout', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Mock token refresh endpoint
  http.post('/api/auth/refresh', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      accessToken: 'new_fake_access_token',
    });
  }),

  // Mock attendance capture endpoint
  http.post('/api/attendance/capture', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      message: 'Attendance captured successfully',
    });
  }),
];
