import { NextResponse } from 'next/server';
import { getRoleHomePath } from './lib/roleRoutes';

function getSessionUser(request) {
  const rawSession = request.cookies.get('slms_session')?.value;
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession);
  } catch {
    return null;
  }
}

function redirectTo(request, pathname, search = '') {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;
  return NextResponse.redirect(url);
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionUser = getSessionUser(request);
  const roleHome = getRoleHomePath(sessionUser?.role);
  const hasValidSession = Boolean(sessionUser?.token && sessionUser?.role && roleHome !== '/login');
  const protectedRoutes = ['/student', '/teacher', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isGuestOnlyRoute = pathname === '/' || pathname === '/login' || pathname === '/register';
  const isCurriculumRoute = pathname === '/curriculum' || pathname.startsWith('/curriculum/');
  const isLessonsIndex = pathname === '/lessons';
  const isProtectedLessonDetail = pathname.startsWith('/lessons/');

  if (hasValidSession && isGuestOnlyRoute) {
    return redirectTo(request, roleHome);
  }

  if (hasValidSession && isCurriculumRoute) {
    return redirectTo(request, sessionUser.role === 'STUDENT' ? '/student/lessons' : roleHome);
  }

  if (hasValidSession && isLessonsIndex) {
    return redirectTo(request, sessionUser.role === 'STUDENT' ? '/student/lessons' : roleHome);
  }

  if (hasValidSession && isProtectedLessonDetail && sessionUser.role !== 'STUDENT') {
    return redirectTo(request, roleHome);
  }

  if (isLessonsIndex && !hasValidSession) {
    return redirectTo(request, '/curriculum');
  }

  if ((isProtectedRoute || isProtectedLessonDetail) && !hasValidSession) {
    const requestedPath = `${pathname}${request.nextUrl.search}`;
    const response = redirectTo(request, '/login', `?redirect=${encodeURIComponent(requestedPath)}`);
    response.cookies.delete('slms_session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/curriculum/:path*', '/student/:path*', '/teacher/:path*', '/admin/:path*', '/lessons', '/lessons/:path*'],
};
