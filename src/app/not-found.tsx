import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#0a0a0f',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '16px', fontWeight: 'bold' }}>
        404
      </h1>
      <h2 style={{ fontSize: '24px', marginBottom: '16px', fontWeight: '500' }}>
        Page Not Found
      </h2>
      <p style={{ marginBottom: '32px', opacity: 0.7, fontSize: '16px' }}>
        The page you are looking for does not exist.
      </p>
      <Link 
        href="/"
        style={{
          padding: '12px 24px',
          backgroundColor: '#8b5cf6',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: '500',
          fontSize: '16px',
        }}
      >
        Go Home
      </Link>
    </div>
  );
}
