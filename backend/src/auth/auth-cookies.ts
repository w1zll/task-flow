import type { Response } from 'express';

export const REFRESH_COOKIE = 'refresh_token';
export const ACCESS_COOKIE = 'access_token';

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
  path: '/',
};

export const setTokenCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearTokenCookies = (res: Response) => {
  res.clearCookie(ACCESS_COOKIE, AUTH_COOKIE_OPTIONS);
  res.clearCookie(REFRESH_COOKIE, AUTH_COOKIE_OPTIONS);
};
