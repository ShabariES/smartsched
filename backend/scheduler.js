const db = require('./db');

const priorityMap = { 'High': 1, 'Medium': 2, 'Low': 3 };

/**
 * Proper Working Principle:
 * 1. Collect all Pending Jobs, Available Machines, and Active Workforce.
 * 2. Order jobs by Priority then Proximity to Deadline (EDD).
 * 3. Match resources based on HARD skills and machine capability.
 * 4. Calculate continuous time blocks to prevent resource overlap.
 */
async function generateSchedule() {
    try {
        const [jobs] = await db.execute(`
            SELECT j.* FROM jobs j
            LEFT JOIN schedule s ON j.job_id = s.job_id AND s.status = 'Completed'
            WHERE s.schedule_id IS NULL
            ORDER BY j.due_date ASC
        `);
        const [machines] = await db.execute("SELECT * FROM machines WHERE status != 'Breakdown'");
        const [workers] = await db.execute("SELECT * FROM workers WHERE status != 'Leave'");

        // Sort by Priority (High->Low) then Deadline
        const sortedJobs = jobs.sort((a, b) => {
            const pA = priorityMap[a.priority] || 4;
            const pB = priorityMap[b.priority] || 4;
            if (pA !== pB) return pA - pB;
            return new Date(a.due_date) - new Date(b.due_date);
        });

        const schedules = [];
        const resourceTimeline = {
            machines: {}, // machine_id -> last_end_time
            workers: {}  // worker_id -> last_end_time
        };

        const now = new Date();

        for (const job of sortedJobs) {
            // Find optimal machine match
            const machine = machines.find(m => {
                const search = job.required_machine.toLowerCase();
                return m.machine_id.toLowerCase() === search || m.machine_name.toLowerCase().includes(search);
            });

            // Find optimal worker match (Fuzzy skill matching)
            const worker = workers.find(w => {
                const required = job.required_skill.toLowerCase();
                const actualSkills = w.skill.toLowerCase().split(',').map(s => s.trim());
                return actualSkills.includes(required) || w.skill.toLowerCase().includes(required);
            });

            if (machine && worker) {
                // Calculate next available start window
                const machineReady = resourceTimeline.machines[machine.machine_id] || now;
                const workerReady = resourceTimeline.workers[worker.worker_id] || now;

                const startTime = new Date(Math.max(now, machineReady, workerReady));
                const endTime = new Date(startTime.getTime() + job.processing_time * 60 * 60 * 1000);

                const pad = (n) => n.toString().padStart(2, '0');
                const formatMySQL = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

                schedules.push([
                    job.job_id,
                    machine.machine_id,
                    worker.worker_id,
                    formatMySQL(startTime),
                    formatMySQL(endTime),
                    'Scheduled'
                ]);

                // Update Timelines
                resourceTimeline.machines[machine.machine_id] = endTime;
                resourceTimeline.workers[worker.worker_id] = endTime;
            }
        }

        if (schedules.length > 0) {
            const query = 'INSERT INTO schedule (job_id, machine_id, worker_id, start_time, end_time, status) VALUES ?';
            await db.query(query, [schedules]);
        }

        console.log(`Generated ${schedules.length} schedules.`);
        let message = '';
        if (schedules.length === 0 && jobs.length > 0) {
            message = 'Resource Mismatch: No available machine or worker matches job requirements.';
        }
        return { success: true, count: schedules.length, message };
    } catch (error) {
        console.error("Critical Engine Failure:", error);
        return { success: false, error: error.message };
    }
}

async function reschedule() {
    try {
        // Reset Logic Flow
        await db.execute("DELETE FROM schedule WHERE status = 'Scheduled'");
        await db.execute("UPDATE machines SET status = 'Available' WHERE status = 'Busy'");
        await db.execute("UPDATE workers SET status = 'Available' WHERE status = 'Busy'");

        return await generateSchedule();
    } catch (error) {
        console.error("Operational Reset Failure:", error);
        return { success: false, error: error.message };
    }
}

async function updateScheduleStatus() {
    try {
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const currentTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        // 1. Terminate finished jobs IMMEDIATELY using Local Time comparison
        const [toComplete] = await db.execute(
            "SELECT schedule_id FROM schedule WHERE status = 'Scheduled' AND end_time <= ?",
            [currentTime]
        );

        if (toComplete.length > 0) {
            await db.execute(
                "UPDATE schedule SET status = 'Completed' WHERE status = 'Scheduled' AND end_time <= ?",
                [currentTime]
            );
            console.log(`[REALTIME] Terminated ${toComplete.length} jobs at ${currentTime} (Local)`);
        }

        // 2. Refresh resource states based on LIVE active jobs
        const [activeSchedules] = await db.execute(
            "SELECT machine_id, worker_id FROM schedule WHERE status = 'Scheduled' AND start_time <= ? AND end_time > ?",
            [currentTime, currentTime]
        );

        const activeMachines = new Set(activeSchedules.map(s => s.machine_id));
        const activeWorkers = new Set(activeSchedules.map(s => s.worker_id));

        // Sync Machine Status
        const [machines] = await db.execute('SELECT machine_id, status FROM machines');
        for (const m of machines) {
            const shouldBeBusy = activeMachines.has(m.machine_id);
            if (m.status === 'Breakdown') continue;

            if (shouldBeBusy && m.status !== 'Busy') {
                await db.execute("UPDATE machines SET status = 'Busy' WHERE machine_id = ?", [m.machine_id]);
            } else if (!shouldBeBusy && m.status === 'Busy') {
                await db.execute("UPDATE machines SET status = 'Available' WHERE machine_id = ?", [m.machine_id]);
            }
        }

        // Sync Worker Status
        const [workers] = await db.execute('SELECT worker_id, status FROM workers');
        for (const w of workers) {
            const shouldBeBusy = activeWorkers.has(w.worker_id);
            if (w.status === 'Leave') continue;

            if (shouldBeBusy && w.status !== 'Busy') {
                await db.execute("UPDATE workers SET status = 'Busy' WHERE worker_id = ?", [w.worker_id]);
            } else if (!shouldBeBusy && w.status === 'Busy') {
                await db.execute("UPDATE workers SET status = 'Available' WHERE worker_id = ?", [w.worker_id]);
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Status Update Failure:", error);
        return { success: false, error: error.message };
    }
}

module.exports = { generateSchedule, reschedule, updateScheduleStatus };
