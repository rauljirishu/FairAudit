import React from 'react';
import { motion } from 'motion/react';
import { Severity } from '../types';

interface SeverityMeterProps {
  severity: Severity;
}

export function SeverityMeter({ severity }: SeverityMeterProps) {
  const angles = {
    'LOW': -60,
    'MEDIUM': -20,
    'HIGH': 20,
    'CRITICAL': 60
  };

  const colors = {
    'LOW': '#00ff88',
    'MEDIUM': '#ffcc00',
    'HIGH': '#ff6b35',
    'CRITICAL': '#ff2d55'
  };

  return (
    <div className="relative w-64 h-40 flex flex-col items-center justify-end overflow-hidden">
      {/* Gauge Background */}
      <div className="absolute bottom-0 w-64 h-64 rounded-full border-[16px] border-white/5" />
      
      {/* Gauge Track */}
      <svg className="absolute bottom-0 w-64 h-32" viewBox="0 0 100 50">
        <path 
          d="M 10 50 A 40 40 0 0 1 90 50" 
          fill="none" 
          stroke="rgba(255,255,255,0.05)" 
          strokeWidth="8" 
          strokeLinecap="round"
        />
        <motion.path 
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          d="M 10 50 A 40 40 0 0 1 90 50" 
          fill="none" 
          stroke={`url(#gauge-gradient-${severity})`}
          strokeWidth="8" 
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id={`gauge-gradient-${severity}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00ff88" />
            <stop offset="33%" stopColor="#ffcc00" />
            <stop offset="66%" stopColor="#ff6b35" />
            <stop offset="100%" stopColor="#ff2d55" />
          </linearGradient>
        </defs>
      </svg>

      {/* Needle */}
      <motion.div 
        initial={{ rotate: -90 }}
        animate={{ rotate: angles[severity] || 0 }}
        transition={{ duration: 2, type: "spring", stiffness: 50 }}
        className="absolute bottom-0 w-1 h-28 bg-white origin-bottom rounded-full z-10 shadow-[0_0_15px_rgba(255,255,255,0.5)]"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
      </motion.div>

      {/* Center Point */}
      <div className="absolute bottom-0 w-6 h-6 bg-primary-bg border-4 border-white rounded-full z-20" />

      {/* Label */}
      <div className="mb-4 text-center z-20">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-xs font-display uppercase tracking-wide text-text-secondary"
        >
          Severity Level
        </motion.p>
        <motion.h3 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
          style={{ color: colors[severity] }}
          className="text-2xl font-display font-semibold tracking-tight"
        >
          {severity}
        </motion.h3>
      </div>
    </div>
  );
}
