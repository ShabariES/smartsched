-- Jobs table
CREATE TABLE jobs (
    job_id SERIAL PRIMARY KEY,
    job_name TEXT NOT NULL,
    processing_time INT NOT NULL, -- in hours
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')),
    required_machine TEXT NOT NULL,
    required_skill TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Machines table
CREATE TABLE machines (
    machine_id TEXT PRIMARY KEY,
    machine_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('Available', 'Busy', 'Breakdown', 'Maintenance')) DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workers table
CREATE TABLE workers (
    worker_id TEXT PRIMARY KEY,
    worker_name TEXT NOT NULL,
    skill TEXT NOT NULL,
    shift TEXT NOT NULL,
    status TEXT CHECK (status IN ('Available', 'Leave')) DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule table
CREATE TABLE schedule (
    schedule_id SERIAL PRIMARY KEY,
    job_id INT REFERENCES jobs(job_id) ON DELETE CASCADE,
    machine_id TEXT REFERENCES machines(machine_id) ON DELETE CASCADE,
    worker_id TEXT REFERENCES workers(worker_id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'Scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
