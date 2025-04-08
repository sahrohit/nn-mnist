from neural_net import neuralNetwork  # noqa: F401

from firebase_admin import credentials, firestore

from os import environ
from flask import Flask
from flask_cors import CORS
from flask import request, jsonify
import pickle
import numpy
from flask import abort
import firebase_admin
from dotenv import load_dotenv

load_dotenv()


app = Flask("nn-minst")
CORS(app)

# Load the trained model
with open("model.pkl", "rb") as f:
    loaded_model = pickle.load(f)

my_credentials = {
    "type": "service_account",
    "project_id": "nn-minst",
    "private_key_id": environ.get("PRIVATE_KEY_ID"),
    "private_key": environ.get("PRIVATE_KEY").replace(r"\n", "\n")
    if environ.get("PRIVATE_KEY") is not None
    else "",  # CHANGE HERE
    "client_email": environ.get("CLIENT_EMAIL"),
    "client_id": environ.get("CLIENT_ID"),
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": environ.get("AUTH_PROVIDER_X509_CERT_URL"),
    "client_x509_cert_url": environ.get("CLIENT_X509_CERT_URL"),
}

# Initialize Firebase app
cred = credentials.Certificate(my_credentials)

firebase_admin.initialize_app(cred)
db = firestore.client()


@app.route("/", methods=["GET"])
def ping():
    return f"Pinging Model Application {environ.get('FLASK_ENV')}"


@app.route("/api/predict", methods=["POST"])
def predict():
    input_json = request.json

    # Validate input
    if "data" not in input_json or not isinstance(input_json["data"], list):
        abort(
            400, description="Invalid input. 'data' must be a list of numeric values."
        )

    try:
        # Scale and shift the inputs
        inputs = (numpy.asarray(input_json["data"], dtype=float) / 255.0 * 0.99) + 0.01
        # Query the network
        outputs = loaded_model.query(inputs)
        # The index of the highest value corresponds to the label

        # print("outputs", outputs)

        label = int(numpy.argmax(outputs))

        # Store data and prediction in Firestore
        doc_ref = db.collection("predictions").document()
        doc_ref.set(
            {
                "id": doc_ref.id,
                "input_data": input_json["data"],
                "predicted_label": label,
                "timestamp": firestore.SERVER_TIMESTAMP,
            }
        )

    except Exception as e:
        abort(500, description=f"Error processing input: {str(e)}")

    return jsonify(
        {
            "message": "Prediction successful.",
            "predicted_label": label,
        }
    )


if __name__ == "__main__":
    app.run(debug=True, port=9696, load_dotenv=True)
