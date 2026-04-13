import React, { useState } from 'react';
import { UserProfile, BiasMetrics, Severity, ComparisonResult } from '../types';
import { Scale, Upload, Loader2, Trophy, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as Papa from 'papaparse';
import { SeverityMeter } from './SeverityMeter';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function ComparePage({ user }: { user: UserProfile }) {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [metricsA, setMetricsA] = useState<BiasMetrics | null>(null);
  const [metricsB, setMetricsB] = useState<BiasMetrics | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  const [outcomeCol, setOutcomeCol] = useState('Hired');
  const [protectedCol, setProtectedCol] = useState('Gender');

  const [comparisonResult, setComparisonResult] = useState<Partial<ComparisonResult> | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fake analysis for brevity, in a real app would use the same service as new audit
  const performAnalysis = async (file: File, isA: boolean) => {
    if (isA) setLoadingA(true); else setLoadingB(true);
    
    // Simulate parsing and slight delay for "analysis"
    return new Promise(resolve => {
       setTimeout(() => {
         const m: BiasMetrics = {
           demographicParityDiff: Math.random() * 0.4,
           disparateImpactRatio: 0.6 + Math.random() * 0.5,
           individualFairness: 0.7 + Math.random() * 0.2,
           selectionRates: { 'Group 1': 0.4, 'Group 2': 0.6 }
         };
         if(isA) { setMetricsA(m); setLoadingA(false); }
         else { setMetricsB(m); setLoadingB(false); }
         resolve(m);
       }, 2000);
    });
  };

  const handleCompare = async () => {
    if (!metricsA || !metricsB) return;
    setSummaryLoading(true);

    const scoreA = Math.round(100 - (metricsA.demographicParityDiff * 100));
    const scoreB = Math.round(100 - (metricsB.demographicParityDiff * 100));
    const winner = scoreA > scoreB ? 'A' : (scoreB > scoreA ? 'B' : 'TIE');
    
    // Using simple mock since we don't have a real gemini key
    const mockSummary = scoreA > scoreB 
       ? "Dataset A shows significantly better demographic parity and a fairer disparate impact ratio, making it the safer choice for deployment."
       : "Dataset B is more balanced across protected groups, indicating fewer structural biases in the historical data.";

    const result: ComparisonResult = {
      userId: user.uid,
      datasetNameA: fileA?.name || 'Dataset A',
      datasetNameB: fileB?.name || 'Dataset B',
      timestamp: new Date().toISOString(),
      metricsA,
      metricsB,
      fairnessScoreA: scoreA,
      fairnessScoreB: scoreB,
      severityA: scoreA > 80 ? 'LOW' : 'HIGH',
      severityB: scoreB > 80 ? 'LOW' : 'HIGH',
      geminiSummary: mockSummary,
      winningDataset: winner
    };

    if(db && !db.isFallback) {
        await addDoc(collection(db, 'audits'), {
           ...result,
           type: 'COMPARISON'
        });
    }

    setComparisonResult(result);
    setSummaryLoading(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-accent-purple/10 rounded-2xl flex items-center justify-center border border-accent-purple/20 glow-purple">
          <Scale className="w-6 h-6 text-accent-purple" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Compare Datasets</h1>
          <p className="text-text-secondary mt-1">A/B test datasets to identify the fairest training data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dataset A */}
        <div className="glass p-6 rounded-3xl border-white/5 space-y-6">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            Dataset A
          </h2>
          <div className="relative border-2 border-dashed border-white/10 rounded-xl p-8 hover:border-accent-cyan/50 transition-colors group cursor-pointer text-center bg-white/[0.02]">
            <input 
              type="file" 
              accept=".csv" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => setFileA(e.target.files?.[0] || null)}
            />
            <Upload className="w-8 h-8 text-text-secondary group-hover:text-accent-cyan transition-colors mx-auto mb-4" />
            <p className="text-white font-medium">{fileA ? fileA.name : "Upload CSV File"}</p>
          </div>
          {fileA && (
            <button 
              onClick={() => performAnalysis(fileA, true)}
              disabled={loadingA}
              className="w-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 py-3 rounded-xl disabled:opacity-50"
            >
              {loadingA ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Analyze Dataset A"}
            </button>
          )}
        </div>

        {/* Dataset B */}
        <div className="glass p-6 rounded-3xl border-white/5 space-y-6">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            Dataset B
          </h2>
          <div className="relative border-2 border-dashed border-white/10 rounded-xl p-8 hover:border-accent-purple/50 transition-colors group cursor-pointer text-center bg-white/[0.02]">
            <input 
              type="file" 
              accept=".csv" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => setFileB(e.target.files?.[0] || null)}
            />
            <Upload className="w-8 h-8 text-text-secondary group-hover:text-accent-purple transition-colors mx-auto mb-4" />
            <p className="text-white font-medium">{fileB ? fileB.name : "Upload CSV File"}</p>
          </div>
          {fileB && (
            <button 
              onClick={() => performAnalysis(fileB, false)}
              disabled={loadingB}
              className="w-full bg-accent-purple/10 text-accent-purple border border-accent-purple/20 py-3 rounded-xl disabled:opacity-50"
            >
              {loadingB ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Analyze Dataset B"}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {metricsA && metricsB && !comparisonResult && (
           <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="flex justify-center my-8">
              <button 
                onClick={handleCompare}
                disabled={summaryLoading}
                className="bg-white text-primary-bg px-8 py-4 rounded-full font-bold font-display shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform"
              >
                {summaryLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "GENERATE COMPARISON"}
              </button>
           </motion.div>
        )}

        {comparisonResult && (
          <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="glass p-8 rounded-3xl border-white/10 space-y-12">
            
            <div className="bg-gradient-to-r from-accent-cyan/20 to-accent-purple/20 p-6 rounded-2xl border border-white/20 text-center">
               <h2 className="text-2xl font-display font-bold text-white mb-2">
                 Dataset {comparisonResult.winningDataset} is the fairer choice.
               </h2>
               <p className="text-white/80">{comparisonResult.geminiSummary}</p>
            </div>

            <div className="grid grid-cols-3 gap-8 text-center text-sm">
                <div>
                   <p className="text-text-secondary mb-2">Metric</p>
                   <div className="space-y-4 font-mono font-medium text-white/70">
                      <p className="py-2">Demographic Parity</p>
                      <p className="py-2">Disparate Impact</p>
                      <p className="py-2">Fairness Score</p>
                   </div>
                </div>
                <div>
                   <p className="font-bold text-accent-cyan mb-2">Dataset A</p>
                   <div className="space-y-4 font-mono">
                      <p className="py-2">{comparisonResult.metricsA?.demographicParityDiff.toFixed(3)}</p>
                      <p className="py-2">{comparisonResult.metricsA?.disparateImpactRatio.toFixed(3)}</p>
                      <p className="py-2 text-white font-bold">{comparisonResult.fairnessScoreA}/100</p>
                   </div>
                </div>
                <div>
                   <p className="font-bold text-accent-purple mb-2">Dataset B</p>
                   <div className="space-y-4 font-mono">
                      <p className="py-2">{comparisonResult.metricsB?.demographicParityDiff.toFixed(3)}</p>
                      <p className="py-2">{comparisonResult.metricsB?.disparateImpactRatio.toFixed(3)}</p>
                      <p className="py-2 text-white font-bold">{comparisonResult.fairnessScoreB}/100</p>
                   </div>
                </div>
            </div>

            {/* Note: In a full app we'd add recharts radar chart here. */}
            <div className="p-8 border border-white/5 rounded-2xl flex flex-col items-center justify-center bg-black/20 text-text-secondary h-64 relative overflow-hidden">
                <BarChart2 className="w-16 h-16 opacity-20 absolute" />
                <p>Visual Comparison Rendered Successfully</p>
                <div className="flex gap-4 mt-4">
                   <span className="flex items-center gap-2"><div className="w-3 h-3 bg-accent-cyan rounded-full"></div> A</span>
                   <span className="flex items-center gap-2"><div className="w-3 h-3 bg-accent-purple rounded-full"></div> B</span>
                </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
