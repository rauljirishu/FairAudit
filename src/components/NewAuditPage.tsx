import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, Loader2, Brain, 
  BarChart3, Info, Download, ArrowRight, Table as TableIcon,
  Activity, Users, ShieldAlert, BadgeCheck, HelpCircle, ChevronLeft,
  Settings, Zap, Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserProfile, AuditResult, BiasMetrics, Severity } from '../types';
import { calculateBiasMetrics, getSeverity, calculatePearsonCorrelation, getSmartRecommendations, getTopCorrelation } from '../lib/metrics';
import { explainFairnessMetrics } from '../services/geminiService';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NewAuditPageProps {
  user: UserProfile;
  onComplete: (result: AuditResult) => void;
  onCancel: () => void;
}

type Step = 'upload' | 'configure' | 'analyze';

export function NewAuditPage({ user, onComplete, onCancel }: NewAuditPageProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [outcomeCol, setOutcomeCol] = useState<string>('');
  const [protectedCol, setProtectedCol] = useState<string>('');
  const [predictionCol, setPredictionCol] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowLimitNotice, setRowLimitNotice] = useState(false);
  
  // Analysis state
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      parseCSV(selectedFile);
    } else {
      setError('Please upload a valid CSV file.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'text/csv': ['.csv'] },
    multiple: false 
  });

  const parseCSV = (file: File) => {
    setIsParsing(true);
    setError(null);
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          let parsedData = results.data;
          if (parsedData.length > 2000) {
            parsedData = parsedData.slice(0, 2000);
            setRowLimitNotice(true);
          } else {
            setRowLimitNotice(false);
          }
          setData(parsedData);
          setColumns(Object.keys(parsedData[0]));
          setStep('configure');
        } else {
          setError('The CSV file is empty or invalid.');
        }
        setIsParsing(false);
      },
      error: (err) => {
        setError(`Error parsing CSV: ${err.message}`);
        setIsParsing(false);
      }
    });
  };

  const runAudit = async () => {
    if (!outcomeCol || !protectedCol) {
      setError('Please select both an outcome and a protected attribute column.');
      return;
    }

    setStep('analyze');
    setError(null);
    
    const statuses = [
      "Parsing CSV structure...",
      "Computing fairness metrics...",
      "Running AI neural analysis...",
      "Generating comprehensive report..."
    ];

    try {
      // Simulate progress for UI
      for (let i = 0; i < statuses.length; i++) {
        setAnalysisStatus(prev => [...prev, statuses[i]]);
        for (let j = 0; j < 25; j++) {
          setAnalysisProgress(prev => prev + 1);
          await new Promise(r => setTimeout(r, 30));
        }
      }

      // 1. Calculate Metrics
      const metrics = calculateBiasMetrics(data, outcomeCol, protectedCol, predictionCol);
      const severity = getSeverity(metrics.demographicParityDiff);
      const fairnessScore = Math.round(metrics.individualFairness * 100);
      
      // Calculate correlations to find proxy features
      const topCorrelation = getTopCorrelation(data, protectedCol, columns);

      // 2. Get AI Insights
      const aiResponse = await explainFairnessMetrics(metrics, protectedCol, data.length);
      
      // 3. Get Smart Recommendations
      const recommendations = getSmartRecommendations(metrics, protectedCol, topCorrelation);

      const auditData: AuditResult = {
        userId: user.uid,
        datasetName: file!.name,
        timestamp: new Date().toISOString(),
        severity,
        fairnessScore,
        metrics,
        aiInsights: aiResponse.summary,
        grade: aiResponse.grade,
        recommendations,
        outcomeColumn: outcomeCol,
        protectedColumn: protectedCol,
        topCorrelation
      };

      // 3. Save to Firestore or LocalStorage
      let finalAudit = { ...auditData };
      if (user.uid === 'guest-user') {
        const localAudits = JSON.parse(localStorage.getItem('guest_audits') || '[]');
        finalAudit.id = `guest_${Date.now()}`;
        localAudits.push(finalAudit);
        localStorage.setItem('guest_audits', JSON.stringify(localAudits));
      } else {
        const path = 'audits';
        try {
          const docRef = await addDoc(collection(db, 'audits'), auditData);
          finalAudit.id = docRef.id;
          
          // 4. Upload to Storage
          try {
            const storageRef = ref(storage, `datasets/${user.uid}/${docRef.id}_${file!.name}`);
            await uploadBytes(storageRef, file!);
          } catch (storageErr) {
            console.warn("Storage upload failed, but audit was saved:", storageErr);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, path);
        }
      }

      onComplete(finalAudit);
    } catch (err: any) {
      setError(`Audit failed: ${err.message}`);
      setStep('configure');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 max-w-6xl mx-auto space-y-8"
    >
      {/* Wizard Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onCancel} className="text-text-secondary hover:text-white">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-display font-semibold text-white tracking-wide">NEW AUDIT</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <StepIndicator active={step === 'upload'} completed={step !== 'upload'} label="Upload" num={1} />
          <div className="w-12 h-[2px] bg-white/10" />
          <StepIndicator active={step === 'configure'} completed={step === 'analyze'} label="Configure" num={2} />
          <div className="w-12 h-[2px] bg-white/10" />
          <StepIndicator active={step === 'analyze'} completed={false} label="Analyze" num={3} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card 
              {...getRootProps()} 
              className={cn(
                "relative border-2 border-dashed transition-all cursor-pointer h-[500px] flex flex-col items-center justify-center p-12 text-center overflow-hidden rounded-3xl",
                isDragActive ? "border-accent-cyan bg-accent-cyan/5" : "border-white/10 hover:border-accent-cyan/50 hover:bg-white/5"
              )}
            >
              <input {...getInputProps()} />
              
              {/* Animated Border Effect */}
              {isDragActive && (
                <motion.div 
                  className="absolute inset-0 border-4 border-accent-cyan rounded-3xl"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}

              <div className="w-24 h-24 bg-accent-cyan/10 rounded-3xl flex items-center justify-center mb-8 glow-cyan">
                {isParsing ? (
                  <Loader2 className="w-12 h-12 text-accent-cyan animate-spin" />
                ) : (
                  <Upload className="w-12 h-12 text-accent-cyan" />
                )}
              </div>
              
              <h3 className="text-3xl font-display font-semibold text-white mb-4">
                {isParsing ? "PARSING DATA..." : "DROP DATASET HERE"}
              </h3>
              <p className="text-text-secondary max-w-md text-lg">
                Drag and drop your hiring, credit, or demographic CSV here, or click to browse your neural data.
              </p>
              
              <div className="mt-12 flex gap-6">
                <Badge className="bg-white/5 text-text-secondary border-white/10 px-4 py-2 text-sm">CSV ONLY</Badge>
                <Badge className="bg-white/5 text-text-secondary border-white/10 px-4 py-2 text-sm">MAX 2000 ROWS</Badge>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 p-4 bg-danger-red/10 border border-danger-red/20 text-danger-red rounded-2xl flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}

        {step === 'configure' && (
          <motion.div
            key="configure"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-8">
              {/* Preview Table */}
              <Card className="glass border-white/5 rounded-3xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
                  <div>
                    <CardTitle className="text-xl font-display text-white flex items-center gap-2">
                      <TableIcon className="w-5 h-5 text-accent-cyan" />
                      DATASET PREVIEW
                    </CardTitle>
                    <CardDescription className="text-text-secondary">First 5 rows of {file?.name}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep('upload')} className="text-accent-cyan hover:bg-accent-cyan/10">
                    Change File
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {rowLimitNotice && (
                    <div className="p-3 bg-warning-orange/10 border-b border-warning-orange/20 flex items-center gap-2 text-xs text-warning-orange">
                      <Info className="w-4 h-4" />
                      Large dataset detected. Analyzing first 2000 rows for speed.
                    </div>
                  )}
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          {columns.map(col => (
                            <TableHead key={col} className="text-accent-cyan font-display text-[10px] uppercase tracking-wide">{col}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.slice(0, 5).map((row, i) => (
                          <TableRow key={i} className={cn("border-white/5", i % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent")}>
                            {columns.map(col => (
                              <TableCell key={col} className="text-xs text-text-secondary">{String(row[col])}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <ConfigStat label="Rows" value={data.length} icon={Database} />
                <ConfigStat label="Features" value={columns.length} icon={Zap} />
                <ConfigStat label="File Size" value={`${(file!.size / 1024).toFixed(1)} KB`} icon={FileText} />
              </div>
            </div>

            {/* Configuration Panel */}
            <Card className="glass border-white/5 rounded-3xl h-fit sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl font-display text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-accent-purple" />
                  PARAMETERS
                </CardTitle>
                <CardDescription className="text-text-secondary">Map your dataset columns.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ConfigSelect 
                  label="Outcome Column" 
                  description="The target variable (e.g., hired, approved)."
                  value={outcomeCol}
                  onChange={setOutcomeCol}
                  options={columns}
                />
                
                <ConfigSelect 
                  label="Protected Attribute" 
                  description="The sensitive feature to audit (e.g., gender, race)."
                  value={protectedCol}
                  onChange={setProtectedCol}
                  options={columns}
                />

                <ConfigSelect 
                  label="Prediction (Optional)" 
                  description="Model predictions for advanced metrics."
                  value={predictionCol}
                  onChange={setPredictionCol}
                  options={["", ...columns]}
                />

                {error && (
                  <div className="p-3 bg-danger-red/10 border border-danger-red/20 rounded-xl flex items-start gap-2 text-xs text-danger-red">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button 
                  className="w-full bg-accent-cyan hover:bg-accent-cyan/80 text-primary-bg font-display font-bold h-14 rounded-2xl glow-cyan" 
                  onClick={runAudit}
                >
                  START ANALYSIS
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'analyze' && (
          <motion.div
            key="analyze"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-12"
          >
            <div className="relative w-64 h-64">
              {/* Progress Ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.05)" 
                  strokeWidth="8" 
                />
                <motion.circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="#00d4ff" 
                  strokeWidth="8" 
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * analysisProgress) / 100}
                  strokeLinecap="round"
                  className="glow-cyan"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-display font-semibold text-white">{analysisProgress}%</span>
                <span className="text-xs font-display text-accent-cyan tracking-wide mt-2">ANALYZING</span>
              </div>
            </div>

            <div className="space-y-4 max-w-md w-full">
              {analysisStatus.map((status, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 glass rounded-2xl border-white/5"
                >
                  <span className="text-sm font-medium text-white/80">{status}</span>
                  <CheckCircle2 className="w-5 h-5 text-success-neon" />
                </motion.div>
              ))}
              {analysisStatus.length < 4 && (
                <div className="flex items-center justify-center gap-3 p-4">
                  <Loader2 className="w-5 h-5 text-accent-cyan animate-spin" />
                  <span className="text-sm text-text-secondary animate-pulse">Processing neural weights...</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StepIndicator({ active, completed, label, num }: { active: boolean; completed: boolean; label: string; num: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center font-display text-xs transition-all duration-500",
        active ? "bg-accent-cyan text-primary-bg glow-cyan" : 
        completed ? "bg-success-neon text-primary-bg" : "bg-white/5 text-text-secondary border border-white/10"
      )}>
        {completed ? <CheckCircle2 className="w-5 h-5" /> : num}
      </div>
      <span className={cn(
        "text-xs font-display uppercase tracking-wide transition-colors duration-500",
        active ? "text-accent-cyan" : completed ? "text-success-neon" : "text-text-secondary"
      )}>
        {label}
      </span>
    </div>
  );
}

function ConfigStat({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <Card className="glass border-white/5 rounded-2xl p-4 flex items-center gap-4">
      <div className="p-2 bg-white/5 rounded-xl">
        <Icon className="w-5 h-5 text-accent-cyan" />
      </div>
      <div>
        <p className="text-[10px] font-display uppercase tracking-wide text-text-secondary">{label}</p>
        <p className="text-lg font-semibold text-white">{value}</p>
      </div>
    </Card>
  );
}

function ConfigSelect({ label, description, value, onChange, options }: { label: string; description: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-white">{label}</label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger><HelpCircle className="w-4 h-4 text-text-secondary" /></TooltipTrigger>
            <TooltipContent className="bg-card-bg border-white/10 text-white">{description}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Select value={value || "none_value"} onValueChange={(v) => onChange(v === 'none_value' ? '' : v)}>
        <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-accent-cyan">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="bg-card-bg border-white/10 text-white">
          {options.map(opt => {
            const val = opt || "none_value";
            return (
              <SelectItem key={val} value={val} className="hover:bg-accent-cyan/10 focus:bg-accent-cyan/10">
                {opt || "None"}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
