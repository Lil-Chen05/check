import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { user, profile, signOut, isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-antique-gold-700/15 bg-midnight-950/80 backdrop-blur-sm">
      <button
        onClick={() => navigate('/home')}
        className="font-display text-2xl font-semibold text-antique-gold-400 hover:text-antique-gold-300 transition-colors tracking-display"
      >
        Check
      </button>

      <div className="flex items-center gap-4">
        <button
          onClick={() => window.open('/rules', '_blank', 'noopener,noreferrer')}
          className="text-sm text-antique-gold-700/55 hover:text-antique-gold-400 transition-colors hidden sm:block"
        >
          How to Play
        </button>
        {profile && (
          <div className="text-right hidden sm:block">
            <p className="text-sm text-white font-medium">{profile.display_name}</p>
            <p className="text-xs text-antique-gold-700/60">{profile.wins}W / {profile.games_played}G</p>
          </div>
        )}
        {isConfigured && user && (
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            Sign Out
          </button>
        )}
      </div>
    </header>
  );
}
