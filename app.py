import os
from flask import Flask, request, jsonify, render_template
import pickle
from dotenv import load_dotenv
import pandas as pd  # Add this import at the top of the file

# Load environment variables (if any)
load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')

# Load all three models at startup
models = {}
for key, name in zip(['A', 'B', 'C'], ['Hill48', 'Barlat1989', 'Hill48']):
    path = os.path.join('models', f'model_{name}.pkl')
    with open(path, 'rb') as f:
        models[key] = pickle.load(f)

# Define the expected input order for each model
feature_order = {
    'A': ['r_0', 'r_45' , 'r_90'],
    'B': ['r_0', 'r_45' , 'r_90' , 'm'],
    'C': ['r0', 'r45' , 'r90'],
}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json

    # Validate input JSON structure
    if not data or 'model' not in data or 'features' not in data:
        return jsonify({'error': 'Invalid input format. Expected "model" and "features".'}), 400

    model_key = data['model']
    features = data['features']

    if model_key not in models:
        return jsonify({'error': 'Model not found'}), 400

    # Validate that all required features are present
    order = feature_order[model_key]
    missing_features = [k for k in order if k not in features]
    if missing_features:
        return jsonify({'error': f'Missing features: {", ".join(missing_features)}'}), 400

    # Build feature vector in the correct order
    try:
        feature_values = [float(features.get(k, 1)) for k in order]  # Replace None with 0
        X = pd.DataFrame([feature_values], columns=order)  # Convert to DataFrame
    except ValueError:
        return jsonify({'error': 'Invalid input values. Features must be numeric.'}), 400

    prediction = models[model_key].predict(X)[0]  # Get the first prediction
    prediction = prediction.tolist() if hasattr(prediction, 'tolist') else prediction  # Convert ndarray to list if needed

    return jsonify({'prediction': prediction})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')