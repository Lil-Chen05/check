import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../utils/supabaseClient';
import Header from '../components/Header';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setError('Leaderboard unavailable — Supabase is not configured.');
      setLoading(false);
      return;
    }
    supabase
      .from('profiles')
      .select('id, display_name, wins, games_played')
      .order('wins', { ascending: false })
      .limit(10)
      .then(({ data, error: err }) => {
        if (err) setError('Failed to load leaderboard.');
        else setEntries(data || []);
        setLoading(false);
      });
  }, []);

  const medalColor = (i) => {
    if (i === 0) return 'text-antique-gold-400';
    if (i === 1) return 'text-antique-gold-600/70';
    if (i === 2) return 'text-antique-gold-700/60';
    return 'text-antique-gold-700/35';
  };

  return (
    <div className="min-h-screen felt-bg">
      <div className="noise-overlay" aria-hidden="true" />
      <Header />

      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl text-antique-gold-400 tracking-display mb-2 animate-shimmer">
            Leaderboard
          </h1>
          <p className="text-antique-gold-700/45 text-xs font-light tracking-widest uppercase">
            Top 10 · Ranked by wins
          </p>
        </div>

        <hr className="gold-rule mb-6" />

        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-antique-gold-700/45 hover:text-antique-gold-600/75
                     text-sm mb-6 transition-colors group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Dashboard
        </button>

        <div className="panel overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[2.5rem_1fr_4rem_4.5rem] px-5 py-3 border-b border-antique-gold-700/15">
            <span className="text-antique-gold-700/35 text-xs uppercase tracking-widest">#</span>
            <span className="text-antique-gold-700/35 text-xs uppercase tracking-widest">Player</span>
            <span className="text-antique-gold-700/35 text-xs uppercase tracking-widest text-right">Wins</span>
            <span className="text-antique-gold-700/35 text-xs uppercase tracking-widest text-right">Played</span>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="divide-y divide-antique-gold-700/8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="grid grid-cols-[2.5rem_1fr_4rem_4.5rem] px-5 py-4">
                  <div className="h-4 w-5 bg-midnight-700/50 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-midnight-700/50 rounded animate-pulse" />
                  <div className="h-4 w-7 bg-midnight-700/50 rounded animate-pulse ml-auto" />
                  <div className="h-4 w-9 bg-midnight-700/50 rounded animate-pulse ml-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="px-5 py-10 text-center">
              <p className="text-crimson-400 text-sm">{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && entries.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="text-antique-gold-700/35 text-sm font-light font-display tracking-wide">
                No players yet. Be the first to complete a game.
              </p>
            </div>
          )}

          {/* Rows */}
          {!loading && !error && entries.length > 0 && (
            <div className="divide-y divide-antique-gold-700/8">
              {entries.map((entry, i) => {
                const isMe = user && entry.id === user.id;
                return (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-[2.5rem_1fr_4rem_4.5rem] px-5 py-3.5 transition-colors
                      ${isMe ? 'bg-jade-950/50' : 'hover:bg-midnight-800/25'}`}
                  >
                    <span className={`text-sm font-display tabular-nums ${medalColor(i)}`}>
                      {i + 1}
                    </span>
                    <span className={`text-sm font-display tracking-wide truncate
                      ${isMe ? 'text-antique-gold-300' : 'text-antique-gold-400/75'}`}>
                      {entry.display_name}
                      {isMe && (
                        <span className="ml-2 text-jade-600/80 text-xs font-body font-normal">(you)</span>
                      )}
                    </span>
                    <span className="text-sm text-antique-gold-400 font-display tabular-nums text-right">
                      {entry.wins}
                    </span>
                    <span className="text-sm text-antique-gold-700/55 tabular-nums text-right">
                      {entry.games_played}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!user && (
          <p className="text-center text-antique-gold-700/30 text-xs mt-5 font-display tracking-wide">
            <button
              onClick={() => navigate('/')}
              className="underline hover:text-antique-gold-600/50 transition-colors"
            >
              Sign in
            </button>
            {' '}to appear on the leaderboard
          </p>
        )}
      </div>
    </div>
  );
}
