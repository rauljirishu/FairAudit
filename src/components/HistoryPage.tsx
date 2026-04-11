import React, { useState, useEffect } from 'react';
import { 
  History, Search, Filter, Trash2, Eye, 
  Calendar, Shield, ArrowRight, Database, AlertCircle, Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UserProfile, AuditResult, Severity, ModelAuditResult } from '../types';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryPageProps {
  user: UserProfile;
  onViewAudit: (id: string, type: 'fairness' | 'model') => void;
}

export function HistoryPage({ user, onViewAudit }: HistoryPageProps) {
  const [history, setHistory] = useState<(AuditResult | ModelAuditResult)[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'ALL'>('ALL');

  useEffect(() => {
    if (user.uid === 'guest-user') {
      const localAudits = JSON.parse(localStorage.getItem('guest_audits') || '[]');
      const localModelAudits = JSON.parse(localStorage.getItem('guest_model_audits') || '[]');
      const combined = [...localAudits, ...localModelAudits].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setHistory(combined);
      return;
    }

    const qAudits = query(
      collection(db, 'audits'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const qModelAudits = query(
      collection(db, 'model_audits'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubAudits = onSnapshot(qAudits, (snapshot) => {
      const audits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'fairness' } as any));
      updateHistory(audits, 'fairness');
    });

    const unsubModelAudits = onSnapshot(qModelAudits, (snapshot) => {
      const modelAudits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'model' } as any));
      updateHistory(modelAudits, 'model');
    });

    const updateHistory = (newItems: any[], type: string) => {
      setHistory(prev => {
        const filtered = prev.filter(item => (item as any).type !== type);
        const combined = [...filtered, ...newItems].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        return combined;
      });
    };

    return () => {
      unsubAudits();
      unsubModelAudits();
    };
  }, [user.uid]);

  const filteredHistory = history.filter(audit => {
    const matchesSearch = audit.datasetName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterSeverity === 'ALL' || (audit as any).severity === filterSeverity;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (e: React.MouseEvent, id: string, type: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to permanently delete this audit record?')) {
      if (user.uid === 'guest-user') {
        const storageKey = type === 'model' ? 'guest_model_audits' : 'guest_audits';
        const localAudits = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updated = localAudits.filter((a: any) => a.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        
        setHistory(prev => prev.filter(a => a.id !== id));
      } else {
        const collectionName = type === 'model' ? 'model_audits' : 'audits';
        await deleteDoc(doc(db, collectionName, id));
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 max-w-6xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-semibold text-white tracking-wide">AUDIT HISTORY</h1>
          <p className="text-text-secondary mt-1">Review and manage your previous fairness assessments.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input 
              placeholder="Search datasets..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white rounded-xl focus:ring-accent-cyan"
            />
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeverity(s as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-display font-semibold transition-all tracking-wide",
                  filterSeverity === s 
                    ? "bg-accent-cyan text-primary-bg shadow-lg shadow-accent-cyan/20" 
                    : "text-text-secondary hover:text-white"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-gradient-to-b from-accent-cyan via-accent-purple to-transparent opacity-20 hidden md:block" />

        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {filteredHistory.map((audit, i) => (
              <motion.div 
                key={audit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="relative pl-0 md:pl-20"
              >
                {/* Timeline Dot */}
                <div className="absolute left-[29px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent-cyan shadow-[0_0_10px_#00d4ff] hidden md:block" />
                
                <Card 
                  onClick={() => onViewAudit(audit.id!, (audit as any).type)}
                  className="glass border-white/5 rounded-[2rem] overflow-hidden hover:border-accent-cyan/30 transition-all cursor-pointer group"
                >
                  <CardContent className="p-0 flex flex-col md:flex-row">
                    <div className={cn(
                      "w-full md:w-48 p-8 flex flex-col items-center justify-center text-center gap-2",
                      (audit as any).type === 'model' ? "bg-accent-cyan/5" :
                      (audit as AuditResult).severity === 'LOW' ? "bg-success-neon/5" :
                      (audit as AuditResult).severity === 'MEDIUM' ? "bg-warning-orange/5" :
                      "bg-danger-red/5"
                    )}>
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center border-2 mb-2",
                        (audit as any).type === 'model' ? "border-accent-cyan/30 text-accent-cyan" :
                        (audit as AuditResult).severity === 'LOW' ? "border-success-neon/30 text-success-neon" :
                        (audit as AuditResult).severity === 'MEDIUM' ? "border-warning-orange/30 text-warning-orange" :
                        "border-danger-red/30 text-danger-red"
                      )}>
                        {(audit as any).type === 'model' ? <Brain className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
                      </div>
                      <Badge className={cn(
                        "font-display text-[10px] tracking-wide",
                        (audit as any).type === 'model' ? "bg-accent-cyan text-primary-bg" :
                        (audit as AuditResult).severity === 'LOW' ? "bg-success-neon text-primary-bg" :
                        (audit as AuditResult).severity === 'MEDIUM' ? "bg-warning-orange text-primary-bg" :
                        "bg-danger-red text-white"
                      )}>
                        {(audit as any).type === 'model' ? 'MODEL AUDIT' : (audit as AuditResult).severity}
                      </Badge>
                    </div>

                    <div className="flex-1 p-8 flex flex-col md:flex-row justify-between gap-8">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-display font-semibold text-white group-hover:text-accent-cyan transition-colors">
                            {audit.datasetName.toUpperCase()}
                          </h3>
                          <div className="flex items-center gap-1 text-text-secondary text-xs">
                            <Calendar className="w-3 h-3" />
                            {new Date(audit.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          {(audit as any).type === 'model' ? (
                            <>
                              <HistoryMetric label="Accuracy" value={`${((audit as ModelAuditResult).metrics.overall.accuracy * 100).toFixed(1)}%`} />
                              <HistoryMetric label="F1 Score" value={(audit as ModelAuditResult).metrics.overall.f1.toFixed(3)} />
                              <HistoryMetric label="Protected Attr" value={(audit as ModelAuditResult).protectedColumn} />
                            </>
                          ) : (
                            <>
                              <HistoryMetric label="Fairness Score" value={`${(audit as AuditResult).fairnessScore}%`} />
                              <HistoryMetric label="Outcome Col" value={(audit as AuditResult).outcomeColumn} />
                              <HistoryMetric label="Protected Attr" value={(audit as AuditResult).protectedColumn} />
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col justify-end gap-3">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={(e) => handleDelete(e, audit.id!, (audit as any).type)}
                          className="rounded-xl border-white/10 text-text-secondary hover:text-danger-red hover:bg-danger-red/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          className="rounded-xl bg-white/5 text-white hover:bg-accent-cyan hover:text-primary-bg border border-white/10"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                <History className="w-10 h-10 text-text-secondary opacity-20" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-display font-bold text-white">NO AUDITS FOUND</h3>
                <p className="text-text-secondary max-w-xs">Try adjusting your filters or start a new audit to see results here.</p>
              </div>
              <Button className="bg-accent-cyan text-primary-bg font-display font-bold rounded-xl px-8">
                START NEW AUDIT
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-display uppercase tracking-wide text-text-secondary mb-1">{label}</p>
      <p className="text-sm font-semibold text-white/90 truncate max-w-[120px]">{value}</p>
    </div>
  );
}
