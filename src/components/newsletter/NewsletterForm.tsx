import React, { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');

    try {
      // Store locally for zero-latency capture
      const currentList = JSON.parse(localStorage.getItem('nodehunt_subscribers') || '[]');
      if (!currentList.includes(email)) {
        currentList.push(email);
        localStorage.setItem('nodehunt_subscribers', JSON.stringify(currentList));
      }

      // Simulate webhook / dispatch
      setTimeout(() => {
        setStatus('success');
      }, 400);
    } catch {
      setStatus('error');
      setErrorMessage('Subscription failed. Please try again or subscribe via RSS.');
    }
  };

  if (status === 'success') {
    return (
      <div style={{ padding: '1.25rem', borderRadius: '.75rem', background: 'var(--surface-raised)', border: '1px solid var(--accent)' }}>
        <p style={{ margin: '0 0 .5rem', fontWeight: 800, color: 'var(--accent)', fontSize: '1.1rem' }}>
          ✓ You are subscribed to NodeHunt Briefings!
        </p>
        <p style={{ margin: 0, fontSize: '.9rem', color: 'var(--muted)' }}>
          You'll receive unbiased technical analysis on Web3 nodes, DePIN developments, and protocol security.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', maxWidth: '34rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="Enter your email address..."
          required
          aria-label="Email address for NodeHunt newsletter"
          style={{
            flex: '1 1 240px',
            padding: '.8rem 1.1rem',
            borderRadius: '.6rem',
            border: '1px solid var(--line)',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '.95rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            padding: '.8rem 1.4rem',
            borderRadius: '.6rem',
            border: 0,
            background: 'var(--accent)',
            color: '#062219',
            fontWeight: 800,
            fontSize: '.95rem',
            cursor: 'pointer',
            transition: 'opacity .15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {status === 'loading' ? 'Subscribing…' : 'Subscribe Free'}
        </button>
      </div>
      {status === 'error' && (
        <span style={{ color: 'var(--danger)', fontSize: '.85rem' }}>{errorMessage}</span>
      )}
      <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
        Zero spam. Strictly source-led infrastructure research. Unsubscribe anytime.
      </span>
    </form>
  );
}
