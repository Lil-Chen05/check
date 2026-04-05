import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, isConfigured } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isConfigured) {
      navigate('/home');
      return;
    }

    try {
      if (isSignUp) {
        if (!displayName.trim()) { setError('Display name is required'); setLoading(false); return; }
        const { error: err } = await signUp(email, password, displayName.trim());
        if (err) { setError(err.message); setLoading(false); return; }
      } else {
        const { error: err } = await signIn(email, password);
        if (err) { setError(err.message); setLoading(false); return; }
      }
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipAuth = () => navigate('/home');

  return (
    <div className="min-h-screen felt-bg flex items-center justify-center p-4">
      <div className="noise-overlay" aria-hidden="true" />
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-6xl font-semibold text-antique-gold-400 tracking-display mb-2 animate-shimmer">
            Check
          </h1>
          <p className="text-antique-gold-600/50 text-base font-light">Multiplayer Card Game</p>
        </div>

        <div className="panel p-8">
          <div className="flex mb-6 bg-midnight-950/50 rounded-lg p-1">
            <button
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                !isSignUp ? 'bg-jade-900 text-antique-gold-300 shadow border border-jade-700/50' : 'text-antique-gold-700/60 hover:text-antique-gold-400'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                isSignUp ? 'bg-jade-900 text-antique-gold-300 shadow border border-jade-700/50' : 'text-antique-gold-700/60 hover:text-antique-gold-400'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <input
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field"
                maxLength={20}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
              minLength={6}
            />

            {error && (
              <p className="text-crimson-400 text-sm bg-crimson-950/60 rounded-lg px-3 py-2 border border-crimson-700/30">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {!isConfigured && (
            <div className="mt-6 pt-4 border-t border-antique-gold-700/15">
              <p className="text-xs text-antique-gold-700/55 mb-3 text-center">
                Supabase not configured — play without an account
              </p>
              <button onClick={handleSkipAuth} className="btn-secondary w-full text-sm">
                Play as Guest
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
