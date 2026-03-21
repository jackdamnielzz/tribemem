import { NextResponse, type NextRequest } from 'next/server';

const protectedPaths = [
  '/overview',
  '/ask',
  '/knowledge',
  '/connectors',
  '/crawler',
  '/team',
  '/settings',
  '/api-keys',
];

const authPaths = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Supabase auth if env vars are not configured (dev mode)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('xxx')) {
    // In dev mode without Supabase, allow all routes
    return NextResponse.next();
  }

  const { updateSession } = await import('@/lib/supabase/middleware');
  const { response, user } = await updateSession(request);

  // Redirect unauthenticated users away from protected routes
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  const isAuthPage = authPaths.some((path) => pathname.startsWith(path));
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/overview', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
