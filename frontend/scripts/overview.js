import { initSystemPerformance } from './system-performance.js';
import { renderFleetSummary, renderFleetSummaryUnavailable } from './fleet-summary.js';
import { renderFleetHealth, renderFleetHealthUnavailable } from './fleet-health.js';
import { isValidDevicesToWatch, renderDevicesToWatch, renderDevicesToWatchUnavailable } from './devices-to-watch.js';

const endpoint = '/api/v1/overview/summary';
const refreshIntervalMs = 5_000;
const cacheKey = 'sdr-management.overview-summary.v2';
const healthStates = ['online', 'warning', 'offline', 'updating'];
const retryButton = document.querySelector('#fleet-summary-retry');
let refreshInProgress = false;
let lastSuccessfulSummary = null;

function getCachedSummary() {
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    return isValidSummary(cached) ? cached : null;
  } catch {
    return null;
  }
}

function cacheSummary(summary) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(summary));
  } catch {
    // Storage may be blocked or full; a fresh API snapshot still renders.
  }
}

function isValidSummary(summary) {
  const metricsValid = summary?.metrics &&
    ['totalDevices', 'onlineNow', 'needsAttention', 'activeJobs'].every(
      (key) => Number.isFinite(summary.metrics[key]) && summary.metrics[key] >= 0,
    );
  const counts = summary?.details?.healthCounts;
  const healthCountsValid = counts && healthStates.every(
    (state) => Number.isInteger(counts[state]) && counts[state] >= 0,
  );
  return Boolean(
    metricsValid &&
      healthCountsValid &&
      isValidDevicesToWatch(summary.details.devicesToWatch, summary.metrics.needsAttention) &&
      healthStates.reduce((total, state) => total + counts[state], 0) === summary.metrics.totalDevices &&
      typeof summary.generatedAt === 'string' &&
      Number.isFinite(Date.parse(summary.generatedAt)) &&
      typeof summary.source?.mode === 'string' &&
      typeof summary.source?.label === 'string',
  );
}

function renderSnapshot(summary, options) {
  renderFleetSummary(summary, options);
  renderFleetHealth(summary, options);
  renderDevicesToWatch(summary, options);
}

async function refreshSummary() {
  if (refreshInProgress) return;
  refreshInProgress = true;
  retryButton.hidden = true;
  try {
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Overview API returned ${response.status}`);
    const summary = await response.json();
    if (!isValidSummary(summary)) throw new Error('Overview API returned an invalid snapshot');
    lastSuccessfulSummary = summary;
    cacheSummary(summary);
    renderSnapshot(summary);
  } catch (error) {
    const cached = lastSuccessfulSummary ?? getCachedSummary();
    if (cached) {
      renderSnapshot(cached, { stale: true });
    } else {
      renderFleetSummaryUnavailable('Fleet summary is unavailable. Check the local Node.js server and retry.');
      renderFleetHealthUnavailable();
      renderDevicesToWatchUnavailable();
    }
    console.error('Could not refresh fleet summary', error);
  } finally {
    refreshInProgress = false;
  }
}

retryButton.addEventListener('click', refreshSummary);
document.querySelector('#devices-watch-retry').addEventListener('click', refreshSummary);
initSystemPerformance();
refreshSummary();
window.setInterval(refreshSummary, refreshIntervalMs);
