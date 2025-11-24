# api_server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import traceback
import numpy as np
import pandas as pd
import os

MODEL_PATH = os.getenv("MODEL_PATH", "rf_disposition_model.joblib")

app = Flask("ml-server")
CORS(app)

# Load model
try:
    pipe = joblib.load(MODEL_PATH)
    # store classes order
    CLASSES = list(pipe.named_steps['clf'].classes_)
    print("Loaded pipeline from", MODEL_PATH)
except Exception as e:
    print("Failed loading model:", e)
    pipe = None
    CLASSES = []

def validate_and_frame(payload):
    """
    Accept either a single dict or a list of dicts.
    Return a DataFrame with the ML-expected columns in the correct order.
    """
    if isinstance(payload, dict):
        rows = [payload]
    elif isinstance(payload, list):
        rows = payload
    else:
        raise ValueError("Payload must be object or list of objects")

    # expected columns (same as training pipeline)
    cols = ['product_category','product_price','weight_kg','return_reason','days_since_purchase',
            'distance_km','customer_return_count_90d','order_value_ratio','fraud_score','inspection_status','previous_refurb_count']
    df = pd.DataFrame(rows)
    # ensure all columns exist, fill sensible defaults if not present
    defaults = {
        'product_category':'accessory','product_price':0.0,'weight_kg':0.2,'return_reason':'not_as_described',
        'days_since_purchase':0,'distance_km':0.0,'customer_return_count_90d':0,'order_value_ratio':1.0,
        'fraud_score':0.0,'inspection_status':'not_inspected','previous_refurb_count':0
    }
    for c in cols:
        if c not in df.columns:
            df[c] = defaults[c]
    # cast numeric columns
    num_cols = ['product_price','weight_kg','days_since_purchase','distance_km','customer_return_count_90d','order_value_ratio','fraud_score','previous_refurb_count']
    for c in num_cols:
        df[c] = pd.to_numeric(df[c], errors='coerce').fillna(0.0)
    # final DF with cols ordered
    return df[cols]

@app.route("/predict", methods=["POST"])
def predict():
    if pipe is None:
        return jsonify({"error":"model not loaded"}), 500
    try:
        payload = request.get_json(force=True)
        df = validate_and_frame(payload)
        # run pipeline
        probs = pipe.predict_proba(df)  # shape (n_samples, n_classes)
        preds = pipe.predict(df)
        results = []
        for i in range(len(df)):
            prob_dist = {cls: float(probs[i, j]) for j, cls in enumerate(CLASSES)}
            res = {
                "recommendedDisposition": str(preds[i]),
                "confidence": float(probs[i].max()),
                "probabilities": prob_dist
            }
            results.append(res)
        # If single input, return single object (but SaaS backend tolerates array)
        if isinstance(payload, dict):
            return jsonify(results[0])
        return jsonify(results)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "model_loaded": pipe is not None, "model_path": MODEL_PATH})

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
