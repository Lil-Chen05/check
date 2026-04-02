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
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/20">
      <button
        onClick={() => navigate('/home')}
        className="font-display text-2xl font-bold text-gold-400 hover:text-gold-300 transition-colors"
      >
        Check
      </button>

      <div className="flex items-center gap-4">
        {profile && (
          <div className="text-right hidden sm:block">
            <p className="text-sm text-white font-medium">{profile.display_name}</p>
            <p className="text-xs text-gray-500">{profile.wins}W / {profile.games_played}G</p>
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
