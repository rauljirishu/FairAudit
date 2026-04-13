import React, { useState, useEffect } from 'react';
import { UserProfile, MonitorConfig } from '../types';
import { getMonitors, saveMonitor } from '../services/featureService';
import { ActivitySquare, Bell, Play, Plus, Clock, Loader2, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Slider } from '@/components/ui/slider';

export function MonitorPage({ user }: { user: UserProfile }) {
  const [monitors, setMonitors] = useState<MonitorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [threshold, setThreshold] = useState(15);
  const [freq, setFreq] = useState<'Daily'|'Weekly'|'Monthly'>('Monthly');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getMonitors(user.uid);
      setMonitors(data);
      setLoading(false);
    };
    fetchData();
  }, [user.uid]);

  const handleCreate = async () => {
     setShowForm(false);
     const newMonitor: MonitorConfig = {
         userId: user.uid,
         name,
         baselineCsvPath: 'mock/path',
         outcomeColumn: 'Hired',
         protectedColumn: 'Gender',
         frequency: freq,
         alertThreshold: threshold,
         alertMethod: 'in_app',
         status: 'OK',
         enabled: true,
         lastCheckedDate: new Date().toISOString()
     };
     await saveMonitor(newMonitor);
     setMonitors([...monitors, newMonitor]);
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-accent-cyan" w-8 h-8 /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success-neon/10 rounded-2xl flex items-center justify-center border border-success-neon/20 glow-success">
            <ActivitySquare className="w-6 h-6 text-success-neon" />
            </div>
            <div>
            <h1 className="text-3xl font-display font-bold text-white">Scheduled Monitors</h1>
            <p className="text-text-secondary mt-1">Track bias drift automatically over time.</p>
            </div>
         </div>
         <button onClick={() => setShowForm(true)} className="bg-success-neon text-primary-bg px-6 py-2 rounded-xl font-bold font-display shadow-[0_0_15px_rgba(0,255,136,0.5)]">
            + NEW MONITOR
         </button>
      </div>

      <AnimatePresence>
         {showForm && (
            <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="glass p-6 rounded-3xl border-white/10 space-y-6">
                <h3 className="font-display font-bold text-xl">Create Monitor</h3>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                       <label className="text-sm text-text-secondary">Monitor Name</label>
                       <input value={name} onChange={e=>setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-success-neon" placeholder="e.g. Q3 Hiring Dataset" />
                   </div>
                   <div className="space-y-2">
                       <label className="text-sm text-text-secondary">Frequency</label>
                       <select value={freq} onChange={e=>setFreq(e.target.value as any)} className="w-full bg-primary-bg border border-white/10 rounded-lg p-3 text-white outline-none">
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Monthly</option>
                       </select>
                   </div>
                   <div className="space-y-4 col-span-2">
                       <div className="flex justify-between">
                           <label className="text-sm text-text-secondary">Alert Threshold (Bias increase %)</label>
                           <span className="text-success-neon font-bold">{threshold}%</span>
                       </div>
                       <Slider min={5} max={50} value={[threshold]} onValueChange={v => setThreshold(v[0])} />
                   </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                   <button onClick={() => setShowForm(false)} className="px-6 py-2 text-text-secondary hover:text-white">Cancel</button>
                   <button onClick={handleCreate} className="bg-success-neon text-primary-bg px-6 py-2 rounded-xl font-bold font-display">Save Monitor</button>
                </div>
            </motion.div>
         )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {monitors.length === 0 && <p className="text-text-secondary col-span-2 text-center py-12">No active monitors.</p>}
          {monitors.map((m, i) => (
             <div key={i} className="glass border border-white/10 p-6 rounded-3xl hover:border-success-neon/30 transition-colors">
                <div className="flex justify-between items-start mb-6">
                    <div>
                       <h3 className="font-bold text-white text-lg">{m.name}</h3>
                       <p className="text-xs text-text-secondary flex items-center gap-1 mt-1"><Clock className="w-3 h-3"/> Checked {m.lastCheckedDate?.split('T')[0]}</p>
                    </div>
                    <span className={cn("px-2 py-1 text-[10px] font-bold rounded uppercase", m.status === 'OK' ? 'bg-success-neon/10 text-success-neon border border-success-neon/20' : 'bg-danger-red/10 text-danger-red border border-danger-red/20')}>
                        {m.status}
                    </span>
                </div>
                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                    <div className="text-xs text-text-secondary">
                        <p>Threshold: &gt;{m.alertThreshold}%</p>
                        <p>Every {m.frequency}</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 border border-white/10 rounded-lg hover:bg-white/10 text-white"><StopCircle className="w-4 h-4 text-text-secondary"/></button>
                        <button className="p-2 border border-white/10 bg-success-neon/10 rounded-lg text-success-neon hover:bg-success-neon hover:text-primary-bg transition-colors"><Play className="w-4 h-4"/></button>
                    </div>
                </div>
             </div>
          ))}
      </div>
    </div>
  );
}
