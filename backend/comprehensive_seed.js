const mysql = require('mysql2/promise');
require('dotenv').config();
const { reschedule } = require('./scheduler');

async function seed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'Charlie@286',
        database: process.env.DB_NAME || 'scheduler_db'
    });

    console.log("Connected to database for comprehensive seeding...");

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
        console.log("Seeding 12 Machines...");
        const machines = [
            ['MAC-001', 'CNC Lathe Pro-X', 'Available'],
            ['MAC-002', 'Industrial 3D Printer V2', 'Available'],
            ['MAC-003', 'Milling Machine XL', 'Available'],
            ['MAC-004', 'Laser Cutter Delta', 'Available'],
            ['MAC-005', 'High-Speed Drill Press', 'Available'],
            ['MAC-006', 'Robotic Assembly Arm', 'Available'],
            ['MAC-007', 'Automated Painting Booth', 'Available'],
            ['MAC-008', 'Precision QC Station', 'Available'],
            ['MAC-009', 'Heavy Duty Hydraulic Press', 'Maintenance'],
            ['MAC-010', 'Advanced Soldering Unit', 'Available'],
            ['MAC-011', 'Surface Grinding Machine', 'Available'],
            ['MAC-012', 'Universal Sanding Unit', 'Available']
        ];
        await connection.query('INSERT INTO machines (machine_id, machine_name, status) VALUES ?', [machines]);

        // 2. Seed Workers
        console.log("Seeding 16 Workers...");
        const workers = [
            ['EMP-101', 'Alice Johnson', 'CNC, Milling', 'Day', 'Available'],
            ['EMP-102', 'Bob Smith', '3D Printing, Design', 'Day', 'Available'],
            ['EMP-103', 'Charlie Davis', 'Laser, CNC', 'Day', 'Available'],
            ['EMP-104', 'Diana Prince', 'Milling, Drilling', 'Day', 'Available'],
            ['EMP-105', 'Edward Norton', 'Robotics, Assembly', 'Day', 'Available'],
            ['EMP-106', 'Fiona Gallagher', 'Painting, Finishing', 'Day', 'Available'],
            ['EMP-107', 'George Miller', 'Quality Control, Inspection', 'Day', 'Available'],
            ['EMP-108', 'Hannah Abbott', 'Soldering, Electronics', 'Day', 'Available'],
            ['EMP-109', 'Ian Wright', 'CNC, Laser', 'Night', 'Available'],
            ['EMP-110', 'Julia Roberts', 'Milling, Drilling', 'Night', 'Available'],
            ['EMP-111', 'Kevin Hart', 'Robotics, Welding', 'Night', 'Available'],
            ['EMP-112', 'Laura Palmer', 'Painting, QC', 'Night', 'Available'],
            ['EMP-113', 'Mike Ross', 'Press Operation, Grinding', 'Night', 'Available'],
            ['EMP-114', 'Nina Simone', 'Assembly, Soldering', 'Night', 'Available'],
            ['EMP-115', 'Oscar Isaac', 'Sanding, Grinding', 'Day', 'Available'],
            ['EMP-116', 'Paula Abdul', 'CNC, Design', 'Day', 'Available']
        ];
        await connection.query('INSERT INTO workers (worker_id, worker_name, skill, shift, status) VALUES ?', [workers]);

        // 3. Seed Jobs
        console.log("Seeding 25 Jobs...");
        const now = new Date();

        function getFutureDate(days, hours = 17) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, hours, 0, 0);
            return d.toISOString().slice(0, 19).replace('T', ' ');
        }

        const jobs = [
            ['Aerospace Turbine Blade', 8, getFutureDate(1), 'High', 'CNC Lathe', 'CNC'],
            ['Custom Medical Implant', 5, getFutureDate(2), 'High', '3D Printer', '3D Printing'],
            ['Automotive Engine Block', 12, getFutureDate(1), 'High', 'Milling Machine', 'Milling'],
            ['Precision Gear Set Alpha', 4, getFutureDate(1), 'Medium', 'CNC Lathe', 'CNC'],
            ['Prototype Housing V3', 6, getFutureDate(3), 'Medium', '3D Printer', '3D Printing'],
            ['Chassis Reinforcement', 7, getFutureDate(2), 'High', 'Milling Machine', 'Milling'],
            ['Micro-Component Etching', 2, getFutureDate(1), 'Medium', 'Laser Cutter', 'Laser'],
            ['Structural Support Bracket', 3, getFutureDate(2), 'Low', 'Drill Press', 'Drilling'],
            ['Control Panel Assembly', 5, getFutureDate(3), 'High', 'Robotic Assembly', 'Robotics'],
            ['Exterior Panel Coating', 4, getFutureDate(1), 'Medium', 'Painting Booth', 'Painting'],
            ['Optical Sensor Calibration', 2, getFutureDate(1), 'High', 'QC Station', 'Quality Control'],
            ['Reinforced Base Plate', 6, getFutureDate(4), 'Medium', 'Hydraulic Press', 'Press Operation'],
            ['Circuit Board Soldering', 4, getFutureDate(2), 'High', 'Soldering Unit', 'Soldering'],
            ['Surface Hardening Pack', 3, getFutureDate(2), 'Medium', 'Grinding Machine', 'Grinding'],
            ['Polishing Task Sigma', 2, getFutureDate(3), 'Low', 'Sanding Unit', 'Sanding'],
            ['Heavy Duty Bolt Set', 4, getFutureDate(5), 'Low', 'CNC Lathe', 'CNC'],
            ['Dental Bridge Model', 3, getFutureDate(4), 'Medium', '3D Printer', '3D Printing'],
            ['Custom Heatsink Case', 5, getFutureDate(2), 'High', 'Milling Machine', 'Milling'],
            ['Logo Branding Batch', 1, getFutureDate(1), 'Low', 'Laser Cutter', 'Laser'],
            ['Ventilation Hole Drilling', 2, getFutureDate(2), 'Low', 'Drill Press', 'Drilling'],
            ['Wiring Loom Assembly', 6, getFutureDate(3), 'Medium', 'Robotic Assembly', 'Assembly'],
            ['Internal Shell Priming', 3, getFutureDate(2), 'Low', 'Painting Booth', 'Painting'],
            ['Final Inspection Lot 12', 1, getFutureDate(1), 'High', 'QC Station', 'Inspection'],
            ['Electronic Component Fix', 2, getFutureDate(2), 'Medium', 'Soldering Unit', 'Soldering'],
            ['Rough Cut Smoothing', 3, getFutureDate(3), 'Low', 'Grinding Machine', 'Grinding']
        ];
        await connection.query('INSERT INTO jobs (job_name, processing_time, due_date, priority, required_machine, required_skill) VALUES ?', [jobs]);

        console.log("Seeding complete!");

        // Trigger rescheduling to populate the schedule table
        console.log("Triggering initial optimization...");
        const result = await reschedule();
        if (result.success) {
            console.log(`Successfully generated ${result.count} schedule entries.`);
        } else {
            console.error("Optimization failed:", result.error);
        }

    } catch (err) {
        console.error("Seeding failed:", err);
    } finally {
        await connection.end();
    }
}

seed();
