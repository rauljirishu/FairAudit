# FairAudit HR 🚀

FairAudit HR is a full-featured AI fairness auditing system designed to help HR teams and developers automatically detect, explain, and mitigate bias in their hiring datasets and applicant tracking ML models. By aligning with **SDG 10 (Reduced Inequality)**, we ensure a fairer job market.

## Problem Statement
In the age of AI, machine learning models are deployed to make critical hiring decisions. However, if the historic recruitment data is biased, the model will systematically discriminate against protected demographic groups (e.g., by race, gender, age). FairAudit HR provides a unified dashboard to proactively catch algorithmic bias *before* a model is deployed to screen resumes.

## Features ✨
- **Applicant Data Upload:** Effortlessly upload hiring records or resume datasets directly into the system.
- **Fairpools Dashboard:** Clean, interactive UI showing Accuracy, Bias Scores, Demographic Parity Diff, and Equal Opportunity Diff tailored for recruitment.
- **Fairness Score:** A single glance out-of-100 score indicating bias risks.
- **Explainable AI:** Integration with Google Gemini AI to provide a human-readable, empathetic explanation of bias findings ("Candidate X was unfairly rejected...").
- **Bias Mitigation:** Automated suggestions and real-world impact simulations showing "Before vs After" reductions in bias.
- **Export to PDF:** Instantly download a comprehensive, professional HR Audit Report.

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
- Go to **New Audit** from the Dashboard.
- Drag & Drop your hiring dataset (e.g. `sample_hiring.csv`).
- Map your target and protected columns, and hit **Start Analysis**.

---
*Built with ❤️ for a fairer future.*
