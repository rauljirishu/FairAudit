import { BiasMetrics, Severity, ModelMetrics, Recommendation } from "../types";

export function calculateBiasMetrics(
  data: any[],
  outcomeCol: string,
  protectedCol: string,
  predictionCol?: string
): BiasMetrics {
  const groups = Array.from(new Set(data.map(row => String(row[protectedCol]))));
  const selectionRates: Record<string, number> = {};
  const tprPerGroup: Record<string, number> = {};

  groups.forEach(group => {
    const groupData = data.filter(row => String(row[protectedCol]) === group);
    const positiveOutcomes = groupData.filter(row => Number(row[outcomeCol]) === 1).length;
    selectionRates[group] = positiveOutcomes / groupData.length;

    if (predictionCol) {
      const actualPositives = groupData.filter(row => Number(row[outcomeCol]) === 1);
      const truePositives = actualPositives.filter(row => Number(row[predictionCol]) === 1).length;
      tprPerGroup[group] = actualPositives.length > 0 ? truePositives / actualPositives.length : 0;
    }
  });

  const rates = Object.values(selectionRates);
  const maxRate = Math.max(...rates);
  const minRate = Math.min(...rates);

  // Demographic Parity Difference
  const demographicParityDiff = maxRate - minRate;

  // Disparate Impact Ratio
  const disparateImpactRatio = minRate / (maxRate || 1);

  // Individual Fairness Score (1 - std deviation of rates)
  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  const variance = rates.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rates.length;
  const stdDev = Math.sqrt(variance);
  const individualFairness = Math.max(0, 1 - stdDev);

  return {
    demographicParityDiff,
    disparateImpactRatio,
    individualFairness,
    selectionRates,
    tprPerGroup: predictionCol ? tprPerGroup : undefined
  };
}

export function calculateModelMetrics(
  data: any[],
  actualCol: string,
  predictedCol: string,
  protectedCol: string
): ModelMetrics {
  const groups = Array.from(new Set(data.map(row => String(row[protectedCol]))));
  const fprPerGroup: Record<string, number> = {};
  const fnrPerGroup: Record<string, number> = {};
  const accuracyPerGroup: Record<string, number> = {};

  // Overall metrics
  let tp = 0, fp = 0, tn = 0, fn = 0;

  groups.forEach(group => {
    const groupData = data.filter(row => String(row[protectedCol]) === group);
    
    const actualNegatives = groupData.filter(row => Number(row[actualCol]) === 0);
    const falsePositives = actualNegatives.filter(row => Number(row[predictedCol]) === 1).length;
    fprPerGroup[group] = actualNegatives.length > 0 ? falsePositives / actualNegatives.length : 0;

    const actualPositives = groupData.filter(row => Number(row[actualCol]) === 1);
    const falseNegatives = actualPositives.filter(row => Number(row[predictedCol]) === 0).length;
    fnrPerGroup[group] = actualPositives.length > 0 ? falseNegatives / actualPositives.length : 0;

    const correctPredictions = groupData.filter(row => Number(row[actualCol]) === Number(row[predictedCol])).length;
    accuracyPerGroup[group] = groupData.length > 0 ? correctPredictions / groupData.length : 0;

    // Accumulate for overall
    tp += actualPositives.filter(row => Number(row[predictedCol]) === 1).length;
    fp += falsePositives;
    tn += actualNegatives.filter(row => Number(row[predictedCol]) === 0).length;
    fn += falseNegatives;
  });

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
  const accuracy = (tp + tn) / data.length;

  return { 
    fprPerGroup, 
    fnrPerGroup, 
    accuracyPerGroup,
    overall: { accuracy, f1, precision, recall }
  };
}

export function getSeverity(diff: number): Severity {
  if (diff < 0.1) return 'LOW';
  if (diff < 0.2) return 'MEDIUM';
  if (diff < 0.3) return 'HIGH';
  return 'CRITICAL';
}

export function calculatePearsonCorrelation(data: any[], col1: string, col2: string): number {
  const x = data.map(row => {
    const val = row[col1];
    return typeof val === 'number' ? val : String(val).length;
  });
  const y = data.map(row => {
    const val = row[col2];
    return typeof val === 'number' ? val : String(val).length;
  });

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

export function getSmartRecommendations(
  metrics: BiasMetrics, 
  protectedCol: string,
  topCorrelation?: { column: string; value: number }
): Recommendation[] {
  const recs: Recommendation[] = [];

  // 1. Rebalance Training Data
  const rates = Object.values(metrics.selectionRates);
  const maxRate = Math.max(...rates);
  const minRate = Math.min(...rates);
  const gapPercent = ((maxRate - minRate) * 100).toFixed(1);
  
  recs.push({
    title: "Rebalance Your Training Data",
    description: `Your ${protectedCol} group has a ${gapPercent}% lower selection rate compared to the highest performing group. Collect more representative data from underrepresented groups before retraining your model.`,
    icon: 'database',
    severity: metrics.disparateImpactRatio < 0.8 ? 'HIGH' : 'MEDIUM'
  });

  // 2. Apply Fairness Constraints
  const dpGap = (metrics.demographicParityDiff * 100).toFixed(1);
  recs.push({
    title: "Apply Fairness Constraints",
    description: `A ${dpGap}% gap exists between groups in overall outcomes. Add fairness constraints during model training or adjust decision thresholds per group to equalize opportunity.`,
    icon: 'sliders',
    severity: metrics.demographicParityDiff > 0.2 ? 'MEDIUM' : 'LOW'
  });

  // 3. Remove Proxy Features
  if (topCorrelation && topCorrelation.value > 0.5) {
    recs.push({
      title: "Remove Proxy Features",
      description: `"${topCorrelation.column}" is strongly linked to ${protectedCol} (correlation: ${topCorrelation.value.toFixed(2)}) and may be causing indirect discrimination. Consider removing it.`,
      icon: 'warning',
      severity: 'HIGH'
    });
  } else {
    recs.push({
      title: "Monitor Feature Correlations",
      description: `No strong proxy features were detected (max correlation: ${topCorrelation?.value.toFixed(2) || '0.00'}). Continue auditing new features for indirect links to ${protectedCol}.`,
      icon: 'warning',
      severity: 'LOW'
    });
  }

  return recs;
}

export function getTopCorrelation(data: any[], protectedCol: string, columns: string[]): { column: string; value: number } {
  let maxCorr = 0;
  let maxCol = '';

  columns.forEach(col => {
    if (col === protectedCol) return;
    const corr = Math.abs(calculatePearsonCorrelation(data, protectedCol, col));
    if (corr > maxCorr) {
      maxCorr = corr;
      maxCol = col;
    }
  });

  return { column: maxCol, value: maxCorr };
}
