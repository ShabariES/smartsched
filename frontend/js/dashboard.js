let utilChart = null;

async function fetchDashboard() {
    try {
        // 1. Sync real-time statuses before fetching metrics
        try { await fetch(`${API_URL}/updateStatus`, { method: 'POST' }); } catch (e) { }

        const response = await fetch(`${API_URL}/dashboard`);
        const data = await response.json();

        // 2. Update Counter metrics
        document.getElementById('totalJobs').textContent = data.totalJobs || 0;
        document.getElementById('availMachines').textContent = data.availMachines || 0;
        document.getElementById('availWorkers').textContent = data.availWorkers || 0;
        document.getElementById('machineUtil').textContent = `${data.machineUtilization || 0}%`;

        // 3. Update Today's Live Feed
        const listContainer = document.getElementById('todayScheduleList');
        listContainer.innerHTML = '';
        if (data.todaySchedule && data.todaySchedule.length > 0) {
            data.todaySchedule.forEach(item => {
                const div = document.createElement('div');
                div.style.padding = '1rem';
                div.style.background = 'rgba(255, 77, 0, 0.04)';
                div.style.borderRadius = '12px';
                div.style.marginBottom = '0.75rem';
                div.style.border = '1px solid rgba(255, 77, 0, 0.08)';
                div.innerHTML = `
                    <div style="font-weight: 800; color: var(--text-main); font-size: 0.9rem;">${item.job_name.toUpperCase()}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500; display: flex; gap: 1rem; margin-top: 0.35rem;">
                        <span><i class="far fa-clock"></i> ${new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span><i class="fas fa-microchip"></i> ${item.machine_name}</span>
                    </div>
                `;
                listContainer.appendChild(div);
            });
        } else {
            listContainer.innerHTML = '<p style="color: var(--text-muted); font-weight: 500; text-align: center; padding: 2rem;">No active operations for now.</p>';
        }

        // 4. Update core Graph
        renderUtilizationChart(parseFloat(data.machineUtilization), parseFloat(data.workerUtilization));
    } catch (error) {
        console.error("Dashboard Sync Error:", error);
    }
}

function renderUtilizationChart(mUtil, wUtil) {
    const ctx = document.getElementById('utilChart').getContext('2d');

    // Create Premium Gradients for Highlight
    const grad1 = ctx.createLinearGradient(0, 0, 0, 400);
    grad1.addColorStop(0, '#ff4d00');
    grad1.addColorStop(1, '#ff8c00');

    const grad2 = ctx.createLinearGradient(0, 0, 0, 400);
    grad2.addColorStop(0, '#ffc4a8');
    grad2.addColorStop(1, '#ffd9c7');

    if (utilChart) utilChart.destroy();

    utilChart = new Chart(ctx, {
        type: 'bar',
        plugins: [ChartDataLabels],
        data: {
            labels: ['HARDWARE ASSETS', 'WORKFORCE'],
            datasets: [{
                label: 'CAPACITY UTILIZATION %',
                data: [mUtil, wUtil],
                backgroundColor: [grad1, grad2],
                hoverBackgroundColor: ['#ff4d00', '#ffc4a8'],
                borderRadius: 20,
                borderWidth: 0,
                barThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeOutElastic',
                delay: 200
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(255, 77, 0, 0.04)', drawBorder: false },
                    ticks: {
                        color: '#8b6b55',
                        font: { family: 'Outfit', size: 11 },
                        callback: value => value + '%'
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#331a00', font: { family: 'Outfit', weight: '800', size: 10 } }
                }
            },
            plugins: {
                legend: { display: false },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    color: '#ff4d00',
                    font: { family: 'Outfit', weight: '900', size: 12 },
                    formatter: (value) => value + '%',
                    padding: 6,
                    offset: 8,
                    clip: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: '#ffffff',
                    titleColor: '#ff4d00',
                    bodyColor: '#331a00',
                    titleFont: { family: 'Outfit', weight: 'bold' },
                    bodyFont: { family: 'Outfit' },
                    padding: 12,
                    borderColor: 'rgba(255, 77, 0, 0.1)',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => ` Utilization: ${ctx.raw}%`
                    }
                }
            }
        }
    });
}

document.getElementById('rescheduleBtn').addEventListener('click', async () => {
    const btn = document.getElementById('rescheduleBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizing...';
    btn.disabled = true;
    showToast('Optimization sequence initiated...', 'success');

    try {
        const res = await fetch(`${API_URL}/reschedule`, { method: 'PUT' });
        const result = await res.json();
        if (res.ok) {
            if (result.count === 0 && result.message) {
                showToast(result.message, 'error');
            } else if (result.count === 0) {
                showToast('No pending jobs found to schedule.', 'info');
            } else {
                showToast(`Optimized! ${result.count} tasks scheduled.`, 'success');
            }
            fetchDashboard();
        } else {
            showToast('Optimization failed. Check system logs.', 'error');
        }
    } catch (err) {
        showToast('Network error: Unable to reach server.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

fetchDashboard();

// Auto-refresh every 20 seconds
setInterval(fetchDashboard, 20000);
