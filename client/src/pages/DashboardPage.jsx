import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../utils/supabaseClient';
import Header from '../components/Header';

export default function DashboardPage() {
  const { user, profile, guestMode } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoadingBoard(false); return; }
    supabase
      .from('profiles')
      .select('id, display_name, wins, games_played')
      .order('wins', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setEntries(data || []);
        setLoadingBoard(false);
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

      <div
        className="flex flex-col items-center justify-center px-4 py-8"
        style={{ minHeight: 'calc(100vh - 64px)' }}
      >
        <div className="w-full max-w-lg">

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-display text-6xl font-semibold text-antique-gold-400 mb-2 tracking-display animate-shimmer">
              Check
            </h1>
            <p className="text-antique-gold-600/45 text-xs font-light tracking-widest uppercase">
              Choose Your Mode
            </p>
          </div>

          <hr className="gold-rule mb-6" />

          {/* Leaderboard panel */}
          <div className="panel overflow-hidden mb-4">
            {/* Panel header */}
            <div className="px-5 pt-4 pb-3 border-b border-antique-gold-700/15">
              <p className="text-antique-gold-600/50 text-xs uppercase tracking-widest">
                Leaderboard
              </p>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[2rem_1fr_3.5rem_4rem] px-5 py-2 border-b border-antique-gold-700/10">
              <span className="text-antique-gold-700/35 text-xs uppercase tracking-widest">#</span>
              <span className="text-antique-gold-700/35 text-xs uppercase tracking-widest">Player</span>
              <span className="text-antique-gold-700/35 text-xs uppercase tracking-widest text-right">Wins</span>
              <span className="text-antique-gold-700/35 text-xs uppercase tracking-widest text-right">Played</span>
            </div>

            {/* Loading skeleton */}
            {loadingBoard && (
              <div className="divide-y divide-antique-gold-700/8">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-[2rem_1fr_3.5rem_4rem] px-5 py-3 gap-2">
                    <div className="h-3.5 w-5 bg-midnight-700/50 rounded animate-pulse" />
                    <div className="h-3.5 w-28 bg-midnight-700/50 rounded animate-pulse" />
                    <div className="h-3.5 w-6 bg-midnight-700/50 rounded animate-pulse ml-auto" />
                    <div className="h-3.5 w-8 bg-midnight-700/50 rounded animate-pulse ml-auto" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loadingBoard && entries.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-antique-gold-700/35 text-sm font-light">
                  No players yet — finish a game to appear here.
                </p>
              </div>
            )}

            {/* Rows */}
            {!loadingBoard && entries.length > 0 && (
              <div className="divide-y divide-antique-gold-700/8">
                {entries.map((entry, i) => {
                  const isMe = user && entry.id === user.id;
                  return (
                    <div
                      key={entry.id}
                      className={`grid grid-cols-[2rem_1fr_3.5rem_4rem] px-5 py-3 transition-colors
                        ${isMe ? 'bg-jade-950/50' : 'hover:bg-midnight-800/25'}`}
                    >
                      <span className={`text-sm font-display tabular-nums ${medalColor(i)}`}>
                        {i + 1}
                      </span>
                      <span className={`text-sm truncate font-display tracking-wide
                        ${isMe ? 'text-antique-gold-300' : 'text-antique-gold-400/75'}`}>
                        {entry.display_name}
                        {isMe && <span className="ml-2 text-jade-600/80 text-xs font-body font-normal not-italic">(you)</span>}
                      </span>
                      <span className="text-sm text-antique-gold-400 font-display tabular-nums text-right">
                        {entry.wins}
                      </span>
                      <span className="text-sm text-antique-gold-700/50 tabular-nums text-right">
                        {entry.games_played}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mode buttons */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => navigate('/casual')}
              className="btn-primary py-3.5 text-base tracking-wide"
            >
              Casual
            </button>
            <button
              onClick={() => navigate('/ranked')}
              className="btn-secondary py-3.5 text-base"
            >
              Ranked
            </button>
          </div>

          {/* Signed-in stats */}
          {profile && (
            <div className="bg-midnight-800/30 rounded-xl px-5 py-3 border border-antique-gold-700/10
                            flex items-center justify-between">
              <span className="text-antique-gold-700/50 text-xs">
                Welcome back, <span className="text-antique-gold-500/80">{profile.display_name}</span>
              </span>
              <span className="text-antique-gold-700/40 text-xs tabular-nums">
                {profile.wins}W · {profile.games_played}G
              </span>
            </div>
          )}

          {/* Guest nudge */}
          {guestMode && !user && (
            <p className="text-center text-antique-gold-700/30 text-xs mt-4">
              Playing as guest —{' '}
              <button
                onClick={() => navigate('/')}
                className="underline hover:text-antique-gold-600/55 transition-colors"
              >
                sign in
              </button>
              {' '}to track stats & appear on the leaderboard
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
