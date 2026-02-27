let ganttChart = null;

let allSchedule = [];

async function fetchSchedule() {
    // Sync completion status before fetching
    try { await fetch(`${API_URL}/updateStatus`, { method: 'POST' }); } catch (e) { }

    const res = await fetch(`${API_URL}/schedule`);
    allSchedule = await res.json();
    console.log(`Fetched ${allSchedule.length} schedule items.`);

    populateTable(allSchedule);
    renderGanttChart(allSchedule);
}

document.getElementById('scheduleSearch')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allSchedule.filter(item =>
        (item.job_name || '').toLowerCase().includes(term) ||
        (item.worker_name || '').toLowerCase().includes(term) ||
        (item.machine_name || '').toLowerCase().includes(term)
    );
    populateTable(filtered);
});

function populateTable(schedule) {
    const tbody = document.querySelector('#scheduleTable tbody');
    tbody.innerHTML = '';
    const now = new Date();

    schedule.forEach(item => {
        const start = new Date(item.start_time);
        const end = new Date(item.end_time);

        let displayStatus = item.status.toUpperCase();
        let statusClass = 'badge-busy'; // Orange

        if (item.status === 'Completed') {
            statusClass = 'badge-maintenance'; // Gray
        } else if (now >= start && now < end) {
            displayStatus = 'RUNNING';
            statusClass = 'badge-available'; // Green
        } else if (now < start) {
            displayStatus = 'ON-DECK';
            statusClass = 'badge-busy'; // Orange
        }

        const row = `
            <tr>
                <td>${item.job_name || 'Job #' + item.job_id}</td>
                <td>${item.machine_name || item.machine_id}</td>
                <td>${item.worker_name || item.worker_id}</td>
                <td>${new Date(item.start_time).toLocaleString()}</td>
                <td>${new Date(item.end_time).toLocaleString()}</td>
                <td><span class="badge ${statusClass}">${displayStatus}</span></td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

let frappeGantt = null;

function renderGanttChart(schedule) {
    const tableBody = document.getElementById('ganttTableBody');
    tableBody.innerHTML = '';

    if (schedule.length === 0) {
        document.getElementById('ganttChartContainer').innerHTML = '<p style="padding: 2rem;">No schedule data available.</p>';
        return;
    }

    // We make sure dates are correctly ordered or distinct for Gantt display
    const sortedSchedule = [...schedule].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    const tasks = sortedSchedule.map((item, index) => {
        // Check if there is a worker or machine info
        const resourceStr = item.machine_name || (item.machine_id ? `Machine ${item.machine_id}` : (item.worker_name || `Worker ${item.worker_id}`));
        const jobName = item.job_name || `Job #${item.job_id}`;

        const formatOptions = { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' };

        // Add row to Left Table (Frappe default row height is exactly 38px, header is 50px)
        const rowHTML = `
            <tr style="border-bottom: 1px solid #e2e8f0; height: 38px; box-sizing: border-box; background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 0 1rem; color: #1e1b4b; font-weight: 500; text-overflow: ellipsis; overflow: hidden; max-width: 150px; white-space: nowrap;">${jobName} (${resourceStr})</td>
                <td style="padding: 0 1rem; color: #713f12; font-size: 0.8rem; white-space: nowrap;">${new Date(item.start_time).toLocaleDateString('en-US', formatOptions)}</td>
                <td style="padding: 0 1rem; color: #713f12; font-size: 0.8rem; white-space: nowrap;">${new Date(item.end_time).toLocaleDateString('en-US', formatOptions)}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', rowHTML);

        // Frappe Gantt Task Object
        return {
            id: `task_${item.schedule_id || index}`,
            name: `${jobName} (${resourceStr})`,
            start: item.start_time,
            end: item.end_time,
            progress: item.status === 'Completed' ? 100 : (item.status === 'Running' ? 50 : 0),
            custom_class: 'bar-custom-style'
        };
    });

    if (frappeGantt) {
        frappeGantt.refresh(tasks);
    } else {
        frappeGantt = new Gantt('#gantt', tasks, {
            header_height: 50,
            column_width: 30,
            step: 24,
            view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
            bar_height: 20,
            bar_corner_radius: 3,
            arrow_curve: 5,
            padding: 18,
            view_mode: 'Day',
            date_format: 'YYYY-MM-DD',
            custom_popup_html: function (task) {
                return `
                <div style="padding: 10px; border-radius: 8px; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); font-family: Outfit, sans-serif;">
                    <strong style="color: #1e1b4b; font-size: 0.9rem;">${task.name}</strong><br>
                    <span style="color: #8b6b55; font-size: 0.8rem;">${task.progress}% completed</span>
                </div>
              `;
            }
        });

        // Sync Y scroll
        const ganttContainer = document.querySelector('.gantt-container');
        const leftTableContainer = document.querySelector('#ganttTableBody').parentElement.parentElement;

        if (ganttContainer && leftTableContainer) {
            let isSyncingLeftScroll = false;
            let isSyncingRightScroll = false;

            ganttContainer.addEventListener('scroll', function () {
                if (!isSyncingLeftScroll) {
                    isSyncingRightScroll = true;
                    leftTableContainer.scrollTop = this.scrollTop;
                    setTimeout(() => { isSyncingRightScroll = false; }, 0);
                }
            });
            leftTableContainer.addEventListener('scroll', function () {
                if (!isSyncingRightScroll) {
                    isSyncingLeftScroll = true;
                    ganttContainer.scrollTop = this.scrollTop;
                    setTimeout(() => { isSyncingLeftScroll = false; }, 0);
                }
            });
        }

        // Custom CSS for frappe gantt bars matching mockup (light blue/purple)
        const style = document.createElement('style');
        style.innerHTML = `
            .bar-custom-style .bar { fill: #e0e7ff; }
            .bar-custom-style .bar-progress { fill: #c7d2fe; }
            .gantt .bar-label { fill: #8b5cf6; font-weight: 600; font-family: Outfit, sans-serif; font-size: 11px; }
            .gantt .grid-header { fill: #f8fafc; }
            .gantt .tick text { fill: #475569; font-family: Outfit, sans-serif; }
            /* Fix infinity height loop */
            #ganttChartContainer .gantt { border-radius: 0; min-height: 100%; height: inherit; }
            #ganttChartContainer .gantt-container { overflow-y: hidden !important; overflow-x: auto; position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
            #ganttChartContainer svg { max-height: 100%; }
            #ganttTableBody tr:hover { background: #f8fafc; }
            #ganttTableBody tr td { border-right: 1px solid #e2e8f0; height: 38px; }
            .gantt .grid-row { fill: #ffffff; }
            .gantt .grid-row:nth-child(even) { fill: #f8fafc; }
        `;
        document.head.appendChild(style);
    }
}

// Remove previously unused chartView listener if it isn't in HTML anymore
const viewSelect = document.getElementById('chartView');
if (viewSelect) viewSelect.addEventListener('change', () => fetchSchedule());
document.getElementById('rescheduleBtn').addEventListener('click', async () => {
    const btn = document.getElementById('rescheduleBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizing...';
    btn.disabled = true;
    showToast('Re-optimizing production timeline...', 'success');
    try {
        const res = await fetch(`${API_URL}/reschedule`, { method: 'PUT' });
        if (res.ok) { fetchSchedule(); showToast('Operational timeline updated.', 'success'); }
        else showToast('Re-optimization failed.', 'error');
    } catch (err) { showToast('System connectivity issue.', 'error'); }
    finally { btn.innerHTML = originalText; btn.disabled = false; }
});

// Render bottom charts
function renderImpactCharts() {
    const trendContainer = document.getElementById('utilizationTrends');
    const distContainer = document.getElementById('jobStatusDist');

    if (!trendContainer || !distContainer) return;

    trendContainer.innerHTML = '<canvas id="utilTrendChart"></canvas>';
    distContainer.innerHTML = '<canvas id="jobStatusChart"></canvas>';

    const trendCtx = document.getElementById('utilTrendChart');
    const distCtx = document.getElementById('jobStatusChart');

    new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Machine utilization',
                data: [65, 70, 80, 81, 75, 89, 85],
                borderColor: '#ff4d00',
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 2,
                fill: true,
                backgroundColor: 'rgba(255, 77, 0, 0.05)'
            }, {
                label: 'Worker utilization',
                data: [60, 68, 75, 78, 70, 80, 77],
                borderColor: '#2d1600',
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { font: { family: 'Outfit' } } },
                x: { grid: { display: false }, ticks: { font: { family: 'Outfit' } } }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { font: { family: 'Outfit', weight: '600' }, usePointStyle: true, padding: 20 }
                }
            }
        }
    });

    new Chart(distCtx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Running', 'On-Deck', 'Delayed'],
            datasets: [{
                data: [45, 25, 20, 10],
                backgroundColor: ['#10b981', '#ff4d00', '#f59e0b', '#dc2626'],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Outfit', weight: '500' },
                        usePointStyle: true,
                        padding: 20
                    }
                }
            }
        }
    });
}

fetchSchedule().then(renderImpactCharts);
