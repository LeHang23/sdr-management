import { renderDeviceTable, renderDeviceMessage, isValidDeviceList, clearDeviceSelection } from './device-list-table.js';
import { readDeviceLocation, syncDeviceControls, deviceQueryParams, writeDeviceLocation, initDeviceControls } from './device-list-controls.js';

let query = readDeviceLocation();
let snapshot = null;
let controller;
let generation = 0;
let timer;
const region = document.querySelector('#device-table-region');
const status = document.querySelector('#device-status');
const retry = document.querySelector('#device-retry');
const previous = document.querySelector('#device-previous');
const next = document.querySelector('#device-next');
const count = document.querySelector('#device-count');

function renderPagination() {
  previous.disabled = !snapshot || snapshot.page <= 1;
  next.disabled = !snapshot || snapshot.page >= snapshot.pageCount;
  document.querySelector('#device-page-number').textContent = snapshot ? `Page ${snapshot.page} of ${snapshot.pageCount}` : 'Page unavailable';
  document.querySelector('#device-page-summary').textContent = snapshot
    ? snapshot.total === 0 ? '0 devices' : `${(snapshot.page - 1) * snapshot.pageSize + 1}–${Math.min(snapshot.page * snapshot.pageSize, snapshot.total)} of ${snapshot.total} devices`
    : 'Device count unavailable';
}

async function load() {
  clearTimeout(timer);
  controller?.abort();
  controller = new AbortController();
  const currentController = controller;
  const current = ++generation;
  region.setAttribute('aria-busy', 'true');
  status.textContent = snapshot ? 'Refreshing snapshot…' : 'Loading devices…';
  previous.disabled = true;
  next.disabled = true;
  retry.hidden = true;
  const timeout = setTimeout(() => currentController.abort(), 10_000);
  try {
    const response = await fetch(`/api/v1/devices?${deviceQueryParams(query)}`, { signal: currentController.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(response.status === 401 ? 'Sign-in required. Reload after signing in.' : 'Device list is unavailable.');
    const value = await response.json();
    if (!isValidDeviceList(value)) throw new Error('The device response is invalid.');
    if (current !== generation) return;
    snapshot = value;
    query.page = String(value.page);
    writeDeviceLocation(query);
    renderDeviceTable(value);
    count.textContent = `${value.total} matching devices · ${value.fleetTotal} in fleet`;
    status.textContent = `Updated ${new Date(value.generatedAt).toLocaleTimeString('en-US')} · Health and connection are separate states.`;
    status.parentElement.classList.remove('is-stale');
  } catch (error) {
    if (current !== generation) return;
    status.textContent = snapshot ? `Stale snapshot · Refresh failed. Last updated ${new Date(snapshot.generatedAt).toLocaleTimeString('en-US')}. Retry to update.`
      : navigator.onLine === false ? 'You are offline. Reconnect and retry.' : error.name === 'AbortError' ? 'Request timed out. Please retry.' : error.message;
    status.parentElement.classList.toggle('is-stale', Boolean(snapshot));
    if (!snapshot) { renderDeviceMessage('Device data is unavailable. Please retry.'); count.textContent = 'Device count unavailable'; }
    retry.hidden = false;
  } finally {
    clearTimeout(timeout);
    if (current === generation) {
      region.setAttribute('aria-busy', 'false');
      renderPagination();
      timer = setTimeout(() => { if (!document.hidden) load(); }, 30_000);
    }
  }
}

function changeQuery(value) {
  query = value;
  snapshot = null;
  clearDeviceSelection();
  renderDeviceMessage('Loading devices…');
  count.textContent = 'Loading devices…';
  status.parentElement.classList.remove('is-stale');
  syncDeviceControls(query);
  writeDeviceLocation(query);
  load();
}

initDeviceControls(changeQuery, load);
previous.addEventListener('click', () => { if (snapshot?.page > 1) changeQuery({ ...query, page: String(snapshot.page - 1) }); });
next.addEventListener('click', () => { if (snapshot && snapshot.page < snapshot.pageCount) changeQuery({ ...query, page: String(snapshot.page + 1) }); });
window.addEventListener('popstate', () => changeQuery(readDeviceLocation()));
window.addEventListener('online', load);
document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
syncDeviceControls(query);
load();
