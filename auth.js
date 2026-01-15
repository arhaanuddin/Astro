/* ========================================
   ASTRONET - AUTHENTICATION MODULE
   Role-based access control for Admin & Member
   ======================================== */

const AstroAuth = {
    // Demo credentials (in production, this would be server-side)
    credentials: {
        admin: { password: 'admin123', role: 'admin', name: 'Administrator' },
        member: { password: 'member123', role: 'member', name: 'Member User' }
    },

    // Storage keys
    STORAGE_KEY: 'astronetUser',
    SUBMISSIONS_KEY: 'astronetSubmissions',

    // Get current user from storage
    getCurrentUser: function() {
        const userData = localStorage.getItem(this.STORAGE_KEY);
        return userData ? JSON.parse(userData) : null;
    },

    // Check if user is logged in
    isLoggedIn: function() {
        return this.getCurrentUser() !== null;
    },

    // Check if current user is admin
    isAdmin: function() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    },

    // Check if current user is member
    isMember: function() {
        const user = this.getCurrentUser();
        return user && user.role === 'member';
    },

    // Login function
    login: function(username, password) {
        const user = this.credentials[username];
        if (user && user.password === password) {
            const userData = {
                username: username,
                role: user.role,
                name: user.name,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
            return { success: true, role: user.role };
        }
        return { success: false, error: 'Invalid username or password' };
    },

    // Logout function
    logout: function() {
        localStorage.removeItem(this.STORAGE_KEY);
        window.location.href = 'index.html';
    },

    // Require authentication - redirect to login if not logged in
    requireAuth: function() {
        if (!this.isLoggedIn()) {
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // Require admin role - redirect if not admin
    requireAdmin: function() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        if (!this.isAdmin()) {
            window.location.href = 'member.html';
            return false;
        }
        return true;
    },

    // Require member role (allows admin too)
    requireMember: function() {
        if (!this.isLoggedIn()) {
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // Update navigation based on auth state
    updateNavigation: function() {
        const navLinks = document.getElementById('navLinks');
        if (!navLinks) return;

        const user = this.getCurrentUser();
        const isLoggedIn = user !== null;
        const isAdmin = user && user.role === 'admin';

        // Get all nav items
        const eventsLink = navLinks.querySelector('a[href="events.html"]')?.parentElement;
        const learningLink = navLinks.querySelector('a[href="learning.html"]')?.parentElement;
        const loginLink = navLinks.querySelector('a[href="login.html"]')?.parentElement;

        // Hide/show Events and Learning based on login state
        if (eventsLink) {
            eventsLink.style.display = isLoggedIn ? '' : 'none';
        }
        if (learningLink) {
            learningLink.style.display = isLoggedIn ? '' : 'none';
        }

        // Update login button to show Dashboard/Logout when logged in
        if (loginLink) {
            if (isLoggedIn) {
                // Replace login with dashboard and logout
                const dashboardUrl = isAdmin ? 'admin.html' : 'member.html';
                loginLink.innerHTML = `
                    <a href="${dashboardUrl}" class="nav-login">Dashboard</a>
                `;
                
                // Add logout button after dashboard
                const logoutLi = document.createElement('li');
                logoutLi.innerHTML = '<a href="#" class="nav-logout" onclick="AstroAuth.logout(); return false;">Logout</a>';
                loginLink.after(logoutLi);
            }
        }
    },

    // Gallery Submissions Management
    getSubmissions: function() {
        const data = localStorage.getItem(this.SUBMISSIONS_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveSubmissions: function(submissions) {
        localStorage.setItem(this.SUBMISSIONS_KEY, JSON.stringify(submissions));
    },

    // Submit gallery image (for members)
    submitGalleryImage: function(imageData, title, description, category) {
        const user = this.getCurrentUser();
        if (!user) return { success: false, error: 'Not logged in' };

        const submissions = this.getSubmissions();
        const newSubmission = {
            id: Date.now(),
            imageData: imageData, // Base64 encoded image
            title: title,
            description: description,
            category: category,
            submittedBy: user.username,
            submittedAt: new Date().toISOString(),
            status: 'pending' // pending, approved, rejected
        };
        
        submissions.push(newSubmission);
        this.saveSubmissions(submissions);
        return { success: true, submission: newSubmission };
    },

    // Get pending submissions (for admin)
    getPendingSubmissions: function() {
        return this.getSubmissions().filter(s => s.status === 'pending');
    },

    // Get approved submissions (for gallery)
    getApprovedSubmissions: function() {
        return this.getSubmissions().filter(s => s.status === 'approved');
    },

    // Approve submission (admin only)
    approveSubmission: function(id) {
        if (!this.isAdmin()) return { success: false, error: 'Admin only' };
        
        const submissions = this.getSubmissions();
        const submission = submissions.find(s => s.id === id);
        if (submission) {
            submission.status = 'approved';
            submission.approvedAt = new Date().toISOString();
            this.saveSubmissions(submissions);
            return { success: true };
        }
        return { success: false, error: 'Submission not found' };
    },

    // Reject submission (admin only)
    rejectSubmission: function(id) {
        if (!this.isAdmin()) return { success: false, error: 'Admin only' };
        
        const submissions = this.getSubmissions();
        const submission = submissions.find(s => s.id === id);
        if (submission) {
            submission.status = 'rejected';
            submission.rejectedAt = new Date().toISOString();
            this.saveSubmissions(submissions);
            return { success: true };
        }
        return { success: false, error: 'Submission not found' };
    },

    // Get user's own submissions
    getMySubmissions: function() {
        const user = this.getCurrentUser();
        if (!user) return [];
        return this.getSubmissions().filter(s => s.submittedBy === user.username);
    }
};

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', function() {
    AstroAuth.updateNavigation();
});
