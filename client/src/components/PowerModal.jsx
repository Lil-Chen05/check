import { useState } from 'react';
import { motion } from 'framer-motion';

export default function PowerModal({ power, players, myId, onResolve }) {
  const [step, setStep] = useState(0);
  const [selection1, setSelection1] = useState(null);
  const [selection2, setSelection2] = useState(null);

  if (!power) return null;

  const renderJack = () => {
    const me = players.find(p => p.id === myId);
    return (
      <div>
        <h3 className="text-gold-400 font-display text-xl mb-1">Jack Power</h3>
        <p className="text-gray-400 text-sm mb-4">Peek at one of your own cards</p>
        <div className="flex gap-2 justify-center flex-wrap">
          {me?.hand.map((card, i) => (
            <button
              key={card.id}
              onClick={() => onResolve({ cardIndex: i })}
              className="w-[60px] h-[86px] rounded-lg card-back-pattern border-2 border-gold-600/30
                         hover:border-gold-400 hover:shadow-glow transition-all cursor-pointer
                         flex items-center justify-center"
            >
              <span className="text-gold-400/60 text-xs">#{i + 1}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderQueen = () => {
    const allCards = [];
    players.forEach(p => {
      p.hand.forEach((card, i) => {
        allCards.push({ playerId: p.id, cardIndex: i, card, playerName: p.displayName });
      });
    });

    return (
      <div>
        <h3 className="text-gold-400 font-display text-xl mb-1">Queen Power</h3>
        <p className="text-gray-400 text-sm mb-4">
          {!selection1
            ? 'Select the first card to swap'
            : 'Select the second card to swap'}
        </p>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {players.map(p => (
            <div key={p.id}>
              <p className="text-xs text-gray-500 mb-1">
                {p.id === myId ? 'You' : p.displayName}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {p.hand.map((card, i) => {
                  const isSelected =
                    (selection1?.playerId === p.id && selection1?.cardIndex === i);
                  return (
                    <button
                      key={card.id}
                      onClick={() => {
                        const pos = { playerId: p.id, cardIndex: i };
                        if (!selection1) {
                          setSelection1(pos);
                        } else if (selection1.playerId === p.id && selection1.cardIndex === i) {
                          setSelection1(null);
                        } else {
                          onResolve({ pos1: selection1, pos2: pos });
                        }
                      }}
                      className={`w-[48px] h-[68px] rounded-md card-back-pattern border-2 transition-all cursor-pointer
                        flex items-center justify-center text-xs
                        ${isSelected
                          ? 'border-gold-400 shadow-glow'
                          : 'border-gold-600/20 hover:border-gold-400/50'
                        }`}
                    >
                      <span className="text-gold-400/50">#{i + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRedKing = () => (
    <div>
      <h3 className="text-gold-400 font-display text-xl mb-1">Red King Power</h3>
      <p className="text-gray-400 text-sm mb-4">Choose a player to receive a new face-down card</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {players.map(p => (
          <button
            key={p.id}
            onClick={() => onResolve({ targetPlayerId: p.id })}
            className="px-4 py-3 bg-black/30 border border-gold-600/20 rounded-lg
                       hover:border-gold-400 hover:shadow-glow transition-all cursor-pointer"
          >
            <span className="text-white font-medium text-sm">
              {p.id === myId ? 'Yourself' : p.displayName}
            </span>
            <span className="text-xs text-gray-500 block">{p.cardCount} cards</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderBlackKing = () => {
    if (power.step === 'peek') {
      return (
        <div>
          <h3 className="text-gold-400 font-display text-xl mb-1">Black King Power</h3>
          <p className="text-gray-400 text-sm mb-4">Peek at any card on the field</p>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {players.map(p => (
              <div key={p.id}>
                <p className="text-xs text-gray-500 mb-1">
                  {p.id === myId ? 'You' : p.displayName}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {p.hand.map((card, i) => (
                    <button
                      key={card.id}
                      onClick={() => onResolve({ targetPlayerId: p.id, cardIndex: i })}
                      className="w-[48px] h-[68px] rounded-md card-back-pattern border-2 border-gold-600/20
                                 hover:border-gold-400 hover:shadow-glow transition-all cursor-pointer
                                 flex items-center justify-center"
                    >
                      <span className="text-gold-400/50 text-xs">#{i + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div>
        <h3 className="text-gold-400 font-display text-xl mb-1">Black King Power</h3>
        <p className="text-gray-400 text-sm mb-4">Now swap the peeked card to a different position</p>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {players.map(p => (
            <div key={p.id}>
              <p className="text-xs text-gray-500 mb-1">
                {p.id === myId ? 'You' : p.displayName}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {p.hand.map((card, i) => {
                  const isPeekedPos =
                    power.peekedPosition?.playerId === p.id &&
                    power.peekedPosition?.cardIndex === i;
                  return (
                    <button
                      key={card.id}
                      disabled={isPeekedPos}
                      onClick={() => onResolve({ toPos: { playerId: p.id, cardIndex: i } })}
                      className={`w-[48px] h-[68px] rounded-md card-back-pattern border-2 transition-all
                        flex items-center justify-center text-xs
                        ${isPeekedPos
                          ? 'border-amber-500 opacity-50 cursor-not-allowed'
                          : 'border-gold-600/20 hover:border-gold-400 hover:shadow-glow cursor-pointer'
                        }`}
                    >
                      <span className="text-gold-400/50">
                        {isPeekedPos ? 'Here' : `#${i + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (power.type) {
      case 'jack': return renderJack();
      case 'queen': return renderQueen();
      case 'red-king': return renderRedKing();
      case 'black-king': return renderBlackKing();
      default: return <p>Unknown power</p>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-felt-800 border border-gold-600/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
      >
        {renderContent()}
      </motion.div>
    </motion.div>
  );
}
