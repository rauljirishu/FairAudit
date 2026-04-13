import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

def train_and_evaluate(df, outcome_column, protected_column, metrics_func):
    """
    Cleans dataset, trains baseline models, and evaluates them for accuracy and fairness.
    """
    # Auto-preprocessing
    df = df.dropna(subset=[outcome_column, protected_column])
    y = df[outcome_column]
    X = df.drop(columns=[outcome_column])
    
    # Identify sensitive attributes
    sensitive_features = X[protected_column].copy()
    
    # Feature Encoding (handling categorical variables)
    X_encoded = pd.get_dummies(X, drop_first=True)
    
    # Impute missing values with mode/median basic mapping
    X_encoded = X_encoded.fillna(X_encoded.median(numeric_only=True))
    
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
        fairness = metrics_func(y_test, y_pred, sens_test)
        
        # Feature Importance for Random Forest Explainability
        top_feature = "Unknown"
        if name == "Random Forest":
            importances = model.feature_importances_
            feature_names = X_encoded.columns
            if len(importances) > 0:
                top_idx = importances.argmax()
                top_feature = feature_names[top_idx]
                
        results.append({
            "model": name,
            "accuracy": float(accuracy),
            "fairness": fairness,
            "most_important_feature": top_feature
        })
        
    return results
