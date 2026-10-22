"""
TRAINING SCRIPT
Run this file ONCE to create the 'model.pkl' file.
python backend/ml/train_model.py
"""

import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import pickle
import os

def train_and_save_model():
    """
    Creates a simple, illustrative model to recommend a "focus area".
    """
    # 1. Create simple dummy data
    # In a real app, this would be thousands of rows of real user data
    data = {
        'travel_footprint': [1.2, 5.5, 2.1, 8.0, 0.5, 1.0, 3.0, 6.0],
        'energy_footprint': [4.0, 2.0, 3.5, 5.0, 1.5, 4.5, 1.0, 3.0],
        'food_footprint':   [2.5, 1.7, 3.0, 1.5, 1.6, 3.3, 1.8, 3.1],
        'focus_recommendation': ['energy', 'travel', 'energy', 'travel', 'energy', 'energy', 'travel', 'travel']
        # 'focus_recommendation' is what the user should work on most
    }
    
    df = pd.DataFrame(data)
    
    X = df[['travel_footprint', 'energy_footprint', 'food_footprint']]
    y = df['focus_recommendation']
    
    # 2. Train a simple model
    # A Decision Tree is simple to understand
    model = DecisionTreeClassifier(max_depth=3, random_state=42)
    model.fit(X, y)
    
    # 3. Save the model to a file
    model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
        
    print(f"Model trained and saved to {model_path}")

if __name__ == "__main__":
    train_and_save_model()