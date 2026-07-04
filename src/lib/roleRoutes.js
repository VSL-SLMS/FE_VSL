export function getRoleHomePath(role) {
  return {
    STUDENT: '/student',
    TEACHER: '/teacher',
    ADMIN: '/admin'
  }[String(role || '').toUpperCase()] || '/login';
}
