import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, signInWithGoogle } from '../firebase';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { Shield, Lock, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react';
import { ParticleBackground } from './ParticleBackground';

interface AuthPageProps {
  onGuestMode: () => void;
}

export function AuthPage({ onGuestMode }: AuthPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login failed:", error);
      setError(error.message || "Authentication failed. The backend might be suspended.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-primary-bg flex items-center justify-center p-4 relative overflow-hidden">
      <ParticleBackground />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass border-white/5 rounded-[2.5rem] p-12 text-center space-y-8 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent-cyan/20 blur-[80px] rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent-purple/20 blur-[80px] rounded-full" />

          <div className="flex flex-col items-center space-y-4">
            <Logo size="lg" />
            <h1 className="text-3xl font-display font-semibold text-white tracking-wide">SECURE ACCESS</h1>
            <p className="text-text-secondary text-sm max-w-[240px] mx-auto">
              Sign in to access the FairAudit Pro neural analysis dashboard.
            </p>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="p-4 bg-danger-red/10 border border-danger-red/20 rounded-2xl text-xs text-danger-red text-left flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold uppercase tracking-wider">Backend Error</p>
                  <p className="opacity-80">{error}</p>
                </div>
              </div>
            )}

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={handleGoogleLogin} 
                disabled={loading}
                className="w-full bg-white text-primary-bg hover:bg-white/90 font-semibold h-14 rounded-2xl flex items-center justify-center gap-3"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                {loading ? "AUTHENTICATING..." : "CONTINUE WITH GOOGLE"}
              </Button>
            </motion.div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-primary-bg px-2 text-text-secondary">OR</span></div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={onGuestMode}
                variant="outline"
                className="w-full border-white/10 text-white hover:bg-white/5 h-14 rounded-2xl flex items-center justify-center gap-3"
              >
                <ArrowRight className="w-5 h-5" />
                CONTINUE AS GUEST
              </Button>
            </motion.div>
            
            <p className="text-[10px] text-text-secondary uppercase tracking-wide">
              Enterprise-grade security guaranteed
            </p>
          </div>

          <div className="pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
            <AuthFeature icon={<Lock className="w-4 h-4" />} label="AES-256" />
            <AuthFeature icon={<Shield className="w-4 h-4" />} label="SOC2 COMPLIANT" />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-text-secondary text-xs flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 text-accent-cyan" />
            Trusted by 500+ AI Research Labs
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function AuthFeature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-text-secondary">
      <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
        {icon}
      </div>
      <span className="text-[10px] font-display font-bold tracking-widest">{label}</span>
    </div>
  );
}
