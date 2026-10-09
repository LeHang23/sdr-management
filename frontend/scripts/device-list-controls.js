const form = document.querySelector('#device-filters');
const pageSize = document.querySelector('#device-page-size');
const defaults = { q: '', health: 'all', connection: 'all', source: 'all', attention: 'all', sort: 'name', direction: 'asc', page: '1', pageSize: '25' };

export function readDeviceLocation() {
  const params = new URLSearchParams(location.search);
  const result = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const value = params.get(key);
    if (value === null) continue;
    if (key === 'q') result.q = value.trim().slice(0, 100);
    else if (key === 'page') {
      if (/^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))) result.page = value;
    } else {
      const select = key === 'pageSize' ? pageSize : form.elements.namedItem(key);
      if ([...select.options].some((option) => option.value === value)) result[key] = value;
    }
  }
  return result;
}

export function syncDeviceControls(query) {
  for (const key of Object.keys(defaults)) {
    if (key === 'page') continue;
    (key === 'pageSize' ? pageSize : form.elements.namedItem(key)).value = query[key];
  }
}

export function deviceQueryParams(query) {
  return new URLSearchParams(Object.entries(query).map(([key, value]) => [key, String(value)]));
}

export function writeDeviceLocation(query) {
  const params = new URLSearchParams();
  for (const key of Object.keys(defaults)) if (String(query[key]) !== defaults[key]) params.set(key, query[key]);
  history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}`);
}

export function initDeviceControls(onChange, onRefresh) {
  function applyFilters() {
    onChange({ ...Object.fromEntries(new FormData(form)), page: '1', pageSize: pageSize.value });
  }
  form.addEventListener('submit', (event) => { event.preventDefault(); applyFilters(); });
  form.addEventListener('change', (event) => { if (event.target.tagName === 'SELECT') applyFilters(); });
  document.querySelector('#device-clear').addEventListener('click', () => {
    syncDeviceControls(defaults);
    onChange({ ...defaults });
  });
  pageSize.addEventListener('change', applyFilters);
  for (const id of ['device-refresh', 'device-retry']) document.querySelector(`#${id}`).addEventListener('click', onRefresh);
}
