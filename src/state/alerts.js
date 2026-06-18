/**
 * Portivo — shared alerts store
 * Place at: src/state/alerts.js
 *
 * Minimal pub/sub so any page can publish "things needing attention"
 * and the TopNav bell can subscribe without prop-drilling or a
 * context provider wrapping the whole app.
 *
 * TODO: once you have a real backend, this is the natural seam to
 * swap for a polling fetch or a websocket push — the publish/subscribe
 * shape stays the same, only where setAlerts() gets called changes.
 */

let state = {
  count: 0,
  items: [], // [{ id, number, message, type: 'eta' | 'etd', severity: 'overdue' | 'due_today' }]
};

const listeners = new Set();

export function getAlerts() {
  return state;
}

export function setAlerts(next) {
  state = next;
  listeners.forEach(fn => fn(state));
}

export function subscribeAlerts(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
