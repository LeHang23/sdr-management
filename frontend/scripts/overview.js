import { initSystemPerformance } from './system-performance.js';

const endpoint = '/api/v1/overview/summary';
const refreshIntervalMs = 5_000;
const cacheKey = 'sdr-management.overview-summary.v1';
const formatter = new Intl.NumberFormat('en-US');

const summarySection = document.querySelector('#fleet-summary');
const sourceStatus = document.querySelector('#fleet-summary-source');
const retryButton = document.querySelector('#fleet-summary-retry');
const pageSourceLabel = document.querySelector('#overview-source-label');
const footerSourceLabel = document.querySelector('#overview-footer-source');
const synchronizedLabel = document.querySelector('#overview-last-synchronized');
const fleetSourceTitle = document.querySelector('#fleet-source-title');
const fleetSourceCopy = document.querySelector('#fleet-source-copy');
const cards = new Map(
  [...document.querySelectorAll('[data-kpi-card]')].map((card) => [card.dataset.kpiCard, card]),
);

let refreshInProgress = false;

function getCachedSummary() {
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    return isValidSummary(cached) ? cached : null;
  } catch {
    return null;
  }
}

function cacheSummary(summary) {
  localStorage.setItem(cacheKey, JSON.stringify(summary));
}

function isValidSummary(summary) {
  return Boolean(
    summary &&
      summary.metrics &&
      ['totalDevices', 'onlineNow', 'needsAttention', 'activeJobs'].every(
        (key) => Number.isFinite(summary.metrics[key]),
      ) &&
      summary.details &&
      summary.source,
  );
}

function setCard(metric, value, note, tone = '') {
  const card = cards.get(metric);
  const valueElement = card.querySelector('[data-kpi-value]');
  const noteElement = card.querySelector('[data-kpi-note]');
  card.classList.remove('is-loading', 'is-unavailable', 'is-stale');
  noteElement.className = `metric-note ${tone}`.trim();
  valueElement.textContent = value;
  noteElement.textContent = note;
}

function formatJobNote(counts) {
  const parts = ['queued', 'deploying', 'verifying', 'retrying']
    .filter((status) => counts[status] > 0)
    .map((status) => `${counts[status]} ${status}`);
  return parts.length > 0 ? parts.join(' · ') : 'No active jobs';
}

function renderSourceDescription(source) {
  const isManual = source.mode === 'manual';
  fleetSourceTitle.textContent = isManual ? 'Manual data source' : 'SDR Gateway';
  fleetSourceCopy.textContent = isManual
    ? 'SQLite demo data. Update it manually to simulate fleet changes.'
    : 'Physical SDR telemetry is connected through the gateway.';
}

function renderSummary(summary, { stale = false } = {}) {
  const { metrics, details } = summary;
  const fleetEmpty = metrics.totalDevices === 0;
  const sourceLabel = stale
    ? `Showing cached data from ${summary.source.label} · Stale`
    : `Data source: ${summary.source.label}`;
  const staleSuffix = stale ? ' · Stale' : '';

  setCard(
    'totalDevices',
    formatter.format(metrics.totalDevices),
    fleetEmpty ? 'No devices in fleet' : `${details.addedThisMonth} added this month${staleSuffix}`,
    details.addedThisMonth > 0 ? 'positive' : '',
  );
  setCard(
    'onlineNow',
    formatter.format(metrics.onlineNow),
    fleetEmpty
      ? `No devices in fleet${staleSuffix}`
      : `${details.availabilityPercent}% fleet availability${staleSuffix}`,
    metrics.onlineNow > 0 ? 'positive' : '',
  );
  setCard(
    'needsAttention',
    formatter.format(metrics.needsAttention),
    `${details.healthCounts.warning} warning · ${details.healthCounts.offline} offline${staleSuffix}`,
    metrics.needsAttention > 0 ? 'warning' : '',
  );
  setCard(
    'activeJobs',
    formatter.format(metrics.activeJobs),
    `${formatJobNote(details.activeJobCounts)}${staleSuffix}`,
  );

  if (stale) {
    for (const card of cards.values()) card.classList.add('is-stale');
  }
  summarySection.setAttribute('aria-busy', 'false');
  sourceStatus.textContent = sourceLabel;
  pageSourceLabel.textContent = `Data from ${summary.source.label}`;
  footerSourceLabel.textContent = summary.source.label;
  renderSourceDescription(summary.source);
  synchronizedLabel.textContent = stale
    ? `Last successful snapshot: ${new Date(summary.generatedAt).toLocaleString('en-US')}`
    : `Last synchronized: ${new Date(summary.generatedAt).toLocaleString('en-US')}`;
  retryButton.hidden = true;
}

function renderUnavailable(message) {
  for (const [metric, card] of cards) {
    card.classList.remove('is-loading', 'is-stale');
    card.classList.add('is-unavailable');
    card.querySelector('[data-kpi-value]').textContent = '—';
    card.querySelector('[data-kpi-note]').textContent = 'Unavailable';
  }
  summarySection.setAttribute('aria-busy', 'false');
  sourceStatus.textContent = message;
  pageSourceLabel.textContent = 'Data source unavailable';
  footerSourceLabel.textContent = 'Data source unavailable';
  fleetSourceTitle.textContent = 'Fleet data unavailable';
  fleetSourceCopy.textContent = 'Start the Node.js application server and retry.';
  synchronizedLabel.textContent = 'No successful snapshot available';
  retryButton.hidden = false;
}

async function refreshSummary() {
  if (refreshInProgress) return;
  refreshInProgress = true;
  retryButton.hidden = true;
  try {
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Overview API returned ${response.status}`);
    const summary = await response.json();
    if (!isValidSummary(summary)) throw new Error('Overview API returned an invalid snapshot');
    cacheSummary(summary);
    renderSummary(summary);
  } catch (error) {
    const cached = getCachedSummary();
    if (cached) {
      renderSummary(cached, { stale: true });
    } else {
      renderUnavailable('Fleet summary is unavailable. Check the local Node.js server and retry.');
    }
    console.error('Could not refresh fleet summary', error);
  } finally {
    refreshInProgress = false;
  }
}

retryButton.addEventListener('click', refreshSummary);
initSystemPerformance();
refreshSummary();
window.setInterval(refreshSummary, refreshIntervalMs);
