import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, animate } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'red' | 'green' | 'purple';
  suffix?: string;
}

export function StatCard({ label, value, icon: Icon, color, suffix = "" }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
      ease: "easeOut"
    });
    return () => controls.stop();
  }, [value]);

  const colorClasses = {
    blue: "from-blue-500/20 to-accent-cyan/20 border-accent-cyan/30 text-accent-cyan shadow-[0_0_20px_rgba(0,212,255,0.1)]",
    red: "from-red-500/20 to-danger-red/20 border-danger-red/30 text-danger-red shadow-[0_0_20px_rgba(255,45,85,0.1)]",
    green: "from-green-500/20 to-success-neon/20 border-success-neon/30 text-success-neon shadow-[0_0_20px_rgba(0,255,136,0.1)]",
    purple: "from-purple-500/20 to-accent-purple/20 border-accent-purple/30 text-accent-purple shadow-[0_0_20px_rgba(124,58,237,0.1)]"
  };

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className={cn(
        "relative overflow-hidden glass rounded-3xl p-6 border bg-gradient-to-br",
        colorClasses[color]
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <Icon className="w-6 h-6" />
        </div>
        <div className="h-1 w-12 bg-white/10 rounded-full" />
      </div>
      
      <p className="text-xs font-display uppercase tracking-wide text-text-secondary mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-display font-semibold text-white">
          {displayValue.toLocaleString()}
        </span>
        <span className="text-lg font-display font-semibold text-white/40">{suffix}</span>
      </div>

      {/* Decorative background element */}
      <div className={cn(
        "absolute -bottom-6 -right-6 w-24 h-24 blur-3xl opacity-20 rounded-full",
        color === 'blue' && "bg-accent-cyan",
        color === 'red' && "bg-danger-red",
        color === 'green' && "bg-success-neon",
        color === 'purple' && "bg-accent-purple"
      )} />
    </motion.div>
  );
}
