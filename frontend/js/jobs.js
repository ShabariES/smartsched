

const jobForm = document.getElementById('jobForm');
const jobsTableBody = document.querySelector('#jobsTable tbody');

let allJobs = [];

async function fetchJobs() {
    const res = await fetch(`${API_URL}/jobs`);
    allJobs = await res.json();
    renderJobs(allJobs);
}

function renderJobs(jobs) {
    jobsTableBody.innerHTML = '';
    jobs.forEach(job => {
        const row = `
            <tr>
                <td>#${job.job_id}</td>
                <td>${job.job_name}</td>
                <td>${job.processing_time} hrs</td>
                <td><span class="badge ${getPriorityClass(job.priority)}">${job.priority}</span></td>
                <td>${new Date(job.due_date).toLocaleDateString()}</td>
            </tr>
        `;
        jobsTableBody.insertAdjacentHTML('beforeend', row);
    });
}

document.getElementById('jobSearch')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allJobs.filter(job =>
        job.job_name.toLowerCase().includes(term) ||
        (`#${job.job_id}`).includes(term)
    );
    renderJobs(filtered);
});

function getPriorityClass(p) {
    if (p === 'High') return 'badge-busy';
    if (p === 'Medium') return 'badge-maintenance';
    return 'badge-available';
}

jobForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const jobData = {
        name: document.getElementById('jobName').value,
        time: parseInt(document.getElementById('jobTime').value),
        dueDate: document.getElementById('dueDate').value,
        priority: document.getElementById('priority').value,
        machine: document.getElementById('machine').value,
        skill: document.getElementById('skill').value
    };

    try {
        const res = await fetch(`${API_URL}/addJob`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jobData)
        });

        if (res.ok) {
            showToast('New task initialized in registry', 'success');
            jobForm.reset();
            fetchJobs();
        } else {
            showToast('Failed to commit task. Check requirements.', 'error');
        }
    } catch (err) {
        showToast('Network collision. Operation aborted.', 'error');
    }
});

fetchJobs();

// Auto-refresh every 30 seconds
setInterval(fetchJobs, 30000);
