import React, { useEffect, useState } from 'react';
import { UserProfile, AuditLogEntry } from '../types';
import { getAuditLogs } from '../services/securityService';
import { History, Activity, Filter, DownloadCloud, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export function AuditLogsPage({ user }: { user: UserProfile }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const fetchedLogs = await getAuditLogs(user.role === 'admin' ? null : user.uid);
        setLogs(fetchedLogs);
      } catch (error) {
        console.error("Failed to load audit logs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [user]);

  const getActionColor = (action: string) => {
    if(action.includes('LOGIN')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if(action.includes('AUDIT_STARTED') || action.includes('AUDIT_COMPLETED')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    if(action.includes('DOWNLOAD')) return 'bg-green-500/10 text-green-400 border-green-500/20';
    if(action.includes('DELETED')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if(action.includes('UPLOAD')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return 'bg-white/5 text-white/70 border-white/10';
  };

  const filteredLogs = filterAction === 'ALL' ? logs : logs.filter(l => l.action.includes(filterAction));

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white">System Audit Logs</h1>
              <p className="text-text-secondary mt-1">Immutable record of all system events and user actions.</p>
            </div>
         </div>
         
         <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                 <Filter className="w-4 h-4 text-text-secondary" />
                 <select 
                   value={filterAction} 
                   onChange={(e) => setFilterAction(e.target.value)}
                   className="bg-transparent border-none text-sm outline-none text-white w-24"
                 >
                    <option value="ALL">All Events</option>
                    <option value="LOGIN">Logins</option>
                    <option value="AUDIT">Audits</option>
                    <option value="DELETED">Deletions</option>
                    <option value="DOWNLOAD">Downloads</option>
                 </select>
             </div>
             <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 transition-all text-sm">
                <DownloadCloud className="w-4 h-4 text-accent-cyan" />
                Export CSV
             </button>
         </div>
      </div>

      <div className="glass rounded-3xl p-2 border-white/5 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto w-full px-4">
            <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-primary-bg/90 backdrop-blur-xl z-10">
                <tr className="text-text-secondary text-sm font-medium border-b border-white/5">
                <th className="py-4 font-mono text-xs hidden md:table-cell">TIMESTAMP</th>
                <th className="py-4">USER / ACTOR</th>
                <th className="py-4">EVENT ACTION</th>
                <th className="py-4">DETAILS</th>
                </tr>
            </thead>
            <tbody className="text-sm">
                {filteredLogs.length === 0 && (
                   <tr><td colSpan={4} className="py-8 text-center text-text-secondary">No audit logs found.</td></tr>
                )}
                {filteredLogs.map((log) => (
                <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={log.id || Math.random().toString()} 
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                >
                    <td className="py-4 font-mono text-xs text-text-secondary hidden md:table-cell">
                        {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 font-medium text-white">
                        <div className="flex flex-col">
                            <span>{log.userName}</span>
                            <span className="text-xs text-text-secondary">{log.userEmail}</span>
                        </div>
                    </td>
                    <td className="py-4">
                        <span className={cn("px-2.5 py-1 text-xs font-mono rounded border capitalize", getActionColor(log.action))}>
                            {log.action.replace('_', ' ')}
                        </span>
                    </td>
                    <td className="py-4">
                        <div className="max-w-xs xl:max-w-md truncate text-text-secondary p-2 bg-black/20 rounded font-mono text-xs border border-white/5" title={JSON.stringify(log.details)}>
                            {JSON.stringify(log.details)}
                        </div>
                    </td>
                </motion.tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
