import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Silently re-runs `callback` on an interval (and when the browser tab
 * regains focus) so workspace data stays fresh without manual reloads.
 * The callback should refresh state WITHOUT toggling loading spinners —
 * pass the quiet loader, not the spinner-wrapped refresh.
 */
const useAutoRefresh = (callback, intervalMs = 20000) => {
  useEffect(() => {
    if (typeof callback !== 'function') return undefined;

    const run = () => {
      // Skip background tabs on web — no point polling a hidden page.
      if (Platform.OS === 'web' && typeof document !== 'undefined' && document.hidden) return;
      try {
        const result = callback();
        if (result && typeof result.catch === 'function') result.catch(() => {});
      } catch {
        // Silent by design: the next tick or a manual refresh will recover.
      }
    };

    const timer = setInterval(run, intervalMs);

    let onFocus;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      onFocus = () => run();
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onFocus);
    }

    return () => {
      clearInterval(timer);
      if (onFocus) {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onFocus);
      }
    };
  }, [callback, intervalMs]);
};

export default useAutoRefresh;
