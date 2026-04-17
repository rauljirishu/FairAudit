import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Activity, ArrowUpRight, 
  TrendingUp, AlertTriangle, CheckCircle2, Clock,
  Plus, ArrowRight, Shield, Brain, FileText, Search, Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserProfile, AuditResult } from '../types';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { StatCard } from './StatCard';

interface DashboardProps {
  user: UserProfile;
  onNewAudit: () => void;
  onViewAudit: (id: string) => void;
}

export function Dashboard({ user, onNewAudit, onViewAudit }: DashboardProps) {
  const [recentAudits, setRecentAudits] = useState<AuditResult[]>([]);
  const [stats, setStats] = useState({
    totalAudits: 0,
    criticalBiases: 0,
    datasetsClean: 0,
    reportsGenerated: 0
  });

  useEffect(() => {
    if (user.uid === 'guest-user') {
      const localAudits = JSON.parse(localStorage.getItem('guest_audits') || '[]');
      setRecentAudits(localAudits.slice(0, 10));
      
      const critical = localAudits.filter((a: any) => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;
      const clean = localAudits.filter((a: any) => a.severity === 'LOW').length;
      setStats({
        totalAudits: localAudits.length,
        criticalBiases: critical,
        datasetsClean: clean,
        reportsGenerated: localAudits.length
      });
      return;
    }

    const q = query(
      collection(db, 'audits'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const path = 'audits';
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const audits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditResult));
      setRecentAudits(audits);

      if (audits.length > 0) {
        const critical = audits.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;
        const clean = audits.filter(a => a.severity === 'LOW').length;
        setStats({
          totalAudits: audits.length,
          criticalBiases: critical,
          datasetsClean: clean,
          reportsGenerated: audits.length // Assuming 1 report per audit
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 space-y-8"
    >
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-display font-semibold text-white tracking-tight"
          >
            {getGreeting()}, {user.displayName ? user.displayName.split(' ')[0].toUpperCase() : 'USER'}
          </motion.h1>
          <p className="text-text-secondary mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={onNewAudit}
            className="bg-accent-cyan hover:bg-accent-cyan/80 text-primary-bg font-display font-semibold px-8 py-6 rounded-2xl glow-cyan group"
          >
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
            NEW AUDIT
          </Button>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Recruitment Audits" value={stats.totalAudits} icon={Shield} color="blue" />
        <StatCard label="Bias Detected" value={stats.criticalBiases} icon={AlertTriangle} color="red" />
        <StatCard label="Fairpools Verified" value={stats.datasetsClean} icon={CheckCircle2} color="green" />
        <StatCard label="Reports Generated" value={stats.reportsGenerated} icon={FileText} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area */}
        <Card className="lg:col-span-2 glass border-white/5 rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-display text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent-cyan" />
              FAIRNESS TRENDS
            </CardTitle>
            <CardDescription className="text-text-secondary">Historical fairness scores across your audited datasets.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentAudits.slice().reverse().map(a => ({ name: new Date(a.timestamp).toLocaleDateString(), score: a.fairnessScore }))}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#8892b0', fontSize: 10 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#8892b0', fontSize: 10 }} 
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#00d4ff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#00d4ff" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Audits Table */}
        <Card className="glass border-white/5 rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-display text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent-purple" />
              RECENT ACTIVITY
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              <AnimatePresence>
                {recentAudits.map((audit, i) => (
                  <motion.div 
                    key={audit.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                    onClick={() => onViewAudit(audit.id!)}
                    className="p-4 flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border",
                        audit.severity === 'LOW' ? "bg-success-neon/10 border-success-neon/20 text-success-neon" :
                        audit.severity === 'MEDIUM' ? "bg-warning-orange/10 border-warning-orange/20 text-warning-orange" :
                        "bg-danger-red/10 border-danger-red/20 text-danger-red"
                      )}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{audit.datasetName}</p>
                        <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                          {new Date(audit.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-accent-cyan group-hover:translate-x-1 transition-all" />
                  </motion.div>
                ))}
              </AnimatePresence>
              {recentAudits.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-text-secondary text-sm italic">No audits found.</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-white/5">
              <Button variant="ghost" className="w-full text-xs text-accent-cyan hover:text-accent-cyan hover:bg-accent-cyan/10">
                VIEW ALL HISTORY
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        animate={{ 
          boxShadow: ["0 0 0px rgba(0,212,255,0)", "0 0 20px rgba(0,212,255,0.4)", "0 0 0px rgba(0,212,255,0)"]
        }}
        transition={{ 
          boxShadow: { duration: 2, repeat: Infinity }
        }}
        onClick={onNewAudit}
        className="fixed bottom-8 right-8 w-16 h-16 bg-accent-cyan rounded-full flex items-center justify-center text-primary-bg shadow-xl z-50"
      >
        <Plus className="w-8 h-8" />
      </motion.button>
    </motion.div>
  );
}
