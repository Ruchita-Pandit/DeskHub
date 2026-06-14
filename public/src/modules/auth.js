import * as authApi from "../api/auth.js";

export function initLogin() {
    const form = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');
    const submitButton = document.getElementById('login-submit');
    // Ensure all elements exist
    if (!form || !errorDiv || !submitButton) {
      console.error('Login form elements not found');
      return;
    }
    // Handle form submission
    form.addEventListener('submit', async (event) => {
      event.preventDefault(); // Don't submit form normally
      // Get form data
      const formData = new FormData(form);
      const email = formData.get('email');
      const password = formData.get('password');
      // Basic validation
      if (!email || !password) {
        showError('Please enter both email and password');
        return;
      }
      // Show loading state
      setLoading(true);
      try {
        // Attempt login
        await authApi.login(email, password);
        
        // Success - redirect to dashboard
        window.location.href = 'dashboard.html';
      } catch (error) {
        // Show error message
        showError(error.message);
        setLoading(false);
      }
    });
    // Helper functions
    function showError(message) {
      errorDiv.textContent = message;
      errorDiv.hidden = false;
    }
    function setLoading(isLoading) {
      submitButton.disabled = isLoading;
      submitButton.textContent = isLoading ? 'Signing In...' : 'Sign In';
    }
}

export function initLogout(selector = "#logout-btn") {
    const logoutButton = document.querySelector(selector);
    if (!logoutButton) {
      console.warn(`Logout button not found: ${selector}`);
      return;
    }
    logoutButton.addEventListener('click', (event) => {
      event.preventDefault();
      
      // Logout and redirect
      authApi.logout();
      window.location.href = 'index.html';
    });
}

export function requireAuth() {
    if (!authApi.isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
      }
    return true;
}
