import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const sections = [
  'objective',
  'the-table',
  'visual-cues',
  'power-cards',
  'reactions',
  'resolving-powers',
  'calling-check',
];

function SectionPanel({ number, title, children }) {
  return (
    <div
      className="panel p-6 sm:p-8 relative overflow-hidden"
      style={{ animationDelay: `${number * 60}ms`, animation: 'slideUp 0.4s ease-out both' }}
    >
      {/* Decorative section number */}
      <span
        className="absolute top-3 right-5 font-display font-semibold select-none pointer-events-none"
        style={{ fontSize: '5rem', lineHeight: 1, color: 'rgba(201,168,76,0.045)' }}
        aria-hidden="true"
      >
        {String(number).padStart(2, '0')}
      </span>

      <div className="flex items-center gap-3 mb-5">
        <span className="font-display text-xs text-antique-gold-700/50 tracking-widest uppercase tabular-nums">
          {String(number).padStart(2, '0')}
        </span>
        <span className="h-px flex-1 bg-antique-gold-700/20" />
        <h2 className="font-display text-xl sm:text-2xl text-antique-gold-400 tracking-display">
          {title}
        </h2>
      </div>

      <div className="text-antique-gold-600/65 font-body text-sm sm:text-base leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}

function RuleRow({ label, children }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-antique-gold-600/40 flex-shrink-0 mt-[0.45rem]" />
      <p>
        {label && <span className="text-antique-gold-400 font-medium">{label} — </span>}
        {children}
      </p>
    </div>
  );
}

function CardValueTable() {
  const rows = [
    ['1 – 9', 'Face value'],
    ['10', '0 points'],
    ['J, Q, K', '10 points each'],
    ['Joker', '−1 point'],
  ];
  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-antique-gold-700/20">
      {rows.map(([card, pts], i) => (
        <div
          key={card}
          className={`grid grid-cols-2 px-5 py-2.5 ${
            i < rows.length - 1 ? 'border-b border-antique-gold-700/12' : ''
          } ${i % 2 === 0 ? 'bg-midnight-800/30' : ''}`}
        >
          <span className="font-display text-antique-gold-400 tracking-wide">{card}</span>
          <span className="text-antique-gold-600/60">{pts}</span>
        </div>
      ))}
    </div>
  );
}

function PowerCard({ suit, title, description }) {
  const isRed = suit === 'red';
  return (
    <div className={`rounded-xl p-4 border ${
      isRed
        ? 'bg-crimson-950/30 border-crimson-700/25'
        : 'bg-midnight-800/50 border-antique-gold-700/20'
    }`}>
      <p className={`font-display text-base tracking-display mb-1.5 ${
        isRed ? 'text-crimson-400' : 'text-antique-gold-400'
      }`}>
        {title}
      </p>
      <p className="text-antique-gold-600/55 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function RulesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen felt-bg">
      <div className="noise-overlay" aria-hidden="true" />
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Page title */}
        <div className="text-center mb-8" style={{ animation: 'slideUp 0.35s ease-out both' }}>
          <h1 className="font-display text-5xl sm:text-6xl font-semibold text-antique-gold-400 tracking-display mb-2 animate-shimmer">
            How to Play
          </h1>
          <p className="text-antique-gold-700/45 text-xs tracking-widest uppercase">
            Check · A Game of Memory &amp; Reaction
          </p>
        </div>

        <hr className="gold-rule mb-8" />

        {/* Back button */}
        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 text-antique-gold-700/45 hover:text-antique-gold-600/75
                     text-sm mb-6 transition-colors group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Dashboard
        </button>

        <div className="space-y-4">

          {/* 01 — Objective */}
          <SectionPanel number={1} title="Objective">
            <p>
              Aim to have the <span className="text-antique-gold-400 font-medium">lowest total point value</span> when
              the game ends. Every card in your hand counts against you — except the Joker.
            </p>
            <CardValueTable />
          </SectionPanel>

          {/* 02 — The Table */}
          <SectionPanel number={2} title="The Table">
            <p className="mb-4">Three zones make up the board:</p>
            <div className="space-y-3">
              <RuleRow label="Draw Pile">
                The face-down stack in the centre. On your turn you draw from here.
              </RuleRow>
              <RuleRow label="Top Pile">
                The face-up discard pile. The card on top is what reactions are matched against.
              </RuleRow>
              <RuleRow label="Holding">
                Your row of face-down cards. Positions are <span className="text-antique-gold-400">fixed</span> — you
                cannot freely rearrange them. Any card added to your hand (by a Red King power or as a
                penalty) always arrives at the <span className="text-antique-gold-400">far right</span>.
              </RuleRow>
            </div>
          </SectionPanel>

          {/* 03 — Visual Cues */}
          <SectionPanel number={3} title="Visual Cues">
            <div className="space-y-3">
              <RuleRow label="Glowing card">
                Another player is currently selecting or peeking at that card — pay close attention
                to which one lights up.
              </RuleRow>
              <RuleRow label="Swap animation">
                When a swap occurs (Queen or Black King power), an animation plays showing which
                two cards exchanged positions so you can track the change.
              </RuleRow>
            </div>
          </SectionPanel>

          {/* 04 — Power Cards */}
          <SectionPanel number={4} title="Power Cards">
            <p className="mb-4">
              Powers trigger whenever a power card lands on the play pile — by any means
              (normal play, swap, or stolen via reaction).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PowerCard
                suit="black"
                title="Jack (J)"
                description="Peek at any one of your own face-down cards, then place it back."
              />
              <PowerCard
                suit="black"
                title="Queen (Q)"
                description="Blindly swap any two face-down cards anywhere on the table. Nobody sees the cards."
              />
              <PowerCard
                suit="red"
                title="Red King (♥♦)"
                description="Draw a card from the deck and place it face-down at the far right of any player's hand."
              />
              <PowerCard
                suit="black"
                title="Black King (♠♣)"
                description="Peek at any face-down card on the table, then move it to a different position."
              />
            </div>
          </SectionPanel>

          {/* 05 — Reactions */}
          <SectionPanel number={5} title="Reactions">
            <p className="mb-4">
              When any card lands on the pile, a brief window opens. If you hold a card of the
              same rank, you can slam it onto the pile — or attempt to grab a matching card from
              an opponent's hand.
            </p>
            <div className="space-y-3">
              <RuleRow label="One attempt only">
                You get exactly one attempt per card played. Attempting a steal or reacting with
                your own card uses your single shot — you cannot fail a steal then try your own card.
              </RuleRow>
              <RuleRow label="Failed steal">
                The grabbed card is returned to the opponent's original hand position and you draw
                a penalty card. You do <span className="text-antique-gold-400">not</span> keep the wrong card.
              </RuleRow>
              <RuleRow label="7-card limit">
                Players holding <span className="text-antique-gold-400">7 or more cards</span> cannot
                attempt to steal from opponents. They may still react with their own cards.
              </RuleRow>
              <RuleRow label="First-success rule">
                Only the first successful reactor benefits. Any later correct reactions are treated
                as failures and draw a penalty card.
              </RuleRow>
            </div>
          </SectionPanel>

          {/* 06 — Resolving Powers */}
          <SectionPanel number={6} title="Resolving Powers">
            <p>
              When a power card is played, the game <span className="text-antique-gold-400">pauses</span> and
              prompts the controlling player to <span className="text-antique-gold-400 font-medium">resolve</span> it —
              choosing which card to peek at, or which two cards to swap. Other players wait. Once
              resolved, the game continues normally.
            </p>
            <p className="mt-3 text-antique-gold-700/50 text-sm italic">
              Note: if a power card is stolen via reaction, the thief — not the original player — controls and resolves the power.
            </p>
          </SectionPanel>

          {/* 07 — Calling Check */}
          <SectionPanel number={7} title="Calling Check">
            <p className="mb-4">
              At the <span className="text-antique-gold-400 font-medium">start of your turn</span>, before drawing,
              you may call <span className="text-antique-gold-400 font-medium">"Check"</span> if you believe
              you have the lowest score.
            </p>
            <div className="space-y-3">
              <RuleRow>You still take a full normal turn after calling it.</RuleRow>
              <RuleRow>Every other player then takes <span className="text-antique-gold-400">one final turn</span> in order.</RuleRow>
              <RuleRow>Hands are revealed and scores tallied — lowest total wins.</RuleRow>
              <RuleRow label="Tiebreaker">
                Fewest cards wins. If still tied, the player closest to the caller in turn order wins.
              </RuleRow>
            </div>
          </SectionPanel>

        </div>

        {/* Full rules link */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-antique-gold-700/40 text-xs font-display tracking-wide">
            Want every detail?
          </p>
          <a
            href="https://github.com/Lil-Chen05/check/blob/main/docs/rules.md"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-block text-sm"
          >
            Full Rules on GitHub
          </a>
        </div>

        <p className="text-center text-antique-gold-700/20 text-xs tracking-widest uppercase mt-8">
          Check · Rules
        </p>
      </div>
    </div>
  );
}
