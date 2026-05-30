import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/student', '/teacher', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isLessonsIndex = pathname === '/lessons';
  const isProtectedLessonDetail = pathname.startsWith('/lessons/');
  const sessionCookie = request.cookies.get('slms_session');

  if (isLessonsIndex && !sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/curriculum';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if ((isProtectedRoute || isProtectedLessonDetail) && !sessionCookie) {
    const url = request.nextUrl.clone();
    const redirectTo = `${pathname}${request.nextUrl.search}`;
    url.pathname = '/login';
    url.search = `?redirect=${encodeURIComponent(redirectTo)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/teacher/:path*', '/admin/:path*', '/lessons', '/lessons/:path*'],
};
