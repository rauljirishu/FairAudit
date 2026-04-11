import React, { useState, useCallback } from 'react';
import { 
  Upload, FileText, ChevronRight, ChevronLeft, 
  CheckCircle2, Loader2, AlertCircle, Brain,
  Table as TableIcon, Info, Play
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/src/lib/utils';
import { calculateModelMetrics } from '../lib/metrics';
import { ModelAuditResult, ModelMetrics, UserProfile } from '../types';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface ModelAuditPageProps {
  user: UserProfile;
  onComplete: (result: ModelAuditResult) => void;
}

type Step = 'upload' | 'configure' | 'analyze';

export function ModelAuditPage({ user, onComplete }: ModelAuditPageProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  
  // Configuration state
  const [actualCol, setActualCol] = useState<string>('');
  const [predictedCol, setPredictedCol] = useState<string>('');
  const [protectedCol, setProtectedCol] = useState<string>('');
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsParsing(true);
      
      Papa.parse(selectedFile, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data);
          if (results.meta.fields) {
            setColumns(results.meta.fields);
            // Auto-detect columns if possible
            const cols = results.meta.fields;
            setActualCol(cols.find(c => c.toLowerCase().includes('actual') || c.toLowerCase().includes('real')) || '');
            setPredictedCol(cols.find(c => c.toLowerCase().includes('predict')) || '');
            setProtectedCol(cols.find(c => c.toLowerCase().includes('gender') || c.toLowerCase().includes('race') || c.toLowerCase().includes('protected')) || '');
          }
          setIsParsing(false);
          setStep('configure');
        },
        error: (error) => {
          console.error("CSV Parsing Error:", error);
          setIsParsing(false);
        }
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  });

  const handleStartAnalysis = async () => {
    if (!actualCol || !predictedCol || !protectedCol) return;
    
    setIsAnalyzing(true);
    setStep('analyze');
    setError(null);
    
    // Simulate progress
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const metrics = calculateModelMetrics(data, actualCol, predictedCol, protectedCol);
      
      const result: ModelAuditResult = {
        userId: user.uid,
        datasetName: file?.name || 'Model Audit',
        timestamp: new Date().toISOString(),
        metrics,
        protectedColumn: protectedCol,
        actualColumn: actualCol,
        predictedColumn: predictedCol
      };

      // Save to Firebase or LocalStorage
      if (user.uid === 'guest-user') {
        const localAudits = JSON.parse(localStorage.getItem('guest_model_audits') || '[]');
        result.id = `guest_model_${Date.now()}`;
        localAudits.push(result);
        localStorage.setItem('guest_model_audits', JSON.stringify(localAudits));
      } else {
        const path = 'model_audits';
        try {
          const docRef = await addDoc(collection(db, 'model_audits'), result);
          result.id = docRef.id;
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, path);
        }
      }

      setAnalysisProgress(100);
      setTimeout(() => {
        onComplete(result);
      }, 500);
    } catch (error: any) {
      console.error("Analysis Error:", error);
      setError(error.message || "An unexpected error occurred during neural processing.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-cyan/10 rounded-2xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-accent-cyan" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-semibold text-white tracking-wide">MODEL AUDIT</h1>
            <p className="text-text-secondary">Evaluate model performance across protected groups.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <StepIndicator active={step === 'upload'} completed={step !== 'upload'} label="UPLOAD" num={1} />
          <div className="w-8 h-[1px] bg-white/10" />
          <StepIndicator active={step === 'configure'} completed={step === 'analyze'} label="CONFIGURE" num={2} />
          <div className="w-8 h-[1px] bg-white/10" />
          <StepIndicator active={step === 'analyze'} completed={false} label="ANALYZE" num={3} />
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
                "glass border-dashed border-2 transition-all cursor-pointer h-[400px] flex flex-col items-center justify-center p-12 text-center",
                isDragActive ? "border-accent-cyan bg-accent-cyan/5" : "border-white/10 hover:border-white/20"
              )}
            >
              <input {...getInputProps()} />
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
                Upload a CSV file containing actual outcomes, model predictions, and protected attributes.
              </p>
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
              <Card className="glass border-white/5 rounded-3xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
                  <div>
                    <CardTitle className="text-xl font-display text-white flex items-center gap-2">
                      <TableIcon className="w-5 h-5 text-accent-cyan" />
                      DATASET PREVIEW
                    </CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep('upload')} className="text-text-secondary hover:text-white">
                    Change File
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
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
                          <TableRow key={i} className="border-white/5 hover:bg-white/5">
                            {columns.map(col => (
                              <TableCell key={col} className="text-white/70 text-xs">{row[col]}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="glass border-white/5 rounded-3xl p-6">
                <h3 className="text-lg font-display font-semibold text-white mb-6 flex items-center gap-2">
                  <Play className="w-4 h-4 text-accent-cyan" />
                  MAP COLUMNS
                </h3>
                
                <div className="space-y-6">
                  <ConfigSelect 
                    label="Actual Outcome" 
                    description="The real ground truth (0 or 1)."
                    value={actualCol}
                    onChange={setActualCol}
                    options={columns}
                  />
                  <ConfigSelect 
                    label="Predicted Outcome" 
                    description="The model's prediction (0 or 1)."
                    value={predictedCol}
                    onChange={setPredictedCol}
                    options={columns}
                  />
                  <ConfigSelect 
                    label="Protected Attribute" 
                    description="The group column (e.g., Gender, Race)."
                    value={protectedCol}
                    onChange={setProtectedCol}
                    options={columns}
                  />
                </div>

                <Button 
                  onClick={handleStartAnalysis}
                  disabled={!actualCol || !predictedCol || !protectedCol}
                  className="w-full mt-8 bg-accent-cyan hover:bg-accent-cyan/80 text-primary-bg font-display font-semibold py-6 rounded-2xl glow-cyan"
                >
                  START AUDIT
                </Button>
              </Card>
            </div>
          </motion.div>
        )}

        {step === 'analyze' && (
          <motion.div
            key="analyze"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative w-64 h-64 mb-12">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/5"
                />
                <motion.circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={753.98}
                  initial={{ strokeDashoffset: 753.98 }}
                  animate={{ strokeDashoffset: 753.98 - (753.98 * analysisProgress) / 100 }}
                  className="text-accent-cyan"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-display font-semibold text-white">{analysisProgress}%</span>
                <span className="text-xs font-display text-accent-cyan tracking-wide mt-2">ANALYZING</span>
              </div>
            </div>

            <h2 className="text-3xl font-display font-semibold text-white mb-4">
              {error ? "ANALYSIS FAILED" : "NEURAL PROCESSING..."}
            </h2>
            <p className="text-text-secondary text-center max-w-md mb-8">
              {error ? error : "Our AI is computing performance metrics across all protected groups to identify potential disparities."}
            </p>

            {error && (
              <Button 
                onClick={() => setStep('configure')}
                className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-8"
              >
                Return to Configuration
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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

function ConfigSelect({ label, description, value, onChange, options }: { label: string; description: string; value: string; onChange: (val: string) => void; options: string[] }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white">{label}</label>
      <p className="text-xs text-text-secondary mb-2">{description}</p>
      <Select value={value || "none_value"} onValueChange={(v) => onChange(v === 'none_value' ? '' : v)}>
        <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-12">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="bg-dark-navy border-white/10 text-white">
          {options.map(opt => {
            const val = opt || "none_value";
            return (
              <SelectItem key={val} value={val}>{opt || "None"}</SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
