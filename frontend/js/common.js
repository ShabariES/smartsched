const API_URL = window.location.origin + '/api';

// Auth Guard
function checkAuth() {
    const token = localStorage.getItem('admin_token');
    const isAuthPage = window.location.pathname.includes('auth.html');

    if (!token && !isAuthPage) {
        window.location.href = 'auth.html';
    } else if (token && isAuthPage) {
        window.location.href = 'index.html';
    }
}

// Sidebar Profile Sync & Role Access
function updateSidebarProfile() {
    const name = localStorage.getItem('admin_name') || 'External User';
    const role = localStorage.getItem('admin_role') || 'User';
    const profileName = document.querySelector('.profile-name');
    const profileRole = document.querySelector('.profile-role');
    const avatar = document.querySelector('.avatar');

    if (profileName) profileName.textContent = name;
    if (profileRole) profileRole.textContent = role;
    if (avatar) avatar.textContent = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    // Role-based Access Control
    if (role === 'User') {
        const restrictedLinks = ['jobs.html', 'machines.html', 'workers.html'];
        const currentPage = window.location.pathname.split('/').pop();

        if (restrictedLinks.includes(currentPage)) {
            window.location.href = 'index.html';
        }

        document.querySelectorAll('.nav-links a').forEach(link => {
            const href = link.getAttribute('href');
            if (restrictedLinks.includes(href)) {
                link.parentElement.style.display = 'none';
            }
        });

        // Hide Admin-only buttons (like Reschedule/Optimise)
        const adminElements = document.querySelectorAll('#rescheduleBtn, .form-card');
        adminElements.forEach(el => el.style.display = 'none');
    }
}

// Logout handler
function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_name');
    localStorage.removeItem('admin_role');
    window.location.href = 'auth.html';
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    updateSidebarProfile();
    initMobileSidebar();

    // Add logout listener if profile exists
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        // Already handled by onclick="logout()"
    } else {
        const profile = document.querySelector('.sidebar-footer');
        if (profile) {
            profile.style.cursor = 'pointer';
            profile.title = 'Click to Logout';
            profile.addEventListener('click', () => {
                if (confirm('Logout from Smart Scheduler?')) logout();
            });
        }
    }
});

/**
 * Mobile sidebar initialization
 * Injects hamburger button and handles toggle events
 */
function initMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Create toggle button if it doesn't exist
    if (!document.getElementById('sidebar-toggle')) {
        const toggle = document.createElement('button');
        toggle.id = 'sidebar-toggle';
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.prepend(toggle);

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            toggle.innerHTML = sidebar.classList.contains('active') ?
                '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('active') && !sidebar.contains(e.target)) {
                sidebar.classList.remove('active');
                toggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });

        // Close when navigating
        sidebar.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                sidebar.classList.remove('active');
                toggle.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) {
        const div = document.createElement('div');
        div.id = 'toast-container';
        document.body.appendChild(div);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const color = type === 'success' ? 'var(--accent)' : '#ef4444';

    toast.style.borderLeftColor = color;
    toast.innerHTML = `
        <i class="fas ${icon}" style="color: ${color}"></i>
        <span>${message}</span>
    `;

    document.getElementById('toast-container').appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// Global pulse helper
function updateSystemStatus(text) {
    const statusEl = document.querySelector('.system-status span');
    if (statusEl) statusEl.textContent = text;
}
