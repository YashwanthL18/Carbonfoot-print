import pickle
import os
import numpy as np

# Load the model
model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
try:
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
except FileNotFoundError:
    print("Model file not found. Run 'train_model.py' first.")
    model = None

# Simple, rule-based tips
TIPS_DATABASE = {
    "focus_travel": [
        "Try swapping one car trip per week with public transit or biking.",
        "For your next vacation, consider a destination reachable by train.",
        "Look into electric vehicle options for your next car."
    ],
    "focus_energy": [
        "Switch to LED lightbulbs. They use 75% less energy.",
        "Unplug electronics when not in use (phantom load).",
        "Check your home's insulation or see if solar panels are an option for you."
    ],
    "focus_food": [
        "Try 'Meatless Mondays' to reduce your red meat consumption.",
        "Focus on buying local, seasonal produce to reduce food miles.",
        "Plan your meals for the week to reduce food waste."
    ],
    "general": [
        "Track your footprint again next month to see your progress!"
    ]
}

def get_personalized_recommendations(footprint_data):
    """
    Generates tips based on the ML model and a simple rules engine.
    'footprint_data' is a dict: {'travel': X, 'energy': Y, 'food': Z}
    """
    
    if not model:
        return ["Model not loaded. Please train the model first."]

    # 1. Use the ML model to find the "focus area"
    try:
        # Prepare data for the model
        features = np.array([[
            footprint_data.get("travel", 0),
            footprint_data.get("energy", 0),
            footprint_data.get("food", 0)
        ]])
        
        # Predict the focus area
        focus_area = model.predict(features)[0] # e.g., 'energy'
        
        # 2. Get specific tips for that area
        tips = TIPS_DATABASE.get(f"focus_{focus_area}", [])
        
        # 3. Add a general tip
        recommendations = tips[:2] + TIPS_DATABASE["general"]
        
    except Exception as e:
        print(f"Error during recommendation: {e}")
        recommendations = TIPS_DATABASE["general"] # Fallback

    return recommendations