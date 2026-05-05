import { paths } from './api.types';

type SuccessContent<R> = {
  [K in Extract<keyof R, string | number>]:
    `${K}` extends `2${string}`
      ? R[K] extends { content?: { 'application/json': infer Body } }
        ? Body
        : never
      : never;
}[Extract<keyof R, string | number>];


export type ApiResponse<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends { responses: infer R } ? SuccessContent<R> : never;

type test = paths['/api/auth/login']['post']['responses']['200']['content']['application/json'];
type test2 = ApiResponse<'/api/auth/login', 'post'>;

export type ApiBody<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends {
  requestBody: { content: { 'application/json': infer B } };
}
  ? B
  : never;

export type ApiParams<
  P extends keyof paths,
  M extends keyof paths[P],
> = paths[P][M] extends {
  parameters: { path: infer Params };
}
  ? Params
  : never;
