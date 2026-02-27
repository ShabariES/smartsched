# Hosting Smart Scheduler on Render

This guide outlines how to host your **Smart Scheduler** ecosystem (Node.js backend + Frontend) on [Render](https://render.com/).

## 1. Prerequisites
- Your code is already pushed to GitHub: `https://github.com/ShabariES/smartsched.git`
- A MySQL Database. Since Render doesn't offer a free MySQL tier, you can use **Aiven** or **Railway** to get a free MySQL connection string.

## 2. Steps to Host

### Step A: Connect GitHub to Render
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select the `smartsched` repository.

### Step B: Configure the Web Service
- **Name**: `smartsched-system` (or anything you like)
- **Region**: Select the one closest to you.
- **Branch**: `main`
- **Root Directory**: (Leave blank / root)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Step C: Set Environment Variables (Crucial)
Go to the **Environment** tab in your Render service and add the following keys:

| Key | Value |
| :--- | :--- |
| `PORT` | `3000` |
| `DB_HOST` | *(Your MySQL Host, e.g., `mysql.aivencloud.com`)* |
| `DB_USER` | *(Your MySQL Username)* |
| `DB_PASSWORD` | *(Your MySQL Password)* |
| `DB_NAME` | *(Your Database Name)* |
| `GEMINI_API_KEY` | *(Your AI API Key for scheduling optimizations)* |

## 3. Database Preparation
Render's Node process will try to initialize tables automatically via `server.js`. However, ensure your MySQL provider allows the user to CREATE tables.

## 4. Frontend Access
Since the backend uses `express.static`, your frontend will automatically be available at your Render URL (e.g., `https://smartsched-system.onrender.com`).

---
**Note**: The app is currently configured to connect to `/api` relative to the current origin, so it will work perfectly out-of-the-box on Render!
