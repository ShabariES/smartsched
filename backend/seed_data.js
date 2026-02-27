const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'c:/Users/shanm/OneDrive/Pictures/Hackathon Sona/backend/.env' });

async function seed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'Charlie@286',
        database: process.env.DB_NAME || 'scheduler_db'
    });

    console.log("Connected to database for seeding...");

    try {
        // Clear existing data to avoid duplicates/conflicts for the demo
        console.log("Cleaning up existing data...");
        await connection.execute('DELETE FROM schedule');
        await connection.execute('DELETE FROM jobs');
        await connection.execute('DELETE FROM machines');
        await connection.execute('DELETE FROM workers');

        // 1. Seed Machines
        console.log("Seeding Machines...");
        const machines = [
            ['MCH-101', 'High-Speed CNC Lathe', 'Available'],
            ['MCH-102', 'Industrial 3D Printer', 'Available'],
            ['MCH-103', 'Automated Milling Unit', 'Available'],
            ['MCH-104', 'Laser Cutting Module', 'Maintenance']
        ];
        await connection.query('INSERT INTO machines (machine_id, machine_name, status) VALUES ?', [machines]);

        // 2. Seed Workers
        console.log("Seeding Workers...");
        const workers = [
            ['W-001', 'Alex Rivera', 'CNC, Milling', 'Day', 'Available'],
            ['W-002', 'Sarah Chen', 'Design, Printing', 'Day', 'Available'],
            ['W-003', 'Marcus Thorne', 'Milling, Laser', 'Night', 'Available'],
            ['W-004', 'Elena Vance', 'CNC, Quality', 'Day', 'Available']
        ];
        await connection.query('INSERT INTO workers (worker_id, worker_name, skill, shift, status) VALUES ?', [workers]);

        // 3. Seed Jobs (with future due dates)
        console.log("Seeding Jobs...");
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

        const jobs = [
            ['Precision Gear Set', 3, tomorrow, 'High', 'CNC Lathe', 'CNC'],
            ['Medical Prototype V2', 5, nextWeek, 'Medium', '3D Printer', 'Printing'],
            ['Engine Housing', 4, tomorrow, 'High', 'Milling', 'Milling'],
            ['Chassis Bracket', 2, nextWeek, 'Low', 'CNC Lathe', 'CNC']
        ];
        await connection.query('INSERT INTO jobs (job_name, processing_time, due_date, priority, required_machine, required_skill) VALUES ?', [jobs]);

        console.log("Seeding complete! Now you can click 'Run Optimization' on the Dashboard.");
    } catch (err) {
        console.error("Seeding failed:", err);
    } finally {
        await connection.end();
    }
}

seed();
