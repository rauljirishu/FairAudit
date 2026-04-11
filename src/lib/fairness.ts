export interface GroupFairnessStats {
  group: string;
  total: number;
  positiveOutcomes: number;
  selectionRate: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  tpr: number; // True Positive Rate
  fpr: number; // False Positive Rate
}

export interface FairnessAuditMetrics {
  groups: GroupFairnessStats[];
  demographicParityDifference: number;
  disparateImpactRatio: number;
  equalizedOddsDifference: number;
}

export function calculateFairnessMetrics(
  data: any[],
  outcomeCol: string,
  protectedCol: string,
  groundTruthCol?: string
): FairnessAuditMetrics {
  const groupsMap = new Map<string, any[]>();

  data.forEach((row) => {
    const groupValue = String(row[protectedCol]);
    if (!groupsMap.has(groupValue)) {
      groupsMap.set(groupValue, []);
    }
    groupsMap.get(groupValue)?.push(row);
  });

  const groupStats: GroupFairnessStats[] = Array.from(groupsMap.entries()).map(([group, rows]) => {
    const total = rows.length;
    const positiveOutcomes = rows.filter((r) => Number(r[outcomeCol]) === 1).length;
    const selectionRate = total > 0 ? positiveOutcomes / total : 0;

    let tp = 0, fp = 0, tn = 0, fn = 0;
    if (groundTruthCol) {
      rows.forEach((r) => {
        const pred = Number(r[outcomeCol]);
        const actual = Number(r[groundTruthCol]);
        if (pred === 1 && actual === 1) tp++;
        else if (pred === 1 && actual === 0) fp++;
        else if (pred === 0 && actual === 0) tn++;
        else if (pred === 0 && actual === 1) fn++;
      });
    }

    const tpr = (tp + fn) > 0 ? tp / (tp + fn) : 0;
    const fpr = (fp + tn) > 0 ? fp / (fp + tn) : 0;

    return {
      group,
      total,
      positiveOutcomes,
      selectionRate,
      truePositives: tp,
      falsePositives: fp,
      trueNegatives: tn,
      falseNegatives: fn,
      tpr,
      fpr
    };
  });

  // Calculate global differences (comparing max and min selection rates)
  const selectionRates = groupStats.map((g) => g.selectionRate);
  const maxSR = Math.max(...selectionRates);
  const minSR = Math.min(...selectionRates);

  const demographicParityDifference = maxSR - minSR;
  const disparateImpactRatio = maxSR > 0 ? minSR / maxSR : 1;

  // Equalized Odds Difference (max diff in TPR + max diff in FPR)
  const tprs = groupStats.map(g => g.tpr);
  const fprs = groupStats.map(g => g.fpr);
  const equalizedOddsDifference = (Math.max(...tprs) - Math.min(...tprs)) + (Math.max(...fprs) - Math.min(...fprs));

  return {
    groups: groupStats,
    demographicParityDifference,
    disparateImpactRatio,
    equalizedOddsDifference
  };
}
