const card = document.querySelector('#devices');
const rows = document.querySelector('#devices-watch-rows');
const count = document.querySelector('#devices-watch-count');
const status = document.querySelector('#devices-watch-status');
const retry = document.querySelector('#devices-watch-retry');
const states = ['online', 'warning', 'offline', 'updating'];
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
});

function validDate(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function isValidDevicesToWatch(watch, needsAttention) {
  return Boolean(watch && Number.isInteger(watch.total) && watch.total >= 0 &&
    watch.total === needsAttention && watch.limit === 5 && Array.isArray(watch.items) &&
    watch.items.length === Math.min(watch.total, watch.limit) &&
    new Set(watch.items.map((item) => item?.deviceId)).size === watch.items.length &&
    watch.items.every((item) => item && typeof item.deviceId === 'string' && item.deviceId.length > 0 &&
      typeof item.displayName === 'string' && typeof item.issueSummary === 'string' &&
      states.includes(item.healthStatus) &&
      [null, 'info', 'warning', 'critical'].includes(item.issueSeverity) &&
      (['warning', 'offline'].includes(item.healthStatus) || item.issueSeverity === 'critical') &&
      (item.lastSeenAt === null || validDate(item.lastSeenAt)) && validDate(item.attentionAt)));
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function messageRow(message) {
  const row = element('tr');
  const cell = element('td', message, 'devices-watch-message');
  cell.colSpan = 4;
  row.append(cell);
  rows.replaceChildren(row);
}

export function renderDevicesToWatch(summary, { stale = false } = {}) {
  const watch = summary.details.devicesToWatch;
  const fragment = document.createDocumentFragment();
  for (const item of watch.items) {
    const row = element('tr');
    row.dataset.deviceId = item.deviceId;
    const identity = element('td');
    identity.append(element('strong', item.displayName), element('small', item.deviceId));
    identity.title = 'Device Detail is planned';
    const state = element('td');
    const badge = element('span', undefined, `status-tag ${item.healthStatus}`);
    const dot = element('i');
    dot.setAttribute('aria-hidden', 'true');
    badge.append(dot, document.createTextNode(item.healthStatus === 'online'
      ? 'Healthy' : item.healthStatus[0].toUpperCase() + item.healthStatus.slice(1)));
    state.append(badge);
    const issue = element('td', item.issueSummary, 'devices-watch-issue');
    if (item.issueSeverity) issue.append(element('small', `${item.issueSeverity} issue`));
    const lastSeen = element('td');
    if (item.lastSeenAt === null) lastSeen.textContent = 'Never seen';
    else {
      const time = element('time', dateFormatter.format(new Date(item.lastSeenAt)));
      time.dateTime = item.lastSeenAt;
      time.title = new Date(item.lastSeenAt).toISOString();
      lastSeen.append(time);
    }
    row.append(identity, state, issue, lastSeen);
    fragment.append(row);
  }
  rows.replaceChildren(fragment);
  if (watch.total === 0) messageRow('No devices need attention.');
  count.textContent = watch.total > watch.limit
    ? `Showing ${watch.items.length} of ${watch.total} · Sorted by priority`
    : `${watch.total} needing attention · Sorted by priority`;
  status.textContent = `${stale ? 'Cached snapshot' : 'Updated'} · ${dateFormatter.format(new Date(summary.generatedAt))} · ${summary.source.label}`;
  retry.hidden = !stale;
  card.classList.remove('is-loading', 'is-unavailable', 'is-stale');
  card.classList.toggle('is-stale', stale);
  card.setAttribute('aria-busy', 'false');
}

export function renderDevicesToWatchUnavailable() {
  messageRow('Devices to watch are unavailable. Please retry.');
  count.textContent = 'Sorted by priority';
  status.textContent = 'Data unavailable';
  retry.hidden = false;
  card.classList.remove('is-loading', 'is-stale');
  card.classList.add('is-unavailable');
  card.setAttribute('aria-busy', 'false');
}
