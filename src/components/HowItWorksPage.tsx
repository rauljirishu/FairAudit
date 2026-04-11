import React from 'react';
import { 
  Upload, Brain, Search, CheckCircle2, 
  ChevronDown, Database, Cpu, ShieldCheck, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function HowItWorksPage() {
  const steps = [
    {
      title: "UPLOAD DATASET",
      description: "Securely upload your CSV dataset. Our system handles data ingestion with enterprise-grade encryption.",
      icon: Upload,
      color: "text-accent-cyan",
      bg: "bg-accent-cyan/10",
      animation: { y: [0, -10, 0], transition: { duration: 2, repeat: Infinity } }
    },
    {
      title: "NEURAL ANALYSIS",
      description: "Our proprietary algorithms compute demographic parity, disparate impact, and individual fairness metrics.",
      icon: Cpu,
      color: "text-accent-purple",
      bg: "bg-accent-purple/10",
      animation: { rotate: [0, 360], transition: { duration: 8, repeat: Infinity, ease: "linear" as const } }
    },
    {
      title: "AI EXPLANATION",
      description: "Google Gemini 1.5 Pro analyzes the metrics to provide human-readable insights and root-cause analysis.",
      icon: Brain,
      color: "text-success-neon",
      bg: "bg-success-neon/10",
      animation: { scale: [1, 1.1, 1], transition: { duration: 3, repeat: Infinity } }
    },
    {
      title: "FIX & DEPLOY",
      description: "Receive actionable recommendations to mitigate bias and export certified fairness reports.",
      icon: ShieldCheck,
      color: "text-warning-orange",
      bg: "bg-warning-orange/10",
      animation: { opacity: [0.5, 1, 0.5], transition: { duration: 2, repeat: Infinity } }
    }
  ];

  const faqs = [
    {
      q: "How does FairAudit detect bias?",
      a: "We use a combination of statistical fairness metrics (like Demographic Parity and Equalized Odds) and advanced AI analysis to identify patterns of discrimination across protected attributes like race, gender, and age."
    },
    {
      q: "Is my data secure?",
      a: "Yes. All datasets are encrypted at rest and in transit. We only process the first 2000 rows for analysis, and data can be deleted at any time from your history."
    },
    {
      q: "What is the role of Gemini AI?",
      a: "Gemini AI acts as a senior fairness auditor. It takes the raw statistical metrics and translates them into actionable business insights, explaining 'why' bias might be occurring and 'how' to fix it."
    },
    {
      q: "Can I use this for production models?",
      a: "Absolutely. FairAudit is designed to be part of your MLOps pipeline, providing certification-ready reports for compliance and internal auditing."
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-24 pb-24">
      {/* Hero */}
      <div className="text-center space-y-6">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-5xl font-display font-semibold text-white tracking-tighter"
        >
          HOW IT <span className="text-accent-cyan">WORKS</span>
        </motion.h1>
        <p className="text-text-secondary text-xl max-w-2xl mx-auto">
          A 4-step automated pipeline to ensure your AI models are fair, transparent, and compliant.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-accent-cyan/30 transition-all h-full">
              <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
                <motion.div 
                  animate={step.animation}
                  className={cn("w-20 h-20 rounded-3xl flex items-center justify-center mb-4", step.bg)}
                >
                  <step.icon className={cn("w-10 h-10", step.color)} />
                </motion.div>
                <h3 className="text-2xl font-display font-semibold text-white tracking-wide">{step.title}</h3>
                <p className="text-text-secondary leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="space-y-12">
        <div className="text-center">
          <h2 className="text-3xl font-display font-semibold text-white tracking-wide">FREQUENTLY ASKED QUESTIONS</h2>
          <div className="h-1 w-24 bg-accent-cyan mx-auto mt-4 rounded-full" />
        </div>

        <div className="glass rounded-[2.5rem] border-white/5 p-8">
          <Accordion className="w-full space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-white/5 px-4">
                <AccordionTrigger className="text-left text-white font-bold hover:text-accent-cyan transition-colors py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-text-secondary text-base leading-relaxed pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="text-center space-y-12">
        <h3 className="text-sm font-display font-semibold text-text-secondary tracking-[0.3em] uppercase">Built with Industry Leading Tech</h3>
        <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all">
          <TechLogo name="Firebase" />
          <TechLogo name="Gemini AI" />
          <TechLogo name="React" />
          <TechLogo name="Tailwind" />
          <TechLogo name="Framer" />
        </div>
      </div>
    </div>
  );
}

function TechLogo({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-white/10 rounded-lg" />
      <span className="font-display font-semibold text-lg tracking-tight text-white">{name.toUpperCase()}</span>
    </div>
  );
}
