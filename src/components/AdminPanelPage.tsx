import React, { useEffect, useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { fetchAllUsers, updateUserRole } from '../services/securityService';
import { Shield, ShieldAlert, ShieldCheck, Mail, Calendar, Loader2, PlaySquare } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export function AdminPanelPage({ user }: { user: UserProfile }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditCounts, setAuditCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const fetchedUsers = await fetchAllUsers();
        setUsers(fetchedUsers);
        
        // Fetch audit counts
        const counts: Record<string, number> = {};
        if (db && !db.isFallback) {
          const snapshot = await getDocs(collection(db, 'audits'));
          for (const doc of snapshot.docs) {
             const userId = doc.data().userId;
             counts[userId] = (counts[userId] || 0) + 1;
          }
        }
        setAuditCounts(counts);
      } catch (error) {
        console.error("Failed to load admin panel data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
     try {
       await updateUserRole(uid, newRole);
       setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
     } catch (e) {
       console.error("Error updating role", e);
     }
  };

  const getRoleIcon = (role?: UserRole) => {
     if(role === 'admin') return <ShieldAlert className="w-4 h-4 text-accent-gold" />;
     if(role === 'analyst') return <ShieldCheck className="w-4 h-4 text-accent-cyan" />;
     return <Shield className="w-4 h-4 text-text-secondary" />;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-accent-gold/10 rounded-2xl flex items-center justify-center border border-accent-gold/20 glow-gold">
          <ShieldAlert className="w-6 h-6 text-accent-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-white">System Administration</h1>
          <p className="text-text-secondary mt-1">Manage users, roles, and system permissions.</p>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 border-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-text-secondary text-sm font-medium">
              <th className="pb-4 pt-2">User Name</th>
              <th className="pb-4 pt-2">Contact</th>
              <th className="pb-4 pt-2">Total Audits</th>
              <th className="pb-4 pt-2">System Role</th>
              <th className="pb-4 pt-2">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {users.map((u) => (
              <motion.tr 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={u.uid} 
                className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
              >
                <td className="py-4 font-medium text-white flex items-center gap-3">
                  <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10" />
                  {u.displayName || 'Unnamed User'}
                </td>
                <td className="py-4 text-text-secondary flex gap-2 items-center">
                  <Mail className="w-4 h-4 opacity-50" />
                  {u.email}
                </td>
                <td className="py-4">
                  <div className="flex gap-2 items-center">
                    <PlaySquare className="w-4 h-4 text-accent-cyan" />
                    <span className="font-mono">{auditCounts[u.uid] || 0}</span>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(u.role)}
                    <span className="capitalize">{u.role || 'Analyst'}</span>
                  </div>
                </td>
                <td className="py-4">
                  <select 
                    value={u.role || 'analyst'} 
                    onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                    className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-sm text-text-secondary focus:border-accent-cyan outline-none w-28 disabled:opacity-50"
                    disabled={u.uid === user.uid}
                  >
                    <option value="admin">Admin</option>
                    <option value="analyst">Analyst</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
