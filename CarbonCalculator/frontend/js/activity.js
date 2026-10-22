// Handles activity input form and forwards it to /api/calculate
// Saves result in sessionStorage and redirects to results.html

const API_URL = 'http://127.0.0.1:5000';

document.addEventListener('DOMContentLoaded', () => {
    const activityForm = document.getElementById('activity-form');
    if (!activityForm) return;

    activityForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Map the simple activity form to the calculator API payload
        const travel = document.getElementById('travel').value || 0;
        const electricity = document.getElementById('electricity').value || 0;
        const food = document.getElementById('food').value || 'average';
        // plastic currently not used by backend calculator

        const payload = {
            car_km: travel,
            car_type: 'gasoline', // default; you can add a select later
            public_transit_km: 0,
            flight_hours: 0,
            electricity_kwh: electricity,
            natural_gas: 0,
            diet_type: food === 'vegetarian' ? 'vegetarian' : 'average'
        };

        try {
            const res = await fetch(`${API_URL}/api/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`HTTP ${res.status}: ${txt}`);
            }

            const data = await res.json();
            if (data.success) {
                // Save the last result for the results page to read
                sessionStorage.setItem('lastResult', JSON.stringify(data));
                window.location.href = 'results.html';
            } else {
                alert('Calculation failed');
            }

        } catch (err) {
            console.error('Activity submit error', err);
            alert('Could not submit activity. See console.');
        }
    });
});