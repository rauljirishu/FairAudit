export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface BiasMetrics {
  demographicParityDiff: number;
  disparateImpactRatio: number;
  individualFairness: number;
  selectionRates: Record<string, number>;
  tprPerGroup?: Record<string, number>;
}

export interface Recommendation {
  title: string;
  description: string;
  icon: 'database' | 'sliders' | 'warning';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AuditResult {
  id?: string;
  userId: string;
  datasetName: string;
  timestamp: string;
  severity: Severity;
  fairnessScore: number;
  metrics: BiasMetrics;
  aiInsights: string;
  grade: string;
  recommendations: Recommendation[];
  outcomeColumn: string;
  protectedColumn: string;
  topCorrelation?: {
    column: string;
    value: number;
  };
}

export interface ModelMetrics {
  fprPerGroup: Record<string, number>;
  fnrPerGroup: Record<string, number>;
  accuracyPerGroup: Record<string, number>;
  overall: {
    accuracy: number;
    f1: number;
    precision: number;
    recall: number;
  };
}

export interface ModelAuditResult {
  id?: string;
  userId: string;
  datasetName: string;
  timestamp: string;
  metrics: ModelMetrics;
  protectedColumn: string;
  actualColumn: string;
  predictedColumn: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  onboardingCompleted?: boolean;
}

export type Theme = 'dark' | 'light' | 'midnight';
export type FontSize = 'small' | 'medium' | 'large' | 'xl';
export type AccentColor = 'cyan' | 'purple' | 'green' | 'orange' | 'pink' | 'gold';

export interface UserSettings {
  appearance: {
    theme: Theme;
    fontSize: FontSize;
    accentColor: AccentColor;
  };
  notifications: {
    auditComplete: boolean;
    weeklyReport: boolean;
    newFeatures: boolean;
  };
  analysisDefaults: {
    maxRows: number;
    protectedAttributes: string[];
    autoStart: boolean;
  };
}
