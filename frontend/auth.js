console.log('🛡️ AstroAuth: v2.0 (with Register) initialized');

const AstroAuth = {
    // Storage key for user data cache
    USER_KEY: 'astronetUser',

    // Get current user from local cache
    getCurrentUser: function () {
        const userData = localStorage.getItem(this.USER_KEY);
        return userData ? JSON.parse(userData) : null;
    },

    // Check if user is logged in (has valid token)
    isLoggedIn: function () {
        return AstroAPI.getToken() !== null && this.getCurrentUser() !== null;
    },

    // Check if current user is admin
    isAdmin: function () {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    },

    // Check if current user is member
    isMember: function () {
        const user = this.getCurrentUser();
        return user && user.role === 'member';
    },

    // Login function - calls API
    login: async function (username, password) {
        try {
            const response = await AstroAPI.auth.login(username, password);

            if (response.success) {
                // Store token
                AstroAPI.setToken(response.token);

                // Cache user data
                localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));

                return {
                    success: true,
                    role: response.user.role,
                    user: response.user
                };
            }
            return { success: false, error: response.error || 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message || 'Login failed. Please try again.' };
        }
    },

    // Register function - calls API
    register: async function (username, email, password, name) {
        console.log('📡 AstroAuth: Attempting registration...', { username, email, name });
        try {
            const response = await AstroAPI.auth.register(username, email, password, name);
            console.log('📡 AstroAuth: API response received:', response);

            if (response.success) {
                // Store token
                AstroAPI.setToken(response.token);

                // Cache user data
                localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));

                return {
                    success: true,
                    role: response.user.role,
                    user: response.user
                };
            }
            return { success: false, error: response.error || 'Registration failed' };
        } catch (error) {
            console.error('📡 AstroAuth: Registration exception:', error);
            return { success: false, error: error.message || 'Registration failed. Please try again.' };
        }
    },

    // Logout function
    logout: function () {
        AstroAPI.removeToken();
        localStorage.removeItem(this.USER_KEY);
        window.location.href = 'index.html';
    },

    // Require authentication - redirect to login if not logged in
    requireAuth: function () {
        if (!this.isLoggedIn()) {
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // Require admin role - redirect if not admin
    requireAdmin: function () {
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
    requireMember: function () {
        if (!this.isLoggedIn()) {
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // Update navigation based on auth state
    updateNavigation: function () {
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

    // ======== GALLERY SUBMISSIONS (now use API) ========

    // Get all submissions (from API)
    getSubmissions: async function () {
        try {
            const response = await AstroAPI.gallery.getAll();
            return response.success ? response.items : [];
        } catch (error) {
            console.error('Get submissions error:', error);
            return [];
        }
    },

    // Submit gallery image (calls API)
    submitGalleryImage: async function (imageData, title, description, category) {
        try {
            const response = await AstroAPI.gallery.submit(imageData, title, description, category);
            return response;
        } catch (error) {
            console.error('Submit gallery error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get pending submissions (for admin - calls API)
    getPendingSubmissions: async function () {
        try {
            const response = await AstroAPI.gallery.getPending();
            return response.success ? response.items : [];
        } catch (error) {
            console.error('Get pending error:', error);
            return [];
        }
    },

    // Get approved submissions (for gallery - calls API)
    getApprovedSubmissions: async function () {
        try {
            const response = await AstroAPI.gallery.getApproved();
            return response.success ? response.items : [];
        } catch (error) {
            console.error('Get approved error:', error);
            return [];
        }
    },

    // Approve submission (admin only - calls API)
    approveSubmission: async function (id) {
        try {
            const response = await AstroAPI.gallery.approve(id);
            return response;
        } catch (error) {
            console.error('Approve error:', error);
            return { success: false, error: error.message };
        }
    },

    // Reject submission (admin only - calls API)
    rejectSubmission: async function (id) {
        try {
            const response = await AstroAPI.gallery.reject(id);
            return response;
        } catch (error) {
            console.error('Reject error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get user's own submissions (calls API)
    getMySubmissions: async function () {
        try {
            const response = await AstroAPI.gallery.getMySubmissions();
            return response.success ? response.items : [];
        } catch (error) {
            console.error('Get my submissions error:', error);
            return [];
        }
    }
};

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', function () {
    AstroAuth.updateNavigation();
});
