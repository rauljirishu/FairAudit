import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, logout, handleFirestoreError, OperationType } from './firebase';
import { AuthPage } from './components/Auth';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { NewAuditPage } from './components/NewAuditPage';
import { ResultsPage } from './components/ResultsPage';
import { HistoryPage } from './components/HistoryPage';
import { HowItWorksPage } from './components/HowItWorksPage';
import { LandingPage } from './components/LandingPage';
import { ModelAuditPage } from './components/ModelAuditPage';
import { ModelResultsPage } from './components/ModelResultsPage';
import { SettingsPage } from './components/SettingsPage';
import { Chatbot } from './components/Chatbot';
import { Onboarding } from './components/Onboarding';
import { UserProfile, AuditResult, ModelAuditResult, UserSettings } from './types';
import { Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { TooltipProvider } from '@/components/ui/tooltip';

const DEFAULT_SETTINGS: UserSettings = {
  appearance: {
    theme: 'dark',
    fontSize: 'medium',
    accentColor: 'cyan'
  },
  notifications: {
    auditComplete: true,
    weeklyReport: false,
    newFeatures: true
  },
  analysisDefaults: {
    maxRows: 2000,
    protectedAttributes: ['Gender', 'Age', 'Race'],
    autoStart: false
  }
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-primary-bg p-8 text-center">
          <div className="w-20 h-20 bg-danger-red/10 rounded-3xl flex items-center justify-center mb-6 border border-danger-red/20">
            <AlertTriangle className="w-10 h-10 text-danger-red" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-4">SYSTEM ERROR DETECTED</h1>
          <p className="text-text-secondary max-w-md mb-8">
            An unexpected error occurred in the neural core. Our engineers have been notified.
          </p>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-left w-full max-w-2xl overflow-auto max-h-48 mb-8">
            <pre className="text-xs text-danger-red font-mono">
              {this.state.error?.message || String(this.state.error)}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-accent-cyan text-primary-bg px-8 py-3 rounded-xl font-display font-bold glow-cyan"
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('landing');
  const [selectedAudit, setSelectedAudit] = useState<AuditResult | null>(null);
  const [selectedModelAudit, setSelectedModelAudit] = useState<ModelAuditResult | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Apply settings on load
  useEffect(() => {
    const saved = localStorage.getItem('fairaudit_settings');
    const settings: UserSettings = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    
    // Theme
    document.documentElement.setAttribute('data-theme', settings.appearance.theme);
    if (settings.appearance.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    
    // Font Size
    const fontSizes = { small: '13px', medium: '15px', large: '17px', xl: '19px' };
    document.documentElement.style.fontSize = fontSizes[settings.appearance.fontSize];
    
    // Accent Color
    const colors = {
      cyan: '#00d4ff', purple: '#7c3aed', green: '#00ff88',
      orange: '#ff6b35', pink: '#ff2d92', gold: '#ffd700'
    };
    const color = colors[settings.appearance.accentColor] || '#00d4ff';
    document.documentElement.style.setProperty('--accent-primary', color);
    document.documentElement.style.setProperty('--accent-glow', `${color}66`);
  }, []);

  useEffect(() => {
    if (isGuest) return; // Stop Firebase Auth from interrupting guest session
    
    if (auth.isFallback) {
      setBackendError("Cloud services are currently unavailable. You can continue as a Guest.");
      setLoading(false);
      setIsAuthReady(true);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // Check onboarding status in Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let onboardingCompleted = false;
          if (userDocSnap.exists()) {
            onboardingCompleted = userDocSnap.data().onboardingCompleted || false;
          } else {
            // Create user doc if it doesn't exist
            await setDoc(userDocRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              onboardingCompleted: false,
              createdAt: new Date().toISOString()
            });
          }

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            onboardingCompleted
          });
          
          if (!onboardingCompleted) {
            setShowOnboarding(true);
          }

          setIsGuest(false);
        } else if (!isGuest) {
          setUser(null);
        }
        setLoading(false);
        setIsAuthReady(true);
        if (firebaseUser && (activeTab === 'landing' || activeTab === 'auth')) {
          setActiveTab('dashboard');
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Auth listener failed:", e);
      setBackendError("Cloud services are currently unavailable. You can continue as a Guest.");
      setLoading(false);
      setIsAuthReady(true);
    }
  }, [activeTab, isGuest]);

  const handleGuestMode = () => {
    setIsGuest(true);
    setUser({
      uid: 'guest-user',
      email: 'guest@fairaudit.pro',
      displayName: 'Guest Auditor',
      photoURL: null,
      onboardingCompleted: true
    });
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if (isGuest) {
      setIsGuest(false);
      setUser(null);
      setActiveTab('landing');
    } else {
      logout();
    }
  };

  const handleOnboardingComplete = async (startAudit: boolean) => {
    setShowOnboarding(false);
    if (user && user.uid !== 'guest-user') {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { onboardingCompleted: true });
      setUser(prev => prev ? { ...prev, onboardingCompleted: true } : null);
    }
    if (startAudit) {
      setActiveTab('new-audit');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleViewAudit = async (id: string, type: 'fairness' | 'model' = 'fairness') => {
    if (isGuest) {
      const storageKey = type === 'model' ? 'guest_model_audits' : 'guest_audits';
      const localAudits = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const audit = localAudits.find((a: any) => a.id === id);
      if (audit) {
        if (type === 'model') {
          setSelectedModelAudit(audit);
          setActiveTab('model-results');
        } else {
          setSelectedAudit(audit);
          setActiveTab('results');
        }
      }
      return;
    }
    const collectionName = type === 'model' ? 'model_audits' : 'audits';
    const path = `${collectionName}/${id}`;
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        if (type === 'model') {
          setSelectedModelAudit({ id: docSnap.id, ...docSnap.data() } as ModelAuditResult);
          setActiveTab('model-results');
        } else {
          setSelectedAudit({ id: docSnap.id, ...docSnap.data() } as AuditResult);
          setActiveTab('results');
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-primary-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-accent-cyan border-t-transparent rounded-full glow-cyan"
        />
        <p className="mt-8 font-display text-accent-cyan tracking-[0.5em] animate-pulse">INITIALIZING NEURAL CORE</p>
      </div>
    );
  }

  // If on landing page, show it regardless of auth (unless user is logged in and we want to skip it)
  if (activeTab === 'landing' && !user) {
    return <LandingPage onStart={() => setActiveTab('auth')} />;
  }

  if (activeTab === 'auth' && !user) {
    return <AuthPage onGuestMode={handleGuestMode} />;
  }

  if (!user) {
    return <LandingPage onStart={() => setActiveTab('auth')} />;
  }

  const userProfile: UserProfile = user!;

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Neural Dashboard';
      case 'new-audit': return 'Fairness Wizard';
      case 'model-audit': return 'Model Performance Audit';
      case 'history': return 'Audit Repository';
      case 'how-it-works': return 'Documentation';
      case 'settings': return 'System Settings';
      case 'results': return 'Analysis Report';
      case 'model-results': return 'Model Analysis Report';
      default: return 'FairAudit Pro';
    }
  };

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="flex h-screen bg-primary-bg text-white font-sans selection:bg-accent-cyan selection:text-primary-bg overflow-hidden">
          <Sidebar 
            activeTab={activeTab === 'results' ? 'history' : activeTab} 
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setSelectedAudit(null);
            }} 
            user={userProfile}
            onLogout={handleLogout}
          />
          
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {backendError && (
              <div className="bg-danger-red/20 border-b border-danger-red/30 px-4 py-2 text-center text-xs text-danger-red font-medium flex items-center justify-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                {backendError}
              </div>
            )}
            <Navbar 
              user={userProfile} 
              title={getPageTitle()} 
              onSettings={() => setActiveTab('settings')}
              onLogout={handleLogout}
            />
          
          <main className="flex-1 overflow-y-auto relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + (selectedAudit?.id || '')}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="min-h-full"
              >
                {activeTab === 'dashboard' && (
                  <Dashboard 
                    user={userProfile} 
                    onNewAudit={() => setActiveTab('new-audit')} 
                    onViewAudit={handleViewAudit}
                  />
                )}
                {activeTab === 'new-audit' && (
                  <NewAuditPage 
                    user={userProfile} 
                    onComplete={(result) => {
                      setSelectedAudit(result);
                      setActiveTab('results');
                    }}
                    onCancel={() => setActiveTab('dashboard')}
                  />
                )}
                {activeTab === 'model-audit' && (
                  <ModelAuditPage 
                    user={userProfile} 
                    onComplete={(result) => {
                      setSelectedModelAudit(result);
                      setActiveTab('model-results');
                    }}
                  />
                )}
                {activeTab === 'results' && selectedAudit && (
                  <ResultsPage 
                    result={selectedAudit} 
                    user={userProfile}
                    onBack={() => setActiveTab('dashboard')} 
                  />
                )}
                {activeTab === 'model-results' && selectedModelAudit && (
                  <ModelResultsPage 
                    result={selectedModelAudit} 
                    onBack={() => setActiveTab('dashboard')} 
                  />
                )}
                {activeTab === 'history' && (
                  <HistoryPage 
                    user={userProfile} 
                    onViewAudit={handleViewAudit}
                  />
                )}
                {activeTab === 'how-it-works' && (
                  <HowItWorksPage />
                )}
                {activeTab === 'settings' && (
                  <SettingsPage 
                    user={userProfile} 
                    onReplayTour={() => {
                      setShowOnboarding(true);
                      setActiveTab('dashboard');
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
          
          <Chatbot user={userProfile} latestAudit={selectedAudit} />
          
          <AnimatePresence>
            {showOnboarding && (
              <Onboarding 
                user={userProfile} 
                onComplete={handleOnboardingComplete} 
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
    </ErrorBoundary>
  );
}
