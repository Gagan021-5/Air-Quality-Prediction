import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "models", "airquality_model.pkl")
COLUMNS_PATH = os.path.join(BASE_DIR, "models", "model_columns.pkl")
CSV_PATH = os.path.join(BASE_DIR, "airquality.csv")

model = joblib.load(MODEL_PATH)
model_columns = joblib.load(COLUMNS_PATH)

df = pd.read_csv(CSV_PATH)


def get_category(value):
    if value <= 50:
        return "Good"
    elif value <= 100:
        return "Moderate"
    elif value <= 200:
        return "Poor"
    else:
        return "Severe"


@app.route("/")
def hello():
    return jsonify({"Backend": "Running"})


@app.route("/metadata")
def metadata():
    states = sorted(df["state"].dropna().unique().tolist())
    cities = sorted(df["city"].dropna().unique().tolist())
    return jsonify({"states": states, "cities": cities})


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No input data provided"}), 400

        city = data.get("city", "")
        state = data.get("state", "")
        match = df[(df["city"] == city) & (df["state"] == state)]

        if not match.empty:
            lat = match.iloc[0]["latitude"]
            lon = match.iloc[0]["longitude"]
        else:
            lat = 0.0
            lon = 0.0

        input_data = {
            "latitude": lat,
            "longitude": lon,
            "hour": int(data.get("hour", 0)),
            "month": int(data.get("month", 1)),
            "state": state,
            "city": city,
            "pollutant_id": data.get("pollutant_id", ""),
        }

        input_df = pd.DataFrame([input_data])

        input_df = pd.get_dummies(input_df)

        input_df = input_df.reindex(columns=model_columns, fill_value=0)

        prediction = model.predict(input_df)[0]
        category = get_category(prediction)

        return jsonify({
            "predicted_pollution": round(float(prediction), 2),
            "category": category
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
