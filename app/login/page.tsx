'use client';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function signIn() {
    setLoading(true); setError('');
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (authError) { setError(authError.message); setLoading(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#f8f9fa] px-5"><section className="w-full max-w-[400px] rounded-xl border border-border bg-white px-8 py-10 text-center shadow-[0_3px_12px_rgba(60,64,67,.12)]"><div className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-xl bg-accent text-white"><BrainMark /></div><h1 className="text-[22px] font-semibold tracking-[-.4px]">Second Brain</h1><button onClick={signIn} disabled={loading} className="mt-8 flex h-11 w-full items-center justify-center gap-3 rounded-input border border-[#dadce0] bg-white text-sm font-medium text-[#3c4043] transition-colors hover:bg-[#f8f9fa] disabled:opacity-60"><GoogleMark />{loading ? 'Connecting…' : 'Continue with Google'}</button>{error && <p className="mt-4 text-sm text-overdue">{error}</p>}</section></main>;
}
function GoogleMark() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.92c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.4 37.95 46.98 31.83 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59a14.39 14.39 0 0 1 0-9.18l-7.98-6.19a23.96 23.96 0 0 0 0 21.56l7.98-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.8l-7.73-6c-2.15 1.45-4.9 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>; }
function BrainMark() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 18V5a3 3 0 0 0-5.8-1A4 4 0 0 0 4 11a4 4 0 0 0 2 7.5 3.5 3.5 0 0 0 6-2.5Z"/><path d="M12 18V5a3 3 0 0 1 5.8-1A4 4 0 0 1 20 11a4 4 0 0 1-2 7.5 3.5 3.5 0 0 1-6-2.5Z"/><path d="M8 11h.01M16 11h.01"/></svg>; }
