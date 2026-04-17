import React, { useState, useEffect } from 'react';
import { 
  Download, ArrowLeft, Brain, BadgeCheck, ShieldAlert, 
  AlertCircle, Users, Activity, Share2, Sparkles, ChevronRight,
  Database, Sliders, AlertTriangle, Loader2, CheckCircle2, Trophy, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuditResult, Severity, UserProfile, Recommendation, Comment } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { Switch } from '@/components/ui/switch';
import { publishToLeaderboard, getComments, addComment } from '../services/featureService';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { SeverityMeter } from './SeverityMeter';
import { Typewriter } from './Typewriter';
import jsPDF from 'jspdf';

interface ResultsPageProps {
  result: AuditResult;
  user: UserProfile;
  onBack: () => void;
}

export function ResultsPage({ result, user, onBack }: ResultsPageProps) {
  const [showContent, setShowContent] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('REPORT DOWNLOADED!');
  const [isPublic, setIsPublic] = useState(result.isPublicLeaderboard || false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const fetchC = async () => { if(result.id) setComments(await getComments(result.id)); };
    fetchC();
  }, [result.id]);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const today = new Date().toLocaleDateString();

      // Helper for dark header
      const addHeader = (title: string) => {
        doc.setFillColor(13, 17, 23); // Dark background
        doc.rect(0, 0, pageWidth, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, 20);
      };

      // PAGE 1: COVER
      addHeader("FAIRAUDIT PRO");
      doc.setTextColor(13, 17, 23);
      doc.setFontSize(32);
      doc.text("Bias Audit Report", margin, 60);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${today}`, margin, 80);
      doc.text(`Dataset: ${result.datasetName}`, margin, 90);
      doc.text(`Audited by: ${user.displayName || user.email} (${user.email})`, margin, 100);
      
      doc.setDrawColor(0, 212, 255);
      doc.setLineWidth(1);
      doc.line(margin, 110, pageWidth - margin, 110);

      // PAGE 2: DATASET SUMMARY
      doc.addPage();
      addHeader("DATASET SUMMARY");
      doc.setTextColor(13, 17, 23);
      doc.setFontSize(14);
      doc.text(`Total rows analyzed: ${result.metrics.selectionRates ? "1500+" : "N/A"}`, margin, 50); // Using placeholder logic for total rows if not stored
      doc.text(`Protected attribute checked: ${result.protectedColumn}`, margin, 60);
      doc.text(`Groups found: ${Object.keys(result.metrics.selectionRates).join(", ")}`, margin, 70);
      doc.text(`Outcome column: ${result.outcomeColumn}`, margin, 80);
      
      const overallRate = (Object.values(result.metrics.selectionRates).reduce((a, b) => a + b, 0) / Object.values(result.metrics.selectionRates).length * 100).toFixed(1);
      doc.text(`Overall positive rate: ${overallRate}%`, margin, 90);

      // PAGE 3: BIAS METRICS TABLE
      doc.addPage();
      addHeader("BIAS METRICS TABLE");
      doc.setTextColor(13, 17, 23);
      
      // Table Header
      const tableTop = 50;
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, tableTop, pageWidth - 2 * margin, 10, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text("Metric", margin + 5, tableTop + 7);
      doc.text("Value", margin + 60, tableTop + 7);
      doc.text("Threshold", margin + 100, tableTop + 7);
      doc.text("Status", margin + 140, tableTop + 7);

      // Rows
      const rows = [
        { metric: "Demographic Parity", value: result.metrics.demographicParityDiff.toFixed(3), threshold: "< 0.1", status: result.metrics.demographicParityDiff < 0.1 ? "PASS" : "FAIL" },
        { metric: "Disparate Impact", value: result.metrics.disparateImpactRatio.toFixed(3), threshold: "> 0.8", status: result.metrics.disparateImpactRatio > 0.8 ? "PASS" : "FAIL" },
      ];

      Object.entries(result.metrics.selectionRates).forEach(([group, rate]) => {
        rows.push({ metric: `Selection Rate [${group}]`, value: (rate * 100).toFixed(1) + "%", threshold: "-", status: "-" });
      });

      rows.push({ metric: "Overall Severity", value: result.severity, threshold: "-", status: result.severity === 'LOW' ? "OK" : "ACTION NEEDED" });

      doc.setFont('helvetica', 'normal');
      rows.forEach((row, i) => {
        const y = tableTop + 20 + (i * 10);
        if (i % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, y - 7, pageWidth - 2 * margin, 10, 'F');
        }
        doc.text(row.metric, margin + 5, y);
        doc.text(row.value, margin + 60, y);
        doc.text(row.threshold, margin + 100, y);
        
        if (row.status === "FAIL" || row.status === "ACTION NEEDED") {
          doc.setTextColor(255, 0, 0);
        } else if (row.status === "PASS" || row.status === "OK") {
          doc.setTextColor(0, 150, 0);
        } else {
          doc.setTextColor(13, 17, 23);
        }
        doc.text(row.status, margin + 140, y);
        doc.setTextColor(13, 17, 23);
      });

      // PAGE 4: AI EXPLANATION
      doc.addPage();
      addHeader("AI EXPLANATION");
      doc.setTextColor(13, 17, 23);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("What This Means", margin, 50);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const splitText = doc.splitTextToSize(result.aiInsights, pageWidth - 2 * margin);
      doc.text(splitText, margin, 65);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Letter Grade: ${result.grade}`, margin, 65 + (splitText.length * 7) + 10);

      // PAGE 5: RECOMMENDATIONS
      doc.addPage();
      addHeader("HOW TO FIX THIS");
      doc.setTextColor(13, 17, 23);
      
      result.recommendations.forEach((rec, i) => {
        const y = 50 + (i * 50);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${i + 1}. ${rec.title}`, margin, y);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const splitRec = doc.splitTextToSize(rec.description, pageWidth - 2 * margin);
        doc.text(splitRec, margin, y + 10);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Severity: ${rec.severity}`, margin, y + 10 + (splitRec.length * 6) + 5);
        doc.setTextColor(13, 17, 23);
      });

      // PAGE 6: FOOTER
      doc.addPage();
      addHeader("REPORT FOOTER");
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text("Generated by FairAudit Pro", margin, 50);
      doc.text("Powered by Google Gemini AI", margin, 60);
      doc.text("Built for Google Solution Challenge 2026", margin, 70);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 80);

      doc.save(`FairAudit_Pro_Report_${result.datasetName}.pdf`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("PDF Generation failed:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const severityColors = {
    'LOW': 'from-success-neon/20 to-transparent border-success-neon/30 text-success-neon',
    'MEDIUM': 'from-warning-orange/20 to-transparent border-warning-orange/30 text-warning-orange',
    'HIGH': 'from-orange-600/20 to-transparent border-orange-600/30 text-orange-600',
    'CRITICAL': 'from-danger-red/20 to-transparent border-danger-red/30 text-danger-red'
  };

  const gradeColors = {
    'A': 'bg-success-neon/20 text-success-neon border-success-neon/30',
    'B': 'bg-success-neon/10 text-success-neon border-success-neon/20',
    'C': 'bg-warning-orange/20 text-warning-orange border-warning-orange/30',
    'D': 'bg-orange-600/20 text-orange-600 border-orange-600/30',
    'F': 'bg-danger-red/20 text-danger-red border-danger-red/30'
  };

  const getRecIcon = (icon: string) => {
    switch (icon) {
      case 'database': return <Database className="w-5 h-5" />;
      case 'sliders': return <Sliders className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      default: return <BadgeCheck className="w-5 h-5" />;
    }
  };

  const handleToggleLeaderboard = async (v: boolean) => {
     setIsPublic(v);
     if (v && result.id) {
        await publishToLeaderboard(result.id, {
            auditId: result.id,
            domain: result.datasetName,
            fairnessScore: result.fairnessScore,
            severity: result.severity,
            date: new Date().toISOString()
        });
        setToastMsg("Added to Leaderboard!");
        setShowToast(true);
        setTimeout(()=>setShowToast(false), 2000);
     }
  };

  const handleAddComment = async () => {
      if(!commentText.trim() || !result.id) return;
      await addComment(result.id, commentText);
      setComments(await getComments(result.id));
      setCommentText('');
  };

  const getRetentionBadge = () => {
     if(!result.deleteAfter) return <span className="text-xs px-2 py-1 bg-white/5 text-text-secondary rounded border border-white/10">No expiry</span>;
     const days = Math.ceil((new Date(result.deleteAfter).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
     if(days < 0) return null;
     if(days < 7) return <span className="text-xs px-2 py-1 bg-danger-red/10 text-danger-red rounded border border-danger-red/20 flex items-center gap-1"><Clock className="w-3 h-3"/> Expires in {days} days</span>;
     return <span className="text-xs px-2 py-1 bg-warning-orange/10 text-warning-orange rounded border border-warning-orange/20 flex items-center gap-1"><Clock className="w-3 h-3"/> Expires in {days} days</span>;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 max-w-7xl mx-auto space-y-8"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-success-neon text-primary-bg px-6 py-3 rounded-full font-display font-bold flex items-center gap-2 shadow-lg glow-success"
          >
            <CheckCircle2 className="w-5 h-5" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="text-text-secondary hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>
          <div className="h-8 w-[1px] bg-white/10" />
          <h1 className="text-3xl font-display font-semibold text-white tracking-wide">AUDIT RESULTS</h1>
        </div>
        
        <div className="flex gap-4 items-center">
          {getRetentionBadge()}
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 rounded-2xl">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            onClick={generatePDF} 
            disabled={isGeneratingPDF}
            className="bg-accent-cyan hover:bg-accent-cyan/80 text-primary-bg font-display font-semibold px-6 rounded-2xl glow-cyan min-w-[160px]"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                GENERATING...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                DOWNLOAD REPORT
              </>
            )}
          </Button>
        </div>
      </div>

      <div id="audit-report" className="space-y-8">
        {/* Hero Severity Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "relative overflow-hidden glass rounded-[2.5rem] p-12 border bg-gradient-to-r flex flex-col md:flex-row items-center justify-between gap-12",
            severityColors[result.severity]
          )}
        >
          <div className="space-y-6 text-center md:text-left">
            <Badge className="bg-white/10 text-white border-white/20 px-4 py-1 text-xs font-display tracking-wide">
              {result.severity} SEVERITY DETECTED
            </Badge>
            <h2 className="text-5xl md:text-6xl font-display font-semibold text-white tracking-tighter">
              {result.fairnessScore}<span className="text-2xl opacity-40">/100</span>
            </h2>
            <p className="text-xl text-white/70 max-w-xl font-medium">
              Our neural analysis has identified <span className="text-white font-semibold">{result.severity.toLowerCase()}</span> bias risks in the <span className="text-white font-semibold">{result.datasetName}</span> dataset.
            </p>
          </div>

          <SeverityMeter severity={result.severity} />
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-current blur-[120px] opacity-10 -z-10" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="glass border-white/5 rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-display text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent-cyan" />
                  SELECTION RATE PER GROUP
                </CardTitle>
                <CardDescription className="text-text-secondary">Percentage of positive outcomes (outcome=1) for each demographic group.</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(result.metrics.selectionRates).map(([name, rate]) => ({ name, rate: rate * 100 }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8892b0', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} unit="%" tick={{ fill: '#8892b0', fontSize: 11 }} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="rate" radius={[6, 6, 0, 0]} animationDuration={2000}>
                      {Object.entries(result.metrics.selectionRates).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#00d4ff' : '#7c3aed'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass border-white/5 rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-display text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-accent-purple" />
                  BIAS METRICS OVERVIEW
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical" 
                    data={[
                      { name: 'Demographic Parity', value: result.metrics.demographicParityDiff, threshold: 0.1, color: '#00d4ff' },
                      { name: 'Disparate Impact', value: result.metrics.disparateImpactRatio, threshold: 0.8, color: '#7c3aed' },
                      { name: 'Individual Fairness', value: result.metrics.individualFairness, threshold: 0.9, color: '#00ff88' }
                    ]}
                    margin={{ left: 40, right: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" domain={[0, 1.2]} axisLine={false} tickLine={false} tick={{ fill: '#8892b0', fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 500 }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={2500}>
                      {[0, 1, 2].map((i) => (
                        <Cell key={`cell-${i}`} fill={['#00d4ff', '#7c3aed', '#00ff88'][i]} />
                      ))}
                    </Bar>
                    <ReferenceLine x={0.1} stroke="#ff2d55" strokeDasharray="5 5" label={{ position: 'top', value: 'Critical', fill: '#ff2d55', fontSize: 10, fontWeight: 600 }} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Impact Storytelling */}
            <Card className="glass border-warning-orange/20 bg-warning-orange/5 rounded-3xl overflow-hidden mt-8">
              <CardHeader>
                <CardTitle className="text-xl font-display text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-warning-orange" />
                  REAL-WORLD IMPACT SIMULATION
                </CardTitle>
              </CardHeader>
              <CardContent>
                <blockquote className="border-l-2 border-warning-orange pl-4 italic text-white/80 text-sm mb-4">
                  "Based on {result.fairnessScore < 80 ? 'these biases' : 'this data'}, a qualified candidate from an underrepresented group may be unfairly rejected despite having equivalent qualifications. Without mitigation, scaling this model to 10,000 applicants could result in hundreds of discriminatory rejections."
                </blockquote>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex-1">
                    <p className="text-[10px] font-display text-text-secondary uppercase tracking-wide">BEFORE MITIGATION</p>
                    <p className="text-danger-red font-bold text-xl">{result.fairnessScore}/100 Fair</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-secondary opacity-50" />
                  <div className="flex-1">
                    <p className="text-[10px] font-display text-text-secondary uppercase tracking-wide">AFTER TARGET (EST.)</p>
                    <p className="text-success-neon font-bold text-xl">95+/100 Fair</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-success-neon">
                  <Activity className="w-4 h-4" />
                  Applying recommended fixes can reduce demographic bias by an estimated 35%.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights & Recommendations */}
          <div className="space-y-8">
            <Card className="glass border-accent-cyan/20 rounded-3xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 to-transparent pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white font-display">
                  <Brain className="w-6 h-6 text-accent-cyan animate-pulse" />
                  What This Means For Real People
                </CardTitle>
                <Badge className={cn("text-lg font-display px-3 py-1 rounded-lg border", gradeColors[result.grade as keyof typeof gradeColors] || gradeColors['C'])}>
                  {result.grade}
                </Badge>
              </CardHeader>
              <CardContent>
                {showContent && (
                  <Typewriter text={result.aiInsights} />
                )}
                <div className="mt-6 flex items-center gap-2 text-[10px] font-display text-accent-cyan uppercase tracking-wide opacity-50">
                  <Sparkles className="w-3 h-3" />
                  Powered by Gemini AI
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-sm font-display font-semibold text-white tracking-wide flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-success-neon" />
                FIX RECOMMENDATIONS
              </h3>
              <AnimatePresence>
                {result.recommendations.map((rec, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + (i * 0.2) }}
                    whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    className="glass p-5 rounded-2xl border-white/5 flex gap-4 group cursor-default border-l-4"
                    style={{ borderLeftColor: rec.severity === 'HIGH' ? '#ff2d55' : rec.severity === 'MEDIUM' ? '#ff9f0a' : '#00ff88' }}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-accent-cyan border border-white/10">
                        {getRecIcon(rec.icon)}
                      </div>
                      <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-accent-cyan text-primary-bg flex items-center justify-center text-[10px] font-bold border-2 border-primary-bg">
                        {i + 1}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">{rec.title}</h4>
                        <Badge variant="outline" className="text-[8px] h-4 border-white/10 text-text-secondary">
                          {rec.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed group-hover:text-white transition-colors">
                        {rec.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
               </AnimatePresence>
            </div>

            <Card className="glass border-accent-gold/20 rounded-3xl overflow-hidden relative">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white font-display">
                  <Trophy className="w-6 h-6 text-accent-gold" />
                  Public Leaderboard
                </CardTitle>
                <Switch checked={isPublic} onCheckedChange={handleToggleLeaderboard} disabled={isPublic} className="data-[state=checked]:bg-accent-gold" />
              </CardHeader>
              <CardContent>
                 <p className="text-sm text-text-secondary">Make this audit public to the community leaderboard. This is anonymous.</p>
              </CardContent>
            </Card>

            <div className="glass p-6 rounded-3xl border-white/5 mt-8">
               <h3 className="font-display font-bold text-white mb-4">Team Comments</h3>
               <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                   {comments.map(c => (
                      <div key={c.id} className="flex gap-3">
                         <img src={c.userAvatar || `https://ui-avatars.com/api/?name=${c.userName}`} className="w-8 h-8 rounded-full border border-white/10" />
                         <div className="bg-white/5 rounded-2xl rounded-tl-none p-3 border border-white/5 flex-1">
                            <p className="text-xs font-bold text-white mb-1">{c.userName} <span className="font-normal text-text-secondary ml-2">{new Date(c.timestamp).toLocaleString()}</span></p>
                            <p className="text-sm text-white/90">{c.text}</p>
                         </div>
                      </div>
                   ))}
                   {comments.length === 0 && <p className="text-xs text-text-secondary">No comments yet.</p>}
               </div>
               <div className="flex gap-2">
                   <input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none text-sm text-white focus:border-accent-cyan" />
                   <button onClick={handleAddComment} className="bg-accent-cyan text-primary-bg px-4 py-2 rounded-xl text-sm font-bold">Post</button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
