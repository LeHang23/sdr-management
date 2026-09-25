const ranges = {
  '1h': { label: 'Last hour', points: 13, stepMinutes: 5 },
  '6h': { label: 'Last 6 hours', points: 13, stepMinutes: 30 },
  '24h': { label: 'Last 24 hours', points: 13, stepMinutes: 120 },
};
const endpoint = '/api/v1/overview/performance';

const chartWidth = 760;
const chartHeight = 220;
const plotTop = 18;
const plotBottom = 198;

function isValidPerformance(performance) {
  return Boolean(
    performance &&
      performance.range &&
      performance.source &&
      performance.summary &&
      Array.isArray(performance.points) &&
      performance.points.every((point) =>
        typeof point.timestamp === 'string' &&
        (point.throughputMbps === null || Number.isFinite(point.throughputMbps)) &&
        (point.snrDb === null || Number.isFinite(point.snrDb)) &&
        Number.isFinite(point.onlineDevices),
      ),
  );
}

async function fetchPerformance(rangeKey, signal) {
  const response = await fetch(`${endpoint}?range=${encodeURIComponent(rangeKey)}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) throw new Error(`System Performance API returned ${response.status}`);
  const performance = await response.json();
  if (!isValidPerformance(performance)) throw new Error('System Performance API returned an invalid snapshot');
  return performance;
}

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

function getScale(values, padding = 0.12) {
  const validValues = values.filter(Number.isFinite);
  if (validValues.length === 0) return { min: 0, max: 4, step: 1 };
  const minimum = Math.min(...validValues);
  const maximum = Math.max(...validValues);
  const span = Math.max(maximum - minimum, 1);
  const step = Math.max(1, Math.ceil((span * (1 + padding * 2)) / 4));
  const min = Math.max(0, Math.floor((minimum - span * padding) / step) * step);
  return { min, max: min + step * 4, step };
}

function toY(value, scale) {
  return plotBottom - ((value - scale.min) / (scale.max - scale.min)) * (plotBottom - plotTop);
}

function buildSegments(points, key, scale) {
  const segments = [];
  let active = [];
  points.forEach((point, index) => {
    if (Number.isFinite(point[key])) {
      active.push([index * (chartWidth / (points.length - 1)), toY(point[key], scale)]);
    } else if (active.length) {
      segments.push(active);
      active = [];
    }
  });
  if (active.length) segments.push(active);
  return segments;
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(timestamp));
}

function formatAxis(scale) {
  return Array.from({ length: 5 }, (_, index) => scale.max - scale.step * index);
}

export function initSystemPerformance() {
  const rangeSelect = document.querySelector('#performance-range');
  const summary = document.querySelector('#performance-summary');
  const loading = document.querySelector('#performance-loading');
  const message = document.querySelector('#performance-message');
  const messageTitle = document.querySelector('#performance-message-title');
  const messageCopy = document.querySelector('#performance-message-copy');
  const retry = document.querySelector('#performance-retry');
  const chart = document.querySelector('#performance-chart');
  const svg = document.querySelector('#performance-svg');
  const throughputAxis = document.querySelector('#throughput-axis');
  const snrAxis = document.querySelector('#snr-axis');
  const timeAxis = document.querySelector('#performance-time-axis');
  const tooltip = document.querySelector('#performance-tooltip');
  const note = document.querySelector('#performance-note');
  let requestController;

  function setLoading() {
    requestController?.abort();
    requestController = new AbortController();
    rangeSelect.disabled = true;
    loading.hidden = false;
    message.hidden = true;
    chart.hidden = true;
    note.hidden = true;
    summary.textContent = `Loading ${ranges[rangeSelect.value].label.toLowerCase()} of telemetry…`;
    return requestController.signal;
  }

  function showMessage(title, copy, canRetry) {
    loading.hidden = true;
    chart.hidden = true;
    message.hidden = false;
    messageTitle.textContent = title;
    messageCopy.textContent = copy;
    retry.hidden = !canRetry;
    summary.textContent = 'Telemetry unavailable';
  }

  function render(performance) {
    const { points } = performance;
    const throughputValues = points.map((point) => point.throughputMbps);
    const snrValues = points.map((point) => point.snrDb);
    const throughputScale = getScale(throughputValues);
    const snrScale = getScale(snrValues);
    const isPartial = performance.summary.partial;
    const averageOnline = performance.summary.averageOnlineDevices;

    svg.replaceChildren();
    const title = createSvgElement('title');
    title.textContent = `Throughput in Mbps and SNR in dB for ${ranges[rangeSelect.value].label.toLowerCase()}`;
    svg.append(title);

    const definitions = createSvgElement('defs');
    const throughputGradient = createSvgElement('linearGradient', {
      id: 'throughput-fill', x1: 0, y1: 0, x2: 0, y2: 1,
    });
    throughputGradient.append(
      createSvgElement('stop', { offset: '0%', 'stop-color': '#2563eb', 'stop-opacity': '0.18' }),
      createSvgElement('stop', { offset: '100%', 'stop-color': '#2563eb', 'stop-opacity': '0' }),
    );
    definitions.append(throughputGradient);
    svg.append(definitions);

    const grid = createSvgElement('g', { class: 'chart-grid' });
    for (let index = 0; index < 5; index += 1) {
      const y = plotTop + index * ((plotBottom - plotTop) / 4);
      grid.append(createSvgElement('line', { x1: 0, y1: y, x2: chartWidth, y2: y }));
    }
    svg.append(grid);

    const areaSegments = buildSegments(points, 'throughputMbps', throughputScale);
    if (areaSegments.length === 1 && areaSegments[0].length > 1) {
      const line = areaSegments[0].map(([x, y]) => `${x},${y}`).join(' L');
      svg.append(createSvgElement('path', { class: 'area', d: `M${line} L${chartWidth},${plotBottom} L0,${plotBottom} Z` }));
    }

    for (const [key, scale, className] of [
      ['throughputMbps', throughputScale, 'throughput-line'],
      ['snrDb', snrScale, 'snr-line'],
    ]) {
      for (const segment of buildSegments(points, key, scale)) {
        if (segment.length > 1) {
          svg.append(createSvgElement('polyline', {
            class: className,
            points: segment.map(([x, y]) => `${x},${y}`).join(' '),
          }));
        }
      }
    }

    points.forEach((point, index) => {
      const x = index * (chartWidth / (points.length - 1));
      const hitArea = createSvgElement('rect', {
        class: 'chart-hit-area', x: Math.max(0, x - 18), y: 0, width: 36, height: chartHeight,
        tabindex: 0, role: 'button', 'aria-label': `${formatTime(point.timestamp)}. Throughput ${point.throughputMbps ?? 'unavailable'} Mbps. SNR ${point.snrDb ?? 'unavailable'} dB.`,
      });
      const showTooltip = () => {
        tooltip.innerHTML = `<strong>${formatTime(point.timestamp)}</strong><span>Throughput: ${point.throughputMbps ?? '—'} Mbps</span><span>SNR: ${point.snrDb ?? '—'} dB</span>`;
        tooltip.style.setProperty('--tooltip-position', `${Math.min(88, Math.max(12, (x / chartWidth) * 100))}%`);
        tooltip.hidden = false;
      };
      hitArea.addEventListener('mouseenter', showTooltip);
      hitArea.addEventListener('focus', showTooltip);
      hitArea.addEventListener('mouseleave', () => { tooltip.hidden = true; });
      hitArea.addEventListener('blur', () => { tooltip.hidden = true; });
      svg.append(hitArea);
    });

    throughputAxis.replaceChildren(...formatAxis(throughputScale).map((value) => Object.assign(document.createElement('span'), { textContent: value })));
    snrAxis.replaceChildren(...formatAxis(snrScale).map((value) => Object.assign(document.createElement('span'), { textContent: value })));
    const labelIndexes = [0, Math.floor((points.length - 1) / 4), Math.floor((points.length - 1) / 2), Math.floor((points.length - 1) * 0.75), points.length - 1];
    timeAxis.replaceChildren(...labelIndexes.map((index) => Object.assign(document.createElement('span'), { textContent: formatTime(points[index].timestamp) })));

    loading.hidden = true;
    message.hidden = true;
    chart.hidden = false;
    summary.textContent = `${performance.range.label} · ${averageOnline} devices online on average · ${performance.source.label}`;
    note.textContent = 'Some telemetry samples are unavailable. Available data remains visible.';
    note.hidden = !isPartial;
  }

  async function refresh() {
    const signal = setLoading();
    try {
      const performance = await fetchPerformance(rangeSelect.value, signal);
      if (performance.points.length === 0) {
        showMessage('No performance data', 'No telemetry was recorded for this time range.', false);
        return;
      }
      render(performance);
    } catch (error) {
      if (error.name !== 'AbortError') {
        showMessage('Performance data unavailable', 'Could not load telemetry from the server. Try again.', true);
        console.error('Could not refresh system performance', error);
      }
    } finally {
      if (!signal.aborted) rangeSelect.disabled = false;
    }
  }

  rangeSelect.addEventListener('change', refresh);
  retry.addEventListener('click', refresh);
  refresh();
}
