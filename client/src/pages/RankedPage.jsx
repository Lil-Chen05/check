import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RankedPage() {
  const { user, guestMode } = useAuth();
  const navigate = useNavigate();
  const isGuest = guestMode && !user;

  return (
    <div className="min-h-screen felt-bg flex items-center justify-center p-4">
      <div className="noise-overlay" aria-hidden="true" />

      <div className="w-full max-w-md text-center">
        <div className="panel p-8">
          {isGuest ? (
            <>
              <h1 className="font-display text-3xl text-antique-gold-400 tracking-display mb-2">
                Ranked Mode
              </h1>
              <p className="font-display text-base text-antique-gold-600/55 tracking-wide mb-1">
                Requires an account
              </p>
              <hr className="gold-rule my-5" />
              <p className="font-display text-lg text-antique-gold-600/60 tracking-wide leading-relaxed mb-6">
                Create a free account to compete on the leaderboard, track your stats, and earn your rank when Ranked Mode launches.
              </p>
              <button
                onClick={() => navigate('/')}
                className="btn-primary w-full mb-3"
              >
                Sign In / Create Account
              </button>
              <button
                onClick={() => navigate('/home')}
                className="btn-secondary w-full text-sm"
              >
                Back to Dashboard
              </button>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl text-antique-gold-400 tracking-display mb-2">
                Coming Soon
              </h1>
              <p className="font-display text-base text-antique-gold-600/55 tracking-wide mb-1">
                Ranked Mode is in development
              </p>
              <hr className="gold-rule my-5" />
              <p className="font-display text-lg text-antique-gold-600/60 tracking-wide leading-relaxed mb-3">
                Ranked matches, skill-based matchmaking, and tiered leaderboards are on the way.
              </p>
              <p className="font-display text-base text-antique-gold-700/45 tracking-wide leading-relaxed mb-6">
                For now, Casual games still count toward your stats and leaderboard position.
              </p>
              <button
                onClick={() => navigate('/home')}
                className="btn-secondary w-full"
              >
                Back to Dashboard
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-antique-gold-700/25 text-xs tracking-widest uppercase">
          Check · Ranked
        </p>
      </div>
    </div>
  );
}
