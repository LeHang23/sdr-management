export function createJobs({ request, refresh, error }) {
  const jobsForm = document.querySelector('#job-form');
  const targets = jobsForm.elements.targets;
  let targetIds = '';
  let jobId = null;
  function telemetry(fields) {
    return Object.fromEntries(['throughputMbps', 'snrDb'].filter((key) => fields[key].value !== '').map((key) => [key, Number(fields[key].value)]));
  }
  jobsForm.addEventListener('input', () => { jobId = null; });
  jobsForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    jobId ??= crypto.randomUUID();
    const fields = jobsForm.elements;
    fields.submitJob.disabled = true;
    try {
      const response = await request('./api/jobs', 'POST', {
        jobId, deviceIds: Array.from(targets.selectedOptions, (option) => option.value),
        telemetry: telemetry(fields), outcome: fields.outcome.value, timeoutMs: Number(fields.timeoutMs.value),
      });
      document.querySelector('#job-feedback').textContent = `Queued simulated job ${response.jobId}.`;
      jobId = null;
      await refresh();
    } catch (failure) { error(failure.message); }
    finally { fields.submitJob.disabled = false; }
  });
  return {
    render(status) {
      const ids = JSON.stringify(status.devices.map((device) => [device.id, device.displayName]));
      if (ids !== targetIds) {
        const selected = new Set(Array.from(targets.selectedOptions, (option) => option.value));
        targets.replaceChildren(...status.devices.map((device) => {
          const option = document.createElement('option');
          option.value = device.id; option.textContent = `${device.displayName} (${device.id})`;
          option.selected = selected.has(device.id); return option;
        }));
        targetIds = ids;
      }
      const history = document.querySelector('#job-history');
      history.replaceChildren();
      if (status.jobsError) {
        const warning = document.createElement('p');
        warning.className = 'error'; warning.textContent = `Job status unavailable: ${status.jobsError}. Previously confirmed results may be stale.`;
        history.append(warning);
      }
      for (const job of status.jobs ?? []) {
        const article = document.createElement('article'); article.className = 'job-item';
        const heading = document.createElement('strong'); heading.textContent = `${job.jobId} • ${job.status} • simulated`;
        const text = document.createElement('p');
        text.textContent = job.targets.map((target) => `${target.deviceId}: ${target.status} (deadline ${new Date(target.deadlineAt).toLocaleTimeString()})`).join(' · ');
        article.append(heading, text); history.append(article);
      }
      if (!(status.jobs?.length) && !status.jobsError) history.textContent = 'No simulated jobs yet.';
    },
  };
}
