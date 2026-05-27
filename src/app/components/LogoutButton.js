'use client';

export default function LogoutButton() {
  function handleLogout() {
    localStorage.removeItem('slms_user');
    window.location.href = '/login';
  }

  return (
    <button className="btn" onClick={handleLogout} style={{ marginTop: 'auto', marginBottom: 22, marginLeft: 22, marginRight: 22 }}>
      Log out
    </button>
  );
}
