import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/terms', '/forgot-password', '/reset-password', '/accept-invite']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  /* Always allow public paths and Next internals */
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  /* Check for access token in cookie or Authorization header.
     The real token lives in localStorage (client-only), so the
     middleware uses a lightweight session cookie set on login.
     If absent → redirect to /login with ?from= for post-login redirect. */
  const sessionCookie = request.cookies.get('cmms_session')

  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|register|forgot-password|reset-password|accept-invite).*)',
  ],
}
