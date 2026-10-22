"""
Core Carbon Footprint Calculation Logic.
All emission factors are illustrative examples.
"""

# --- Emission Factors (kg CO2e) ---
# Source: Use real data from EPA, IPCC, or other scientific bodies for a real app.
EMISSION_FACTORS = {
    # Travel (per km)
    "car_gasoline": 0.17,  # kg CO2e per km
    "car_electric": 0.05,  # (Varies greatly by grid)
    "public_bus": 0.08,
    "train": 0.04,
    "flight_short": 0.25,  # (Short-haul)
    "flight_long": 0.15,   # (Long-haul)
    
    # Energy (per unit)
    "electricity": 0.233,  # kg CO2e per kWh (US average, example)
    "natural_gas": 2.0,    # kg CO2e per m³ (or therm)
    
    # Food (per year, based on diet type)
    "diet_meat_lover": 3300,  # kg CO2e per year
    "diet_average": 2500,
    "diet_vegetarian": 1700,
    "diet_vegan": 1500
}

def calculate_travel_footprint(car_km, car_type, flight_hours, public_transit_km):
    """Calculates total travel footprint in kg CO2e per year."""
    total = 0
    
    # 1. Car
    car_factor = EMISSION_FACTORS.get(f"car_{car_type}", EMISSION_FACTORS["car_gasoline"])
    total += float(car_km) * car_factor * 52 # Assuming weekly km
    
    # 2. Flights (simplified)
    # A real app would use the Google Maps distance between airports
    flight_factor = EMISSION_FACTORS["flight_long"] if float(flight_hours) > 6 else EMISSION_FACTORS["flight_short"]
    total += float(flight_hours) * 800 * flight_factor # Assuming avg speed 800 km/h
    
    # 3. Public Transit
    total += float(public_transit_km) * EMISSION_FACTORS["public_bus"] * 52 # Assuming weekly km
    
    return total

def calculate_energy_footprint(electricity_kwh_monthly, natural_gas_monthly):
    """Calculates total energy footprint in kg CO2e per year."""
    total = 0
    
    # 1. Electricity
    total += float(electricity_kwh_monthly) * EMISSION_FACTORS["electricity"] * 12 # Monthly to yearly
    
    # 2. Natural Gas
    total += float(natural_gas_monthly) * EMISSION_FACTORS["natural_gas"] * 12 # Monthly to yearly
    
    return total

def calculate_food_footprint(diet_type):
    """Calculates total food footprint in kg CO2e per year."""
    return EMISSION_FACTORS.get(f"diet_{diet_type}", EMISSION_FACTORS["diet_average"])

def calculate_total_footprint(data):
    """
    Main function to calculate the total footprint and its breakdown.
    'data' is a dictionary from the frontend.
    """
    
    travel = calculate_travel_footprint(
        data.get("car_km", 0),
        data.get("car_type", "gasoline"),
        data.get("flight_hours", 0),
        data.get("public_transit_km", 0)
    )
    
    energy = calculate_energy_footprint(
        data.get("electricity_kwh", 0),
        data.get("natural_gas", 0)
    )
    
    food = calculate_food_footprint(
        data.get("diet_type", "average")
    )
    
    total = travel + energy + food
    
    # Return breakdown in tonnes
    return {
        "travel": round(travel / 1000, 2),
        "energy": round(energy / 1000, 2),
        "food": round(food / 1000, 2),
        "total": round(total / 1000, 2)
    }