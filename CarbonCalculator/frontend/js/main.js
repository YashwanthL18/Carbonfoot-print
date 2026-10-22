// This variable will hold the chart object so we can destroy it
let resultPieChart = null;
const API_URL = 'http://127.0.0.1:5000'; // Base URL of your Flask server

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('calculator-form');
    form.addEventListener('submit', handleFormSubmit);
});

/**
 * Handles the submission of the calculator form.
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Show loading state
    const button = event.target.querySelector('button[type="submit"]');
    const progressBar = document.querySelector('.progress-bar');
    button.classList.add('loading');
    progressBar.classList.remove('hidden');
    
    // 1. Get all data from the form
    const formData = {
        car_km: document.getElementById('car-km').value,
        car_type: document.getElementById('car-type').value,
        public_transit_km: document.getElementById('public-transit-km').value,
        flight_hours: document.getElementById('flight-hours').value,
        electricity_kwh: document.getElementById('electricity-kwh').value,
        natural_gas: document.getElementById('natural-gas').value,
        diet_type: document.getElementById('diet-type').value,
    };

    // Show loading state
    const submitButton = document.getElementById('calculate-btn');
    submitButton.textContent = 'Calculating...';
    submitButton.disabled = true;

    try {
        // 2. Send data to the backend API
        const response = await fetch(`${API_URL}/api/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        // If you want the calculation to be associated with the logged-in user,
        // include credentials so the session cookie is sent.
        // Example change is above; to include credentials uncomment below and
        // add credentials: 'include' to the fetch options.

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // 3. Display the results
        if (result.success) {
            displayResults(result);
        } else {
            alert('Calculation failed. Please try again.');
        }

    } catch (error) {
        console.error('Error sending data to backend:', error);
        alert('An error occurred. Please check the console and try again.');
        
        // Hide loading states on error
        const button = document.querySelector('button[type="submit"]');
        const progressBar = document.querySelector('.progress-bar');
        button.classList.remove('loading');
        progressBar.classList.add('hidden');
    } finally {
        // Restore button state
        submitButton.textContent = 'Calculate My Footprint';
        submitButton.disabled = false;
    }
}

/**
 * Displays the results on the page.
 * @param {object} result - The result object from the API
 */
function displayResults(result) {
    // Hide loading states
    const button = document.querySelector('button[type="submit"]');
    const progressBar = document.querySelector('.progress-bar');
    button.classList.remove('loading');
    progressBar.classList.add('hidden');

    const resultsContainer = document.getElementById('results-container');
    const totalElement = document.getElementById('total-footprint');
    const recommendationsList = document.getElementById('recommendations-list');

    // 1. Show total footprint
    totalElement.textContent = `${result.footprint.total} tonnes`;

    // 2. Populate recommendations
    recommendationsList.innerHTML = ''; // Clear old tips
    result.recommendations.forEach(tip => {
        const li = document.createElement('li');
        li.textContent = tip;
        recommendationsList.appendChild(li);
    });

    // 3. Display the pie chart
    const chartData = {
        labels: ['Travel', 'Energy', 'Food'],
        datasets: [{
            label: 'Footprint Breakdown (tonnes)',
            data: [
                result.footprint.travel,
                result.footprint.energy,
                result.footprint.food
            ],
            backgroundColor: [
                '#2a9d8f', // Teal
                '#e9c46a', // Yellow
                '#e76f51'  // Red/Orange
            ],
            hoverOffset: 4
        }]
    };

    const ctx = document.getElementById('result-pie-chart').getContext('2d');
    
    // If a chart already exists, destroy it before creating a new one
    if (resultPieChart) {
        resultPieChart.destroy();
    }
    
    resultPieChart = new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Your Footprint Breakdown'
                }
            }
        }
    });

    // 4. Show the results section
    resultsContainer.classList.remove('hidden');
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}