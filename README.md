# FairAudit 🚀

FairAudit is a full-featured AI fairness auditing system designed to help developers and data scientists automatically detect, explain, and mitigate bias in their datasets and machine learning models. 

## Problem Statement
In the age of AI, machine learning models are being deployed to make critical decisions (e.g., loan approvals, hiring, parole). However, if the training data is historically biased, the model will systematically discriminate against protected demographic groups (e.g., by race, gender, age). FairAudit provides a unified dashboard to proactively catch algorithmic bias *before* a model is deployed.

## Features ✨
- **CSV Data Upload:** Effortlessly upload real datasets (credit approvals, hiring records, etc.) directly into the system.
- **Fairness Metrics Dashboard:** Clean, interactive UI showing Accuracy, Bias Scores, Demographic Parity Diff, and Equal Opportunity Diff.
- **Fairness Score:** A single glance out-of-100 score indicating bias risks.
- **Model Comparison:** Automatically train at least two ML models (Logistic Regression vs. Random Forest) and view comparison charts on accuracy vs. fairness.
- **Explainable AI:** Integration with Gemini AI to provide a human-readable explanation of bias findings.
- **Bias Mitigation:** Automated suggestions for resolving issues (e.g., re-weighting instances, dropping proxies).
- **Export to PDF:** Instantly download a comprehensive, professional PDF Audit Report.

## Tech Stack 🛠
- **Backend:** Python, FastAPI, scikit-learn, pandas
- **Frontend:** React, HTML+Tailwind, Vite, Recharts, jsPDF (for UI and PDF)
- **AI Integration:** Google Gemini AI
- **Authentication/DB:** Firebase

## Setup Instructions 💻

### 1. Backend Setup
1. Open a terminal and navigate to the project directory:
   ```bash
   cd FairAudit
   ```
2. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Run the FastAPI backend:
   ```bash
   python backend/main.py
   ```
   *The API will start on `http://localhost:8000`.*

### 2. Frontend Setup
1. Open a new terminal window at the project root `FairAudit`.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the React development server:
   ```bash
   npm run dev
   ```
   *The UI will start on `http://localhost:3000`.*

### Usage
- Once the app loads, log in or proceed as a Guest.
- Go to **Model Audit** from the Dashboard.
- Drag & Drop your dataset (e.g. `sample_hiring.csv`).
- Map your target and protected columns, and hit **Train & Compare Models**.

## Screenshots 📸
*(Placeholder for UI screenshots. You can take screenshots of the beautiful Neural Dashboard, interactive fairness metrics, and downloadable PDF.)*

---
*Built with ❤️ for a fairer future.*
