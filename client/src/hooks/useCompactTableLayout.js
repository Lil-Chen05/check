import { useEffect, useState } from 'react';

/**
 * Narrow phones: use tighter card slots (see cardLayout / PlayerHand size "xs").
 */
export function useCompactTableLayout() {
  const [compact, setCompact] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 390px)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 390px)');
    setCompact(mq.matches);
    const fn = () => setCompact(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  return compact;
}
