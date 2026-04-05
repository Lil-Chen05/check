import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Draws a dashed SVG arc connecting two card slots after a Queen / Black King swap.
 * Reads card positions from `data-slot-player` / `data-slot-index` DOM attributes.
 */
export default function SwapArc({ pairSwap, containerRef }) {
  const [arc, setArc] = useState(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!pairSwap) {
      setArc(null);
      return;
    }
    // Wait one frame so the DOM reflects the new game-state before measuring
    rafRef.current = requestAnimationFrame(() => {
      const container = containerRef?.current;
      if (!container) return;

      const cRect = container.getBoundingClientRect();
      const elA = container.querySelector(
        `[data-slot-player="${pairSwap.a.playerId}"][data-slot-index="${pairSwap.a.index}"]`,
      );
      const elB = container.querySelector(
        `[data-slot-player="${pairSwap.b.playerId}"][data-slot-index="${pairSwap.b.index}"]`,
      );
      if (!elA || !elB) return;

      const rA = elA.getBoundingClientRect();
      const rB = elB.getBoundingClientRect();

      setArc({
        ax: rA.left + rA.width / 2 - cRect.left,
        ay: rA.top + rA.height / 2 - cRect.top,
        bx: rB.left + rB.width / 2 - cRect.left,
        by: rB.top + rB.height / 2 - cRect.top,
      });
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [pairSwap, containerRef]);

  if (!arc) return null;

  const { ax, ay, bx, by } = arc;

  // Quadratic bezier: control point midway, lifted above both cards
  const cpx = (ax + bx) / 2;
  const cpy = Math.min(ay, by) - 52;

  // SVG viewport — tight bounding box with a little padding
  const pad = 12;
  const vx = Math.min(ax, bx, cpx) - pad;
  const vy = Math.min(ay, by, cpy) - pad;
  const vw = Math.max(ax, bx, cpx) + pad - vx;
  const vh = Math.max(ay, by) + pad - vy;

  // Shift all coords into local SVG space
  const lax = ax - vx, lay = ay - vy;
  const lbx = bx - vx, lby = by - vy;
  const lcpx = cpx - vx, lcpy = cpy - vy;
  const path = `M ${lax} ${lay} Q ${lcpx} ${lcpy} ${lbx} ${lby}`;

  return (
    <AnimatePresence>
      {arc && (
        <motion.svg
          key="swap-arc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute pointer-events-none z-[15]"
          style={{ left: vx, top: vy, width: vw, height: vh, overflow: 'visible' }}
          aria-hidden
        >
          {/* Dashed connecting path */}
          <motion.path
            d={path}
            fill="none"
            stroke="rgba(148,163,184,0.5)"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
          {/* End-point dots — colours match the swap rings (red / blue) */}
          <motion.circle
            cx={lax} cy={lay} r="3.5"
            fill="rgba(239,68,68,0.8)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 500, damping: 20 }}
          />
          <motion.circle
            cx={lbx} cy={lby} r="3.5"
            fill="rgba(96,165,250,0.8)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 500, damping: 20 }}
          />
        </motion.svg>
      )}
    </AnimatePresence>
  );
}
