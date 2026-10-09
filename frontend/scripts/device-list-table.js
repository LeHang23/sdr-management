const rows = document.querySelector('#device-rows');
const selectAll = document.querySelector('#device-select-all');
const clear = document.querySelector('#device-selection-clear');
const selected = new Set();
let items = [];
const labels = { online: 'Healthy', warning: 'Warning', offline: 'Offline', updating: 'Updating' };
export const sourceLabels = { manual: 'Manual input', simulator: 'Simulator', sdr_gateway: 'SDR Gateway' };
const dates = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function updateSelection() {
  for (const checkbox of rows.querySelectorAll('input')) checkbox.checked = selected.has(checkbox.value);
  selectAll.disabled = items.length === 0;
  selectAll.checked = items.length > 0 && selected.size === items.length;
  selectAll.indeterminate = selected.size > 0 && selected.size < items.length;
  clear.disabled = selected.size === 0;
  document.querySelector('#device-selection-count').textContent = `${selected.size} devices selected on this page`;
}

export function clearDeviceSelection() {
  selected.clear();
  updateSelection();
}

rows.addEventListener('change', (event) => {
  if (!event.target.matches('input[type="checkbox"]')) return;
  if (event.target.checked) selected.add(event.target.value);
  else selected.delete(event.target.value);
  updateSelection();
});
selectAll.addEventListener('change', () => {
  selected.clear();
  if (selectAll.checked) items.forEach((item) => selected.add(item.deviceId));
  updateSelection();
});
clear.addEventListener('click', clearDeviceSelection);

export function renderDeviceMessage(text) {
  items = [];
  const row = element('tr');
  const cell = element('td', text, 'device-message');
  cell.colSpan = 7;
  row.append(cell);
  rows.replaceChildren(row);
  clearDeviceSelection();
}

export function renderDeviceTable(snapshot) {
  items = snapshot.items;
  for (const id of selected) if (!items.some((item) => item.deviceId === id)) selected.delete(id);
  const fragment = document.createDocumentFragment();
  for (const item of items) {
    const row = element('tr');
    const selection = element('td');
    const checkbox = element('input');
    checkbox.type = 'checkbox';
    checkbox.value = item.deviceId;
    checkbox.setAttribute('aria-label', `Select ${item.displayName} (${item.deviceId})`);
    selection.append(checkbox);
    const identity = element('td');
    identity.append(element('strong', item.displayName), element('small', item.deviceId));
    const health = element('td');
    health.append(element('span', labels[item.healthStatus], `status-tag ${item.healthStatus}`));
    const connection = element('td', item.connectionStatus === 'online' ? 'Online' : 'Offline');
    const source = element('td', sourceLabels[item.source]);
    const seen = element('td');
    if (item.lastSeenAt === null) seen.textContent = 'Never seen';
    else {
      const time = element('time', dates.format(new Date(item.lastSeenAt)));
      time.dateTime = item.lastSeenAt;
      time.title = new Date(item.lastSeenAt).toISOString();
      seen.append(time);
    }
    row.append(selection, identity, health, connection, source, seen,
      element('td', item.needsAttention ? 'Needs attention' : '—'));
    fragment.append(row);
  }
  rows.replaceChildren(fragment);
  if (!items.length) renderDeviceMessage(snapshot.fleetTotal === 0
    ? 'No devices registered yet.' : 'No devices match your search and filters.');
  updateSelection();
}

export function isValidDeviceList(value) {
  return Boolean(value && typeof value.snapshotId === 'string' && Number.isFinite(Date.parse(value.generatedAt)) &&
    ['fleetTotal', 'total', 'page', 'pageSize', 'pageCount'].every((key) => Number.isSafeInteger(value[key])) &&
    value.total >= 0 && value.fleetTotal >= value.total && value.page > 0 &&
    [10, 25, 50, 100].includes(value.pageSize) && value.pageCount === Math.max(1, Math.ceil(value.total / value.pageSize)) &&
    value.page <= value.pageCount && Array.isArray(value.items) &&
    value.items.length === Math.min(value.pageSize, Math.max(0, value.total - (value.page - 1) * value.pageSize)) &&
    new Set(value.items.map((item) => item?.deviceId)).size === value.items.length &&
    value.items.every((item) => item && typeof item.deviceId === 'string' && item.deviceId.length > 0 &&
      typeof item.displayName === 'string' && Object.hasOwn(labels, item.healthStatus) &&
      ['online', 'offline'].includes(item.connectionStatus) && Object.hasOwn(sourceLabels, item.source) &&
      typeof item.needsAttention === 'boolean' &&
      (item.lastSeenAt === null || (typeof item.lastSeenAt === 'string' && Number.isFinite(Date.parse(item.lastSeenAt))))));
}
