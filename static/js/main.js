
const featureSets = {
    'A': ['r_0', 'r_45', 'r_90'],
    'B': ['r_0', 'r_45', 'r_90', 'm'],
    'C': ['r0', 'r45', 'r90'],
};

const modelSelect = document.getElementById('model-select');
const container = document.getElementById('inputs-container');
const button = document.getElementById('predict-btn');
const resultDiv = document.getElementById('result');

modelSelect.addEventListener('change', function() {
    container.innerHTML = '';
    const features = featureSets[modelSelect.value] || [];
    features.forEach(feature => {
        const label = document.createElement('label');
        label.htmlFor = feature;
        label.textContent = `Enter ${feature}:`;
        const input = document.createElement('input');
        input.type = 'number';
        input.id = feature;
        input.placeholder = feature;
        input.step = 'any';
        container.appendChild(label);
        container.appendChild(input);
    });
    resultDiv.innerHTML = '';
});

button.addEventListener('click', async () => {
    const model = modelSelect.value;
    if (!model) {
        resultDiv.innerHTML = 'Please select a model.';
        return;
    }

    const inputElements = featureSets[model].reduce((obj, f) => {
        obj[f] = parseFloat(document.getElementById(f).value);
        return obj;
    }, {});

    const res = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, features: inputElements })
    });

    const data = await res.json();
    if (data.error) {
        resultDiv.innerHTML = `Error: ${data.error}`;
    } else {
        resultDiv.innerHTML = `<strong>Predicted Parameters:</strong><br>
            a = ${data.prediction[0].toFixed(4)}<br>
            c = ${data.prediction[1].toFixed(4)}<br>
            h = ${data.prediction[2].toFixed(4)}<br>
            p = ${data.prediction[3].toFixed(4)}`;
    }
});


