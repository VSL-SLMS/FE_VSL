'use client';

function roleKey(role) {
  return `slms_user_${String(role || '').toUpperCase()}`;
}

function clearStoredUserKeys() {
  localStorage.removeItem('slms_user');
  localStorage.removeItem(roleKey('STUDENT'));
  localStorage.removeItem(roleKey('TEACHER'));
  localStorage.removeItem(roleKey('ADMIN'));
}

export function readStoredUser(expectedRole) {
  if (typeof window === 'undefined') return null;

  try {
    if (expectedRole) {
      const roleRaw = localStorage.getItem(roleKey(expectedRole));
      if (roleRaw) {
        const roleUser = JSON.parse(roleRaw);
        if (roleUser?.role === String(expectedRole).toUpperCase() && roleUser?.token) {
          return roleUser;
        }
      }
    }

    const rawUser = localStorage.getItem('slms_user');
    if (!rawUser) return null;

    const user = JSON.parse(rawUser);
    if (!user?.token) return null;
    if (expectedRole && user.role !== String(expectedRole).toUpperCase()) return null;
    return user;
  } catch (error) {
    clearStoredUserKeys();
    return null;
  }
}

export function writeStoredUser(user) {
  if (typeof window === 'undefined' || !user) return;
  localStorage.setItem('slms_user', JSON.stringify(user));
  localStorage.setItem(roleKey(user.role), JSON.stringify(user));
  window.dispatchEvent(new Event('slms-auth-changed'));
}

export function removeStoredUser() {
  if (typeof window === 'undefined') return;
  clearStoredUserKeys();
  window.dispatchEvent(new Event('slms-auth-changed'));
}
