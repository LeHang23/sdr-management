const formatter = new Intl.NumberFormat('en-US');
const healthStates = ['online', 'warning', 'offline', 'updating'];

const healthCard = document.querySelector('#fleet-health');
const healthUpdated = document.querySelector('#fleet-health-updated');
const healthChart = document.querySelector('#fleet-health-chart');
const healthDonut = document.querySelector('#fleet-health-donut');
const healthPercentage = document.querySelector('#fleet-health-percentage');
const healthCenterLabel = document.querySelector('#fleet-health-center-label');
const healthCounts = new Map(
  [...document.querySelectorAll('[data-health-state]')].map((item) => [
    item.dataset.healthState,
    item.querySelector('[data-health-count]'),
  ]),
);
function formatSnapshotTime(timestamp) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp));
}

export function renderFleetHealth(summary, { stale = false } = {}) {
  const counts = summary.details.healthCounts;
  const totalDevices = summary.metrics.totalDevices;
  const healthyPercentage = totalDevices === 0 ? 0 : Math.round((counts.online / totalDevices) * 100);
  let cumulative = 0;
  const ends = {};

  for (const state of healthStates.slice(0, -1)) {
    cumulative += totalDevices === 0 ? 0 : (counts[state] / totalDevices) * 360;
    ends[state] = `${cumulative}deg`;
  }

  healthDonut.style.setProperty('--health-healthy-end', ends.online);
  healthDonut.style.setProperty('--health-warning-end', ends.warning);
  healthDonut.style.setProperty('--health-offline-end', ends.offline);
  healthPercentage.textContent = `${healthyPercentage}%`;
  healthCenterLabel.textContent = totalDevices === 0 ? 'No devices' : 'Healthy';
  for (const state of healthStates) healthCounts.get(state).textContent = formatter.format(counts[state]);

  healthCard.classList.remove('is-loading', 'is-unavailable', 'is-empty', 'is-stale');
  if (totalDevices === 0) healthCard.classList.add('is-empty');
  if (stale) healthCard.classList.add('is-stale');
  healthCard.setAttribute('aria-busy', 'false');
  healthUpdated.textContent = stale
    ? `Cached snapshot · ${formatSnapshotTime(summary.generatedAt)}`
    : `Updated at ${formatSnapshotTime(summary.generatedAt)}`;
  healthChart.setAttribute(
    'aria-label',
    totalDevices === 0
      ? `No devices in fleet${stale ? '. Cached data' : ''}`
      : `${healthyPercentage}% healthy. ${counts.online} healthy, ${counts.warning} warning, ${counts.offline} offline, and ${counts.updating} updating${stale ? '. Cached data' : ''}.`,
  );
}

export function renderFleetHealthUnavailable() {
  healthCard.classList.remove('is-loading', 'is-empty', 'is-stale');
  healthCard.classList.add('is-unavailable');
  healthCard.setAttribute('aria-busy', 'false');
  healthUpdated.textContent = 'Data unavailable';
  healthPercentage.textContent = '—';
  healthCenterLabel.textContent = 'Unavailable';
  for (const count of healthCounts.values()) count.textContent = '—';
  healthChart.setAttribute('aria-label', 'Fleet health data is unavailable');
}
