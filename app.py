
import os
from flask import Flask, request, jsonify, render_template
import pickle
import numpy as np
from dotenv import load_dotenv
import pandas as pd

# Load environment variables (if any)
load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')

# Load model data at startup
models = {}
for key, name in zip(['A', 'B', 'C'], ['Hill48', 'Barlat1989', 'Barlat2000']):
    path = os.path.join('models', f'model_{name}.pkl')
    with open(path, 'rb') as f:
        models[key] = pickle.load(f)

# Define the expected input order for each model
feature_order = {
    'A': ['r_0', 'r_45', 'r_90'],
    'B': ['r_0', 'r_45', 'r_90', 'm'],
    'C': ['sigma_0', 'sigma_90', 'sigma_b', 'sigma_45', 'r_0', 'r_90', 'r_b', 'r_45', 'a'],
}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        print(f"Received data: {data}")
        
        # Validate input JSON structure
        if not data or 'model' not in data or 'features' not in data:
            return jsonify({'error': 'Invalid input format. Expected "model" and "features".'}), 400
        
        model_key = data['model']
        features = data['features']
        
        if model_key not in models:
            return jsonify({'error': f'Model {model_key} not found'}), 400
        
        # Validate that all required features are present
        order = feature_order[model_key]
        missing_features = [k for k in order if k not in features]
        
        if missing_features:
            return jsonify({'error': f'Missing features: {", ".join(missing_features)}'}), 400
        
        # Handle prediction based on model type
        try:
            if model_key == 'C':  # Special handling for Barlat 2000
                # Get values in the correct order and convert to float
                feature_values = [float(features.get(k, 0)) for k in order]
                print(f"Barlat 2000 input: {feature_values}")
                
                # Convert to numpy array and reshape for Barlat 2000
                X = np.array(feature_values).reshape(1, -1)
                print(X)
                # Get model and make prediction
                prediction = models[model_key].predict(X)[0]            
                    
            else:  # Original flow for other models
                # Build feature DataFrame in the original way
                feature_values = [float(features.get(k, 0)) for k in order]
                X = pd.DataFrame([feature_values], columns=order)
              
                # Make prediction using the original flow
                prediction = models[model_key].predict(X)[0]
            
            # Ensure prediction is in the right format for JSON
            if hasattr(prediction, 'tolist'):
                prediction = prediction.tolist()
                
            return jsonify({'prediction': prediction})
            
        except ValueError as e:
            return jsonify({'error': f'Invalid numeric value: {str(e)}'}), 400
        except AttributeError as e:
            return jsonify({'error': f'Model prediction error: {str(e)}'}), 500
            
    except Exception as e:
        import traceback
        print(f"Exception: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')





