import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/boards'];
const AUTH_ROUTES = ['/auth/login', '/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession = request.cookies.has('refresh_token');

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (isProtected && !hasSession) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
      // console.log('to login');
    return NextResponse.redirect(loginUrl);
  }

  // const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  // if (isAuthRoute && hasToken) {
  //     // console.log('to boards');
  //   return NextResponse.redirect(new URL('/boards', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ['/boards/:path*', '/auth/:path*'],
};
