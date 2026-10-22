const API_URL = 'http://127.0.0.1:5000';

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    setupImageUpload();
    loadProfileStats();
});

function loadUserProfile() {
    const raw = sessionStorage.getItem('user');
    if (raw) {
        const user = JSON.parse(raw);
        // Update profile details
        document.getElementById('user-name').textContent = user.name || 'Not set';
        document.getElementById('user-email').textContent = user.email || 'Not set';
        document.getElementById('user-location').textContent = user.location || 'Not set';
        document.getElementById('user-joined').textContent = user.joined || 'Not available';
        
        // Load profile image if exists
        if (user.profileImage) {
            document.getElementById('profile-image').src = user.profileImage;
        }
    } else {
        // If no user in session, keep the page visible but use placeholders
        console.warn('No user found in sessionStorage; showing placeholders.');
    }
}

function setupImageUpload() {
    const imageInput = document.getElementById('image-upload');
    if (!imageInput) return;
    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('profile-image').src = e.target.result;
                // Save to session storage
                const user = JSON.parse(sessionStorage.getItem('user') || '{}');
                user.profileImage = e.target.result;
                sessionStorage.setItem('user', JSON.stringify(user));
            };
            reader.readAsDataURL(file);
        }
    });
}

/**
 * Load profile-related statistics: carbon savings, total calculations, achievement level
 * Tries API endpoints first, falls back to localStorage 'footprint_history' if API unavailable.
 */
async function loadProfileStats() {
    try {
        // Try stats endpoint for high-level numbers
        const statsResp = await fetch(`${API_URL}/api/stats`);
        let stats = null;
        if (statsResp.ok) {
            stats = await statsResp.json();
        }

        // Try history endpoint to derive calculations and savings
        let history = [];
        const histResp = await fetch(`${API_URL}/api/history`);
        if (histResp.ok) {
            history = await histResp.json();
        }

        // If API calls failed, try local fallback
        if ((!stats || !Array.isArray(history) || history.length === 0) && !history.length) {
            try {
                const raw = localStorage.getItem('footprint_history');
                if (raw) history = JSON.parse(raw);
            } catch (e) { /* ignore */ }
        }

        // Populate UI fields
        // Total calculations = history length
        const totalCalculations = Array.isArray(history) ? history.length : 0;
        document.getElementById('total-calculations').textContent = totalCalculations.toString();

        // Carbon savings: compute difference between earliest and latest total_footprint
        let savingsText = '0 kg CO2';
        if (Array.isArray(history) && history.length >= 2) {
            // ensure chronological order
            history.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const first = Number(history[0].total_footprint) || 0;
            const last = Number(history[history.length - 1].total_footprint) || 0;
            const saved = Math.max(0, first - last);
            savingsText = `${saved.toFixed(2)} kg CO2`;
        } else if (stats && typeof stats.total_savings !== 'undefined') {
            savingsText = `${Number(stats.total_savings).toFixed(2)} kg CO2`;
        }
        document.getElementById('carbon-savings').textContent = savingsText;

        // Trees saved (from stats if available)
        try {
            const treesElem = document.getElementById('trees-saved-profile');
            if (treesElem) {
                if (stats && typeof stats.trees_saved !== 'undefined') {
                    treesElem.textContent = stats.trees_saved.toString();
                } else {
                    // Try to compute from local history using 22 kg CO2 per tree
                    if (Array.isArray(history) && history.length >= 2) {
                        const first = Number(history[0].total_footprint) || 0;
                        const last = Number(history[history.length - 1].total_footprint) || 0;
                        const saved = Math.max(0, first - last);
                        const trees = (saved / 22.0).toFixed(1);
                        treesElem.textContent = trees.toString();
                    }
                }
            }
        } catch (e) { /* ignore */ }

        // Achievement level: simple rule-based level from savings
        let level = 'Beginner';
        try {
            const savedVal = parseFloat(savingsText) || 0;
            if (savedVal >= 500) level = 'Eco Champion';
            else if (savedVal >= 200) level = 'Advanced';
            else if (savedVal >= 50) level = 'Intermediate';
            else level = 'Beginner';
        } catch (e) { level = 'Beginner'; }
        document.getElementById('achievement-level').textContent = level;

    } catch (error) {
        console.error('Error loading profile stats:', error);
        // Fallback placeholders
        document.getElementById('carbon-savings').textContent = 'Unavailable';
        document.getElementById('total-calculations').textContent = '0';
        document.getElementById('achievement-level').textContent = 'Beginner';
    }
}

// Initialize a default user in sessionStorage only if missing
if (!sessionStorage.getItem('user')) {
    const userData = {
        name: "User's Name",
        email: "user@example.com",
        location: "City, Country",
        joined: "November 2025",
        profileImage: null // Will be set when user uploads an image
    };
    sessionStorage.setItem('user', JSON.stringify(userData));
}