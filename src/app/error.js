'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="page" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <h1>Something went wrong!</h1>
      <p className="muted" style={{ marginBottom: 24 }}>An unexpected error occurred.</p>
      <div className="actions">
        <button className="btn btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/" className="btn">
          Go home
        </Link>
      </div>
    </main>
  );
}
