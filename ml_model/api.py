import os
import numpy as np
import pandas as pd
import joblib
import shap
import torch
from fastapi import FastAPI, BackgroundTasks, HTTPException, Request
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from sklearn.ensemble import IsolationForest

# Suppress TensorFlow logs
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

app = FastAPI()

# Paths
MODEL_PATH = "isolation_forest_model.pkl"
DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)

# ✅ Load Hugging Face Model (Efficient)
MODEL_NAME = "google/flan-t5-base"
device = "cuda" if torch.cuda.is_available() else "cpu"

model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME, torch_dtype=torch.float16).to(device)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

def get_llm():
    return model, tokenizer

def generate_llm_explanation(prompts):
    """Generate LLM explanations in batch asynchronously."""
    model, tokenizer = get_llm()
    inputs = tokenizer(prompts, return_tensors="pt", padding=True, truncation=True, max_length=50).to(device)
    outputs = model.generate(**inputs, max_length=30)  # 🔥 Reduce max_length to 30 for speed
    return tokenizer.batch_decode(outputs, skip_special_tokens=True)

# ✅ Train Model (Background Task)
@app.post("/train_model/")
async def train_model(request: Request, background_tasks: BackgroundTasks):
    data = await request.json()  # Read raw JSON

    # Handle both { "records": [...] } and direct list input [...]
    if isinstance(data, list):
        records = data
    elif isinstance(data, dict) and "records" in data:
        records = data["records"]
    else:
        raise HTTPException(status_code=400, detail="Invalid input format. Expected a list or {'records': [...]}.")

    if not records:
        raise HTTPException(status_code=400, detail="No data provided for training.")
    
    background_tasks.add_task(train_model_async, records)
    return {"message": "Training started in the background. ✅ You will see 'Model training completed successfully!' when done."}

def train_model_async(records):
    df = pd.DataFrame(records)
    df.to_csv(os.path.join(DATA_DIR, "train_data.csv"), index=False)

    # ✅ Convert all numeric-like columns to proper numeric format
    df = df.apply(pd.to_numeric, errors="coerce").fillna(0)

    numerical_columns = df.select_dtypes(include=['number']).columns
    if numerical_columns.empty:
        print("No numerical data found. Skipping training.")
        return

    X_train = df[numerical_columns]  

    # ✅ Optimized Isolation Forest
    iso_forest = IsolationForest(n_estimators=100, contamination=0.1, random_state=42, max_samples=256, n_jobs=-1)
    iso_forest.fit(X_train)

    joblib.dump(iso_forest, MODEL_PATH)
    print("\n✅ Model training completed successfully!\n")
    print(f"\n✅ Model trained with these features: {list(X_train.columns)}\n")

# ✅ Predict Anomalies (Optimized)
@app.post("/predict/")
async def predict_anomalies(request: Request):
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(status_code=400, detail="Model not found. Train the model first.")

    iso_forest = joblib.load(MODEL_PATH)
    print("log---1")
    try:
        data = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid JSON data")
    print("log---1.1")
    # Handle both { "records": [...] } and direct list input [...]
    if isinstance(data, list):
        records = data
    elif isinstance(data, dict) and "records" in data:
        records = data["records"]
    else:
        raise HTTPException(status_code=400, detail="Invalid input format. Expected a list or {'records': [...]}.")
    print("log---1.2")
    df = pd.DataFrame(records)
    print("log---1.3")
    if df.empty:
        return {"message": "No data provided for prediction.", "results": []}

    # ✅ Convert all numeric-like columns to proper numeric format
    df = df.apply(pd.to_numeric, errors="coerce").fillna(0)
    print("log---2")
    numerical_columns = df.select_dtypes(include=['number']).columns
    if numerical_columns.empty:
        raise HTTPException(status_code=400, detail="No numerical columns found in dataset. Ensure the input contains numerical features.")

    X_test = df[numerical_columns]

    # ✅ Predict anomalies
    anomaly_predictions = iso_forest.predict(X_test)
    decision_scores = iso_forest.decision_function(X_test)
    print("log---3")
    # ✅ Confidence Calculation (Min-Max Scaling)
    min_score, max_score = decision_scores.min(), decision_scores.max()
    confidence_scores = (decision_scores - min_score) / (max_score - min_score + 1e-6) * 100
    print("log---4")
    anomalies = anomaly_predictions == -1
    confidence_scores = np.round(np.where(anomalies, 100 - confidence_scores, confidence_scores), 2)
    print("log---5")
    df["Anomaly"] = anomalies.astype(int)
    df["Confidence (%)"] = confidence_scores

    # ✅ SHAP Explanation
    try:
        explainer = shap.Explainer(iso_forest, X_test)
        shap_values = explainer(X_test).values
    except Exception:
        shap_values = np.zeros_like(X_test)

    feature_names = numerical_columns

    def identify_anomaly_reason(index):
        feature_importance = np.nan_to_num(np.array(shap_values)[index])
        if len(feature_importance) == 0:
            return "No explanation available"
        most_impactful_index = np.abs(feature_importance).argmax()
        return f"{feature_names[most_impactful_index]} anomaly detected (SHAP: {abs(feature_importance[most_impactful_index]):.3f})"

    df["AnomalyReason"] = df.apply(lambda row: identify_anomaly_reason(row.name) if row["Anomaly"] == 1 else "Normal", axis=1)

    # ✅ Run LLM on Limited Data (Optimized)
    top_anomalies = df[df["Anomaly"] == 1].head(3)  # 🔥 Reduce LLM calls from 5 → 3
    if not top_anomalies.empty:
        prompts = [f"Explain why transaction {index} is flagged: {row['AnomalyReason']}" for index, row in top_anomalies.iterrows()]
        llm_outputs = generate_llm_explanation(prompts)

        for index, explanation in zip(top_anomalies.index, llm_outputs):
            df.loc[index, "LLM_Insight"] = explanation

    # ✅ Ensure JSON-safe output
    df = df.replace([np.inf, -np.inf], np.nan).fillna(0)

    df.to_csv(os.path.join(DATA_DIR, "anomaly_results.csv"), index=False)

    return {
        "message": "Anomaly detection completed!",
        "num_anomalies": int(df["Anomaly"].sum()),
        "results": df.to_dict(orient="records")
    }

@app.post("/")
def root():
    return {"message": "🚀 Optimized Anomaly Detection API is running!"}
