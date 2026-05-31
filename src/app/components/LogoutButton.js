'use client';

import { logoutAction } from '../actions/auth';
import { removeStoredUser } from '../../lib/authStorage';

export default function LogoutButton() {
  async function handleLogout() {
    await logoutAction();
    removeStoredUser();
    window.location.href = '/login';
  }

  return (
    <button className="btn" onClick={handleLogout} style={{ marginTop: 'auto', marginBottom: 22, marginLeft: 22, marginRight: 22 }}>
      Log out
    </button>
  );
}
