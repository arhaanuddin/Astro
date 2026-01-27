/* ========================================
   ASTRONET - API CLIENT
   Handles all API communication with backend
   ======================================== */

const AstroAPI = {
    // Base URL for API - using IP to avoid IPv6 issues
    baseURL: 'http://127.0.0.1:3000/api',

    // Storage key for JWT token
    TOKEN_KEY: 'astronetToken',

    // Get stored token
    getToken: function () {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    // Set token
    setToken: function (token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },

    // Remove token
    removeToken: function () {
        localStorage.removeItem(this.TOKEN_KEY);
    },

    // Make API request with authentication
    request: async function (endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // GET request
    get: function (endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    // POST request
    post: function (endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    // PUT request
    put: function (endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    // PATCH request
    patch: function (endpoint, body) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    },

    // DELETE request
    delete: function (endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },

    // Upload file with form data
    upload: async function (endpoint, formData) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const config = {
            method: 'POST',
            body: formData,
            headers: {}
        };

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            return data;
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    },

    // ======== AUTH ENDPOINTS ========
    auth: {
        login: function (username, password) {
            return AstroAPI.post('/auth/login', { username, password });
        },
        register: function (username, email, password, name) {
            return AstroAPI.post('/auth/register', { username, email, password, name });
        },
        me: function () {
            return AstroAPI.get('/auth/me');
        },
        forgotPassword: function (email) {
            return AstroAPI.post('/auth/forgot-password', { email });
        },
        resetPassword: function (token, password) {
            return AstroAPI.post('/auth/reset-password', { token, password });
        }
    },

    // ======== USER ENDPOINTS ========
    users: {
        getAll: function () {
            return AstroAPI.get('/users');
        },
        getById: function (id) {
            return AstroAPI.get(`/users/${id}`);
        },
        create: function (userData) {
            return AstroAPI.post('/users', userData);
        },
        update: function (id, userData) {
            return AstroAPI.put(`/users/${id}`, userData);
        },
        delete: function (id) {
            return AstroAPI.delete(`/users/${id}`);
        }
    },

    // ======== EVENT ENDPOINTS ========
    events: {
        getAll: function () {
            return AstroAPI.get('/events');
        },
        getFeatured: function () {
            return AstroAPI.get('/events/featured');
        },
        getById: function (id) {
            return AstroAPI.get(`/events/${id}`);
        },
        create: function (eventData) {
            return AstroAPI.post('/events', eventData);
        },
        update: function (id, eventData) {
            return AstroAPI.put(`/events/${id}`, eventData);
        },
        delete: function (id) {
            return AstroAPI.delete(`/events/${id}`);
        },
        register: function (id, registrationData) {
            return AstroAPI.post(`/events/${id}/register`, registrationData);
        },
        cancelRegistration: function (id) {
            return AstroAPI.delete(`/events/${id}/register`);
        },
        getRegistrations: function (id) {
            return AstroAPI.get(`/events/${id}/registrations`);
        }
    },

    // ======== GALLERY ENDPOINTS ========
    gallery: {
        getApproved: function (category) {
            const query = category && category !== 'all' ? `?category=${category}` : '';
            return AstroAPI.get(`/gallery${query}`);
        },
        getAll: function () {
            return AstroAPI.get('/gallery/all');
        },
        getPending: function () {
            return AstroAPI.get('/gallery/pending');
        },
        getMySubmissions: function () {
            return AstroAPI.get('/gallery/my-submissions');
        },
        submit: function (imageData, title, description, category) {
            return AstroAPI.post('/gallery/submit', {
                imageData,
                title,
                description,
                category
            });
        },
        approve: function (id) {
            return AstroAPI.patch(`/gallery/${id}/approve`, {});
        },
        reject: function (id) {
            return AstroAPI.patch(`/gallery/${id}/reject`, {});
        },
        delete: function (id) {
            return AstroAPI.delete(`/gallery/${id}`);
        }
    },

    // ======== STATS ENDPOINTS ========
    stats: {
        getDashboardStats: function () {
            return AstroAPI.get('/stats');
        }
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AstroAPI;
}
