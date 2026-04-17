import io
import sys
import os
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Add the parent directory to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.metrics import compute_fairness_metrics
from models.predictor import train_and_evaluate

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "https://fairaudit-75uiqte2p-rishita-rauljis-projects.vercel.app",
    "https://fairaudit.vercel.app",  # keep this for future redeployments
    "http://localhost:5173",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/audit-models")
async def audit_models(
    file: UploadFile = File(...),
    outcome_column: str = Form(...),
    protected_column: str = Form(...)
):
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")

    if outcome_column not in df.columns or protected_column not in df.columns:
        raise HTTPException(status_code=400, detail="Outcome or protected column not found in dataset")

    results = train_and_evaluate(df, outcome_column, protected_column, compute_fairness_metrics)

    recommendations = [
        {"title": "Remove Sensitive Features", "description": "Drop any features serving as proxies for the protected attributes.", "severity": "HIGH", "icon": "warning"},
        {"title": "Apply Re-sampling", "description": "Oversample the minority demographic group or undersample the overrepresented class to balance representation.", "severity": "MEDIUM", "icon": "database"},
        {"title": "Fairness-Aware Algorithms", "description": "Consider adversarial debiasing or re-weighting strategies during model training.", "severity": "MEDIUM", "icon": "sliders"}
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
