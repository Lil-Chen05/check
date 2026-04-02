import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import Header from '../components/Header';

export default function HomePage() {
  const { user, profile, getToken, isConfigured } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [guestId] = useState(() => {
    if (isConfigured) return null;
    const stored = sessionStorage.getItem('guestId');
    if (stored) return stored;
    const id = `guest-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('guestId', id);
    return id;
  });
  const [guestName, setGuestName] = useState(() => sessionStorage.getItem('guestName') || '');
  const [hasSetName, setHasSetName] = useState(() => !!sessionStorage.getItem('guestName'));

  const userId = user?.id || guestId;
  const displayName = profile?.display_name || guestName || 'Player';

  const [token, setToken] = useState(null);
  useEffect(() => {
    if (isConfigured) {
      getToken().then(setToken);
    }
  }, [getToken, isConfigured]);

  const { connected, emit } = useSocket(
    token || 'dev-token',
    userId,
    displayName,
  );

  if (!isConfigured && !hasSetName) {
    return (
      <div className="min-h-screen felt-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-black/30 backdrop-blur-sm rounded-2xl border border-gold-600/20 p-8">
          <h2 className="font-display text-3xl text-gold-400 text-center mb-6">Choose a Name</h2>
          <input
            type="text"
            placeholder="Your display name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="input-field mb-4"
            maxLength={20}
            autoFocus
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
      <Header />
      <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="w-full max-w-lg">
          <div className="text-center mb-10">
            <h1 className="font-display text-5xl font-extrabold text-gold-400 mb-2">Check</h1>
            <p className="text-emerald-300/60">
              {connected
                ? <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Connected</span>
                : <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> Connecting...</span>
              }
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCreate}
              className="btn-primary w-full text-lg py-4"
              disabled={!connected || loading}
            >
              Create Room
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-felt-900 px-4 text-sm text-gray-500">or join with code</span>
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="input-field flex-1 text-center text-lg tracking-[0.3em] uppercase"
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
              <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2 text-center">{error}</p>
            )}
          </div>

          {profile && (
            <div className="mt-8 bg-black/20 rounded-xl p-4 border border-white/5 text-center">
              <p className="text-gray-400 text-sm">
                Welcome back, <span className="text-gold-400 font-medium">{profile.display_name}</span>
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
