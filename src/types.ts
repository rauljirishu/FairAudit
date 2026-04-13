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
  // Data Retention
  createdAt?: string;
  deleteAfter?: string | null;
  autoDeleteEnabled?: boolean;
  // Team Collaboration
  sharedWith?: { email: string; permission: 'view' | 'comment' }[];
  isPublicLink?: boolean;
  viewCount?: number;
  // Leaderboard
  isPublicLeaderboard?: boolean;
  industryTag?: string;
}

export interface ComparisonResult {
  id?: string;
  userId: string;
  datasetNameA: string;
  datasetNameB: string;
  timestamp: string;
  metricsA: BiasMetrics;
  metricsB: BiasMetrics;
  fairnessScoreA: number;
  fairnessScoreB: number;
  severityA: Severity;
  severityB: Severity;
  geminiSummary: string;
  winningDataset: 'A' | 'B' | 'TIE';
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

export type UserRole = 'admin' | 'analyst' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  onboardingCompleted?: boolean;
  role?: UserRole;
  lastLogin?: string;
}

export type Theme = 'dark' | 'light' | 'midnight';
export type FontSize = 'small' | 'medium' | 'large' | 'xl';
export type AccentColor = 'cyan' | 'purple' | 'green' | 'orange' | 'pink' | 'gold';

export type AutoDeleteOption = 'forever' | '7days' | '30days' | '90days' | 'immediate';

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
  dataProtection: {
    autoDelete: AutoDeleteOption;
  };
}

export interface AuditLogEntry {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  details: any;
}

export interface MonitorConfig {
  id?: string;
  userId: string;
  name: string;
  baselineCsvPath: string; // Firebase storage path
  outcomeColumn: string;
  protectedColumn: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  alertThreshold: number; // 5 to 50
  alertMethod: 'in_app';
  lastCheckedDate?: string;
  status: 'OK' | 'ALERT';
  baselineMetrics?: BiasMetrics;
  enabled: boolean;
}

export interface Comment {
  id?: string;
  auditId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
}

export interface LeaderboardEntry {
  id?: string;
  auditId: string;
  domain: string;
  fairnessScore: number;
  severity: Severity;
  date: string;
}
