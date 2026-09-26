import { initSystemPerformance } from './system-performance.js';
import { renderFleetSummary, renderFleetSummaryUnavailable } from './fleet-summary.js';
import { renderFleetHealth, renderFleetHealthUnavailable } from './fleet-health.js';

const endpoint = '/api/v1/overview/summary';
const refreshIntervalMs = 5_000;
const cacheKey = 'sdr-management.overview-summary.v1';
const healthStates = ['online', 'warning', 'offline', 'updating'];
const retryButton = document.querySelector('#fleet-summary-retry');
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
      healthStates.reduce((total, state) => total + counts[state], 0) === summary.metrics.totalDevices &&
      typeof summary.generatedAt === 'string' &&
      Number.isFinite(Date.parse(summary.generatedAt)) &&
      summary.source,
  );
}

function renderSnapshot(summary, options) {
  renderFleetSummary(summary, options);
  renderFleetHealth(summary, options);
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
    renderSnapshot(summary);
  } catch (error) {
    const cached = getCachedSummary();
    if (cached) {
      renderSnapshot(cached, { stale: true });
    } else {
      renderFleetSummaryUnavailable('Fleet summary is unavailable. Check the local Node.js server and retry.');
      renderFleetHealthUnavailable();
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
