CREATE DATABASE IF NOT EXISTS scheduler_db;
USE scheduler_db;

CREATE TABLE IF NOT EXISTS jobs (
    job_id INT AUTO_INCREMENT PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL,
    processing_time INT NOT NULL,
    due_date DATE NOT NULL,
    priority ENUM('High', 'Medium', 'Low') NOT NULL,
    required_machine VARCHAR(255),
    required_skill VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS machines (
    machine_id VARCHAR(50) PRIMARY KEY,
    machine_name VARCHAR(255) NOT NULL,
    status ENUM('Available', 'Busy', 'Breakdown', 'Maintenance') DEFAULT 'Available'
);

CREATE TABLE IF NOT EXISTS workers (
    worker_id VARCHAR(50) PRIMARY KEY,
    worker_name VARCHAR(255) NOT NULL,
    skill VARCHAR(255) NOT NULL,
    shift ENUM('Day', 'Night') NOT NULL,
    status ENUM('Available', 'Busy', 'Leave') DEFAULT 'Available'
);

CREATE TABLE IF NOT EXISTS schedule (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT,
    machine_id VARCHAR(50),
    worker_id VARCHAR(50),
    start_time DATETIME,
    end_time DATETIME,
    status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    FOREIGN KEY (job_id) REFERENCES jobs(job_id),
    FOREIGN KEY (machine_id) REFERENCES machines(machine_id),
    FOREIGN KEY (worker_id) REFERENCES workers(worker_id)
);

CREATE TABLE IF NOT EXISTS admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'Executive'
);
