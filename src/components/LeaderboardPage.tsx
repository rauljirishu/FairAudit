import React, { useEffect, useState } from 'react';
import { UserProfile, LeaderboardEntry } from '../types';
import { getLeaderboard } from '../services/featureService';
import { Trophy, Loader2, Award, ArrowUp, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export function LeaderboardPage({ user }: { user: UserProfile }) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchL = async () => {
            setLoading(true);
            const res = await getLeaderboard();
            setEntries(res.sort((a,b) => b.fairnessScore - a.fairnessScore));
            setLoading(false);
        };
        fetchL();
    }, []);

    if(loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-accent-gold" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4 mb-12 relative overflow-hidden p-12 glass rounded-3xl border-accent-gold/20 glow-gold">
               <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/10 to-transparent"></div>
               <Trophy className="w-16 h-16 text-accent-gold mx-auto mb-4 relative z-10" />
               <h1 className="text-4xl font-display font-bold text-white relative z-10">Global Fairness Leaderboard</h1>
               <p className="text-text-secondary max-w-2xl mx-auto relative z-10">
                   Discover and benchmark against the most equitable datasets and models audited by the community.
               </p>
               <div className="flex justify-center gap-8 mt-8 text-sm font-mono relative z-10">
                   <div className="bg-black/20 px-4 py-2 rounded-xl backdrop-blur">
                       <span className="text-accent-gold block text-2xl font-bold">{entries.length}</span> Total Submissions
                   </div>
                   <div className="bg-black/20 px-4 py-2 rounded-xl backdrop-blur">
                       <span className="text-success-neon block text-2xl font-bold">{entries.filter(e => e.fairnessScore > 90).length}</span> Premium Tiers
                   </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {entries.slice(0, 3).map((e, i) => (
                    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i * 0.1}} key={e.id} className="glass p-6 rounded-3xl border-white/10 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent-gold/5 rounded-full blur-2xl"></div>
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <span className="text-4xl font-display font-bold text-accent-gold">#{i+1}</span>
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                <Award className="w-6 h-6 text-accent-gold" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold text-white mb-1">{e.domain || 'Anonymous Industry'}</h3>
                            <div className="flex items-end justify-between mt-4">
                                <div>
                                    <p className="text-xs text-text-secondary uppercase tracking-widest font-display mb-1">Fairness Index</p>
                                    <p className="text-3xl font-mono text-accent-gold">{Math.round(e.fairnessScore)}</p>
                                </div>
                                <span className={cn("px-2 py-1 text-xs border rounded", e.severity==='LOW'?'text-success-neon border-success-neon/20':'text-warning-orange border-warning-orange/20')}>
                                    {e.severity} Risk
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="glass rounded-3xl p-6 border-white/5">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-sm font-display text-text-secondary uppercase tracking-wider border-b border-white/5">
                            <th className="pb-4">Rank</th>
                            <th className="pb-4">Domain/Industry</th>
                            <th className="pb-4">Fairness Score</th>
                            <th className="pb-4">Risk Severity</th>
                            <th className="pb-4">Verified Date</th>
                        </tr>
                    </thead>
                    <tbody className="font-mono text-sm">
                        {entries.slice(3).map((e, index) => (
                           <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                               <td className="py-4 text-white font-bold">#{index + 4}</td>
                               <td className="py-4 text-text-secondary">{e.domain || 'Anonymous Dataset'}</td>
                               <td className="py-4"><span className="text-accent-cyan">{Math.round(e.fairnessScore)}</span></td>
                               <td className="py-4">{e.severity}</td>
                               <td className="py-4 text-text-secondary">{new Date(e.date).toLocaleDateString()}</td>
                           </tr>
                        ))}
                        {entries.length <= 3 && (
                            <tr><td colSpan={5} className="py-8 text-center text-text-secondary font-sans border-0">Submit an audit to populate the leaderboard!</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
