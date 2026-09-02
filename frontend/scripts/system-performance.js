const ranges = {
  '1h': { label: 'Last hour', points: 13, stepMinutes: 5 },
  '6h': { label: 'Last 6 hours', points: 13, stepMinutes: 30 },
  '24h': { label: 'Last 24 hours', points: 13, stepMinutes: 120 },
};

const chartWidth = 760;
const chartHeight = 220;
const plotTop = 18;
const plotBottom = 198;

function seededValue(index, rangeFactor, offset) {
  return Math.sin(index * 1.17 + rangeFactor + offset) + Math.cos(index * 0.53 + offset) * 0.55;
}

function buildSimulatedTelemetry(rangeKey) {
  const config = ranges[rangeKey];
  const now = new Date();
  const rangeFactor = config.stepMinutes / 30;
  const points = Array.from({ length: config.points }, (_, index) => {
    const timestamp = new Date(now.getTime() - (config.points - index - 1) * config.stepMinutes * 60_000);
    const signal = seededValue(index, rangeFactor, 0.4);
    return {
      timestamp: timestamp.toISOString(),
      throughputMbps: Number((56 + index * 1.25 + signal * 7.5).toFixed(1)),
      snrDb: Number((18.5 + index * 0.28 + seededValue(index, rangeFactor, 1.7) * 2.1).toFixed(1)),
    };
  });

  const requestedState = new URLSearchParams(window.location.search).get('performanceState');
  if (requestedState === 'empty') return [];
  if (requestedState === 'partial') {
    points[3].snrDb = null;
    points[8].throughputMbps = null;
  }
  return points;
}

async function fetchSimulatedTelemetry(rangeKey, signal) {
  await new Promise((resolve, reject) => {
    const timeout = window.setTimeout(resolve, 420);
    signal.addEventListener('abort', () => {
      window.clearTimeout(timeout);
      reject(new DOMException('Request aborted', 'AbortError'));
    }, { once: true });
  });
  if (new URLSearchParams(window.location.search).get('performanceState') === 'error') {
    throw new Error('Simulated telemetry is unavailable');
  }
  return buildSimulatedTelemetry(rangeKey);
}

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

function getScale(values, padding = 0.12) {
  const validValues = values.filter(Number.isFinite);
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
    summary.textContent = `Loading ${ranges[rangeSelect.value].label.toLowerCase()} of simulated telemetry…`;
    return requestController.signal;
  }

  function showMessage(title, copy, canRetry) {
    loading.hidden = true;
    chart.hidden = true;
    message.hidden = false;
    messageTitle.textContent = title;
    messageCopy.textContent = copy;
    retry.hidden = !canRetry;
    summary.textContent = 'Simulated telemetry unavailable';
  }

  function render(points) {
    const throughputValues = points.map((point) => point.throughputMbps);
    const snrValues = points.map((point) => point.snrDb);
    const throughputScale = getScale(throughputValues);
    const snrScale = getScale(snrValues);
    const isPartial = [...throughputValues, ...snrValues].some((value) => !Number.isFinite(value));
    const averageOnline = Math.round(18 + points.length / 12);

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
    summary.textContent = `${ranges[rangeSelect.value].label} · ${averageOnline} devices online on average · Simulated`;
    note.textContent = 'Some telemetry samples are unavailable. Available data remains visible.';
    note.hidden = !isPartial;
  }

  async function refresh() {
    const signal = setLoading();
    try {
      const points = await fetchSimulatedTelemetry(rangeSelect.value, signal);
      if (points.length === 0) {
        showMessage('No performance data', 'No simulated telemetry was recorded for this time range.', false);
        return;
      }
      render(points);
    } catch (error) {
      if (error.name !== 'AbortError') showMessage('Performance data unavailable', 'Could not load simulated telemetry. Try again.', true);
    } finally {
      if (!signal.aborted) rangeSelect.disabled = false;
    }
  }

  rangeSelect.addEventListener('change', refresh);
  retry.addEventListener('click', refresh);
  refresh();
}
