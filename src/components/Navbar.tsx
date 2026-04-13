import React, { useState } from 'react';
import { Search, Bell, Settings, HelpCircle, LogOut, User, Shield, Info } from 'lucide-react';
import { UserProfile } from '../types';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';

interface NavbarProps {
  user: UserProfile;
  title: string;
  onSettings: () => void;
  onLogout: () => void;
}

export function Navbar({ user, title, onSettings, onLogout }: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-20 glass border-b border-white/5 px-8 flex items-center justify-between relative z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <Logo size="sm" glow={false} />
          <span className="font-display font-bold text-xl tracking-tight text-glow-cyan hidden lg:block">FAIRAUDIT</span>
        </div>
        
        <div className="h-8 w-[1px] bg-white/10 mx-2 hidden lg:block" />
        
        <h2 className="font-display text-lg font-semibold tracking-wide text-white/80 uppercase">{title}</h2>
        
        <div className="hidden xl:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 w-80 focus-within:border-accent-cyan/50 transition-all">
          <Search className="w-4 h-4 text-text-secondary mr-2" />
          <input 
            type="text" 
            placeholder="Search audits, datasets..." 
            className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-text-secondary/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <NavIcon 
              icon={<Bell className="w-5 h-5" />} 
              badge 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
            />
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 glass border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <span className="text-xs font-display font-bold text-white">NOTIFICATIONS</span>
                    <span className="text-[10px] text-accent-cyan cursor-pointer hover:underline">Mark all as read</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    <NotificationItem 
                      title="Audit Complete" 
                      time="2m ago" 
                      description="Dataset 'hiring_2024.csv' analysis finished."
                      icon={<Shield className="w-4 h-4 text-success-neon" />}
                    />
                    <NotificationItem 
                      title="System Update" 
                      time="1h ago" 
                      description="Neural core updated to v2.4.5."
                      icon={<Info className="w-4 h-4 text-accent-cyan" />}
                    />
                    <NotificationItem 
                      title="Team Alert" 
                      time="2h ago" 
                      description="John shared an audit with you."
                      icon={<Info className="w-4 h-4 text-accent-purple" />}
                    />
                    <NotificationItem 
                      title="Monitor Alert" 
                      time="3h ago" 
                      description="⚠️ Monitor Alert: hiring dataset bias increased."
                      icon={<Info className="w-4 h-4 text-danger-red" />}
                    />
                    <div className="p-8 text-center">
                      <p className="text-xs text-text-secondary">No more notifications</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <NavIcon icon={<HelpCircle className="w-5 h-5" />} />
          <NavIcon icon={<Settings className="w-5 h-5" />} onClick={onSettings} />
        </div>
        
        <div className="h-8 w-[1px] bg-white/10 mx-2" />
        
        <div className="relative">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white group-hover:text-accent-cyan transition-colors">{user.displayName || 'User'}</p>
              {user.role === 'admin' && <span className="text-[10px] text-accent-gold font-display uppercase tracking-tighter bg-accent-gold/10 px-2 py-0.5 rounded-full border border-accent-gold/20">Admin</span>}
              {user.role === 'viewer' && <span className="text-[10px] text-text-secondary font-display uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded-full border border-white/10">View Only</span>}
              {(user.role === 'analyst' || !user.role) && <span className="text-[10px] text-accent-cyan font-display uppercase tracking-tighter bg-accent-cyan/10 px-2 py-0.5 rounded-full border border-accent-cyan/20">Analyst</span>}
            </div>
            <motion.img 
              whileHover={{ scale: 1.1 }}
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`} 
              className="w-10 h-10 rounded-full border-2 border-accent-cyan/20"
              alt="Profile"
            />
          </div>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-56 glass border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                  <p className="text-xs font-bold text-white truncate">{user.email}</p>
                  <p className="text-[10px] text-text-secondary">UID: {user.uid.slice(0, 8)}...</p>
                </div>
                <div className="p-2">
                  <MenuButton icon={<User className="w-4 h-4" />} label="My Profile" />
                  <MenuButton icon={<Settings className="w-4 h-4" />} label="Account Settings" onClick={onSettings} />
                  <div className="h-[1px] bg-white/5 my-2" />
                  <MenuButton 
                    icon={<LogOut className="w-4 h-4" />} 
                    label="Sign Out" 
                    variant="danger" 
                    onClick={onLogout}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function NavIcon({ icon, badge, onClick }: { icon: React.ReactNode; badge?: boolean; onClick?: () => void }) {
  return (
    <motion.button 
      onClick={onClick}
      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
      whileTap={{ scale: 0.9 }}
      className="p-2.5 rounded-xl text-text-secondary hover:text-white transition-colors relative"
    >
      {icon}
      {badge && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-accent-cyan rounded-full border-2 border-primary-bg" />
      )}
    </motion.button>
  );
}

function NotificationItem({ title, time, description, icon }: { title: string; time: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="p-4 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-bold text-white">{title}</span>
        </div>
        <span className="text-[10px] text-text-secondary">{time}</span>
      </div>
      <p className="text-[11px] text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

function MenuButton({ icon, label, variant = 'default', onClick }: { icon: React.ReactNode; label: string; variant?: 'default' | 'danger'; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
        variant === 'danger' 
          ? "text-danger-red hover:bg-danger-red/10" 
          : "text-text-secondary hover:text-white hover:bg-white/5"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
