import { motion } from 'framer-motion';
import Card from './Card';
import { getPointValue } from '../utils/cardUtils';

export default function ScoreBoard({ scores, myId, onReturnToLobby }) {
  if (!scores || scores.length === 0) return null;

  const winner = scores[0];

  return (
    <div className="min-h-screen felt-bg flex items-center justify-center p-4">
      <div className="noise-overlay" aria-hidden="true" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="font-display text-5xl text-antique-gold-400 mb-2 tracking-display">Game Over</h2>
            <p className="text-antique-gold-600/70 text-base font-light">
              {winner.displayName} wins with {winner.points} point{winner.points !== 1 ? 's' : ''}!
            </p>
          </motion.div>
        </div>

        <hr className="gold-rule my-6" />
        <div className="panel overflow-hidden">
          {scores.map((player, idx) => (
            <motion.div
              key={player.id}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * idx + 0.5 }}
              className={`flex items-center gap-4 px-6 py-4 border-b border-antique-gold-700/10 last:border-b-0 ${
                idx === 0 ? 'bg-antique-gold-600/8' : ''
              } ${player.id === myId ? 'ring-1 ring-inset ring-jade-700/50' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                idx === 0
                  ? 'bg-antique-gold-600 text-midnight-950'
                  : idx === 1
                    ? 'bg-gray-400 text-midnight-950'
                    : idx === 2
                      ? 'bg-[#92400e] text-antique-gold-300'
                      : 'bg-midnight-700 text-gray-400'
              }`}>
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium truncate">{player.displayName}</span>
                  {player.id === myId && (
                    <span className="text-xs text-jade-600 bg-jade-900/30 rounded-full px-2 py-0.5 border border-jade-700/30">You</span>
                  )}
                </div>

                <div className="flex gap-1 mt-1.5">
                  {player.hand.map((card, ci) => (
                    <motion.div
                      key={card.id || ci}
                      initial={{ rotateY: 180 }}
                      animate={{ rotateY: 0 }}
                      transition={{ delay: 0.1 * ci + 0.3 * idx + 0.8 }}
                    >
                      <Card card={card} faceUp size="sm" motionPreset="static" enableLayout={false} />
                    </motion.div>
                  ))}
                  {player.hand.length === 0 && (
                    <span className="text-xs text-gray-500 py-2">No cards</span>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className={`text-2xl font-bold ${
                  idx === 0 ? 'text-antique-gold-400 font-display' : 'text-gray-400'
                }`}>
                  {player.points}
                </div>
                <div className="text-xs text-antique-gold-700/55">
                  {player.cardCount} card{player.cardCount !== 1 ? 's' : ''}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button onClick={onReturnToLobby} className="btn-primary text-base px-8 tracking-wide">
            Return to Lobby
          </button>
        </div>
      </motion.div>
    </div>
  );
}
