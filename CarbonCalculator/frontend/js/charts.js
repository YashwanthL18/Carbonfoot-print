const API_URL = 'http://127.0.0.1:5000'; // Base URL of your Flask server

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    loadChartData();
    loadActivities();
    loadRecommendations();
    updateQuickStats();
});

/**
 * Loads activities from the backend
 */
async function loadActivities() {
    try {
        const response = await fetch(`${API_URL}/api/activities`, { credentials: 'include' });
        if (!response.ok) {
            if (response.status === 401) {
                document.getElementById('activities-list').innerHTML = '<li>Please login to see your activities.</li>';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const activities = await response.json();
        const list = document.getElementById('activities-list');
        
        if (activities.length === 0) {
            list.innerHTML = '<li>No activities recorded yet.</li>';
            return;
        }

        list.innerHTML = activities.map(activity => `
            <li class="fade-in">
                <i class="fas fa-check-circle" style="color: var(--primary-color); margin-right: 8px;"></i>
                ${activity.description}
                <small>${new Date(activity.date).toLocaleDateString()}</small>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading activities:', error);
        document.getElementById('activities-list').innerHTML = 
            '<li>Could not load activities. Please try again later.</li>';
    }
}

/**
 * Loads personalized recommendations
 */
async function loadRecommendations() {
    try {
        const response = await fetch(`${API_URL}/api/recommendations`, { credentials: 'include' });
        if (!response.ok) {
            if (response.status === 401) {
                document.getElementById('recommendations-list').innerHTML = '<li>Please login to see personalized tips.</li>';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const recommendations = await response.json();
        const list = document.getElementById('recommendations-list');
        
        if (recommendations.length === 0) {
            list.innerHTML = '<li>No recommendations available yet.</li>';
            return;
        }

        list.innerHTML = recommendations.map(tip => {
            let msg = '';
            if (typeof tip === 'string') msg = tip;
            else if (tip && typeof tip.message === 'string') msg = tip.message;
            else msg = JSON.stringify(tip);

            return `
                <li class="fade-in">
                    <i class="fas fa-lightbulb" style="color: var(--primary-color); margin-right: 8px;"></i>
                    ${msg}
                </li>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading recommendations:', error);
        document.getElementById('recommendations-list').innerHTML = 
            '<li>Could not load recommendations. Please try again later.</li>';
    }
}

/**
 * Updates the quick stats section with animations
 */
async function updateQuickStats() {
    try {
        const response = await fetch(`${API_URL}/api/stats`, { credentials: 'include' });
        if (!response.ok) {
            if (response.status === 401) {
                // Show guest state
                document.getElementById('carbon-score').textContent = 'Login to see stats';
                document.getElementById('reduction-rate').textContent = '—';
                document.getElementById('trees-saved').textContent = '—';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const stats = await response.json();
        
        // Update stats with animations
        const elements = {
            'carbon-score': `${stats.current_score.toFixed(1)} kg CO₂/day`,
            'reduction-rate': `${(stats.reduction_rate * 100).toFixed(1)}%`,
            'trees-saved': stats.trees_saved.toString()
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.textContent = value;
            
            setTimeout(() => {
                element.style.transition = 'all 0.5s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 300);
        });
    } catch (error) {
        console.error('Error updating stats:', error);
        // Show error state in stats
        ['carbon-score', 'reduction-rate', 'trees-saved'].forEach(id => {
            document.getElementById(id).textContent = 'Error loading data';
        });
    }
}

/**
 * Fetches historical data and renders the progress chart.
 */
async function loadChartData() {
    try {
        const response = await fetch(`${API_URL}/api/history`, { credentials: 'include' });
        if (!response.ok) {
            if (response.status === 401) {
                // Try local fallback if user not logged in
                try {
                    const raw = localStorage.getItem('footprint_history');
                    if (raw) {
                        const fallback = JSON.parse(raw);
                        if (Array.isArray(fallback) && fallback.length > 0) {
                            renderProgressChart(fallback);
                            return;
                        }
                    }
                } catch (e) { /* ignore */ }
                document.getElementById('progress-chart-container').innerHTML +=
                    '<p>Please log in to see your personal footprint history.</p>';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const historyData = await response.json();

        if (historyData.length === 0) {
            document.getElementById('progress-chart-container').innerHTML +=
                '<p>No data yet. Go to the calculator to log your first footprint!</p>';
            return;
        }

        renderProgressChart(historyData);

    } catch (error) {
        console.error('Error fetching history:', error);
        // Try a local fallback (e.g., when backend isn't running) by reading stored history
        try {
            const raw = localStorage.getItem('footprint_history');
            if (raw) {
                const fallback = JSON.parse(raw);
                if (Array.isArray(fallback) && fallback.length > 0) {
                    renderProgressChart(fallback);
                    return;
                }
            }
        } catch (e) { /* ignore */ }

        alert('Could not load footprint history. Ensure the backend is running or add sample data.');
    }
}

/**
 * Renders the line chart using Chart.js
 * @param {Array} data - The array of record objects from the API
 */
function renderProgressChart(data) {
    // Sort data chronologically (oldest first)
    data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // 1. Process data for the chart
    const labels = data.map(record => {
        const date = new Date(record.created_at);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });

    const totalData = data.map(record => Number(record.total_footprint) || 0);
    const travelData = data.map(record => Number(record.travel_footprint) || 0);
    const energyData = data.map(record => Number(record.energy_footprint) || 0);
    const foodData = data.map(record => Number(record.food_footprint) || 0);

    // Ensure canvas exists
    const canvas = document.getElementById('progress-line-chart');
    if (!canvas) {
        console.warn('progress-line-chart canvas not found.');
        return;
    }

    const ctx = canvas.getContext('2d');

    // 2. Create gradients for the chart
    const gradients = {
        total: ctx.createLinearGradient(0, 0, 0, canvas.height || 400),
        travel: ctx.createLinearGradient(0, 0, 0, canvas.height || 400),
        energy: ctx.createLinearGradient(0, 0, 0, canvas.height || 400),
        food: ctx.createLinearGradient(0, 0, 0, canvas.height || 400)
    };

    gradients.total.addColorStop(0, 'rgba(46, 204, 113, 0.18)');
    gradients.total.addColorStop(1, 'rgba(46, 204, 113, 0)');

    gradients.travel.addColorStop(0, 'rgba(52, 152, 219, 0.18)');
    gradients.travel.addColorStop(1, 'rgba(52, 152, 219, 0)');

    gradients.energy.addColorStop(0, 'rgba(155, 89, 182, 0.18)');
    gradients.energy.addColorStop(1, 'rgba(155, 89, 182, 0)');

    gradients.food.addColorStop(0, 'rgba(230, 126, 34, 0.18)');
    gradients.food.addColorStop(1, 'rgba(230, 126, 34, 0)');

    // 3. Build chart configuration (single chart instance)
    const config = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Footprint',
                    data: totalData,
                    borderColor: '#2ecc71',
                    backgroundColor: gradients.total,
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    pointBackgroundColor: '#2ecc71',
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: 'Travel',
                    data: travelData,
                    borderColor: '#3498db',
                    backgroundColor: gradients.travel,
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    pointBackgroundColor: '#3498db',
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: 'Energy',
                    data: energyData,
                    borderColor: '#9b59b6',
                    backgroundColor: gradients.energy,
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    pointBackgroundColor: '#9b59b6',
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: 'Food',
                    data: foodData,
                    borderColor: '#e67e22',
                    backgroundColor: gradients.food,
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    pointBackgroundColor: '#e67e22',
                    pointRadius: 3,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 12,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            const val = Number(context.parsed.y || 0);
                            return `${context.dataset.label}: ${val.toFixed(2)} kg CO₂`;
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Your Footprint Over Time'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    title: {
                        display: true,
                        text: 'CO₂ Emissions (kg)'
                    }
                },
                x: {
                    grid: { display: false }
                }
            },
            interaction: { intersect: false, mode: 'nearest' },
            animation: { duration: 800 }
        }
    };

    // Destroy previous chart if exists then create new one
    try {
        if (window.progressChart) {
            window.progressChart.destroy();
        }
    } catch (e) { /* ignore */ }

    window.progressChart = new Chart(ctx, config);
}