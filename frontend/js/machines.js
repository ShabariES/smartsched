

const machineForm = document.getElementById('machineForm');
const machinesTableBody = document.querySelector('#machinesTable tbody');

let allMachines = [];

async function fetchMachines() {
    const res = await fetch(`${API_URL}/machines`);
    allMachines = await res.json();
    renderMachines(allMachines);
}

function renderMachines(machines) {
    machinesTableBody.innerHTML = '';
    machines.forEach(m => {
        const row = `
            <tr>
                <td>${m.machine_id}</td>
                <td>${m.machine_name}</td>
                <td><span class="badge ${getStatusClass(m.status)}">${m.status}</span></td>
            </tr>
        `;
        machinesTableBody.insertAdjacentHTML('beforeend', row);
    });
}

document.getElementById('machineSearch')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allMachines.filter(m =>
        m.machine_name.toLowerCase().includes(term) ||
        m.machine_id.toLowerCase().includes(term)
    );
    renderMachines(filtered);
});

function getStatusClass(s) {
    switch (s.toLowerCase()) {
        case 'available': return 'badge-available';
        case 'busy': return 'badge-busy';
        case 'breakdown': return 'badge-maintenance';
        case 'maintenance': return 'badge-maintenance';
        default: return '';
    }
}

machineForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        id: document.getElementById('machineId').value,
        name: document.getElementById('machineName').value,
        status: document.getElementById('machineStatus').value
    };

    try {
        const res = await fetch(`${API_URL}/addMachine`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast('Asset deployed to operational fleet', 'success');
            machineForm.reset();
            fetchMachines();
        } else {
            showToast('Registration failed: Hardware ID collision.', 'error');
        }
    } catch (err) {
        showToast('System Link Failure.', 'error');
    }
});

fetchMachines();
