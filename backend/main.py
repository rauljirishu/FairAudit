import io
import json
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def compute_fairness_metrics(y_true, y_pred, sensitive_features):
    df = pd.DataFrame({
        'y_true': y_true,
        'y_pred': y_pred,
        'sensitive': sensitive_features
    })
    
    unique_groups = df['sensitive'].unique()
    selection_rates = {}
    for group in unique_groups:
        group_df = df[df['sensitive'] == group]
        sr = group_df['y_pred'].mean()
        selection_rates[str(group)] = sr
        
    rates = list(selection_rates.values())
    if len(rates) >= 2:
        max_rate = max(rates)
        min_rate = min(rates)
        demographic_parity_diff = max_rate - min_rate
        disparate_impact_ratio = min_rate / max_rate if max_rate > 0 else 0
    else:
        demographic_parity_diff = 0
        disparate_impact_ratio = 1
        
    # Equal opportunity difference (TPR diff)
    tpr = {}
    for group in unique_groups:
        group_df = df[(df['sensitive'] == group) & (df['y_true'] == 1)]
        if len(group_df) > 0:
            tpr[str(group)] = group_df['y_pred'].mean()
        else:
            tpr[str(group)] = 0
            
    tprs = list(tpr.values())
    equal_opportunity_diff = max(tprs) - min(tprs) if len(tprs) >= 2 else 0
        
    return {
        "demographicParityDiff": demographic_parity_diff,
        "disparateImpactRatio": disparate_impact_ratio,
        "equalOpportunityDiff": equal_opportunity_diff,
        "selectionRates": selection_rates
    }

@app.post("/api/audit-models")
async def audit_models(file: UploadFile = File(...), outcome_column: str = Form(...), protected_column: str = Form(...)):
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")

    if outcome_column not in df.columns or protected_column not in df.columns:
        raise HTTPException(status_code=400, detail="Outcome or protected column not found in dataset")
        
    # Preprocess
    df = df.dropna(subset=[outcome_column, protected_column])
    y = df[outcome_column]
    X = df.drop(columns=[outcome_column])
    
    # Sensitive attributes
    sensitive_features = X[protected_column].copy()
    
    # Simple encoding for categorical features
    X_encoded = pd.get_dummies(X, drop_first=True)
    
    X_train, X_test, y_train, y_test, sens_train, sens_test = train_test_split(
        X_encoded, y, sensitive_features, test_size=0.3, random_state=42
    )
    
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Random Forest": RandomForestClassifier(random_state=42)
    }
    
    results = []
    
    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        fairness = compute_fairness_metrics(y_test, y_pred, sens_test)
        
        results.append({
            "model": name,
            "accuracy": float(accuracy),
            "fairness": fairness
        })
        
    # Identify bias mitigation recommendations
    recommendations = [
        {"title": "Re-weighting", "description": "Assign different weights to instances based on their protected attribute class to reduce bias.", "severity": "MEDIUM", "icon": "sliders"},
        {"title": "Remove Proxy Variables", "description": "Ensure no other variables strongly correlate with the protected attribute.", "severity": "HIGH", "icon": "warning"}
    ]
    
    return {
        "results": results,
        "recommendations": recommendations,
        "protected_column": protected_column,
        "outcome_column": outcome_column
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
