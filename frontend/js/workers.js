

const workerForm = document.getElementById('workerForm');
const workersTableBody = document.querySelector('#workersTable tbody');

let allWorkers = [];

async function fetchWorkers() {
    const res = await fetch(`${API_URL}/workers`);
    allWorkers = await res.json();
    renderWorkers(allWorkers);
}

function renderWorkers(workers) {
    workersTableBody.innerHTML = '';
    workers.forEach(w => {
        const row = `
            <tr>
                <td>${w.worker_id}</td>
                <td>${w.worker_name}</td>
                <td>${w.skill}</td>
                <td>${w.shift}</td>
                <td><span class="badge ${w.status === 'Available' ? 'badge-available' : 'badge-busy'}">${w.status}</span></td>
            </tr>
        `;
        workersTableBody.insertAdjacentHTML('beforeend', row);
    });
}

document.getElementById('workerSearch')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allWorkers.filter(w =>
        w.worker_name.toLowerCase().includes(term) ||
        w.worker_id.toLowerCase().includes(term) ||
        w.skill.toLowerCase().includes(term)
    );
    renderWorkers(filtered);
});

workerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        id: document.getElementById('workerId').value,
        name: document.getElementById('workerName').value,
        skill: document.getElementById('workerSkill').value,
        shift: document.getElementById('workerShift').value,
        status: document.getElementById('workerStatus').value
    };

    try {
        const res = await fetch(`${API_URL}/addWorker`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast('Personnel synchronized with registry', 'success');
            workerForm.reset();
            fetchWorkers();
        } else {
            showToast('Synchronize failed: Duplicate Payroll ID.', 'error');
        }
    } catch (err) {
        showToast('Workforce Link Interrupted.', 'error');
    }
});

fetchWorkers();

// Auto-refresh every 30 seconds
setInterval(fetchWorkers, 30000);
