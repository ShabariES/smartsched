const fetch = require('node-fetch');

/**
 * Real-time Order Simulation
 * This mimics an external ERP system or IoT sensor 
 * sending new manufacturing requests to SmartSched 
 */

const API_URL = 'http://localhost:7000/api';

const sampleJobs = [
    { name: 'External Order #AZ-1', time: 3, priority: 'High', machine: 'CNC', skill: 'CNC' },
    { name: 'IoT Event: Part Batch #B9', time: 5, priority: 'Medium', machine: '3D Printer', skill: '3D Printing' },
    { name: 'Urgent Maintenance Part', time: 2, priority: 'High', machine: 'Lathe', skill: 'Lathe' },
    { name: 'Customer Restock #23', time: 4, priority: 'Low', machine: 'Milling', skill: 'Milling' }
];

async function simulateOrder() {
    const job = sampleJobs[Math.floor(Math.random() * sampleJobs.length)];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    const payload = {
        ...job,
        dueDate: tomorrow.toISOString().slice(0, 19).replace('T', ' ')
    };

    console.log(`[REAL-TIME INGRESS] Incoming stream data: ${payload.name}`);

    try {
        const res = await fetch(`${API_URL}/addJob`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            console.log(`[SUCCESS] New schedule entry added automatically via Real-time Link.`);
        }
    } catch (e) {
        console.error(`[FAIL] Connection to SmartSched Interrupted.`);
    }
}

// Fire a new simulated real-time data point every 60 seconds
console.log("Real-time Data Simulation Hub: ONLINE");
setInterval(simulateOrder, 60000);
simulateOrder();
