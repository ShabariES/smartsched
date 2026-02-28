require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const { generateSchedule, reschedule, updateScheduleStatus } = require('./scheduler');

const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));



// Table Initialization System (Zero-Manual-Setup)
(async () => {
    try {
        console.log("Verifying Database Infrastructure...");

        // 1. Jobs Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS jobs (
                job_id INT AUTO_INCREMENT PRIMARY KEY,
                job_name VARCHAR(255) NOT NULL,
                processing_time INT NOT NULL,
                due_date DATETIME NOT NULL,
                priority ENUM('High', 'Medium', 'Low') NOT NULL,
                required_machine VARCHAR(255),
                required_skill VARCHAR(255)
            )
        `);

        // 2. Machines Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS machines (
                machine_id VARCHAR(50) PRIMARY KEY,
                machine_name VARCHAR(255) NOT NULL,
                status ENUM('Available', 'Busy', 'Breakdown', 'Maintenance') DEFAULT 'Available'
            )
        `);

        // 3. Workers Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS workers (
                worker_id VARCHAR(50) PRIMARY KEY,
                worker_name VARCHAR(255) NOT NULL,
                skill VARCHAR(255) NOT NULL,
                shift ENUM('Day', 'Night') NOT NULL,
                status ENUM('Available', 'Busy', 'Leave') DEFAULT 'Available'
            )
        `);

        // 4. Admins Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS admins (
                admin_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                role VARCHAR(50) DEFAULT 'Executive'
            )
        `);

        // 5. Schedule Table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS schedule (
                schedule_id INT AUTO_INCREMENT PRIMARY KEY,
                job_id INT,
                machine_id VARCHAR(50),
                worker_id VARCHAR(50),
                start_time DATETIME,
                end_time DATETIME,
                status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
                FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
                FOREIGN KEY (machine_id) REFERENCES machines(machine_id) ON DELETE SET NULL,
                FOREIGN KEY (worker_id) REFERENCES workers(worker_id) ON DELETE SET NULL
            )
        `);

        // Seed Default Admin if system is fresh
        const [rows] = await db.execute('SELECT COUNT(*) as count FROM admins');
        if (rows[0].count === 0) {
            const defaultPass = await bcrypt.hash('shabari@2026', 10);
            await db.execute(
                'INSERT INTO admins (full_name, username, password, role) VALUES (?, ?, ?, ?)',
                ['Shabari E S', 'shabari', defaultPass, 'Admin']
            );
            console.log("Default Admin Seeded successfully.");
        }

        console.log("Database Sync: COMPLETE. System ready.");
    } catch (e) {
        console.error("CRITICAL: Database Initialization Failed ->", e.message);
    }
})();

// 0. Authentication Endpoints
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, username, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            'INSERT INTO admins (full_name, username, password, role) VALUES (?, ?, ?, ?)',
            [fullName, username, hashedPassword, role || 'User']
        );
        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await db.execute('SELECT * FROM admins WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const admin = rows[0];
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = `session_${admin.username}_${Math.random().toString(36).substring(7)}`;

        res.json({ token, name: admin.full_name, role: admin.role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 1. Job Endpoints
app.post('/api/addJob', async (req, res) => {
    try {
        const { name, time, dueDate, priority, machine, skill } = req.body;
        const [result] = await db.execute(
            'INSERT INTO jobs (job_name, processing_time, due_date, priority, required_machine, required_skill) VALUES (?, ?, ?, ?, ?, ?)',
            [name, time, dueDate, priority, machine, skill]
        );

        // REAL-TIME CONNECTION: Automatically find a slot for this new data entry
        await generateSchedule();

        const [rows] = await db.execute('SELECT * FROM jobs WHERE job_id = ?', [result.insertId]);
        res.status(201).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/jobs', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM jobs');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Machine Endpoints
app.post('/api/addMachine', async (req, res) => {
    try {
        const { id, name, status } = req.body;
        await db.execute(
            'INSERT INTO machines (machine_id, machine_name, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE machine_name = VALUES(machine_name), status = VALUES(status)',
            [id, name, status || 'Available']
        );

        const [rows] = await db.execute('SELECT * FROM machines WHERE machine_id = ?', [id]);
        res.status(201).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/machines', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM machines');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Worker Endpoints
app.post('/api/addWorker', async (req, res) => {
    try {
        const { id, name, skill, shift, status } = req.body;
        await db.execute(
            'INSERT INTO workers (worker_id, worker_name, skill, shift, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE worker_name = VALUES(worker_name), skill = VALUES(skill), shift = VALUES(shift), status = VALUES(status)',
            [id, name, skill, shift, status || 'Available']
        );

        const [rows] = await db.execute('SELECT * FROM workers WHERE worker_id = ?', [id]);
        res.status(201).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/workers', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM workers');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Scheduling Endpoints
app.post('/api/generateSchedule', async (req, res) => {
    const result = await generateSchedule();
    if (!result.success) return res.status(500).json(result);
    res.json(result);
});

app.get('/api/schedule', async (req, res) => {
    try {
        const query = `
            SELECT s.*, j.job_name, m.machine_name, w.worker_name 
            FROM schedule s
            JOIN jobs j ON s.job_id = j.job_id
            JOIN machines m ON s.machine_id = m.machine_id
            JOIN workers w ON s.worker_id = w.worker_id
            ORDER BY s.start_time ASC
        `;
        const [rows] = await db.execute(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/reschedule', async (req, res) => {
    const result = await reschedule();
    if (!result.success) return res.status(500).json(result);
    res.json(result);
});

// 5. Dashboard Endpoint
app.get('/api/dashboard', async (req, res) => {
    try {
        const [[{ totalJobs }]] = await db.execute('SELECT COUNT(*) as totalJobs FROM jobs');
        const [[{ availMachines }]] = await db.execute("SELECT COUNT(*) as availMachines FROM machines WHERE status = 'Available'");
        const [[{ availWorkers }]] = await db.execute("SELECT COUNT(*) as availWorkers FROM workers WHERE status = 'Available'");

        const [machines] = await db.execute('SELECT status FROM machines');
        const [workers] = await db.execute('SELECT status FROM workers');

        const machineUtil = machines.length ? (machines.filter(m => m.status === 'Busy').length / machines.length) * 100 : 0;
        const workerUtil = workers.length ? (workers.filter(w => w.status === 'Busy').length / workers.length) * 100 : 0;

        // 3. Weekly Utilization Trends Calculation
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const machineData = new Array(7).fill(0);
        const workerData = new Array(7).fill(0);

        const todayDate = new Date();
        const currentDayOfWk = todayDate.getDay();
        const mondayDate = new Date(todayDate);
        mondayDate.setDate(todayDate.getDate() - (currentDayOfWk === 0 ? 6 : currentDayOfWk - 1));
        mondayDate.setHours(0, 0, 0, 0);

        const [allSchedules] = await db.execute('SELECT start_time, end_time FROM schedule');
        const [allMachines] = await db.execute('SELECT machine_id FROM machines');
        const [allWorkers] = await db.execute('SELECT worker_id FROM workers');

        for (let i = 0; i < 7; i++) {
            const dStart = new Date(mondayDate);
            dStart.setDate(mondayDate.getDate() + i);
            const dEnd = new Date(dStart);
            dEnd.setDate(dStart.getDate() + 1);

            let mHrs = 0;
            allSchedules.forEach(s => {
                const sTime = new Date(s.start_time);
                const eTime = new Date(s.end_time);
                const overlapS = new Date(Math.max(sTime, dStart));
                const overlapE = new Date(Math.min(eTime, dEnd));
                if (overlapS < overlapE) {
                    mHrs += (overlapE - overlapS) / (1000 * 60 * 60);
                }
            });

            const availMHrs = (allMachines.length || 1) * 24;
            const availWHrs = (allWorkers.length || 1) * 24;
            machineData[i] = Math.min(100, (mHrs / availMHrs) * 100).toFixed(1);
            workerData[i] = Math.min(100, (mHrs / availWHrs) * 100).toFixed(1);
        }

        // 4. Job Status Distribution
        const [[{ completedCount }]] = await db.execute("SELECT COUNT(*) as completedCount FROM schedule WHERE status = 'Completed'");
        const [[{ runningCount }]] = await db.execute("SELECT COUNT(*) as runningCount FROM schedule WHERE status = 'Scheduled' AND start_time <= NOW() AND end_time > NOW()");
        const [[{ onDeckCount }]] = await db.execute("SELECT COUNT(*) as onDeckCount FROM schedule WHERE status = 'Scheduled' AND start_time > NOW()");
        const [[{ delayedCount }]] = await db.execute("SELECT COUNT(*) as delayedCount FROM schedule WHERE status = 'Scheduled' AND end_time < NOW()");

        res.json({
            totalJobs,
            availMachines,
            availWorkers,
            machineUtilization: machineUtil.toFixed(1),
            workerUtilization: workerUtil.toFixed(1),
            todaySchedule,
            weeklyTrends: { machineData, workerData, labels: days },
            statusDistribution: [completedCount, runningCount, onDeckCount, delayedCount]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. Manual Status Check
app.post('/api/updateStatus', async (req, res) => {
    const result = await updateScheduleStatus();
    res.json(result);
});

// Automatic status update every 10 seconds for high-precision termination
setInterval(() => {
    updateScheduleStatus();
}, 10000);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
