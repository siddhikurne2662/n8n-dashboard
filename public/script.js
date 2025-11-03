async function callApi(path, method='GET') {
  const base = document.getElementById('apiUrl').value;
  const user = document.getElementById('user').value;
  const pass = document.getElementById('pass').value;
  const res = await fetch(base + path, {
    method,
    headers: {
      'Authorization': 'Basic ' + btoa(user + ':' + pass),
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

async function loadWorkflows() {
  const data = await callApi('/workflows');
  const container = document.getElementById('workflows');
  const items = data.data || data; // n8n may wrap in data property
  container.innerHTML = items.map(wf => `
    <div class="card">
      <strong>${wf.name || 'Untitled'}</strong> (id: ${wf.id})<br/>
      Status: ${wf.active ? '🟢 Active' : '🔴 Inactive'}
      <div style="margin-top:8px;">
        <button onclick="runWorkflow(${wf.id})">Run</button>
        <button onclick="toggle(${wf.id}, ${wf.active})">${wf.active ? 'Deactivate' : 'Activate'}</button>
        <button onclick="viewExecutions(${wf.id})">History</button>
      </div>
      <div id="exec-${wf.id}"></div>
    </div>
  `).join('');
}

async function runWorkflow(id) {
  await callApi(`/workflows/${id}/run`, 'POST');
  alert('Run triggered for workflow ' + id);
}

async function toggle(id, active) {
  const action = active ? 'deactivate' : 'activate';
  await callApi(`/workflows/${id}/${action}`, 'POST');
  loadWorkflows();
}

async function viewExecutions(id) {
  const res = await callApi(`/executions?filter[workflowId]=${id}`);
  const list = res.data || res;
  document.getElementById('exec-' + id).innerHTML = '<pre>' + JSON.stringify(list, null, 2) + '</pre>';
}

document.getElementById('load').onclick = loadWorkflows;
