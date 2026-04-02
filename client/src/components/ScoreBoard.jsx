import { motion } from 'framer-motion';
import Card from './Card';
import { getPointValue } from '../utils/cardUtils';

export default function ScoreBoard({ scores, myId, onReturnToLobby }) {
  if (!scores || scores.length === 0) return null;

  const winner = scores[0];

  return (
    <div className="min-h-screen felt-bg flex items-center justify-center p-4">
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
            <h2 className="font-display text-5xl text-gold-400 mb-2">Game Over</h2>
            <p className="text-emerald-300 text-lg">
              {winner.displayName} wins with {winner.points} point{winner.points !== 1 ? 's' : ''}!
            </p>
          </motion.div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-gold-600/20 overflow-hidden">
          {scores.map((player, idx) => (
            <motion.div
              key={player.id}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * idx + 0.5 }}
              className={`flex items-center gap-4 px-6 py-4 border-b border-white/5 last:border-b-0 ${
                idx === 0 ? 'bg-gold-400/10' : ''
              } ${player.id === myId ? 'ring-1 ring-inset ring-emerald-400/30' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                idx === 0
                  ? 'bg-gold-500 text-black'
                  : idx === 1
                    ? 'bg-gray-400 text-black'
                    : idx === 2
                      ? 'bg-amber-700 text-white'
                      : 'bg-gray-700 text-gray-300'
              }`}>
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium truncate">{player.displayName}</span>
                  {player.id === myId && (
                    <span className="text-xs text-emerald-400 bg-emerald-400/10 rounded-full px-2 py-0.5">You</span>
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
                  idx === 0 ? 'text-gold-400' : 'text-gray-300'
                }`}>
                  {player.points}
                </div>
                <div className="text-xs text-gray-500">
                  {player.cardCount} card{player.cardCount !== 1 ? 's' : ''}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button onClick={onReturnToLobby} className="btn-primary text-lg px-8">
            Return to Lobby
          </button>
        </div>
      </motion.div>
    </div>
  );
}
