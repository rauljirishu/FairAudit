import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { AuditLogEntry, UserProfile, UserRole, AutoDeleteOption, AuditResult } from '../types';

export const logAuditAction = async (action: string, details: any = {}) => {
  if (!auth.currentUser) return;
  if (!db || db.isFallback) return;

  try {
    const user = auth.currentUser;
    const entry: AuditLogEntry = {
      userId: user.uid,
      userEmail: user.email || 'unknown',
      userName: user.displayName || 'unknown',
      action,
      timestamp: new Date().toISOString(),
      ipAddress: 'client',
      details,
    };
    await addDoc(collection(db, 'auditLogs'), entry);
  } catch (error) {
    console.error("Failed to log audit action", error);
  }
};

export const getAuditLogs = async (userId: string | null = null) => {
  if (!db || db.isFallback) return [];
  try {
    const logsRef = collection(db, 'auditLogs');
    let q;
    if (userId) {
      q = query(logsRef, where('userId', '==', userId), orderBy('timestamp', 'desc'));
    } else {
      q = query(logsRef, orderBy('timestamp', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as AuditLogEntry));
  } catch(error) {
    console.error("Failed to fetch audit logs", error);
    return [];
  }
};

export const getUserRole = async (uid: string): Promise<UserRole> => {
   if(!db || db.isFallback) return 'analyst';
   try {
     const docSnap = await getDoc(doc(db, 'users', uid));
     if(docSnap.exists() && docSnap.data().role) {
       return docSnap.data().role;
     }
   } catch(e) {}
   return 'analyst';
};

export const updateUserRole = async (uid: string, newRole: UserRole) => {
  if(!db || db.isFallback) return;
  await updateDoc(doc(db, 'users', uid), { role: newRole });
  await logAuditAction('SETTINGS_CHANGED', { updatedUser: uid, newRole });
};

export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  if(!db || db.isFallback) return [];
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
};

export const calculateDeleteAfter = (option: AutoDeleteOption): string | null => {
  if (option === 'forever' || option === 'immediate') return null;
  const now = new Date();
  if (option === '7days') now.setDate(now.getDate() + 7);
  else if (option === '30days') now.setDate(now.getDate() + 30);
  else if (option === '90days') now.setDate(now.getDate() + 90);
  return now.toISOString();
};

export const checkAndDeleteExpiredAudits = async (userId: string) => {
   if(!db || db.isFallback) return 0;
   try {
     const q = query(collection(db, 'audits'), where('userId', '==', userId));
     const snapshot = await getDocs(q);
     const now = new Date().toISOString();
     let deletedCount = 0;
     for (const docSnap of snapshot.docs) {
       const data = docSnap.data() as AuditResult;
       if (data.deleteAfter && data.deleteAfter < now) {
          await deleteDoc(doc(db, 'audits', docSnap.id));
          deletedCount++;
       }
     }
     if (deletedCount > 0) {
       await logAuditAction('AUTO_DELETED', { count: deletedCount });
     }
     return deletedCount;
   } catch (e) {
     console.error("Auto delete failed", e);
     return 0;
   }
};

export const deleteUserAccountAndData = async () => {
    if(!auth.currentUser || !db || db.isFallback) return;
    const uid = auth.currentUser.uid;
    // Note: Would need a Cloud Function for a complete, secure wipe including Auth deleting self,
    // but we do client side clear for simulation
    
    // delete audits
    const auditsQ = query(collection(db, 'audits'), where('userId', '==', uid));
    const auditsSnap = await getDocs(auditsQ);
    for(const d of auditsSnap.docs) await deleteDoc(d.ref);

    // delete profile
    await deleteDoc(doc(db, 'users', uid));

    await auth.currentUser.delete();
};
