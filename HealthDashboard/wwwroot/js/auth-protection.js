// navigation-guard.js - Cross-browser back button prevention
// Prevents browser back navigation on all major browsers (Chrome, Safari, Firefox, Edge)

(function () {
    'use strict';

    // ============================================
    // CROSS-BROWSER BACK NAVIGATION PREVENTION
    // ============================================

    /**
     * Prevents back navigation by manipulating browser history
     * Works on Chrome, Safari, Firefox, Edge, and IE11+
     */
    function preventBackNavigation() {
        // Method 1: Replace and Push State
        if (window.history && window.history.replaceState) {
            // Replace current state to remove back entry
            window.history.replaceState(null, document.title, window.location.href);
        }

        if (window.history && window.history.pushState) {
            // Push new state so back button stays on this page
            window.history.pushState(null, document.title, window.location.href);
        }

        // Method 2: Listen for popstate (back/forward button)
        window.addEventListener('popstate', function (event) {
            // Immediately push state again to prevent navigation
            window.history.pushState(null, document.title, window.location.href);
        });

        // Method 3: Handle hashchange for older browsers
        window.addEventListener('hashchange', function (event) {
            // Prevent hash-based navigation
            window.history.pushState(null, document.title, window.location.href);
        });
    }

    /**
     * Prevents page caching - critical for Safari
     * Safari caches pages aggressively with back-forward cache (bfcache)
     */
    function preventPageCaching() {
        // Handle Safari's back-forward cache
        window.addEventListener('pageshow', function (event) {
            if (event.persisted) {
                // Page was loaded from bfcache (back/forward button used)
                // Force reload to prevent showing stale content
                window.location.reload();
            }
        });

        // Also handle pagehide for cleanup
        window.addEventListener('pagehide', function (event) {
            // Clear any sensitive data when leaving
            clearSensitiveData();
        });
    }

    /**
     * Adds cache-control meta tags dynamically
     * Helps prevent page caching across browsers
     */
    function addCacheControlMeta() {
        const metaTags = [
            { 'http-equiv': 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
            { 'http-equiv': 'Pragma', content: 'no-cache' },
            { 'http-equiv': 'Expires', content: '0' }
        ];

        metaTags.forEach(function (attrs) {
            // Check if meta tag already exists
            let existing = document.querySelector('meta[http-equiv="' + attrs['http-equiv'] + '"]');
            if (!existing) {
                let meta = document.createElement('meta');
                meta.setAttribute('http-equiv', attrs['http-equiv']);
                meta.setAttribute('content', attrs.content);
                document.head.appendChild(meta);
            }
        });
    }

    /**
     * Clear sensitive form data and storage
     */
    function clearSensitiveData() {
        // Clear sessionStorage
        if (window.sessionStorage) {
            try {
                window.sessionStorage.clear();
            } catch (e) {
                // Ignore errors in private browsing mode
            }
        }

        // Reset any forms to prevent autofill data leakage
        var forms = document.querySelectorAll('form');
        forms.forEach(function (form) {
            try {
                form.reset();
            } catch (e) {
                // Ignore if form can't be reset
            }
        });
    }

    /**
     * Monitor for user session changes
     */
    function monitorSessionChange() {
        var currentUserElement = document.querySelector('[data-user-email]');
        if (currentUserElement) {
            var userEmail = currentUserElement.getAttribute('data-user-email');
            var previousUser = sessionStorage.getItem('current_user');

            if (previousUser && previousUser !== userEmail) {
                // User has changed, clear all data and reload
                clearSensitiveData();
                window.location.reload(true);
            }

            sessionStorage.setItem('current_user', userEmail);
        }
    }

    /**
     * Handle logout button clicks
     */
    function setupLogoutHandler() {
        var logoutButton = document.getElementById('logoutButton');
        var logoutForm = document.getElementById('logoutForm');

        if (logoutButton) {
            logoutButton.addEventListener('click', function () {
                sessionStorage.setItem('logout_clicked', 'true');
                clearSensitiveData();
            });
        }

        if (logoutForm) {
            logoutForm.addEventListener('submit', function () {
                sessionStorage.setItem('logout_clicked', 'true');
                clearSensitiveData();
            });
        }
    }

    /**
     * Clear data before page unload if logging out
     */
    function setupBeforeUnloadHandler() {
        window.addEventListener('beforeunload', function () {
            var logoutClicked = sessionStorage.getItem('logout_clicked');
            if (logoutClicked === 'true') {
                clearSensitiveData();
                sessionStorage.removeItem('logout_clicked');
            }
        });
    }

    /**
     * Disable back button keyboard shortcuts
     * Prevents Alt+Left Arrow and Backspace navigation
     */
    function disableBackKeyboardShortcuts() {
        document.addEventListener('keydown', function (event) {
            // Backspace key (when not in input/textarea)
            if (event.key === 'Backspace') {
                var target = event.target;
                var tagName = target.tagName.toLowerCase();
                var isEditable = target.isContentEditable;
                var isInput = (tagName === 'input' || tagName === 'textarea');

                if (!isInput && !isEditable) {
                    event.preventDefault();
                }
            }

            // Alt + Left Arrow (back navigation)
            if (event.altKey && event.key === 'ArrowLeft') {
                event.preventDefault();
            }

            // Alt + Right Arrow (forward navigation) - also block for consistency
            if (event.altKey && event.key === 'ArrowRight') {
                event.preventDefault();
            }
        });
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    function initialize() {
        addCacheControlMeta();
        preventBackNavigation();
        preventPageCaching();
        monitorSessionChange();
        setupLogoutHandler();
        setupBeforeUnloadHandler();
        disableBackKeyboardShortcuts();

        console.log('[Navigation Guard] Back navigation prevention active');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // DOM already loaded
        initialize();
    }

})();
