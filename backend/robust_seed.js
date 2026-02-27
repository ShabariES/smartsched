const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'Charlie@286',
        database: process.env.DB_NAME || 'scheduler_db'
    });

    console.log("Connected to database for robust seeding...");

    try {
        // Clear existing data
        console.log("Cleaning up existing data...");
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        await connection.execute('TRUNCATE TABLE schedule');
        await connection.execute('TRUNCATE TABLE jobs');
        await connection.execute('TRUNCATE TABLE machines');
        await connection.execute('TRUNCATE TABLE workers');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        // 1. Seed Machines
        console.log("Seeding Machines...");
        const machines = [
            ['MAC-01', 'Heavy Duty Lathe L-2000', 'Available'],
            ['MAC-02', 'Precision Milling Center M-50', 'Available'],
            ['MAC-03', 'Automated Laser Cutter ALC-5', 'Available'],
            ['MAC-04', 'Multi-Axis CNC Station Pro', 'Available'],
            ['MAC-05', 'Quality Inspection Unit', 'Available']
        ];
        await connection.query('INSERT INTO machines (machine_id, machine_name, status) VALUES ?', [machines]);

        // 2. Seed Workers
        console.log("Seeding Workers...");
        const workers = [
            ['EMP-101', 'Robert Miller', 'Lathe, Milling', 'Day', 'Available'],
            ['EMP-102', 'Sophia Williams', 'Laser, CNC', 'Day', 'Available'],
            ['EMP-103', 'James Brown', 'Milling, Inspection', 'Day', 'Available'],
            ['EMP-104', 'Emma Davis', 'CNC, Lathe', 'Night', 'Available'],
            ['EMP-105', 'Daniel Wilson', 'Inspection, Assembly', 'Night', 'Available']
        ];
        await connection.query('INSERT INTO workers (worker_id, worker_name, skill, shift, status) VALUES ?', [workers]);

        // 3. Seed Jobs
        console.log("Seeding Jobs...");
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 17, 0, 0);
        const dayAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 17, 0, 0);

        function formatDate(d) {
            return d.toISOString().slice(0, 19).replace('T', ' ');
        }

        const jobs = [
            // Job Name, Hours, Due Date, Priority, Required Machine (partial name search), Required Skill
            ['Main Shaft Fabrication', 4, formatDate(tomorrow), 'High', 'Lathe', 'Lathe'],
            ['Housing Milling Unit', 6, formatDate(tomorrow), 'High', 'Milling', 'Milling'],
            ['Custom Logo Engraving', 2, formatDate(dayAfter), 'Medium', 'Laser', 'Laser'],
            ['Engine Block Program', 8, formatDate(dayAfter), 'High', 'CNC', 'CNC'],
            ['Final QC Check S-10', 1, formatDate(tomorrow), 'Low', 'Inspection', 'Inspection']
        ];
        await connection.query('INSERT INTO jobs (job_name, processing_time, due_date, priority, required_machine, required_skill) VALUES ?', [jobs]);

        console.log("Robust seeding complete!");
        console.log("Proceeding to trigger internal optimization...");

        // We will call the internal reschedule logic by running a temporary script or curl
    } catch (err) {
        console.error("Robust seeding failed:", err);
    } finally {
        await connection.end();
    }
}

seed();
