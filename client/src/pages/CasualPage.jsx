import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import Header from '../components/Header';

export default function CasualPage() {
  const { user, profile, guestMode, getToken, isConfigured } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [guestId] = useState(() => {
    const stored = sessionStorage.getItem('guestId');
    if (stored) return stored;
    const id = `guest-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('guestId', id);
    return id;
  });
  const [guestName, setGuestName] = useState(() => sessionStorage.getItem('guestName') || '');
  const [hasSetName, setHasSetName] = useState(() => !!sessionStorage.getItem('guestName'));

  const isGuest = guestMode && !user;
  const userId = user?.id || guestId;
  const displayName = profile?.display_name || guestName || '';

  const [token, setToken] = useState(null);
  useEffect(() => {
    if (isConfigured && user) {
      getToken().then(setToken);
    }
    // guests pass null token — server accepts them as guests
  }, [getToken, isConfigured, user]);

  const { connected, emit } = useSocket(
    token,
    userId,
    displayName,
  );

  // Guest name prompt
  if (isGuest && !hasSetName) {
    return (
      <div className="min-h-screen felt-bg flex items-center justify-center p-4">
        <div className="noise-overlay" aria-hidden="true" />
        <div className="w-full max-w-md panel p-8">
          <h2 className="font-display text-3xl text-antique-gold-400 text-center mb-2 tracking-display">
            Choose a Name
          </h2>
          <p className="text-antique-gold-700/50 text-sm text-center mb-6 font-light">
            This is how other players will see you
          </p>
          <input
            type="text"
            placeholder="Your display name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="input-field mb-4"
            maxLength={20}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && guestName.trim()) {
                sessionStorage.setItem('guestName', guestName.trim());
                setHasSetName(true);
              }
            }}
          />
          <button
            onClick={() => {
              if (guestName.trim()) {
                sessionStorage.setItem('guestName', guestName.trim());
                setHasSetName(true);
              }
            }}
            className="btn-primary w-full"
            disabled={!guestName.trim()}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  const handleCreate = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await emit('create-room');
      if (res?.error) { setError(res.error); return; }
      navigate(`/lobby/${res.roomCode}`);
    } catch { setError('Failed to create room'); }
    finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { setError('Enter a room code'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await emit('join-room', { roomCode: joinCode.trim().toUpperCase() });
      if (res?.error) { setError(res.error); return; }
      navigate(`/lobby/${res.roomCode}`);
    } catch { setError('Failed to join room'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen felt-bg">
      <div className="noise-overlay" aria-hidden="true" />
      <Header />
      <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="w-full max-w-lg">
          <div className="text-center mb-10">
            <h1 className="font-display text-6xl font-semibold text-antique-gold-400 mb-3 tracking-display animate-shimmer">
              Casual
            </h1>
            <p className="text-antique-gold-600/50 text-sm font-light">
              {connected
                ? <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-jade-600" /> Connected</span>
                : <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-crimson-500 animate-pulse" /> Connecting...</span>
              }
            </p>
          </div>
          <hr className="gold-rule mb-8" />

          <div className="space-y-4">
            <button
              onClick={handleCreate}
              className="btn-primary w-full text-base py-4 tracking-wide"
              disabled={!connected || loading}
            >
              Create Room
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-antique-gold-700/20" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-midnight-950 px-4 text-xs text-antique-gold-600/40 uppercase tracking-widest">
                  or join with code
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="input-field flex-1 text-center text-base tracking-[0.35em] uppercase font-display"
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
              <button
                onClick={handleJoin}
                className="btn-secondary px-8"
                disabled={!connected || loading}
              >
                Join
              </button>
            </div>

            {error && (
              <p className="text-crimson-400 text-sm bg-crimson-950/60 rounded-lg px-3 py-2 text-center border border-crimson-700/30">
                {error}
              </p>
            )}
          </div>

          {profile && (
            <div className="mt-8 bg-midnight-800/40 rounded-xl p-4 border border-antique-gold-700/15 text-center">
              <p className="text-gray-400 text-sm">
                Welcome back, <span className="text-antique-gold-400 font-medium">{profile.display_name}</span>
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {profile.wins} win{profile.wins !== 1 ? 's' : ''} · {profile.games_played} game{profile.games_played !== 1 ? 's' : ''} played
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
