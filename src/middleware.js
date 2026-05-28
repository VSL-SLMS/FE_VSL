import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect routes that start with /student, /teacher, or /admin
  const protectedRoutes = ['/student', '/teacher', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get('slms_session');

    if (!sessionCookie) {
      // Redirect to login if no session cookie exists
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/teacher/:path*', '/admin/:path*'],
};
