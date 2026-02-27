# Smart Scheduling System

A production-level workforce and machine allocation system for small industries.

## Features
- **Job Management:** Add jobs with priority, processing time, and requirements.
- **Machine & Worker Management:** Track availability and status.
- **Smart Scheduler:** Intelligent matching of jobs to resources based on priority and skills.
- **Gantt Chart:** Visual timeline of production activities.
- **Real-time Dashboard:** Key performance indicators and utilization stats.

## Tech Stack
- **Frontend:** HTML5, Vanilla CSS, JavaScript, Chart.js
- **Backend:** Node.js, Express.js
- **Database:** Supabase (PostgreSQL)

## Setup Instructions
1. **Supabase Setup:**
   - Create a new project in Supabase.
   - Run the SQL queries in `schema.sql` using the Supabase SQL Editor.
   - Go to Project Settings -> API and get your `SUPABASE_URL` and `SUPABASE_KEY`.

2. **Backend Configuration:**
   - Open `.env` and paste your Supabase credentials.
   - Run `npm install` to install dependencies.

3. **Running the App:**
   - Start the server: `npm start`
   - Open `http://localhost:3000` in your browser.

## How it Works
1. Add your Machines and Workers (with their skills).
2. Add some Jobs that require specific machines and skills.
3. Click "Reschedule" on the Dashboard or Schedule page.
4. The system will calculate the optimal start and end times for each job and update the status of resources.
5. View the result on the Schedule page's Gantt chart.
