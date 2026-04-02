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
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-6xl font-extrabold text-gold-400 tracking-tight mb-2">
            Check
          </h1>
          <p className="text-emerald-300/70 text-lg">Multiplayer Card Game</p>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-gold-600/20 p-8 shadow-2xl">
          <div className="flex mb-6 bg-black/20 rounded-lg p-1">
            <button
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                !isSignUp ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                isSignUp ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
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
              <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {!isConfigured && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-xs text-gray-500 mb-3 text-center">
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
