export const browserApiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? ''
).replace(/\/$/, '');

export const withBrowserApiBaseUrl = (path: string) =>
  `${browserApiBaseUrl}${path}`;
