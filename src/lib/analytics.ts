/**
 * Lightweight client-side analytics and event-tracking abstraction.
 * Dispatches anonymized events to /api/events and updates engagement interest score.
 */

// Simple engagement score weights for privacy-conscious behavioral interest detection
const SCORE_WEIGHTS: Record<string, number> = {
  session_start: 1,
  time_spent_30s: 3,
  time_spent_60s: 4,
  scroll_depth_50: 2,
  scroll_depth_75: 3,
  menu_opened: 3,
  category_viewed: 2,
  menu_item_view: 2,
  add_to_cart: 5,
  order_started: 6,
  order_placed: 8,
  reservation_opened: 4,
};

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('sg_anon_session_id');
  if (!id) {
    id = `sg_${Math.random().toString(36).substring(2, 11)}_${Date.now().toString(36)}`;
    sessionStorage.setItem('sg_anon_session_id', id);
  }
  return id;
}

export function getCurrentInterestScore(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(sessionStorage.getItem('sg_interest_score') || '0', 10);
}

export function incrementInterestScore(points: number): number {
  if (typeof window === 'undefined') return 0;
  const current = getCurrentInterestScore();
  const next = current + points;
  sessionStorage.setItem('sg_interest_score', next.toString());
  
  // Dispatch custom event for real-time reactivity
  window.dispatchEvent(new CustomEvent('sg_interest_score_updated', { detail: { score: next } }));
  return next;
}

export function trackEvent(eventName: string, eventData: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;

  const sessionId = getSessionId();
  const pagePath = window.location.pathname;

  // Compute interest score increment
  const points = SCORE_WEIGHTS[eventName] || 1;
  incrementInterestScore(points);

  const payload = {
    sessionId,
    eventName,
    eventData,
    pagePath,
  };

  try {
    const serialized = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([serialized], { type: 'application/json' });
      navigator.sendBeacon('/api/events', blob);
    } else {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: serialized,
        keepalive: true,
      }).catch(() => {
        // Silently handle offline/network issues
      });
    }
  } catch {
    // Non-blocking fail-safe
  }
}
