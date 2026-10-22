/**
 * Enhanced Google Maps integration with distance calculation
 */
function initMaps() {
    console.log("Initializing Google Maps integration...");

    // Get the input fields
    const originInput = document.getElementById('flight-origin');
    const destinationInput = document.getElementById('flight-destination');
    const flightHoursInput = document.getElementById('flight-hours');

    if (!originInput || !destinationInput) {
        console.error('Flight input fields not found');
        return;
    }

    try {
        // Create autocomplete objects with improved options
        const options = {
            types: ['(cities)'],
            fields: ['name', 'geometry'],
        };

        const autocompleteOrigin = new google.maps.places.Autocomplete(originInput, options);
        const autocompleteDest = new google.maps.places.Autocomplete(destinationInput, options);

        // Create a function to calculate distance
        function calculateDistance() {
            const origin = autocompleteOrigin.getPlace();
            const destination = autocompleteDest.getPlace();

            if (!origin || !origin.geometry || !destination || !destination.geometry) {
                return;
            }

            // Calculate distance using Haversine formula
            const R = 6371; // Earth's radius in km
            const lat1 = origin.geometry.location.lat();
            const lon1 = origin.geometry.location.lng();
            const lat2 = destination.geometry.location.lat();
            const lon2 = destination.geometry.location.lng();

            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;

            // Estimate flight hours (assuming average speed of 800 km/h)
            const estimatedHours = distance / 800;
            flightHoursInput.value = Math.round(estimatedHours * 10) / 10;

            // Show visual feedback
            const feedback = document.createElement('div');
            feedback.className = 'flight-distance-feedback fade-in';
            feedback.innerHTML = `
                <p>Estimated flight distance: ${Math.round(distance)} km</p>
                <p>⏱ Estimated flight time: ${Math.round(estimatedHours * 10) / 10} hours</p>
            `;

            // Remove any existing feedback
            const existingFeedback = document.querySelector('.flight-distance-feedback');
            if (existingFeedback) {
                existingFeedback.remove();
            }

            // Add new feedback after the destination input
            destinationInput.parentNode.appendChild(feedback);
        }

        // Add listeners to calculate distance when places are selected
        autocompleteOrigin.addListener('place_changed', calculateDistance);
        autocompleteDest.addListener('place_changed', calculateDistance);

        // Add loading indicators
        [originInput, destinationInput].forEach(input => {
            input.addEventListener('focus', () => {
                input.classList.add('loading');
            });
        });

    } catch (error) {
        console.error('Error initializing Google Maps:', error);
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message fade-in';
        errorMsg.textContent = 'Could not initialize maps. Please try again later.';
        originInput.parentNode.insertBefore(errorMsg, originInput);
    }
}