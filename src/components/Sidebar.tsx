import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Info, 
  LogOut, 
  Search, 
  Bell,
  ChevronRight,
  Brain,
  Settings,
  Scale,
  ActivitySquare,
  Users,
  Trophy,
  History as Clock,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { UserProfile } from '../types';
import { Logo } from './Logo';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserProfile;
  onLogout: () => void;
}

export function Sidebar({ activeTab, setActiveTab, user, onLogout }: SidebarProps) {
  let menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'analyst', 'viewer'] },
    { id: 'new-audit', label: 'New Audit', icon: PlusCircle, roles: ['admin', 'analyst'] },
    { id: 'model-audit', label: 'Model Audit', icon: Brain, roles: ['admin', 'analyst'] },
    { id: 'compare', label: 'Compare', icon: Scale, roles: ['admin', 'analyst', 'viewer'] },
    { id: 'monitor', label: 'Monitor', icon: ActivitySquare, roles: ['admin', 'analyst'] },
    { id: 'team', label: 'Team', icon: Users, roles: ['admin', 'analyst', 'viewer'] },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, roles: ['admin', 'analyst', 'viewer'] },
    { id: 'history', label: 'Audit History', icon: History, roles: ['admin', 'analyst', 'viewer'] },
    { id: 'audit-logs', label: 'Audit Logs', icon: Clock, roles: ['admin', 'analyst', 'viewer'] },
    { id: 'admin-panel', label: 'Admin Panel', icon: ShieldAlert, roles: ['admin'] },
    { id: 'how-it-works', label: 'How It Works', icon: Info, roles: ['admin', 'analyst', 'viewer'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'analyst', 'viewer'] },
  ];

  menuItems = menuItems.filter(item => item.roles.includes(user.role || 'analyst'));

  return (
    <div className="w-72 h-screen glass border-r border-white/5 flex flex-col relative z-20">
      <div className="p-8 flex items-center gap-4">
        <Logo size="sm" />
        <span className="font-display font-bold text-xl tracking-tight text-glow-cyan">FAIRAUDIT</span>
      </div>
      
      <div className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 glow-cyan" 
                  : "text-text-secondary hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-glow-cyan")} />
                <span className={cn("font-medium tracking-wide", isActive ? "font-medium" : "font-normal")}>{item.label}</span>
              </div>
              {isActive && (
                <motion.div 
                  layoutId="active-indicator"
                  className="w-1.5 h-1.5 rounded-full bg-accent-cyan shadow-[0_0_10px_#00d4ff]" 
                />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="p-6 mt-auto">
        <div className="glass rounded-2xl p-4 border-white/5 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=00d4ff&color=050510`} 
                alt={user.displayName || 'User'} 
                className="w-10 h-10 rounded-full border border-accent-cyan/30"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-success-neon rounded-full border-2 border-primary-bg" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName || 'User'}</p>
              <p className="text-xs text-text-secondary truncate">{user.email}</p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-danger-red hover:bg-danger-red/10 transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
