
document.addEventListener('DOMContentLoaded', function() {
    const modelSelect = document.getElementById('model-select');
    const inputsContainer = document.getElementById('inputs-container');
    const predictBtn = document.getElementById('predict-btn');
    const resultDiv = document.getElementById('result');

    // Define the inputs required for each model
    const modelInputs = {
        'B': [
            { id: 'r_0', label: 'Enter r_0:', type: 'text' },
            { id: 'r_45', label: 'Enter r_45:', type: 'text' },
            { id: 'r_90', label: 'Enter r_90:', type: 'text' },
            { id: 'm', label: 'Enter m:', type: 'text' }
        ],
        'C': [
            { id: 'sigma_0', label: 'Yield stress at 0° (σ₀):', type: 'text' },
            { id: 'sigma_45', label: 'Yield stress at 45° (σ₄₅):', type: 'text' },
            { id: 'sigma_90', label: 'Yield stress at 90° (σ₉₀):', type: 'text' },
            { id: 'sigma_b', label: 'Balanced biaxial yield stress (σᵦ):', type: 'text' },
            { id: 'r_0', label: 'r-value at 0° (r₀):', type: 'text' },
            { id: 'r_45', label: 'r-value at 45° (r₄₅):', type: 'text' },
            { id: 'r_90', label: 'r-value at 90° (r₉₀):', type: 'text' },
            { id: 'r_b', label: 'Balanced biaxial r-value (rᵦ):', type: 'text' },
            { id: 'a', label: 'Exponent parameter (a):', type: 'text' }
        ]
    };

    // Generate input fields based on the selected model
    modelSelect.addEventListener('change', function() {
        const selectedModel = this.value;
        inputsContainer.innerHTML = '';

        if (selectedModel && modelInputs[selectedModel]) {
            modelInputs[selectedModel].forEach(input => {
                const formGroup = document.createElement('div');
                formGroup.className = 'form-group';

                const label = document.createElement('label');
                label.setAttribute('for', input.id);
                label.textContent = input.label;

                const inputElement = document.createElement('input');
                inputElement.type = input.type;
                inputElement.id = input.id;
                inputElement.name = input.id;

                formGroup.appendChild(label);
                formGroup.appendChild(inputElement);
                inputsContainer.appendChild(formGroup);
            });
           
            // Set default values for Barlat 2000
            if (selectedModel === 'C') {
                setTimeout(() => {
                    document.getElementById('sigma_0').value = '1.000';
                    document.getElementById('sigma_45').value = '0.984';
                    document.getElementById('sigma_90').value = '0.995';
                    document.getElementById('sigma_b').value = '1.004';
                    document.getElementById('r_0').value = '1.56';
                    document.getElementById('r_45').value = '1.47';
                    document.getElementById('r_90').value = '1.71';
                    document.getElementById('r_b').value = '1.11';
                    document.getElementById('a').value = '6';
                }, 100);
            }
        }
    });

    // Handle predict button click
    predictBtn.addEventListener('click', function() {
        const selectedModel = modelSelect.value;
        if (!selectedModel) {
            resultDiv.innerHTML = '<p>Please select a model first.</p>';
            return;
        }

        // Collect input values
        const features = {};
        let allFeaturesValid = true;
        let invalidFeatures = [];
        
        modelInputs[selectedModel].forEach(input => {
            const inputElement = document.getElementById(input.id);
            if (inputElement && inputElement.value.trim() !== '') {
                features[input.id] = inputElement.value.trim();
            } else {
                allFeaturesValid = false;
                invalidFeatures.push(input.id);
            }
        });

        if (!allFeaturesValid) {
            resultDiv.innerHTML = `<p>Error: Missing or invalid values for: ${invalidFeatures.join(', ')}</p>`;
            return;
        }

        // Show loading state
        resultDiv.innerHTML = '<p>Processing...</p>';

        // Send prediction request
        fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: selectedModel,
                features: features
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    try {
                        const errorData = JSON.parse(text);
                        throw new Error(errorData.error || `Server error (${response.status})`);
                    } catch(e) {
                        throw new Error(`Server error (${response.status}): ${text || 'Unknown error'}`);
                    }
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                resultDiv.innerHTML = `<p>Error: ${data.error}</p>`;
            } else {
                // Format prediction results
                let resultHtml = '<p>Predicted Parameters:</p>';
                if (Array.isArray(data.prediction)) {
                    // Different parameter names based on the model
                    const paramNames = selectedModel === 'C' ? 
                        ['a₁', 'a₂', 'a₃', 'a₄', 'a₅', 'a₆', 'a₇', 'a₈'] : 
                        ['a', 'c', 'h', 'p'];
                    
                    // Create a table for better readability
                    resultHtml += '<div class="results-table">';
                    
                    data.prediction.forEach((val, idx) => {
                        if (idx < paramNames.length) {
                            resultHtml += `<div class="result-row">
                                <span class="param-name">${paramNames[idx]}:</span>
                                <span class="param-value">${parseFloat(val).toFixed(4)}</span>
                            </div>`;
                        }
                    });
                    
                    resultHtml += '</div>';
                } else {
                    // For single value results
                    resultHtml += `<p>Value = ${parseFloat(data.prediction).toFixed(4)}</p>`;
                }
                resultDiv.innerHTML = resultHtml;
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            resultDiv.innerHTML = `<p>Error: ${error.message}</p>`;
        });
    });

    // Initialize with Barlat 1989 selected
    modelSelect.value = 'B';
    modelSelect.dispatchEvent(new Event('change'));
});
