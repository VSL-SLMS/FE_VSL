import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/student', '/teacher', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isProtectedLessonDetail = pathname.startsWith('/lessons/');

  if (isProtectedRoute || isProtectedLessonDetail) {
    const sessionCookie = request.cookies.get('slms_session');

    if (!sessionCookie) {
      const url = request.nextUrl.clone();
      const redirectTo = `${pathname}${request.nextUrl.search}`;
      url.pathname = '/login';
      url.search = `?redirect=${encodeURIComponent(redirectTo)}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/teacher/:path*', '/admin/:path*', '/lessons/:path*'],
};
