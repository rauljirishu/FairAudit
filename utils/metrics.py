import pandas as pd

def compute_fairness_metrics(y_true, y_pred, sensitive_features):
    """
    Computes critical fairness metrics for an AI model.
    """
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
