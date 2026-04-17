import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';
import { ParticleBackground } from './ParticleBackground';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Brain, Globe, BookOpen } from 'lucide-react';
import { Onboarding } from './Onboarding';

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    // Show manual automatically on first visit per session
    const hasSeenManual = sessionStorage.getItem('seenLandingManual');
    if (!hasSeenManual) {
      setShowManual(true);
      sessionStorage.setItem('seenLandingManual', 'true');
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-primary-bg flex flex-col items-center justify-center px-4">
      <ParticleBackground />
      
      <div className="absolute top-6 right-8 z-40 flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => setShowManual(true)}
          className="border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/10 rounded-full font-display uppercase tracking-widest text-xs"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          User Manual
        </Button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center max-w-4xl"
      >
        <Logo size="lg" className="mb-8" />
        
        <motion.h1 
          className="text-5xl md:text-7xl font-display font-semibold mb-6 text-glow-cyan"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          FAIRAUDIT HR
        </motion.h1>
        
        <motion.p 
          className="text-2xl md:text-3xl font-display text-accent-cyan mb-4 tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          DETECT. UNDERSTAND. FIX AI BIAS.
        </motion.p>
        
        <motion.p 
          className="text-text-secondary text-lg mb-12 max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          The industry-standard AI fairness auditing platform for HR teams. Ensure your hiring process is objective, bias-free, and aligned with SDG 10 (Reduced Inequality).
          Powered by <span className="text-accent-purple font-bold">Google Gemini AI</span>.
        </motion.p>
        
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={onStart}
              className="bg-accent-cyan hover:bg-accent-cyan/80 text-primary-bg font-display font-bold px-10 py-8 text-xl rounded-full glow-cyan transition-all group"
            >
              START AUDITING
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Button>
        </motion.div>
      </motion.div>
      
      {/* Stats Counter */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-12 w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 px-8"
      >
        <StatItem label="Candidates Audited" value="1M+" icon={<Shield className="w-5 h-5" />} />
        <StatItem label="Bias Mitigated" value="85% AVG" icon={<Brain className="w-5 h-5" />} />
        <StatItem label="HR Teams" value="500+" icon={<Globe className="w-5 h-5" />} />
      </motion.div>

      <AnimatePresence>
        {showManual && (
          <Onboarding 
            user={{ displayName: "Guest" }} 
            onComplete={(startAudit) => {
              setShowManual(false);
              onStart();
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center md:items-start p-6 glass rounded-2xl border-white/5">
      <div className="flex items-center gap-3 mb-2 text-accent-cyan">
        {icon}
        <span className="text-xs font-display uppercase tracking-wide opacity-60">{label}</span>
      </div>
      <motion.span 
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        className="text-3xl font-display font-semibold text-white"
      >
        {value}
      </motion.span>
    </div>
  );
}
