'use client';

import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { useMemo, useSyncExternalStore } from 'react';
import { logoutAction } from '../actions/auth';
import { removeStoredUser } from '../../lib/authStorage';

function getDashboardHref(user) {
  if (!user?.role) return '/login';
  return `/${String(user.role).toLowerCase()}`;
}

function subscribeAuth(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('slms-auth-changed', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('slms-auth-changed', callback);
  };
}

function getAuthSnapshot() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('slms_user') || '';
}

function getServerAuthSnapshot() {
  return '';
}

export function HomeNav() {
  const authSnapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot);
  const currentUser = useMemo(() => {
    if (!authSnapshot) return null;
    try {
      return JSON.parse(authSnapshot);
    } catch {
      return null;
    }
  }, [authSnapshot]);

  async function handleLogout() {
    await logoutAction();
    removeStoredUser();
    window.location.href = '/login';
  }

  return (
    <header className="home-nav">
      <Link href="/" className="brand">
        <span className="brand-mark">✦</span>
        <span>SignLearn</span>
      </Link>
      <nav className="nav-links">
        <Link href="/#about">About VSL</Link>
        <Link href="/#why">Why learn</Link>
        <Link href="/#who">For you</Link>
        <Link href="/curriculum">Curriculum</Link>
      </nav>
      <div className="nav-actions" suppressHydrationWarning>
        {currentUser ? (
          <>
            <Link href={getDashboardHref(currentUser)}>
              {currentUser.display_name || currentUser.name || currentUser.username || 'Dashboard'}
            </Link>
            <button className="btn" type="button" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link className="btn btn-primary" href="/register">Register</Link>
          </>
        )}
      </div>
    </header>
  );
}

export function DashboardShell({ role, title, children }) {
  const roleTitle = role[0].toUpperCase() + role.slice(1);
  const nav = {
    student: [
      ['Dashboard', '/student', '▦'],
      ['Profile', '/student/profile', '◉'],
      ['Lessons', '/student/lessons', '📘'],
      ['Topic videos', '/student/topic-lessons', '▶'],
      ['Assignments', '/student/assignments', '⬆'],
      ['Progress', '/student/progress', '↗']
    ],
    teacher: [
      ['Dashboard', '/teacher', '▦'],
      ['Profile', '/teacher/profile', '◉'],
      ['Students', '/teacher/students', '👥'],
      ['Assignments', '/teacher/assignments', '☑'],
      ['Grading', '/teacher/grading', '🎓']
    ],
    admin: [
      ['Dashboard', '/admin', '▦'],
      ['Users', '/admin/users', '👥'],
      ['Teacher Requests', '/admin/teacher-change-requests', '⇄'],
      ['Lessons', '/admin/lessons', '📘']
    ]
  }[role];

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">✦</span>
          <span>
            <span>SignLearn</span>
            <small style={{ display: 'block', color: 'var(--muted)', textTransform: 'uppercase' }}>{roleTitle}</small>
          </span>
        </Link>
        <nav className="sidebar-nav">
          {nav.map(([label, href, icon], index) => (
            <Link key={href} href={href} className={`sidebar-link ${index === 0 ? 'active' : ''}`}>
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="card" style={{ boxShadow: 'none', marginTop: 22, marginBottom: 'auto' }}>
          <strong>Sign Language 101</strong>
          <p className="muted" style={{ marginBottom: 0 }}>One course, structured lessons, clear progress.</p>
        </div>
        <LogoutButton />
      </aside>
      <section className="dashboard-main">
        <header className="topbar">
          <input className="search-box" placeholder="Search lessons, students..." />
          <div className="nav-actions">
            <Link href="/curriculum">Curriculum</Link>
            <span className="brand-mark" style={{ width: 34, height: 34 }}>{role[0].toUpperCase()}</span>
          </div>
        </header>
        <main className="dashboard-content">
          <div className="page-title">
            <div>
              <span className="eyebrow">{roleTitle}</span>
              <h1>{title}</h1>
            </div>
          </div>
          {children}
        </main>
      </section>
    </div>
  );
}

export default HomeNav;
