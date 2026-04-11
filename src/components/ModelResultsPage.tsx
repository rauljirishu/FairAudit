import React from 'react';
import { 
  ChevronLeft, Download, Share2, Brain, 
  Target, AlertTriangle, CheckCircle2, TrendingDown,
  BarChart3, PieChart, Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell, Legend
} from 'recharts';
import { cn } from '@/src/lib/utils';
import { ModelAuditResult } from '../types';

interface ModelResultsPageProps {
  result: ModelAuditResult;
  onBack: () => void;
}

export function ModelResultsPage({ result, onBack }: ModelResultsPageProps) {
  const groups = Object.keys(result.metrics.accuracyPerGroup);
  
  const chartData = groups.map(group => ({
    name: group,
    accuracy: (result.metrics.accuracyPerGroup[group] * 100).toFixed(1),
    fpr: (result.metrics.fprPerGroup[group] * 100).toFixed(1),
    fnr: (result.metrics.fnrPerGroup[group] * 100).toFixed(1),
  }));

  // Find worst performing group
  const worstAccuracy = Math.min(...Object.values(result.metrics.accuracyPerGroup));
  const worstGroup = groups.find(g => result.metrics.accuracyPerGroup[g] === worstAccuracy);
  const accuracyGap = (Math.max(...Object.values(result.metrics.accuracyPerGroup)) - worstAccuracy) * 100;

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
          <h1 className="text-3xl font-display font-semibold text-white tracking-wide">MODEL AUDIT RESULTS</h1>
        </div>
        
        <div className="flex gap-4">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 rounded-2xl">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button className="bg-accent-cyan hover:bg-accent-cyan/80 text-primary-bg font-display font-semibold px-6 rounded-2xl glow-cyan">
            <Download className="w-4 h-4 mr-2" />
            EXPORT PDF
          </Button>
        </div>
      </div>

      {/* Summary Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden glass rounded-[2.5rem] p-12 border bg-gradient-to-r flex flex-col md:flex-row items-center justify-between gap-12",
          accuracyGap > 10 ? "from-danger-red/20 to-primary-bg border-danger-red/20" : "from-success-neon/20 to-primary-bg border-success-neon/20"
        )}
      >
        <div className="space-y-6 text-center md:text-left">
          <Badge className="bg-white/10 text-white border-white/20 px-4 py-1 text-xs font-display tracking-wide">
            MODEL PERFORMANCE AUDIT
          </Badge>
          <h2 className="text-5xl md:text-6xl font-display font-semibold text-white tracking-tighter">
            {accuracyGap > 10 ? "BIAS DETECTED" : "OPTIMAL PERFORMANCE"}
          </h2>
          <p className="text-xl text-white/70 max-w-xl font-medium">
            {accuracyGap > 10 
              ? `The model performs significantly worse for the ${worstGroup} group with a ${accuracyGap.toFixed(1)}% accuracy gap.`
              : "Model performance is consistent across all protected groups."}
          </p>
        </div>
        
        <div className="relative w-48 h-48 flex items-center justify-center">
          <div className={cn(
            "absolute inset-0 blur-3xl opacity-30 rounded-full",
            accuracyGap > 10 ? "bg-danger-red" : "bg-success-neon"
          )} />
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-5xl font-display font-semibold text-white">{(worstAccuracy * 100).toFixed(0)}%</span>
            <span className="text-xs font-display text-white/50 uppercase tracking-wide">Min Accuracy</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Accuracy Chart */}
        <Card className="glass border-white/5 rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-display text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-accent-cyan" />
              ACCURACY BY GROUP
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8892b0', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8892b0', fontSize: 11 }} domain={[0, 100]} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Bar dataKey="accuracy" fill="#00d4ff" radius={[6, 6, 0, 0]} animationDuration={2000}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Number(entry.accuracy) < 80 ? '#ff2d55' : '#00d4ff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Error Rates Chart */}
        <Card className="glass border-white/5 rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-display text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning-orange" />
              ERROR RATES (FPR & FNR)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8892b0', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8892b0', fontSize: 11 }} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend verticalAlign="top" height={36}/>
                <Bar name="False Positive Rate" dataKey="fpr" fill="#ff6b35" radius={[6, 6, 0, 0]} animationDuration={2000} />
                <Bar name="False Negative Rate" dataKey="fnr" fill="#7c3aed" radius={[6, 6, 0, 0]} animationDuration={2000} />
              </BarChart>
            </ResponsiveContainer>
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
                <th className="px-6 py-4 text-xs font-display uppercase tracking-wide text-text-secondary">Group</th>
                <th className="px-6 py-4 text-xs font-display uppercase tracking-wide text-text-secondary">Accuracy</th>
                <th className="px-6 py-4 text-xs font-display uppercase tracking-wide text-text-secondary">False Positive Rate</th>
                <th className="px-6 py-4 text-xs font-display uppercase tracking-wide text-text-secondary">False Negative Rate</th>
                <th className="px-6 py-4 text-xs font-display uppercase tracking-wide text-text-secondary">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {groups.map(group => {
                const acc = result.metrics.accuracyPerGroup[group];
                const fpr = result.metrics.fprPerGroup[group];
                const fnr = result.metrics.fnrPerGroup[group];
                const isWorst = group === worstGroup;
                
                return (
                  <tr key={group} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{group}</td>
                    <td className="px-6 py-4 text-sm text-white/70">{(acc * 100).toFixed(1)}%</td>
                    <td className="px-6 py-4 text-sm text-white/70">{(fpr * 100).toFixed(1)}%</td>
                    <td className="px-6 py-4 text-sm text-white/70">{(fnr * 100).toFixed(1)}%</td>
                    <td className="px-6 py-4">
                      {isWorst && accuracyGap > 5 ? (
                        <Badge className="bg-danger-red/10 text-danger-red border-danger-red/20">Underperforming</Badge>
                      ) : (
                        <Badge className="bg-success-neon/10 text-success-neon border-success-neon/20">Optimal</Badge>
                      )}
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
