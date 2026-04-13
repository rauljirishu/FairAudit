import React, { useEffect, useState } from 'react';
import { UserProfile, AuditResult } from '../types';
import { fetchSharedAudits } from '../services/featureService';
import { Users, Loader2, MessageSquare, Eye } from 'lucide-react';
import { motion } from 'motion/react';

export function TeamPage({ user }: { user: UserProfile }) {
  const [audits, setAudits] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
       setLoading(true);
       try {
           const data = await fetchSharedAudits(user.email);
           setAudits(data);
       } catch (e) {
           console.error("fetch shared", e);
       }
       setLoading(false);
    };
    fetchData();
  }, [user.email]);

  if(loading) return <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent-cyan" /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-accent-cyan/10 rounded-2xl flex items-center justify-center border border-accent-cyan/20 glow-cyan">
          <Users className="w-6 h-6 text-accent-cyan" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Team Workspace</h1>
          <p className="text-text-secondary mt-1">Audits shared with you by team members.</p>
        </div>
      </div>

      {audits.length === 0 ? (
          <div className="text-center text-text-secondary py-12 glass rounded-3xl border-white/5">
             <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p>No audits have been shared with you yet.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {audits.map(a => (
                 <motion.div key={a.id} initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="glass p-6 rounded-3xl border border-white/5 hover:border-accent-cyan/30 transition-all group">
                     <div className="flex justify-between items-start mb-4">
                         <h3 className="font-bold text-lg text-white">{a.datasetName}</h3>
                         <span className="text-xs bg-white/5 px-2 py-1 rounded text-text-secondary border border-white/10">Shared</span>
                     </div>
                     <p className="text-sm text-text-secondary mb-4 flex justify-between">
                         <span>Score: <span className="text-white font-bold">{a.fairnessScore}</span></span>
                         <span className="font-mono">{new Date(a.timestamp).toLocaleDateString()}</span>
                     </p>
                     <div className="flex gap-2">
                         <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-2 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                             <Eye className="w-4 h-4 text-accent-cyan" /> View Report
                         </button>
                     </div>
                 </motion.div>
             ))}
          </div>
      )}
    </div>
  );
}
