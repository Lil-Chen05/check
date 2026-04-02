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
      <Header />
      <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h2 className="font-display text-4xl text-gold-400 mb-2">Game Lobby</h2>
            <div className="inline-flex items-center gap-2 bg-black/30 rounded-full px-5 py-2 border border-gold-600/20">
              <span className="text-gray-400 text-sm">Room Code</span>
              <span className="text-gold-300 font-mono text-xl tracking-[0.3em] font-bold">{roomCode}</span>
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-gold-600/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-emerald-300 font-medium">Players ({room?.players?.length || 0}/12)</h3>
              <span className="text-xs text-gray-500">Need 3–12 to start</span>
            </div>

            <div className="space-y-2 mb-6">
              {room?.players?.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 bg-black/20 rounded-lg px-4 py-3 border border-white/5"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    p.id === room.hostId ? 'bg-gold-500 text-black' : 'bg-emerald-700 text-white'
                  }`}>
                    {p.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-white font-medium flex-1">{p.displayName}</span>
                  {p.id === room.hostId && (
                    <span className="text-xs text-gold-400 bg-gold-400/10 rounded-full px-2 py-0.5">Host</span>
                  )}
                  {p.id === userId && (
                    <span className="text-xs text-emerald-400 bg-emerald-400/10 rounded-full px-2 py-0.5">You</span>
                  )}
                </div>
              ))}

              {(!room?.players || room.players.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-pulse">Connecting to room...</div>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2 mb-4 text-center">{error}</p>
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
              <p className="text-center text-gray-500 text-sm mt-4">Waiting for host to start the game...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
