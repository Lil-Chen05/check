import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import Header from '../components/Header';

export default function LobbyPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user, profile, getToken, isConfigured } = useAuth();
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (isConfigured) getToken().then(setToken);
  }, [getToken, isConfigured]);

  const userId = user?.id || sessionStorage.getItem('guestId') || 'guest';
  const displayName = profile?.display_name || sessionStorage.getItem('guestName') || 'Player';

  const { connected, emit, on } = useSocket(token || 'dev-token', userId, displayName);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!connected || !on) return;

    const unsub1 = on('room-updated', (data) => setRoom(data));
    const unsub2 = on('game-started', () => navigate(`/game/${roomCode}`));
    const unsub3 = on('returned-to-lobby', (data) => setRoom(data));

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [connected, on, navigate, roomCode]);

  useEffect(() => {
    if (!connected || !emit) return;
    emit('join-room', { roomCode }).then(res => {
      if (res?.error) { setError(res.error); return; }
      if (res?.room) setRoom(res.room);
    });
  }, [connected, emit, roomCode]);

  const handleStart = async () => {
    setStarting(true);
    setError('');
    const res = await emit('start-game');
    if (res?.error) { setError(res.error); setStarting(false); }
  };

  const handleLeave = () => {
    emit('leave-room');
    navigate('/home');
  };

  const isHost = room?.hostId === userId;
  const canStart = isHost && (room?.players?.length ?? 0) >= 3;

  return (
    <div className="min-h-screen felt-bg">
      <div className="noise-overlay" aria-hidden="true" />
      <Header />
      <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h2 className="font-display text-4xl text-antique-gold-400 mb-2 tracking-display">Game Lobby</h2>
            <div className="inline-flex items-center gap-2 bg-midnight-800/60 rounded-full px-5 py-2 border border-antique-gold-600/25">
              <span className="text-antique-gold-700/60 text-sm">Room Code</span>
              <span className="text-antique-gold-400 font-display text-xl tracking-[0.35em] font-semibold">{roomCode}</span>
            </div>
          </div>

          <div className="panel p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-antique-gold-300/80 font-medium text-sm uppercase tracking-widest">Players ({room?.players?.length || 0}/12)</h3>
              <span className="text-xs text-antique-gold-700/50">Need 3–12 to start</span>
            </div>
            <hr className="gold-rule mb-4" />

            <div className="space-y-2 mb-6">
              {room?.players?.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 bg-midnight-800/40 rounded-lg px-4 py-3 border border-antique-gold-700/12 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    p.id === room.hostId ? 'bg-antique-gold-600 text-midnight-950' : 'bg-jade-900 text-antique-gold-400'
                  }`}>
                    {p.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-white font-medium flex-1">{p.displayName}</span>
                  {p.id === room.hostId && (
                    <span className="text-xs text-antique-gold-400 bg-antique-gold-600/10 rounded-full px-2 py-0.5 border border-antique-gold-600/20">Host</span>
                  )}
                  {p.id === userId && (
                    <span className="text-xs text-jade-600 bg-jade-900/30 rounded-full px-2 py-0.5 border border-jade-700/30">You</span>
                  )}
                </div>
              ))}

              {(!room?.players || room.players.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-pulse text-antique-gold-700/50">Connecting to room...</div>
                </div>
              )}
            </div>

            {error && (
              <p className="text-crimson-400 text-sm bg-crimson-950/60 rounded-lg px-3 py-2 mb-4 text-center border border-crimson-700/30">{error}</p>
            )}

            <div className="flex gap-3">
              <button onClick={handleLeave} className="btn-secondary flex-1">
                Leave
              </button>
              {isHost && (
                <button
                  onClick={handleStart}
                  className="btn-primary flex-1"
                  disabled={!canStart || starting}
                >
                  {starting ? 'Starting...' : (
                    canStart ? 'Start Game' : `Need ${3 - (room?.players?.length || 0)} more`
                  )}
                </button>
              )}
            </div>

            {!isHost && (
              <p className="text-center text-antique-gold-700/50 text-sm mt-4 italic">Waiting for host to start the game...</p>
            )}

            <div className="text-center mt-3">
              <button
                onClick={() => navigate('/rules')}
                className="text-xs text-antique-gold-700/40 hover:text-antique-gold-600/65 transition-colors underline"
              >
                How to Play
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
