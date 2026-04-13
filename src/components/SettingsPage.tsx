import React, { useState, useEffect } from 'react';
import { 
  Settings, Palette, Bell, Shield, User, 
  Info, Check, Trash2, LogOut, Monitor, 
  Moon, Sun, Type, Sliders, CheckCircle2,
  Github, Bug, RefreshCw, DownloadCloud
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, UserSettings, Theme, FontSize, AccentColor } from '../types';
import { doc, updateDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth, logout } from '../firebase';
import { deleteUserAccountAndData } from '../services/securityService';

interface SettingsPageProps {
  user: UserProfile;
  onReplayTour?: () => void;
}

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
  },
  dataProtection: {
    autoDelete: 'forever'
  }
};

const ACCENT_COLORS: { name: AccentColor; hex: string; class: string }[] = [
  { name: 'cyan', hex: '#00d4ff', class: 'bg-[#00d4ff]' },
  { name: 'purple', hex: '#7c3aed', class: 'bg-[#7c3aed]' },
  { name: 'green', hex: '#00ff88', class: 'bg-[#00ff88]' },
  { name: 'orange', hex: '#ff6b35', class: 'bg-[#ff6b35]' },
  { name: 'pink', hex: '#ff2d92', class: 'bg-[#ff2d92]' },
  { name: 'gold', hex: '#ffd700', class: 'bg-[#ffd700]' }
];

export function SettingsPage({ user, onReplayTour }: SettingsPageProps) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('fairaudit_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    localStorage.setItem('fairaudit_settings', JSON.stringify(settings));
    applySettings(settings);
    setShowToast(true);
    const timer = setTimeout(() => setShowToast(false), 2000);
    return () => clearTimeout(timer);
  }, [settings]);

  const applySettings = (s: UserSettings) => {
    // Apply Theme
    document.documentElement.setAttribute('data-theme', s.appearance.theme);
    if (s.appearance.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    
    // Apply Font Size
    const fontSizes = {
      small: '13px',
      medium: '15px',
      large: '17px',
      xl: '19px'
    };
    document.documentElement.style.fontSize = fontSizes[s.appearance.fontSize];
    
    // Apply Accent Color
    const color = ACCENT_COLORS.find(c => c.name === s.appearance.accentColor)?.hex || '#00d4ff';
    document.documentElement.style.setProperty('--accent-primary', color);
    document.documentElement.style.setProperty('--accent-glow', `${color}66`);
  };

  const updateAppearance = (key: keyof UserSettings['appearance'], value: any) => {
    setSettings(prev => ({
      ...prev,
      appearance: { ...prev.appearance, [key]: value }
    }));
  };

  const updateNotifications = (key: keyof UserSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  const updateAnalysis = (key: keyof UserSettings['analysisDefaults'], value: any) => {
    setSettings(prev => ({
      ...prev,
      analysisDefaults: { ...prev.analysisDefaults, [key]: value }
    }));
  };

  const updateDataProtection = (value: any) => {
    setSettings(prev => ({
      ...prev,
      dataProtection: { autoDelete: value }
    }));
  };

  const handleDeleteHistory = async () => {
    if (window.confirm('Are you sure you want to delete ALL audit history? This action cannot be undone.')) {
      if (user.uid === 'guest-user') {
        localStorage.removeItem('guest_audits');
        localStorage.removeItem('guest_model_audits');
        alert('Guest history cleared.');
      } else {
        const q = query(collection(db, 'audits'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'audits', d.id)));
        
        const q2 = query(collection(db, 'model_audits'), where('userId', '==', user.uid));
        const snapshot2 = await getDocs(q2);
        const deletePromises2 = snapshot2.docs.map(d => deleteDoc(doc(db, 'model_audits', d.id)));
        
        await Promise.all([...deletePromises, ...deletePromises2]);
        alert('Cloud history cleared.');
      }
    }
  };

  const handleDownloadData = async () => {
     setShowToast(true); // "Preparing your data..."
     // Mock generic download
     setTimeout(() => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
            profile: user,
            history: [],
            metrics: []
        }));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "fairaudit_my_data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
     }, 1000);
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      "This will permanently delete:\n✓ Your profile and login access\n✓ All your audit history\n✓ All uploaded datasets\n✓ All saved reports\n\nThis cannot be undone. Type 'DELETE' to confirm:"
    );
    if(confirmation === 'DELETE') {
       try {
         await deleteUserAccountAndData();
         alert("Account deleted. Your data has been permanently removed.");
         logout();
       } catch (e) {
         console.error("Account delete failed", e);
       }
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 pb-24">
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-8 z-50 bg-success-neon text-primary-bg px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg glow-success"
          >
            <CheckCircle2 className="w-4 h-4" />
            SETTINGS SAVED
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/20">
          <Settings className="w-8 h-8 text-accent-cyan" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-semibold text-white tracking-wide">SYSTEM SETTINGS</h1>
          <p className="text-text-secondary">Customize your FairAudit Pro experience.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Navigation */}
        <div className="space-y-2">
          <SettingsNavButton icon={Palette} label="Appearance" active />
          <SettingsNavButton icon={Bell} label="Notifications" />
          <SettingsNavButton icon={Sliders} label="Analysis Defaults" />
          <SettingsNavButton icon={Shield} label="Privacy & Data" />
          <SettingsNavButton icon={User} label="Account" />
          <SettingsNavButton icon={Info} label="About" />
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Appearance */}
          <section className="space-y-6">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-accent-cyan" />
              APPEARANCE
            </h3>
            
            <div className="space-y-4">
              <p className="text-sm font-medium text-text-secondary">Theme Selector</p>
              <div className="grid grid-cols-3 gap-4">
                <ThemeCard 
                  id="dark" 
                  label="Dark" 
                  active={settings.appearance.theme === 'dark'} 
                  onClick={() => updateAppearance('theme', 'dark')}
                  preview={<div className="w-full h-12 bg-[#050510] rounded-lg border border-white/5" />}
                />
                <ThemeCard 
                  id="light" 
                  label="Light" 
                  active={settings.appearance.theme === 'light'} 
                  onClick={() => updateAppearance('theme', 'light')}
                  preview={<div className="w-full h-12 bg-white rounded-lg border border-black/5" />}
                />
                <ThemeCard 
                  id="midnight" 
                  label="Midnight" 
                  active={settings.appearance.theme === 'midnight'} 
                  onClick={() => updateAppearance('theme', 'midnight')}
                  preview={<div className="w-full h-12 bg-black rounded-lg border border-white/10" />}
                />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium text-text-secondary">Text Size</p>
              <div className="flex gap-2">
                {(['small', 'medium', 'large', 'xl'] as FontSize[]).map(size => (
                  <Button
                    key={size}
                    variant={settings.appearance.fontSize === size ? 'default' : 'outline'}
                    onClick={() => updateAppearance('fontSize', size)}
                    className={cn(
                      "flex-1 rounded-xl font-display text-xs uppercase tracking-widest",
                      settings.appearance.fontSize === size ? "bg-accent-cyan text-primary-bg" : "border-white/10 text-white hover:bg-white/5"
                    )}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium text-text-secondary">Accent Color</p>
              <div className="flex gap-4">
                {ACCENT_COLORS.map(color => (
                  <button
                    key={color.name}
                    onClick={() => updateAppearance('accentColor', color.name)}
                    className={cn(
                      "w-10 h-10 rounded-full transition-all relative flex items-center justify-center",
                      color.class,
                      settings.appearance.accentColor === color.name ? "ring-4 ring-white scale-110" : "hover:scale-105"
                    )}
                  >
                    {settings.appearance.accentColor === color.name && <Check className="w-5 h-5 text-white mix-blend-difference" />}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="h-[1px] bg-white/5" />

          {/* Notifications */}
          <section className="space-y-6">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-accent-purple" />
              NOTIFICATIONS
            </h3>
            <div className="space-y-4">
              <ToggleRow 
                label="Audit complete notification" 
                checked={settings.notifications.auditComplete} 
                onChange={(v) => updateNotifications('auditComplete', v)} 
              />
              <ToggleRow 
                label="Weekly bias report reminder" 
                checked={settings.notifications.weeklyReport} 
                onChange={(v) => updateNotifications('weeklyReport', v)} 
              />
              <ToggleRow 
                label="New feature announcements" 
                checked={settings.notifications.newFeatures} 
                onChange={(v) => updateNotifications('newFeatures', v)} 
              />
            </div>
          </section>

          <div className="h-[1px] bg-white/5" />

          {/* Analysis Defaults */}
          <section className="space-y-6">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-success-neon" />
              ANALYSIS DEFAULTS
            </h3>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-text-secondary">Default max rows to analyze</p>
                  <span className="text-accent-cyan font-bold">{settings.analysisDefaults.maxRows}</span>
                </div>
                <Slider 
                  value={[settings.analysisDefaults.maxRows]} 
                  min={1000} 
                  max={10000} 
                  step={500}
                  onValueChange={(vals) => updateAnalysis('maxRows', vals[0])}
                  className="py-4"
                />
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-text-secondary">Protected attributes to auto-detect</p>
                <div className="grid grid-cols-2 gap-4">
                  {['Gender', 'Age', 'Race', 'Religion', 'Disability', 'Nationality'].map(attr => (
                    <div key={attr} className="flex items-center space-x-3">
                      <Checkbox 
                        id={attr} 
                        checked={settings.analysisDefaults.protectedAttributes.includes(attr)}
                        onCheckedChange={(checked) => {
                          const current = settings.analysisDefaults.protectedAttributes;
                          const next = checked 
                            ? [...current, attr] 
                            : current.filter(a => a !== attr);
                          updateAnalysis('protectedAttributes', next);
                        }}
                        className="border-white/20 data-[state=checked]:bg-accent-cyan data-[state=checked]:text-primary-bg"
                      />
                      <label htmlFor={attr} className="text-sm text-white cursor-pointer">{attr}</label>
                    </div>
                  ))}
                </div>
              </div>

              <ToggleRow 
                label="Auto-start analysis after upload" 
                checked={settings.analysisDefaults.autoStart} 
                onChange={(v) => updateAnalysis('autoStart', v)} 
              />
            </div>
          </section>

          <div className="h-[1px] bg-white/5" />

          {/* Account */}
          <section className="space-y-6">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-warning-orange" />
              ACCOUNT
            </h3>
            <div className="glass p-6 rounded-3xl border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`} 
                  className="w-12 h-12 rounded-full border border-white/10"
                  alt="Avatar"
                />
                <div>
                  <p className="font-bold text-white">{user.displayName || 'User'}</p>
                  <p className="text-xs text-text-secondary">{user.email}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => logout()}
                className="border-danger-red/20 text-danger-red hover:bg-danger-red/10 rounded-xl"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
            <Button 
              variant="outline" 
              onClick={handleDeleteHistory}
              className="w-full border-danger-red/20 text-danger-red hover:bg-danger-red/10 rounded-xl py-6"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              DELETE ALL AUDIT HISTORY
            </Button>
          </section>

          <div className="h-[1px] bg-white/5" />

          {/* Privacy & Data Protection */}
          <section className="space-y-6">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-cyan" />
              PRIVACY & DATA PROTECTION
            </h3>

            <div className="space-y-4">
              <p className="text-sm font-medium text-text-secondary">Audit Data Auto-Delete</p>
              <select 
                value={settings.dataProtection?.autoDelete || 'forever'} 
                onChange={(e) => updateDataProtection(e.target.value)}
                className="bg-primary-bg border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-accent-cyan outline-none w-full"
              >
                <option value="forever">Keep forever (default)</option>
                <option value="7days">Delete after 7 days</option>
                <option value="30days">Delete after 30 days</option>
                <option value="90days">Delete after 90 days</option>
                <option value="immediate">Delete immediately after download</option>
              </select>
            </div>

            <div className="glass p-6 rounded-3xl border-white/5 space-y-4">
              <h4 className="font-bold text-white">Privacy Notice</h4>
              <div className="text-xs text-text-secondary space-y-2">
                 <p className="text-white">FairAudit collects:</p>
                 <ul className="list-inside list-disc pl-2">
                   <li>Your Google profile (name, email, photo)</li>
                   <li>Datasets you upload (temporarily)</li>
                   <li>Bias audit results you generate</li>
                 </ul>
                 <p className="text-white mt-4">FairAudit never:</p>
                 <ul className="list-inside list-disc pl-2">
                   <li>Sells your data</li>
                   <li>Uses your data to train AI models</li>
                   <li>Shares your data with third parties</li>
                 </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={handleDownloadData}
                className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white py-6"
              >
                <DownloadCloud className="w-4 h-4 mr-2" />
                Download My Data
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                className="flex-1 bg-danger-red/10 border border-danger-red/20 hover:bg-danger-red/20 text-danger-red rounded-xl py-6"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete My Account
              </Button>
            </div>
          </section>

          <div className="h-[1px] bg-white/5" />

          {/* About */}
          <section className="space-y-6">
            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-accent-cyan" />
              ABOUT
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">App Version</span>
                <span className="text-white font-mono">v1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Neural Core</span>
                <span className="text-accent-cyan font-mono">Gemini 1.5 Flash</span>
              </div>
              <p className="text-xs text-text-secondary italic">"Built for Google Solution Challenge 2026"</p>
              
              <div className="flex gap-4 pt-4">
                <Button variant="outline" className="flex-1 border-white/10 text-white hover:bg-white/5 rounded-xl">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub Repo
                </Button>
                <Button variant="outline" className="flex-1 border-white/10 text-white hover:bg-white/5 rounded-xl">
                  <Bug className="w-4 h-4 mr-2" />
                  Report a Bug
                </Button>
              </div>

              <Button 
                onClick={onReplayTour}
                className="w-full bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20 border border-accent-cyan/20 rounded-xl py-6 mt-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                REPLAY ONBOARDING TOUR
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SettingsNavButton({ icon: Icon, label, active }: { icon: any; label: string; active?: boolean }) {
  return (
    <button className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
      active ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20" : "text-text-secondary hover:text-white hover:bg-white/5"
    )}>
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function ThemeCard({ id, label, active, onClick, preview }: { id: string; label: string; active: boolean; onClick: () => void; preview: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col gap-3 p-3 rounded-2xl border transition-all group",
        active ? "bg-accent-cyan/10 border-accent-cyan glow-cyan" : "bg-white/5 border-white/10 hover:border-white/20"
      )}
    >
      {preview}
      <span className={cn("text-xs font-bold uppercase tracking-widest", active ? "text-accent-cyan" : "text-text-secondary")}>{label}</span>
    </button>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-white">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-accent-cyan" />
    </div>
  );
}
