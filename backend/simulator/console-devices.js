export function createDevices({ request, refresh, error }) {
  const dialog = document.querySelector('#device-editor');
  const form = document.querySelector('#device-form');
  let latest = { devices: [] };
  let editing = null;

  function open(device = null) {
    editing = device?.id ?? null;
    form.reset();
    document.querySelector('#device-error').textContent = '';
    form.elements.id.value = device?.id ?? '';
    form.elements.id.readOnly = Boolean(device);
    form.elements.displayName.value = device?.displayName ?? '';
    form.elements.model.value = device?.metadata?.model ?? '';
    form.elements.location.value = device?.metadata?.location ?? '';
    form.elements.throughputMbps.value = device?.telemetry?.throughputMbps ?? '';
    form.elements.snrDb.value = device?.telemetry?.snrDb ?? '';
    form.elements.fault.value = device?.fault ?? 'normal';
    dialog.querySelector('h2').textContent = device ? `Edit ${device.id}` : 'Add virtual device';
    dialog.showModal();
  }
  function telemetry(fields) {
    return Object.fromEntries(['throughputMbps', 'snrDb'].filter((key) => fields[key].value !== '').map((key) => [key, Number(fields[key].value)]));
  }
  document.querySelector('#add-device').addEventListener('click', () => open());
  document.querySelector('#cancel-device').addEventListener('click', () => dialog.close());
  document.querySelector('#devices').addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-device-action]');
    if (!button) return;
    const device = latest.devices.find((d) => d.id === button.dataset.id);
    if (!device) return;
    if (button.dataset.deviceAction === 'edit') { open(device); return; }
    if (!window.confirm(`Remove ${device.id} from the simulator? Backend history will remain.`)) return;
    button.disabled = true;
    try { await request(`./api/devices/${encodeURIComponent(device.id)}`, 'DELETE'); await refresh(); }
    catch (failure) { error(failure.message); }
    finally { button.disabled = false; }
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fields = form.elements;
    const body = {
      id: fields.id.value.trim(), displayName: fields.displayName.value.trim(),
      metadata: { model: fields.model.value.trim(), location: fields.location.value.trim() },
      telemetry: telemetry(fields), fault: fields.fault.value,
    };
    fields.save.disabled = true;
    try {
      await request(editing ? `./api/devices/${encodeURIComponent(editing)}` : './api/devices', editing ? 'PUT' : 'POST', body);
      dialog.close(); await refresh();
    } catch (failure) { document.querySelector('#device-error').textContent = failure.message; }
    finally { fields.save.disabled = false; }
  });
  return {
    render(status) {
      latest = status;
      document.querySelector('#persistence-note').textContent = status.persistenceEnabled
        ? 'Device configuration is saved across restarts. Removing a device keeps its backend history.'
        : 'Configuration is in memory. Set SDR_SIMULATOR_STATE_PATH to keep it across restarts.';
    },
  };
}
