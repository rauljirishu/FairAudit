import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ArrowRight, ArrowLeft, Shield, Brain, 
  Globe, Upload, Settings, BarChart3, 
  CheckCircle2, FileText, Wrench, Download,
  Sparkles, Star, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/src/lib/utils';
import confetti from 'canvas-confetti';
import { Logo } from './Logo';

interface OnboardingProps {
  user: { displayName: string | null };
  onComplete: (startAudit: boolean) => void;
}

export function Onboarding({ user, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const nextStep = () => setStep(s => Math.min(s + 1, 6));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  useEffect(() => {
    if (step === 1 || step === 6) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00d4ff', '#7c3aed', '#00ff88']
      });
    }
  }, [step]);

  const steps = [
    { id: 1, title: "Welcome" },
    { id: 2, title: "Upload" },
    { id: 3, title: "Configure" },
    { id: 4, title: "Analyze" },
    { id: 5, title: "Fix & Export" },
    { id: 6, title: "Ready" }
  ];

  const handleDownloadSample = () => {
    const csvContent = "name,age,gender,education,experience_years,hired\nAlice Johnson,28,female,masters,4,1\nBob Smith,34,male,bachelors,8,1\nCarol White,26,female,bachelors,2,0\nDavid Brown,45,male,masters,15,1\nEmma Davis,31,female,masters,6,0\nFrank Wilson,29,male,bachelors,5,1\nGrace Lee,24,female,bachelors,1,0\nHenry Taylor,38,male,masters,12,1\nIsabella Moore,27,female,masters,3,1\nJames Anderson,52,male,bachelors,20,1\nKatherine Jackson,33,female,bachelors,7,0\nLiam Martinez,30,male,masters,6,1\nMia Thompson,25,female,bachelors,2,0\nNoah Garcia,41,male,bachelors,14,1\nOlivia Robinson,29,female,masters,5,1\nPeter Clark,36,male,bachelors,10,1\nQuinn Rodriguez,28,female,masters,4,0\nRyan Lewis,44,male,masters,18,1\nSarah Walker,32,female,bachelors,7,0\nThomas Hall,27,male,bachelors,4,1";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_hiring_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="absolute top-8 right-8 z-10">
        <button 
          onClick={() => setShowSkipConfirm(true)}
          className="text-text-secondary hover:text-white text-sm font-display uppercase tracking-widest transition-colors"
        >
          Skip Tour
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-5xl"
        >
          {step === 1 && (
            <div className="text-center space-y-8">
              <div className="flex flex-col items-center space-y-6">
                <motion.div 
                  animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                >
                  <Logo size="lg" glow />
                </motion.div>
                <div className="space-y-2">
                  <h1 className="text-5xl md:text-6xl font-display font-bold text-white tracking-tight">
                    Welcome to FairAudit! 🎉
                  </h1>
                  <p className="text-xl text-accent-cyan font-display tracking-wide uppercase">
                    Your AI-powered bias detection platform
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <Badge icon="🔍" label="Detect Bias" />
                <Badge icon="⚖️" label="Ensure Fairness" />
                <Badge icon="🤖" label="AI Powered" />
              </div>

              <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
                You are now part of a mission to make AI fairer for everyone. 
                This quick tour will show you exactly how to use FairAudit in under 2 minutes.
              </p>

              <div className="pt-8">
                <Button 
                  onClick={nextStep}
                  className="bg-accent-cyan hover:bg-accent-cyan/80 text-primary-bg font-display font-bold px-12 py-8 text-xl rounded-full glow-cyan transition-all group"
                >
                  NEXT →
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-accent-cyan/10 flex items-center justify-center border border-accent-cyan/20">
                    <Upload className="w-8 h-8 text-accent-cyan animate-bounce" />
                  </div>
                  <h2 className="text-4xl font-display font-bold text-white">Step 1: Upload Your Dataset</h2>
                </div>
                
                <p className="text-lg text-text-secondary">
                  Start by uploading your data as a CSV file. This could be:
                </p>

                <div className="space-y-3">
                  <CheckItem label="Hiring data (applicants and outcomes)" delay={0.2} />
                  <CheckItem label="Loan approval records" delay={0.4} />
                  <CheckItem label="Medical treatment data" delay={0.6} />
                  <CheckItem label="Any dataset with decisions about people" delay={0.8} />
                </div>

                <div className="p-6 glass border-accent-cyan/20 rounded-2xl space-y-4">
                  <p className="text-sm text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent-cyan" />
                    💡 Don't have a dataset? Download our sample hiring dataset to try it out
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadSample}
                    className="w-full border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/10 rounded-xl"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Sample CSV
                  </Button>
                </div>
              </div>

              <div className="relative aspect-square glass rounded-[3rem] border-white/5 overflow-hidden flex items-center justify-center p-12">
                <div className="w-full h-full border-4 border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center space-y-6">
                  <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-24 h-24 bg-accent-cyan/10 rounded-3xl flex items-center justify-center border-2 border-accent-cyan/30"
                  >
                    <FileText className="w-12 h-12 text-accent-cyan" />
                  </motion.div>
                  <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="h-full bg-accent-cyan"
                    />
                  </div>
                  <motion.p 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-success-neon font-display font-bold"
                  >
                    Dataset uploaded successfully!
                  </motion.p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-accent-purple/10 flex items-center justify-center border border-accent-purple/20">
                    <Settings className="w-8 h-8 text-accent-purple animate-spin-slow" />
                  </div>
                  <h2 className="text-4xl font-display font-bold text-white">Step 2: Configure Your Audit</h2>
                </div>
                
                <p className="text-lg text-text-secondary">
                  Tell FairAudit two things:
                </p>

                <div className="space-y-4">
                  <ConfigCard 
                    icon={<Globe className="w-6 h-6" />} 
                    title="Outcome Column" 
                    text="Which column shows the final decision? Example: 'hired' (1=yes, 0=no)"
                  />
                  <ConfigCard 
                    icon={<Users className="w-6 h-6" />} 
                    title="Protected Attribute" 
                    text="Which group do you want to check for bias? Example: gender, age, race"
                  />
                </div>
              </div>

              <div className="glass rounded-[3rem] border-white/5 p-12 space-y-8">
                <div className="space-y-4">
                  <p className="text-xs font-display uppercase tracking-widest text-text-secondary">Outcome Selector</p>
                  <motion.div 
                    animate={{ borderColor: ['rgba(255,255,255,0.1)', '#00d4ff', 'rgba(255,255,255,0.1)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center"
                  >
                    <span className="text-white font-medium">hired</span>
                    <ArrowRight className="w-4 h-4 text-accent-cyan" />
                  </motion.div>
                </div>
                <div className="space-y-4">
                  <p className="text-xs font-display uppercase tracking-widest text-text-secondary">Protected Attribute Selector</p>
                  <motion.div 
                    animate={{ borderColor: ['rgba(255,255,255,0.1)', '#7c3aed', 'rgba(255,255,255,0.1)'] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center"
                  >
                    <span className="text-white font-medium">gender</span>
                    <ArrowRight className="w-4 h-4 text-accent-purple" />
                  </motion.div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-success-neon/10 flex items-center justify-center border border-success-neon/20">
                  <BarChart3 className="w-8 h-8 text-success-neon" />
                </div>
                <h2 className="text-4xl font-display font-bold text-white">Step 3: Read Your Results</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <ResultExplanationCard 
                  title="Severity Badge"
                  text="Your overall bias severity level. GREEN = Fair, RED = Action needed immediately"
                  preview={
                    <motion.div 
                      animate={{ backgroundColor: ['#00ff8822', '#ff9f0a22', '#ff2d5522', '#00ff8822'] }}
                      className="px-4 py-2 rounded-lg border border-white/10 font-display font-bold text-xs"
                    >
                      CRITICAL
                    </motion.div>
                  }
                />
                <ResultExplanationCard 
                  title="Bias Metrics"
                  text="Exact measurements showing HOW MUCH bias exists. Values above threshold = problem detected"
                  preview={
                    <div className="flex items-end gap-1 h-12">
                      <motion.div animate={{ height: [10, 40, 10] }} transition={{ repeat: Infinity, duration: 2 }} className="w-3 bg-accent-cyan rounded-t-sm" />
                      <motion.div animate={{ height: [30, 10, 30] }} transition={{ repeat: Infinity, duration: 2 }} className="w-3 bg-accent-purple rounded-t-sm" />
                      <motion.div animate={{ height: [20, 35, 20] }} transition={{ repeat: Infinity, duration: 2 }} className="w-3 bg-success-neon rounded-t-sm" />
                    </div>
                  }
                />
                <ResultExplanationCard 
                  title="AI Explanation"
                  text="Google Gemini AI explains what the numbers mean in plain simple language. No technical knowledge needed."
                  preview={
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent-cyan animate-pulse" />
                      <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                        <motion.div animate={{ x: [-100, 100] }} transition={{ repeat: Infinity, duration: 1.5 }} className="h-full w-1/2 bg-accent-cyan" />
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-warning-orange/10 flex items-center justify-center border border-warning-orange/20">
                    <Wrench className="w-8 h-8 text-warning-orange" />
                  </div>
                  <h2 className="text-4xl font-display font-bold text-white">Step 4: Get Fix Recommendations</h2>
                </div>
                
                <p className="text-lg text-text-secondary">
                  FairAudit gives you specific actionable steps to reduce the bias found in your data. Not generic advice — specific to YOUR dataset.
                </p>

                <div className="space-y-3">
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 glass border-white/5 rounded-xl text-sm text-white"
                  >
                    1. Rebalance training data...
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 glass border-white/5 rounded-xl text-sm text-white"
                  >
                    2. Remove proxy features...
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="p-4 glass border-white/5 rounded-xl text-sm text-white"
                  >
                    3. Apply threshold adjustment...
                  </motion.div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-accent-cyan/10 flex items-center justify-center border border-accent-cyan/20">
                    <FileText className="w-8 h-8 text-accent-cyan" />
                  </div>
                  <h2 className="text-4xl font-display font-bold text-white">Step 5: Download Your Report</h2>
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-0 bg-accent-cyan/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative glass rounded-3xl border-white/10 p-8 flex flex-col items-center space-y-6">
                    <motion.div 
                      animate={{ rotateY: [0, 180, 360] }}
                      transition={{ repeat: Infinity, duration: 4 }}
                      className="w-32 h-40 bg-white/5 border-2 border-white/10 rounded-xl flex items-center justify-center"
                    >
                      <FileText className="w-12 h-12 text-accent-cyan/50" />
                    </motion.div>
                    <Button className="bg-accent-cyan text-primary-bg font-display font-bold rounded-xl px-8 py-6 glow-cyan">
                      <Download className="w-4 h-4 mr-2" />
                      DOWNLOAD PDF
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="text-center space-y-12">
              <div className="flex flex-col items-center space-y-6">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  className="w-32 h-32 rounded-full bg-success-neon/20 flex items-center justify-center border-4 border-success-neon relative"
                >
                  <CheckCircle2 className="w-16 h-16 text-success-neon" />
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-full border-4 border-success-neon"
                  />
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        x: [0, Math.cos(i * 45) * 100], 
                        y: [0, Math.sin(i * 45) * 100],
                        opacity: [1, 0]
                      }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                      className="absolute w-2 h-2 bg-success-neon rounded-full"
                    />
                  ))}
                </motion.div>
                
                <div className="space-y-2">
                  <h2 className="text-5xl md:text-6xl font-display font-bold text-white tracking-tight">
                    You're All Set! 🚀
                  </h2>
                  <p className="text-xl text-text-secondary">
                    You now know everything to audit AI systems for bias
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-12">
                <RecapItem icon={<Upload />} label="Upload" />
                <RecapItem icon={<Settings />} label="Configure" />
                <RecapItem icon={<BarChart3 />} label="Analyze" />
                <RecapItem icon={<FileText />} label="Export" />
              </div>

              <div className="space-y-8">
                <p className="text-2xl font-display text-white">
                  Welcome aboard, <span className="text-accent-cyan">{user.displayName?.split(' ')[0] || 'Auditor'}</span>! Ready to make AI fairer for everyone?
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                  <Button 
                    onClick={() => onComplete(true)}
                    className="bg-accent-cyan hover:bg-accent-cyan/80 text-primary-bg font-display font-bold px-12 py-8 text-xl rounded-full glow-cyan transition-all group w-full md:w-auto"
                  >
                    START MY FIRST AUDIT →
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => onComplete(false)}
                    className="text-white hover:bg-white/5 font-display font-bold px-12 py-8 text-xl rounded-full w-full md:w-auto"
                  >
                    GO TO DASHBOARD
                  </Button>
                </div>
                <p className="text-xs text-text-secondary uppercase tracking-widest">
                  You can replay this tour anytime from Settings → Help
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation & Progress */}
      {step < 6 && (
        <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center space-y-6">
          <div className="flex items-center gap-8">
            {step > 1 && (
              <Button 
                variant="ghost" 
                onClick={prevStep}
                className="text-text-secondary hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                BACK
              </Button>
            )}
            
            <div className="flex items-center gap-3">
              {steps.map((s) => (
                <div 
                  key={s.id}
                  className={cn(
                    "transition-all duration-500 rounded-full",
                    step === s.id ? "w-8 h-3 bg-accent-cyan glow-cyan" : 
                    step > s.id ? "w-3 h-3 bg-accent-cyan/40" : "w-3 h-3 bg-white/10"
                  )}
                />
              ))}
            </div>

            <Button 
              onClick={nextStep}
              className="bg-white text-primary-bg hover:bg-white/90 font-bold px-8 rounded-xl"
            >
              NEXT
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] font-display font-bold text-accent-cyan tracking-widest uppercase">
              Step {step} of 6
            </p>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest">
              About {7 - step} minute{7 - step !== 1 ? 's' : ''} remaining
            </p>
          </div>
        </div>
      )}

      {/* Skip Confirmation */}
      <AnimatePresence>
        {showSkipConfirm && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass border-white/10 p-8 rounded-[2rem] max-w-sm text-center space-y-6"
            >
              <div className="w-16 h-16 bg-warning-orange/10 rounded-2xl flex items-center justify-center border border-warning-orange/20 mx-auto">
                <Shield className="w-8 h-8 text-warning-orange" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-display font-bold text-white">SKIP TOUR?</h3>
                <p className="text-sm text-text-secondary">Are you sure you want to skip the tour? You can always replay it from Settings.</p>
              </div>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => onComplete(false)}
                  className="bg-danger-red hover:bg-danger-red/80 text-white font-bold rounded-xl"
                >
                  YES, SKIP TOUR
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setShowSkipConfirm(false)}
                  className="text-white hover:bg-white/5 font-bold rounded-xl"
                >
                  CONTINUE TOUR
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Badge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="px-4 py-2 glass border-white/10 rounded-full flex items-center gap-2 text-sm text-white font-display">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function CheckItem({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 text-white"
    >
      <div className="w-5 h-5 rounded-full bg-success-neon/20 flex items-center justify-center border border-success-neon/30">
        <CheckCircle2 className="w-3 h-3 text-success-neon" />
      </div>
      <span className="text-sm">{label}</span>
    </motion.div>
  );
}

function ConfigCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="p-4 glass border-white/5 rounded-2xl flex gap-4">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-accent-cyan border border-white/10 shrink-0">
        {icon}
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="text-xs text-text-secondary leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function ResultExplanationCard({ title, text, preview }: { title: string; text: string; preview: React.ReactNode }) {
  return (
    <div className="p-6 glass border-white/5 rounded-3xl space-y-6 flex flex-col items-center text-center">
      <div className="h-20 flex items-center justify-center">
        {preview}
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="text-xs text-text-secondary leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function RecapItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-accent-cyan border border-white/10">
        {icon}
      </div>
      <span className="text-[10px] font-display font-bold text-text-secondary uppercase tracking-widest">{label}</span>
    </div>
  );
}
