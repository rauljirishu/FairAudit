import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
}

export function Logo({ className, size = 'md', glow = true }: LogoProps) {
  const [error, setError] = useState(false);

  const sizes = {
    sm: 'h-[40px]',
    md: 'h-[60px]',
    lg: 'h-[80px]',
    xl: 'h-[120px]',
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <motion.div 
      initial={glow ? { scale: 1 } : false}
      animate={glow ? { 
        scale: [1, 1.02, 1],
        filter: [
          'drop-shadow(0 0 10px rgba(0, 212, 255, 0.2))',
          'drop-shadow(0 0 20px rgba(0, 212, 255, 0.4))',
          'drop-shadow(0 0 10px rgba(0, 212, 255, 0.2))'
        ]
      } : false}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className={cn("flex items-center justify-center relative", className)}
    >
      {!error ? (
        <img 
          src="/logo.png" 
          alt="FairAudit" 
          height={size === 'sm' ? 40 : size === 'md' ? 60 : size === 'lg' ? 80 : 120}
          className={cn("object-contain w-auto", sizes[size])}
          onError={() => setError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className={cn("flex items-center justify-center text-accent-cyan", iconSizes[size])}>
          <ShieldCheck className="w-full h-full" />
        </div>
      )}
      
      {glow && (
        <div className="absolute inset-0 bg-accent-cyan/10 blur-2xl -z-10 rounded-full" />
      )}
    </motion.div>
  );
}
