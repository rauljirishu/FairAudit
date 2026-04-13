import React from 'react';
import { 
  ChevronLeft, Download, Share2, Brain, 
  Target, AlertTriangle, CheckCircle2, TrendingDown,
  BarChart3, PieChart as PieChartIcon, Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell, Legend, PieChart, Pie, Sector
} from 'recharts';
import { cn } from '@/src/lib/utils';
import jsPDF from 'jspdf';

interface ModelResultsPageProps {
  result: any; // backend response with {results, recommendations, protected_column, outcome_column}
  onBack: () => void;
}

function getFairnessLabel(score: number) {
  if (score >= 80) return { label: 'Fair ✅', color: 'text-success-neon', bg: 'bg-success-neon/10 border-success-neon/20' };
  if (score >= 50) return { label: 'Moderate ⚠️', color: 'text-warning-orange', bg: 'bg-warning-orange/10 border-warning-orange/20' };
  return { label: 'Biased ❌', color: 'text-danger-red', bg: 'bg-danger-red/10 border-danger-red/20' };
}

export function ModelResultsPage({ result, onBack }: ModelResultsPageProps) {
  const backendData = result.backendResults;
  
  if (!backendData || !backendData.results) {
    return (
      <div className="p-8 text-center text-white">
        Invalid data from backend. Please try again.
        <Button onClick={onBack} className="mt-4 bg-accent-cyan text-primary-bg">Go Back</Button>
      </div>
    );
  }

  const modelResults = backendData.results;
  
  // Data for comparison chart
  const comparisonChartData = modelResults.map((r: any) => ({
    name: r.model,
    accuracy: (r.accuracy * 100).toFixed(1),
    fairness: (Math.max(0, 100 - (r.fairness.demographicParityDiff * 100))).toFixed(1),
    parityDiff: r.fairness.demographicParityDiff.toFixed(3)
  }));

  const bestAccuracyModel = modelResults.reduce((prev: any, curr: any) => curr.accuracy > prev.accuracy ? curr : prev);
  const bestFairnessModel = modelResults.reduce((prev: any, curr: any) => curr.fairness.demographicParityDiff < prev.fairness.demographicParityDiff ? curr : prev);

  const generateModelPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFillColor(13, 17, 23);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("MODEL COMPARISON REPORT", 20, 20);
    
    doc.setTextColor(13, 17, 23);
    doc.setFontSize(14);
    doc.text(`Dataset: ${result.datasetName}`, 20, 50);
    doc.text(`Target: ${backendData.outcome_column} | Protected: ${backendData.protected_column}`, 20, 60);
    
    let y = 80;
    modelResults.forEach((r: any) => {
      doc.setFontSize(14);
      doc.text(`Model: ${r.model}`, 20, y);
      doc.setFontSize(12);
      doc.text(`Accuracy: ${(r.accuracy * 100).toFixed(2)}%`, 30, y + 10);
      doc.text(`Demographic Parity Diff: ${r.fairness.demographicParityDiff.toFixed(3)}`, 30, y + 20);
      doc.text(`Disparate Impact: ${r.fairness.disparateImpactRatio.toFixed(3)}`, 30, y + 30);
      y += 50;
    });

    doc.save(`Model_Comparison_${result.datasetName}.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="text-text-secondary hover:text-white">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Button>
          <div className="h-8 w-[1px] bg-white/10" />
          <h1 className="text-3xl font-display font-semibold text-white tracking-wide">MODEL COMPARISON</h1>
        </div>
        
        <div className="flex gap-4">
          <Button onClick={generateModelPDF} className="bg-accent-cyan hover:bg-accent-cyan/80 text-primary-bg font-display font-semibold px-6 rounded-2xl glow-cyan">
            <Download className="w-4 h-4 mr-2" />
            EXPORT PDF
          </Button>
        </div>
      </div>

      {/* Summary Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden glass rounded-[2.5rem] p-12 border bg-gradient-to-r from-accent-cyan/20 to-primary-bg border-accent-cyan/20 flex flex-col md:flex-row items-center justify-between gap-12"
      >
        <div className="space-y-6 text-center md:text-left">
          <Badge className="bg-white/10 text-white border-white/20 px-4 py-1 text-xs font-display tracking-wide">
            AI MODEL COMPARISON
          </Badge>
          <h2 className="text-4xl md:text-5xl font-display font-semibold text-white tracking-tighter">
            {backendData.protected_column} Fairness Analysis
          </h2>
          <p className="text-xl text-white/70 max-w-xl font-medium">
            We trained multiple models. &apos;{bestFairnessModel.model}&apos; is the most fair while &apos;{bestAccuracyModel.model}&apos; has the highest accuracy.
          </p>
          {bestFairnessModel.most_important_feature && (
            <p className="text-sm bg-white/5 p-3 rounded-xl border border-white/10 mt-4 leading-relaxed">
               <strong className="text-accent-cyan">Explainable AI Insight:</strong> The model identified <strong className="text-white">"{bestFairnessModel.most_important_feature}"</strong> as the feature contributing most significantly to its decisions. If this feature correlates with demographics, it may be a proxy for bias.
            </p>
          )}
        </div>
        
        <div className="flex gap-6">
          <div className="text-center bg-white/5 p-6 rounded-3xl border border-white/10">
             <div className="text-3xl font-bold text-success-neon">{(bestAccuracyModel.accuracy*100).toFixed(1)}%</div>
             <div className="text-xs text-text-secondary uppercase mt-2">Max Accuracy</div>
          </div>
          <div className="text-center bg-white/5 p-6 rounded-3xl border border-white/10">
             <div className="text-3xl font-bold text-accent-cyan">{(Math.max(0, 100 - bestFairnessModel.fairness.demographicParityDiff * 100)).toFixed(1)}</div>
             <div className="text-xs text-text-secondary uppercase mt-2">Best Fairness Score</div>
             <div className={cn("text-sm font-bold mt-1", getFairnessLabel((Math.max(0, 100 - bestFairnessModel.fairness.demographicParityDiff * 100))).color)}>
                {getFairnessLabel((Math.max(0, 100 - bestFairnessModel.fairness.demographicParityDiff * 100))).label}
             </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass border-white/5 rounded-3xl overflow-hidden cursor-default">
          <CardHeader>
             <CardTitle className="text-xl font-display text-white flex items-center gap-2">
               <PieChartIcon className="w-5 h-5 text-accent-purple" />
               DEMOGRAPHIC PARITY BREAKDOWN
             </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie 
                    data={comparisonChartData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={100} 
                    paddingAngle={5} 
                    dataKey="parityDiff" 
                    nameKey="name" 
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                     {comparisonChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#7c3aed' : '#ff6b35'} />
                     ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Legend verticalAlign="bottom" height={36} />
               </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Comparison Chart */}
        <Card className="glass border-white/5 rounded-3xl overflow-hidden cursor-default lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-display text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-accent-cyan" />
              ACCURACY VS FAIRNESS
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8892b0', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8892b0', fontSize: 11 }} domain={[0, 100]} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend verticalAlign="top" height={36}/>
                <Bar name="Accuracy (%)" dataKey="accuracy" fill="#00d4ff" radius={[6, 6, 0, 0]} animationDuration={2000} />
                <Bar name="Fairness Score (%)" dataKey="fairness" fill="#7c3aed" radius={[6, 6, 0, 0]} animationDuration={2000} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="glass border-white/5 rounded-3xl overflow-hidden cursor-default">
          <CardHeader>
             <CardTitle className="text-xl font-display text-white flex items-center gap-2">
               <AlertTriangle className="w-5 h-5 text-warning-orange" />
               BIAS MITIGATION SUGGESTIONS
             </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {backendData.recommendations && backendData.recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 flex gap-4">
                   <div className="w-10 h-10 rounded-full bg-warning-orange/10 flex items-center justify-center shrink-0 border border-warning-orange/20 text-warning-orange">
                      <AlertTriangle className="w-5 h-5" />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-white flex flex-row justify-between items-center">{rec.title} <Badge className="text-[10px] ml-2">{rec.severity}</Badge></h4>
                      <p className="text-xs text-text-secondary mt-1">{rec.description}</p>
                   </div>
                </div>
             ))}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Table */}
      <Card className="glass border-white/5 rounded-3xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-display text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent-purple" />
            DETAILED PERFORMANCE METRICS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 text-xs font-display uppercase tracking-wide text-text-secondary">Model</th>
                <th className="px-6 py-4 text-xs font-display uppercase tracking-wide text-text-secondary">Accuracy</th>
                <th className="px-6 py-4 text-xs font-display uppercase tracking-wide text-text-secondary">Demographic Parity Diff</th>
                <th className="px-6 py-4 text-xs font-display uppercase tracking-wide text-text-secondary">Disparate Impact</th>
                <th className="px-6 py-4 text-xs font-display uppercase tracking-wide text-text-secondary">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {modelResults.map((r: any) => {
                const fs = Math.max(0, 100 - r.fairness.demographicParityDiff * 100);
                const tag = getFairnessLabel(fs);
                return (
                  <tr key={r.model} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{r.model}</td>
                    <td className="px-6 py-4 text-sm text-white/70">{(r.accuracy * 100).toFixed(1)}%</td>
                    <td className="px-6 py-4 text-sm text-white/70">{fs.toFixed(1)}</td>
                    <td className="px-6 py-4 text-sm text-white/70">{r.fairness.disparateImpactRatio.toFixed(3)}</td>
                    <td className="px-6 py-4 text-sm font-semibold">
                       <Badge className={tag.bg + " " + tag.color}>{tag.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
