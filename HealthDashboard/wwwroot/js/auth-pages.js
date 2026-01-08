// auth-pages.js - Handles browser cache and navigation for authentication pages (Login/Register)
// This script ensures that authentication pages are not served from browser cache,
// forcing a fresh server request to check the user's authentication status.

(function() {
    'use strict';
    
    // Replace current history entry to clean up navigation history
    // This helps maintain a cleaner history state after authentication flows
    if (window.history && window.history.replaceState) {
        window.history.replaceState(null, document.title, window.location.href);
    }
    
    // Handle bfcache (back-forward cache) - reload page if loaded from cache
    // When a user navigates back to a login/register page, we need to reload
    // from the server to get the correct authentication state (which may redirect
    // authenticated users to the dashboard)
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            // Page was loaded from bfcache (back/forward navigation)
            // Force a fresh reload from server to check authentication status
            window.location.reload();
        }
    });
    
    // Clear form inputs on page load to prevent autofill of previous session data
    document.addEventListener('DOMContentLoaded', function() {
        var forms = document.querySelectorAll('form');
        forms.forEach(function(form) {
            form.reset();
        });
    });
})();
