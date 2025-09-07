// auth.js - Simple authentication module

const AUTH_CONFIG = {
    // Default admin credentials (can be overridden by loading from a file)
    users: [
        {
            username: 'admin',
            password: 'G9m#tX2!pV7q@Lz4',
            role: 'admin'
        }
    ]
};

// Function to verify user credentials
function authenticate(username, password) {
    // In a production environment, you would hash the password before comparing
    const user = AUTH_CONFIG.users.find(u => 
        u.username === username && 
        u.password === password
    );
    
    return user ? { 
        authenticated: true, 
        username: user.username,
        role: user.role
    } : { 
        authenticated: false 
    };
}

// Function to check if user is authenticated
function isAuthenticated() {
    const authData = localStorage.getItem('auth');
    if (!authData) return false;
    
    try {
        const { username, token, expires } = JSON.parse(authData);
        return username && token && new Date(expires) > new Date();
    } catch (e) {
        return false;
    }
}

// Function to get current user
function getCurrentUser() {
    const authData = localStorage.getItem('auth');
    if (!authData) return null;
    
    try {
        return JSON.parse(authData);
    } catch (e) {
        return null;
    }
}

// Function to log out
function logout() {
    localStorage.removeItem('auth');
    window.location.href = 'login.html';
}

// Export functions
window.auth = {
    authenticate,
    isAuthenticated,
    getCurrentUser,
    logout
};

// Auto-redirect to login if not authenticated and not on login page
if (!window.location.pathname.endsWith('login.html') && !isAuthenticated()) {
    window.location.href = 'login.html';
}
