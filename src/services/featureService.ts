import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { AuditResult, Comment, LeaderboardEntry, MonitorConfig } from '../types';

export const shareAudit = async (auditId: string, email: string, permission: 'view'|'comment') => {
   if(!db || db.isFallback) return;
   const auditRef = doc(db, 'audits', auditId);
   const snap = await getDoc(auditRef);
   if(snap.exists()) {
      const data = snap.data() as AuditResult;
      const sharedWith = data.sharedWith || [];
      sharedWith.push({ email, permission });
      await updateDoc(auditRef, { sharedWith });
   }
};

export const setPublicLink = async (auditId: string, isPublic: boolean) => {
   if(!db || db.isFallback) throw new Error("no db");
   await updateDoc(doc(db, 'audits', auditId), { isPublicLink: isPublic });
};

export const fetchSharedAudits = async (email: string) => {
    if(!db || db.isFallback) return [];
    try {
        const auditsQ = query(collection(db, 'audits'));
        const auditsSnap = await getDocs(auditsQ);
        const res: AuditResult[] = [];
        auditsSnap.forEach(d => {
           const data = d.data() as AuditResult;
           if(data.sharedWith?.some(s => s.email === email)) {
               res.push({ id: d.id, ...data });
           }
        });
        return res;
    } catch (e) {
        console.error("fetchSharedAudits error", e);
        return [];
    }
};

export const addComment = async (auditId: string, text: string) => {
   if(!auth.currentUser || !db || db.isFallback) return;
   const user = auth.currentUser;
   const comment: Comment = {
       auditId,
       userId: user.uid,
       userName: user.displayName || user.email || 'Unknown',
       userAvatar: user.photoURL || '',
       text,
       timestamp: new Date().toISOString()
   };
   await addDoc(collection(db, `audits/${auditId}/comments`), comment);
};

export const getComments = async (auditId: string) => {
    if(!db || db.isFallback) return [];
    try {
        const q = query(collection(db, `audits/${auditId}/comments`), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({id: d.id, ...d.data()} as Comment));
    } catch (e) {
        console.error("getComments error", e);
        return [];
    }
};

export const publishToLeaderboard = async (auditId: string, data: Partial<LeaderboardEntry>) => {
    if(!db || db.isFallback) return;
    await addDoc(collection(db, 'publicAudits'), data);
    await updateDoc(doc(db, 'audits', auditId), { isPublicLeaderboard: true });
};

export const getLeaderboard = async () => {
    if(!db || db.isFallback) return [];
    try {
        const q = query(collection(db, 'publicAudits'), orderBy('fairnessScore', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({id: d.id, ...d.data()} as LeaderboardEntry));
    } catch (e) {
        console.error("getLeaderboard error", e);
        return [];
    }
};

export const saveMonitor = async (config: MonitorConfig) => {
   if(!db || db.isFallback) return;
   await addDoc(collection(db, 'monitors'), config);
};

export const getMonitors = async (userId: string) => {
    if(!db || db.isFallback) return [];
    try {
        const q = query(collection(db, 'monitors'), where('userId', '==', userId));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({id: d.id, ...d.data()} as MonitorConfig));
    } catch (e) {
        console.error("getMonitors error", e);
        return [];
    }
};
