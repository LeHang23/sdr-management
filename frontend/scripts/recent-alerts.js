const card = document.querySelector('#alerts');
const list = document.querySelector('#recent-alerts-list');
const count = document.querySelector('#recent-alerts-count');
const status = document.querySelector('#recent-alerts-status');
const retry = document.querySelector('#recent-alerts-retry');
const sources = new Set(['manual', 'simulator', 'sdr_gateway']);
const formatter = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
});

function validDate(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function isValidRecentAlerts(alerts) {
  return Boolean(alerts && Number.isInteger(alerts.total) && alerts.total >= 0 &&
    Number.isInteger(alerts.unresolved) && alerts.unresolved >= 0 && alerts.unresolved <= alerts.total &&
    alerts.limit === 3 && Array.isArray(alerts.items) &&
    alerts.items.length === Math.min(alerts.total, alerts.limit) &&
    new Set(alerts.items.map((item) => item?.alertId)).size === alerts.items.length &&
    alerts.items.every((item) => item && typeof item.alertId === 'string' && item.alertId.length > 0 &&
      typeof item.deviceId === 'string' && item.deviceId.length > 0 && typeof item.displayName === 'string' &&
      typeof item.summary === 'string' && ['info', 'warning', 'critical'].includes(item.severity) &&
      ['active', 'resolved'].includes(item.status) && validDate(item.occurredAt) && validDate(item.updatedAt) &&
      sources.has(item.source?.mode) && typeof item.source?.label === 'string'));
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function message(text) {
  list.replaceChildren(element('li', text, 'recent-alerts-message'));
}

export function renderRecentAlerts(summary, { stale = false } = {}) {
  const alerts = summary.details.recentAlerts;
  const fragment = document.createDocumentFragment();
  for (const alert of alerts.items) {
    const row = element('li', undefined, `recent-alert ${alert.status}`);
    row.dataset.alertId = alert.alertId;
    const icon = element('span', alert.severity === 'info' ? 'i' : '!', `alert-symbol ${alert.severity}`);
    icon.setAttribute('aria-hidden', 'true');
    const body = element('div', undefined, 'recent-alert-body');
    body.append(element('strong', alert.summary));
    const details = element('p');
    const time = element('time', formatter.format(new Date(alert.occurredAt)));
    time.dateTime = alert.occurredAt;
    time.title = new Date(alert.occurredAt).toISOString();
    details.append(document.createTextNode(`${alert.displayName} (${alert.deviceId}) · ${alert.source.label} · `), time);
    const lifecycle = element('p', `${alert.severity[0].toUpperCase() + alert.severity.slice(1)} · ${alert.status === 'active' ? 'Active' : 'Resolved'}`);
    if (alert.status === 'resolved') lifecycle.append(document.createTextNode(` · ${formatter.format(new Date(alert.updatedAt))}`));
    body.append(details, lifecycle);
    row.append(icon, body);
    fragment.append(row);
  }
  list.replaceChildren(fragment);
  if (alerts.total === 0) message('No alerts have been recorded.');
  count.textContent = `${alerts.unresolved} unresolved alert${alerts.unresolved === 1 ? '' : 's'}${alerts.total > alerts.limit ? ` · Showing ${alerts.items.length} of ${alerts.total}` : ''}`;
  status.textContent = `${stale ? 'Cached snapshot' : 'Updated'} · ${formatter.format(new Date(summary.generatedAt))}`;
  retry.hidden = !stale;
  card.classList.remove('is-loading', 'is-unavailable');
  card.classList.toggle('is-stale', stale);
  card.setAttribute('aria-busy', 'false');
}

export function renderRecentAlertsUnavailable() {
  message('Recent alerts are unavailable. Please retry.');
  count.textContent = 'Latest fleet incidents';
  status.textContent = 'Data unavailable';
  retry.hidden = false;
  card.classList.remove('is-loading', 'is-stale');
  card.classList.add('is-unavailable');
  card.setAttribute('aria-busy', 'false');
}
