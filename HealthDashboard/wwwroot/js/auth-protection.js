// auth-protection.js - Prevents browser back navigation after login
// This script protects user data by preventing access to previous user's session

(function() {
    'use strict';
    
    // Function to clear browser history and prevent back navigation
    function preventBackNavigation() {
        // Replace the current state to prevent back navigation
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, document.title, window.location.href);
        }
        
        // Push a new state to create a forward entry
        if (window.history && window.history.pushState) {
            window.history.pushState(null, document.title, window.location.href);
        }
        
        // Listen for back/forward navigation attempts
        window.addEventListener('popstate', function(event) {
            // Push state again to prevent going back
            window.history.pushState(null, document.title, window.location.href);
        });
    }
    
    // Function to clear sensitive data on logout or session change
    function clearSensitiveData() {
        // Clear sessionStorage
        if (window.sessionStorage) {
            window.sessionStorage.clear();
        }
        
        // Clear any cached form data
        var forms = document.querySelectorAll('form');
        forms.forEach(function(form) {
            form.reset();
        });
    }
    
    // Function to detect if user session has changed
    function monitorSessionChange() {
        // Store a session marker using data-user-email attribute
        var currentUser = document.querySelector('[data-user-email]');
        if (currentUser) {
            var userEmail = currentUser.getAttribute('data-user-email');
            var previousUser = sessionStorage.getItem('current_user');
            
            if (previousUser && previousUser !== userEmail) {
                // User has changed, clear all data
                clearSensitiveData();
                // Force page reload to clear any cached data
                window.location.reload(true);
            }
            
            sessionStorage.setItem('current_user', userEmail);
        }
    }
    
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        preventBackNavigation();
        monitorSessionChange();
        setupLogoutHandler();
    });
    
    // Also run immediately in case DOM is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        preventBackNavigation();
        monitorSessionChange();
        setupLogoutHandler();
    }
    
    // Prevent page caching
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            // Page was loaded from cache (back/forward button)
            window.location.reload();
        }
    });
    
    // Setup logout handler using specific element IDs
    function setupLogoutHandler() {
        var logoutButton = document.getElementById('logoutButton');
        var logoutForm = document.getElementById('logoutForm');
        
        if (logoutButton) {
            logoutButton.addEventListener('click', function() {
                sessionStorage.setItem('logout_clicked', 'true');
                clearSensitiveData();
            });
        }
        
        if (logoutForm) {
            logoutForm.addEventListener('submit', function() {
                sessionStorage.setItem('logout_clicked', 'true');
                clearSensitiveData();
            });
        }
    }
    
    // Clear data before unload when logging out
    window.addEventListener('beforeunload', function() {
        // Check if logout button was clicked
        var logoutClicked = sessionStorage.getItem('logout_clicked');
        if (logoutClicked === 'true') {
            clearSensitiveData();
            sessionStorage.removeItem('logout_clicked');
        }
    });
})();
