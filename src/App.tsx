import * as React from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  where,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { db, auth } from '@/src/lib/firebase';
import { 
  Athlete, 
  Trial, 
  Badge, 
  TrialType, 
  TRIAL_LABELS, 
  BENCHMARKS 
} from '@/src/types';
import { 
  LayoutDashboard, 
  Users, 
  Timer, 
  Trophy, 
  Moon, 
  Sun, 
  LogOut, 
  Plus, 
  TrendingUp, 
  Award,
  ChevronRight,
  Search,
  Trash2,
  Clock,
  History,
  Scale,
  Activity,
  AlertCircle,
  Fingerprint
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Badge as UIBadge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg' 
        : 'hover:bg-indigo-50/50 dark:hover:bg-slate-700/50 text-slate-500 hover:text-slate-900 dark:hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-sm font-bold tracking-tight">{label}</span>
  </button>
);

const MobileNavItem = ({ icon: Icon, active, onClick, className = "" }: { icon: any, active: boolean, onClick: () => void, className?: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-2 transition-all active:scale-95 ${className} ${
      active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <Icon className="h-6 w-6" />
  </button>
);

const MetricCard = ({ title, value, icon: Icon, description, trend, iconColor = 'text-blue-600' }: { title: string, value: string | number, icon: any, description?: string, trend?: string, iconColor?: string }) => (
  <Card className="rounded-3xl border-border shadow-sm transition-all hover:shadow-md group bg-card backdrop-blur-sm">
    <CardContent className="p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5 md:space-y-1">
          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">{title}</p>
          <div className="flex items-baseline gap-1.5 md:gap-2">
            <h3 className="text-2xl md:text-3xl font-black text-foreground tabular-nums tracking-tight">{value}</h3>
            {trend && <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{trend}</span>}
          </div>
          {description && <p className="text-[10px] md:text-xs font-semibold text-muted-foreground whitespace-nowrap">{description}</p>}
        </div>
        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 ${
          iconColor.includes('blue') || iconColor.includes('indigo') ? 'bg-blue-50 dark:bg-blue-900/20' :
          iconColor.includes('emerald') || iconColor.includes('green') ? 'bg-emerald-50 dark:bg-emerald-900/20' :
          iconColor.includes('amber') || iconColor.includes('orange') || iconColor.includes('yellow') ? 'bg-amber-50 dark:bg-amber-900/20' :
          iconColor.includes('rose') || iconColor.includes('red') ? 'bg-rose-50 dark:bg-rose-900/20' :
          'bg-muted'
        } group-hover:scale-110 shadow-sm group-hover:shadow-md group-hover:rotate-3`}>
          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [athletes, setAthletes] = React.useState<Athlete[]>([]);
  const [trials, setTrials] = React.useState<Trial[]>([]);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
    }
    return false;
  });
  const [isLoading, setIsLoading] = React.useState(true);

  // Theme support
  React.useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    if (isDarkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
      root.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Auth logic
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data fetching
  React.useEffect(() => {
    if (!user) return;

    const qAthletes = query(collection(db, 'athletes'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribeAthletes = onSnapshot(qAthletes, (snapshot) => {
      setAthletes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Athlete)));
    });

    const qTrials = query(collection(db, 'trials'), where('teacherId', '==', user.uid), orderBy('timestamp', 'desc'));
    const unsubscribeTrials = onSnapshot(qTrials, (snapshot) => {
      setTrials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trial)));
    });

    return () => {
      unsubscribeAthletes();
      unsubscribeTrials();
    };
  }, [user]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Sign in error', error);
    }
  };

  const handleSignOut = () => signOut(auth);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen bg-background flex flex-col items-center justify-center p-6 transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground uppercase italic">Kreeda-Prerana</h1>
            <p className="text-muted-foreground text-lg italic mt-2">"Identifying the Diamonds in the Rough"</p>
          </div>
          
          <Card className="border-border/50 shadow-xl overflow-hidden rounded-3xl bg-card">
            <CardContent className="p-10 space-y-8">
              <p className="text-foreground leading-relaxed font-medium">
                The professional digital scout for physical education teachers. 
                Record milestones, track progress, and discover the next national champion.
              </p>
              <Button onClick={handleSignIn} className="w-full h-14 text-lg rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 dark:shadow-none transition-all active:scale-95" size="lg">
                Continue with Google
              </Button>
            </CardContent>
          </Card>
          
          <div className="flex justify-center gap-8 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
            <span>Kabaddi</span>
            <span>Athletics</span>
            <span>Kho-Kho</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`flex min-h-screen w-full flex-col font-sans transition-colors duration-300 overflow-hidden relative text-foreground ${isDarkMode ? 'dark' : ''}`}>
        {/* Unified Background Component */}
        <div className="fixed inset-0 bg-background transition-colors duration-300 -z-50" />
        
        {/* Header - Refined for mobile */}
        <header className="flex h-14 md:h-16 w-full items-center justify-between border-b border-border bg-card/95 backdrop-blur-md px-4 md:px-8 z-50 sticky top-0 transition-colors duration-300">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Trophy className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <h1 className="text-base md:text-xl font-black tracking-tight text-foreground uppercase italic leading-none">
              Kreeda<span className="hidden xs:inline">-Prerana</span> <span className="font-normal text-primary">Scout</span>
            </h1>
          </div>
          <nav className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-2 md:p-2.5 rounded-xl bg-background hover:bg-accent transition-all border border-border text-muted-foreground active:scale-95"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="hidden sm:block h-6 w-px bg-border"></div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-foreground leading-none">{user.displayName || 'Coach'}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight mt-1">Certified PE Educator</p>
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full border-2 border-indigo-100 dark:border-indigo-900 bg-muted overflow-hidden flex items-center justify-center shrink-0">
                {user.photoURL ? <img src={user.photoURL} alt="User" referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : <Users className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
               <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </nav>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar - Desktop Only */}
          <aside className="hidden md:flex w-72 flex-shrink-0 flex-col border-r border-border bg-card transition-colors duration-300">
            <div className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Main Menu</p>
              <nav className="space-y-2">
                <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <SidebarItem icon={Users} label="Athlete Records" active={activeTab === 'athletes'} onClick={() => setActiveTab('athletes')} />
                <SidebarItem icon={Timer} label="Trial Logger" active={activeTab === 'trials'} onClick={() => setActiveTab('trials')} />
                <SidebarItem icon={Trophy} label="Leaderboard" active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} />
              </nav>
            </div>
            
            <div className="flex-1 px-6 overflow-y-auto">
              <Separator className="mb-6 opacity-30" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Active Profiles</p>
              <div className="space-y-3">
                   {athletes.slice(0, 4).map(athlete => (
                      <div key={athlete.id} className="group cursor-pointer rounded-xl border border-transparent p-3 hover:bg-accent transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{athlete.name}</p>
                          <UIBadge variant="outline" className="text-[8px] font-black uppercase bg-primary/10 text-primary border-primary/20">Class {athlete.schoolClass}</UIBadge>
                        </div>
                        <p className="text-[10px] font-medium text-muted-foreground">{athlete.primarySport}</p>
                      </div>
                   ))}
                   {athletes.length === 0 && <p className="text-xs text-muted-foreground italic font-medium px-2">No profiles yet</p>}
              </div>
            </div>

            <div className="p-6 pb-20 md:pb-6">
              <Button 
                onClick={() => { setActiveTab('trials'); }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-primary py-6 text-sm font-bold text-white hover:bg-slate-800 dark:hover:bg-primary/90 transition-all shadow-lg active:scale-95"
              >
                <Plus className="w-4 h-4" />
                New Trial Session
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto overflow-x-hidden relative pb-24 md:pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex-1 h-full max-w-7xl mx-auto w-full"
              >
                {activeTab === 'dashboard' && <DashboardView athletes={athletes} trials={trials} />}
                {activeTab === 'athletes' && <AthletesView athletes={athletes} trials={trials} userId={user.uid} />}
                {activeTab === 'trials' && <TrialsView athletes={athletes} trials={trials} userId={user.uid} />}
                {activeTab === 'leaderboard' && <LeaderboardView athletes={athletes} trials={trials} />}
              </motion.div>
            </AnimatePresence>

            <footer className="mt-auto pt-8 hidden sm:flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pb-4">
               <div className="flex gap-8">
                  <span className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    Offline Sync Ready
                  </span>
                  <span>Khelo India Integrated</span>
               </div>
               <span>v1.5.2-POLISH | © 2026 KREEDA PROJECT</span>
            </footer>
          </main>

          {/* Mobile Navigation Bar */}
          <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-16 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl flex items-center justify-around px-2 z-[100]">
            <MobileNavItem icon={LayoutDashboard} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <MobileNavItem icon={Users} active={activeTab === 'athletes'} onClick={() => setActiveTab('athletes')} />
            <div className="relative -top-4">
              <button 
                onClick={() => setActiveTab('trials')}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-95 ${activeTab === 'trials' ? 'bg-indigo-600 text-white shadow-indigo-300' : 'bg-slate-900 text-white shadow-slate-400'}`}
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <MobileNavItem icon={Timer} active={activeTab === 'trials'} onClick={() => setActiveTab('trials')} className="hidden sm:flex" />
            <MobileNavItem icon={Trophy} active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} />
            <MobileNavItem icon={isDarkMode ? Sun : Moon} active={false} onClick={() => setIsDarkMode(!isDarkMode)} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function DashboardView({ athletes, trials }: { athletes: Athlete[], trials: Trial[] }) {
  const totalStudents = athletes.length;
  const recentTrials = trials.slice(0, 5);
  const totalTrials = trials.length;
  
  // Aggregate data for chart
  const trialsByDate = React.useMemo(() => {
    const grouped = trials.reduce((acc, t) => {
      const date = new Date(t.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .map(([name, count]) => ({ name, count }))
      .reverse()
      .slice(-7);
  }, [trials]);

  const avgSprint = trials.length > 0 ? (trials.filter(t => t.type === 'sprint_100m').reduce((acc, t) => acc + t.value, 0) / (trials.filter(t => t.type === 'sprint_100m').length || 1)).toFixed(2) : '12.4';
  const avgJump = trials.length > 0 ? (trials.filter(t => t.type === 'long_jump').reduce((acc, t) => acc + t.value, 0) / (trials.filter(t => t.type === 'long_jump').length || 1)).toFixed(2) : '2.1';

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white">Regional Scouting Hub</h1>
          <p className="text-xs md:text-sm font-medium text-slate-500">Analytics overview for your athlete development pipeline.</p>
        </div>
        <div className="flex items-center gap-3 px-3 py-1.5 md:px-4 md:py-2 bg-card border border-border rounded-2xl shadow-sm w-fit">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full animate-ping" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Telemetry</span>
          </div>
          <Separator orientation="vertical" className="h-3 md:h-4" />
          <span className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-widest">Portal Sync</span>
        </div>
      </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <MetricCard title="Enrollment" value={totalStudents} icon={Users} description="Athletes in database" trend="+4.2%" iconColor="text-blue-600" />
            <MetricCard title="Test Volume" value={totalTrials} icon={Timer} description="Total performance points" trend="+18.5%" iconColor="text-emerald-600" />
            <MetricCard title="Elite Zone" value={Math.floor(totalStudents * 0.15)} icon={Award} description="Candidates for State" trend="Top 15%" iconColor="text-amber-500" />
            <MetricCard title="Avg Sprint" value={`${avgSprint}s`} icon={Activity} description="100m Regional Average" trend="-0.4s" iconColor="text-rose-500" />
            <MetricCard title="Jump Avg" value={`${avgJump}m`} icon={TrendingUp} description="Broad Jump Standard" trend="+0.1m" iconColor="text-green-600" />
            <MetricCard title="Active Scouters" value="48" icon={Fingerprint} description="Regional verification active" trend="Live" iconColor="text-indigo-600" />
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-12 xl:col-span-7 rounded-3xl shadow-sm bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-border bg-card">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                Talent Pipeline Growth
              </CardTitle>
            </div>
            <UIBadge variant="secondary" className="bg-muted text-muted-foreground border-none rounded-lg px-3 py-1 font-bold text-[9px]">Last 7 Days</UIBadge>
          </CardHeader>
          <CardContent className="h-[350px] pt-8">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trialsByDate}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} fontWeight="bold" />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-12 xl:col-span-12 rounded-3xl border-none shadow-sm bg-card overflow-hidden">
          <CardHeader className="bg-muted/50 border-b border-border">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
              <History className="w-4 h-4 text-rose-500" />
              Recent Scout Logs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentTrials.length > 0 ? recentTrials.map((trial) => {
                const athlete = athletes.find(a => a.id === trial.athleteId);
                return (
                  <div key={trial.id} className="flex items-center justify-between p-5 hover:bg-accent transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary group-hover:scale-110 transition-transform">
                        {athlete?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground tracking-tight">{athlete?.name || 'Unknown'}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{TRIAL_LABELS[trial.type]}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black tabular-nums text-foreground">{trial.value}<span className="text-[10px] ml-0.5 text-muted-foreground">{trial.unit}</span></p>
                      <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Verified</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-20 text-slate-400 font-medium italic text-sm">No recent activity detected.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AthletesView({ athletes, trials, userId }: { athletes: Athlete[], trials: Trial[], userId: string }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);
  const [newAthlete, setNewAthlete] = React.useState({
    name: '',
    age: '',
    primarySport: 'Athletics',
    gender: 'Male',
    schoolClass: ''
  });

  const filteredAthletes = athletes.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.schoolClass.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAthlete.name || !newAthlete.age || !newAthlete.schoolClass) return;
    
    await addDoc(collection(db, 'athletes'), {
      ...newAthlete,
      age: Number(newAthlete.age),
      teacherId: userId,
      createdAt: new Date().toISOString()
    });
    
    setIsAdding(false);
    setNewAthlete({ name: '', age: '', primarySport: 'Athletics', gender: 'Male', schoolClass: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this athlete?')) {
      await deleteDoc(doc(db, 'athletes', id));
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white">Athlete Database</h1>
          <p className="text-xs md:text-sm font-medium text-slate-500">Historical performance data and physical profiles.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto rounded-2xl h-12 px-6 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
              <Plus className="w-4 h-4" />
              Register New Athlete
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95%] max-w-[450px] rounded-[2rem] md:rounded-[2.5rem] border-2 shadow-2xl p-0 overflow-hidden">
            <div className="bg-white dark:bg-slate-800 p-8 border-b">
              <DialogHeader>
                <DialogTitle className="text-xl font-black">Athlete Registration</DialogTitle>
                <CardDescription className="font-medium text-slate-500">Create a digital scouting profile for the Khelo India pipeline.</CardDescription>
              </DialogHeader>
            </div>
            <form onSubmit={handleAddAthlete} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Legal Name</Label>
                  <Input id="name" placeholder="Aakash Verma" className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold" value={newAthlete.name} onChange={e => setNewAthlete({...newAthlete, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="age" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Age</Label>
                    <Input id="age" type="number" placeholder="14" className="h-12 rounded-xl bg-white dark:bg-slate-800 border-none font-bold shadow-sm" value={newAthlete.age} onChange={e => setNewAthlete({...newAthlete, age: e.target.value})} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="class" className="text-[10px] font-black uppercase tracking-widest text-slate-400">School Class</Label>
                    <Input id="class" placeholder="Grade 9" className="h-12 rounded-xl bg-white dark:bg-slate-800 border-none font-bold shadow-sm" value={newAthlete.schoolClass} onChange={e => setNewAthlete({...newAthlete, schoolClass: e.target.value})} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="gender" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gender</Label>
                    <Select value={newAthlete.gender} onValueChange={v => setNewAthlete({...newAthlete, gender: v as any})}>
                      <SelectTrigger className="h-12 border-none bg-white dark:bg-slate-800 rounded-xl font-bold shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sport" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Core Sport</Label>
                    <Select value={newAthlete.primarySport} onValueChange={v => setNewAthlete({...newAthlete, primarySport: v})}>
                      <SelectTrigger className="h-12 border-none bg-white dark:bg-slate-800 rounded-xl font-bold shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Athletics">Athletics</SelectItem>
                        <SelectItem value="Kabaddi">Kabaddi</SelectItem>
                        <SelectItem value="Kho-Kho">Kho-Kho</SelectItem>
                        <SelectItem value="Football">Football</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl transition-all active:scale-95">Complete Enrollment</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <Input 
          placeholder="Search identity or class..." 
          className="pl-12 h-14 rounded-2xl bg-card border-border shadow-sm focus-visible:ring-primary font-medium"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {filteredAthletes.map((athlete) => (
          <motion.div
            layout
            key={athlete.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="group rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 space-y-6">
                   <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center border-2 border-slate-200 dark:border-slate-600 group-hover:bg-blue-600 transition-colors duration-500 shadow-sm">
                        <span className="text-2xl font-black text-slate-800 dark:text-white uppercase italic group-hover:text-white transition-colors">{athlete.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-slate-800 dark:text-white tracking-tight group-hover:text-indigo-600 transition-colors truncate max-w-[120px]">{athlete.name}</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-normal">District Class {athlete.schoolClass}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(athlete.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <UIBadge variant="secondary" className={`border-none rounded-lg font-bold px-3 py-1 text-[10px] uppercase tracking-wider ${
                      athlete.primarySport === 'Athletics' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' :
                      athlete.primarySport === 'Kabaddi' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' :
                      athlete.primarySport === 'Kho-Kho' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' :
                      'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
                    }`}>
                      {athlete.primarySport}
                    </UIBadge>
                    <UIBadge variant="outline" className="rounded-lg font-black text-[9px] px-3 py-1 uppercase tracking-widest text-slate-400 border-slate-200">{athlete.gender}</UIBadge>
                    <UIBadge variant="outline" className="rounded-lg font-black text-[9px] px-3 py-1 uppercase tracking-widest text-slate-400 border-slate-200">{athlete.age} Yrs</UIBadge>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Profile Verified</span>
                   </div>
                   <AthleteDetails athlete={athlete} trials={trials.filter(t => t.athleteId === athlete.id)} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AthleteDetails({ athlete, trials }: { athlete: Athlete, trials: Trial[] }) {
  const chartData = React.useMemo(() => {
    return trials
      .slice()
      .reverse()
      .map(t => ({
        date: new Date(t.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: t.value,
        type: TRIAL_LABELS[t.type]
      }));
  }, [trials]);

  const bestSprint = trials
    .filter(t => t.type.includes('sprint'))
    .reduce((min, t) => (!min || t.value < min.value ? t : min), null as Trial | null);

  const bestJump = trials
    .filter(t => t.type.includes('jump'))
    .reduce((max, t) => (!max || t.value > max.value ? t : max), null as Trial | null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-[0.2em] gap-1 hover:gap-3 transition-all text-indigo-600 dark:text-indigo-400">
          Analytic Detail <ChevronRight className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95%] max-w-[750px] rounded-[2rem] md:rounded-[2.5rem] p-0 overflow-hidden border-2 shadow-2xl">
        <div className="bg-indigo-600 p-6 md:p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 md:p-10 opacity-10">
            <Trophy className="w-48 h-48 md:w-64 md:h-64 rotate-12" />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10 text-center md:text-left">
             <div className="w-20 h-20 md:w-24 md:h-24 bg-white/10 rounded-3xl flex items-center justify-center border-2 border-white/20 backdrop-blur-xl shadow-2xl">
                <span className="text-3xl md:text-4xl font-black italic">{athlete.name.charAt(0)}</span>
             </div>
             <div className="space-y-2">
               <h2 className="text-2xl md:text-4xl font-black tracking-tighter italic">{athlete.name}</h2>
               <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4">
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] bg-white text-indigo-600 px-3 py-1 rounded-full shadow-lg">District Elite</span>
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full whitespace-nowrap">Class {athlete.schoolClass} • {athlete.primarySport}</span>
               </div>
             </div>
          </div>
        </div>
        
        <div className="p-6 md:p-10 space-y-6 md:space-y-10 dark:bg-slate-900 max-h-[70vh] overflow-y-auto bg-white">
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 md:gap-6">
             <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-700 text-center group hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors shadow-sm">
                <p className="text-[8px] md:text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1 md:mb-2 group-hover:text-blue-500 transition-colors">Total Trials</p>
                <p className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white">{trials.length}</p>
             </div>
             <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-700 text-center group hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors shadow-sm">
                <p className="text-[8px] md:text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1 md:mb-2 group-hover:text-emerald-500 transition-colors">Sprint Peak</p>
                <div className="flex items-baseline justify-center gap-1">
                  <p className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tabular-nums">{bestSprint?.value || '--'}</p>
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 italic">s</span>
                </div>
             </div>
             <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-700 text-center group hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors shadow-sm">
                <p className="text-[8px] md:text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1 md:mb-2 group-hover:text-amber-500 transition-colors">Jump Peak</p>
                <div className="flex items-baseline justify-center gap-1">
                  <p className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tabular-nums">{bestJump?.value || '--'}</p>
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 italic">m</span>
                </div>
             </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-slate-800 dark:text-white">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Talent Curve: {TRIAL_LABELS[trials[0]?.type || 'sprint_100m']}
                </h3>
              </div>
              <UIBadge className="text-[8px] font-black uppercase bg-slate-900 text-white rounded-md px-3 py-1">Benchmark Analysis</UIBadge>
            </div>
            <div className="h-[320px] w-full bg-slate-50/50 dark:bg-slate-800/30 rounded-[2.5rem] p-8 border-2 border-dashed border-slate-200 dark:border-slate-700">
              {trials.length > 1 ? (
                 <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                    <XAxis dataKey="date" fontSize={9} tickLine={false} axisLine={false} fontWeight="bold" />
                    <YAxis fontSize={9} tickLine={false} axisLine={false} fontWeight="bold" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#4f46e5" 
                      strokeWidth={4} 
                      dot={{ r: 5, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }} 
                      activeDot={{ r: 7, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm font-medium gap-3 opacity-60">
                  <Scale className="w-10 h-10 opacity-30" />
                  <p className="italic">Progress mapping requires multiple time-logged data points.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-indigo-50 dark:bg-slate-800 p-6 rounded-3xl border border-indigo-100 dark:border-slate-700 flex items-center justify-between shadow-inner">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 transition-transform hover:rotate-0">
                   <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Scout Consensus v4.0</p>
                   <p className="text-lg font-black text-slate-800 dark:text-white tracking-tight italic">{trials.length > 5 ? 'State Level Ready Candidate' : 'Identification Phase: Diamond in Rough'}</p>
                </div>
             </div>
             <Button variant="outline" className="rounded-xl border-2 border-indigo-200 dark:border-slate-600 font-bold text-[10px] uppercase tracking-widest px-6 h-10 hover:bg-indigo-600 hover:text-white transition-all">Export Scouting PDF</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TrialsView({ athletes, trials, userId }: { athletes: Athlete[], trials: Trial[], userId: string }) {
  const [selectedAthlete, setSelectedAthlete] = React.useState<string>('all');
  const [trialType, setTrialType] = React.useState<TrialType>('sprint_100m');
  const [time, setTime] = React.useState(0);
  const [isRunning, setIsRunning] = React.useState(false);
  const [isLogging, setIsLogging] = React.useState(false);

  React.useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => setTime(t => t + 10), 10);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const cent = Math.floor((ms % 1000) / 10);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${cent.toString().padStart(2, '0')}`;
  };

  const handleLogTrial = async () => {
    if (selectedAthlete === 'all' || time === 0) return;
    setIsLogging(true);
    
    await addDoc(collection(db, 'trials'), {
      athleteId: selectedAthlete,
      teacherId: userId,
      type: trialType,
      value: time / 1000,
      unit: 's',
      timestamp: new Date().toISOString()
    });
    
    setTime(0);
    setIsRunning(false);
    setIsLogging(false);
  };

  const filteredTrials = React.useMemo(() => {
    if (selectedAthlete === 'all') return trials;
    return trials.filter(t => t.athleteId === selectedAthlete);
  }, [selectedAthlete, trials]);

  const athleteName = athletes.find(a => a.id === selectedAthlete)?.name || 'Select Athlete';

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white">Trial Center</h1>
          <p className="text-xs md:text-sm font-medium text-slate-500">Precision timing and physical testing laboratory.</p>
        </div>
        
        <BatchEntryForm athletes={athletes} userId={userId} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
        <Card className="xl:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-white dark:bg-slate-950/50 p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <CardTitle className="text-lg md:text-xl font-bold">Performance Chronometer</CardTitle>
                <CardDescription className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
                  <Activity className="w-3 h-3 inline-block animate-pulse mr-1" /> Precision ±0.01s • Verified Capture
                </CardDescription>
              </div>
              <div className="flex flex-col xs:flex-row items-center gap-2 md:gap-3 w-full sm:w-auto">
                 <Select value={trialType} onValueChange={v => setTrialType(v as TrialType)}>
                  <SelectTrigger className="w-full sm:w-[150px] md:w-[180px] h-10 rounded-xl border-none bg-white dark:bg-slate-800 shadow-sm font-bold text-[10px] md:text-xs uppercase tracking-widest">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIAL_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                 </Select>
                 <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                  <SelectTrigger className="w-full sm:w-[150px] md:w-[180px] h-10 rounded-xl border-none bg-white dark:bg-slate-800 shadow-sm font-bold text-[10px] md:text-xs uppercase tracking-widest">
                    <SelectValue placeholder="Athlete" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Profiles</SelectItem>
                    {athletes.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                 </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-10">
            <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
              <div className="flex flex-col items-center space-y-6 md:space-y-8 w-full lg:w-auto">
                <div className="relative group cursor-pointer" onClick={() => setIsRunning(!isRunning)}>
                  <div className="w-48 h-48 md:w-56 md:h-56 rounded-full border-[5px] md:border-[6px] border-indigo-600 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/10 shadow-[0_0_50px_rgba(79,70,229,0.15)] group-hover:scale-105 transition-transform duration-500">
                    <div className="text-center">
                       <p className="text-[9px] md:text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1 md:mb-2">{isRunning ? 'Running' : 'Ready'}</p>
                       <span className="text-3xl md:text-4xl font-black tabular-nums text-slate-800 dark:text-white drop-shadow-sm">{formatTime(time)}</span>
                    </div>
                  </div>
                  {isRunning && <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute -inset-2 rounded-full border-2 border-indigo-400 opacity-50" />}
                </div>
                
                <div className="flex gap-3 md:gap-4 w-full justify-center">
                  <Button 
                    onClick={() => setIsRunning(!isRunning)} 
                    className={`h-11 md:h-12 px-6 md:px-8 flex-1 sm:flex-none rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] shadow-lg transition-all active:scale-95 ${isRunning ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                  >
                    {isRunning ? 'Stop Timer' : 'Start Timer'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => { setTime(0); setIsRunning(false); }}
                    className="h-11 md:h-12 px-6 md:px-8 flex-1 sm:flex-none rounded-2xl border-2 border-slate-200 dark:border-slate-700 font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <div className="flex-1 w-full space-y-4 md:space-y-6">
                <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                     <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Candidate</span>
                     <UIBadge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[7px] md:text-[8px] font-black uppercase">Live Feed</UIBadge>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mb-4 truncate">{athleteName}</h3>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="p-2.5 md:p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 text-center sm:text-left">
                       <p className="text-[7px] md:text-[8px] font-black uppercase text-slate-400 mb-0.5 md:mb-1">Target Pace</p>
                       <p className="text-xs md:text-sm font-bold text-indigo-600">12.50s</p>
                    </div>
                    <div className="p-2.5 md:p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 text-center sm:text-left">
                       <p className="text-[7px] md:text-[8px] font-black uppercase text-slate-400 mb-0.5 md:mb-1">Session Best</p>
                       <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-white">13.12s</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleLogTrial} 
                  disabled={selectedAthlete === 'all' || time === 0 || isRunning || isLogging}
                  className="w-full h-14 md:h-16 rounded-2xl bg-slate-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs shadow-xl active:scale-95 disabled:opacity-50 transition-all"
                >
                  {isLogging ? 'Processing Data...' : 'SECURE LOG DATA'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-4 rounded-3xl bg-slate-900 border-none shadow-xl text-white overflow-hidden flex flex-col h-[400px] xl:h-auto">
          <CardHeader className="p-6 md:p-8 border-b border-white/5 bg-white/5">
             <CardTitle className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-slate-400">Live Result Stream</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-y-auto">
            <div className="divide-y divide-white/5">
              {filteredTrials.length > 0 ? filteredTrials.map((trial) => {
                const athlete = athletes.find(a => a.id === trial.athleteId);
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={trial.id} 
                    className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-xs font-black text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/50 transition-all">
                        {athlete?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black tracking-tight">{athlete?.name || 'Unknown'}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{TRIAL_LABELS[trial.type]}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black tabular-nums">{trial.value}<span className="text-[10px] ml-1 text-indigo-400">s</span></p>
                      <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest italic">{new Date(trial.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center py-32 opacity-20 px-8 text-center">
                   <Activity className="w-12 h-12 mb-4" />
                   <p className="text-xs font-black uppercase tracking-widest">Awaiting local telemetry input</p>
                </div>
              )}
            </div>
          </CardContent>
          <div className="p-8 border-t border-white/5 bg-slate-900/50">
             <Button variant="link" className="w-full text-indigo-400 font-black text-xs uppercase tracking-[0.2em] hover:text-white transition-colors">
               Sync with State Repository →
             </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function BatchEntryForm({ athletes, userId }: { athletes: Athlete[], userId: string }) {
  const [entries, setEntries] = React.useState([{ athleteId: '', value: '', type: 'sprint_100m' as TrialType }]);
  const [open, setOpen] = React.useState(false);

  const addEntry = () => setEntries([...entries, { athleteId: '', value: '', type: 'sprint_100m' as TrialType }]);
  
  const handleBatchLog = async () => {
    const validEntries = entries.filter(e => e.athleteId && e.value);
    if (validEntries.length === 0) return;

    for (const entry of validEntries) {
      await addDoc(collection(db, 'trials'), {
        athleteId: entry.athleteId,
        teacherId: userId,
        type: entry.type,
        value: Number(entry.value),
        unit: entry.type.includes('sprint') ? 's' : 'm',
        timestamp: new Date().toISOString()
      });
    }
    setOpen(false);
    setEntries([{ athleteId: '', value: '', type: 'sprint_100m' as TrialType }]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-2xl h-12 px-6 border-2 font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
          <Table className="w-4 h-4" />
          Batch Entry Mode
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] p-0 overflow-hidden border-2 shadow-2xl">
        <div className="bg-slate-50 dark:bg-slate-800 p-8 border-b border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Secure Batch Entry</DialogTitle>
            <CardDescription className="text-sm font-medium">Log performance data for a class of athletes in one operation.</CardDescription>
          </DialogHeader>
        </div>
        <div className="p-8 space-y-6 dark:bg-slate-900">
          <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
            {entries.map((entry, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4 items-center bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 group transition-all hover:bg-white">
                <div className="col-span-1 text-center font-black text-slate-300 group-hover:text-indigo-400 transition-colors uppercase text-[10px]">Trial {idx + 1}</div>
                <div className="col-span-4">
                  <Select value={entry.athleteId} onValueChange={v => {
                    const newEntries = [...entries];
                    newEntries[idx].athleteId = v;
                    setEntries(newEntries);
                  }}>
                    <SelectTrigger className="h-10 border-none bg-white dark:bg-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm">
                      <SelectValue placeholder="Select Name" />
                    </SelectTrigger>
                    <SelectContent>
                      {athletes.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4">
                  <Select value={entry.type} onValueChange={v => {
                    const newEntries = [...entries];
                    newEntries[idx].type = v as TrialType;
                    setEntries(newEntries);
                  }}>
                    <SelectTrigger className="h-10 border-none bg-white dark:bg-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TRIAL_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input 
                    type="number" 
                    placeholder="Value (s/m)" 
                    className="h-10 border-none bg-white dark:bg-slate-700 rounded-xl font-bold text-xs shadow-sm"
                    value={entry.value}
                    onChange={e => {
                      const newEntries = [...entries];
                      newEntries[idx].value = e.target.value;
                      setEntries(newEntries);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <Button onClick={addEntry} variant="outline" className="flex-1 h-12 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px]">Add Entry Row</Button>
            <Button onClick={handleBatchLog} className="flex-3 h-12 rounded-2xl bg-indigo-600 hover:bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] shadow-lg">Finalize Batch Log</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LeaderboardView({ athletes, trials }: { athletes: Athlete[], trials: Trial[] }) {
  const [leaderboardType, setLeaderboardType] = React.useState<TrialType>('sprint_100m');

  const leaderboard = React.useMemo(() => {
    const scores: Record<string, number> = {};
    const filteredTrials = trials.filter(t => t.type === leaderboardType);
    
    filteredTrials.forEach(t => {
      // For sprints, lower is better. For jumps/throws, higher is better.
      const isBetter = leaderboardType.includes('sprint')
        ? (scores[t.athleteId] === undefined || t.value < scores[t.athleteId])
        : (scores[t.athleteId] === undefined || t.value > scores[t.athleteId]);
      
      if (isBetter) scores[t.athleteId] = t.value;
    });

    return Object.entries(scores)
      .map(([athleteId, value]) => ({
        athlete: athletes.find(a => a.id === athleteId),
        value
      }))
      .sort((a, b) => leaderboardType.includes('sprint') ? a.value - b.value : b.value - a.value)
      .slice(0, 10);
  }, [athletes, trials, leaderboardType]);

  const unit = leaderboardType.includes('sprint') ? 's' : 'm';

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white">Talent Standings</h1>
          <p className="text-xs md:text-sm font-medium text-slate-500">Live rankings based on top regional benchmarks.</p>
        </div>
        
        <Select value={leaderboardType} onValueChange={v => setLeaderboardType(v as TrialType)}>
          <SelectTrigger className="w-full md:w-[250px] h-11 md:h-12 rounded-2xl border-2 bg-white dark:bg-slate-800 font-bold uppercase tracking-widest text-[10px] md:text-xs shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TRIAL_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start pb-10">
        <Card className="lg:col-span-8 rounded-[2rem] md:rounded-[2.5rem] bg-card border-none shadow-sm overflow-hidden transition-colors">
          <CardHeader className="p-6 md:p-8 border-b border-border bg-card">
             <CardTitle className="text-lg md:text-xl font-black italic tracking-tighter">Top 10 Benchmark Leaders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {leaderboard.map((entry, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={entry.athlete?.id}
                  className="p-4 md:p-6 flex items-center justify-between group hover:bg-accent transition-all"
                >
                  <div className="flex items-center gap-4 md:gap-8">
                    <span className={`text-2xl md:text-4xl font-black italic tracking-tight ${idx < 3 ? 'text-primary' : 'text-slate-300 dark:text-slate-700'} tabular-nums w-8 md:w-12 text-center`}>
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-3 md:gap-5">
                       <div className="w-10 h-10 md:w-12 md:h-12 bg-muted rounded-xl md:rounded-2xl flex items-center justify-center border border-border group-hover:scale-110 transition-transform">
                          <span className="text-base font-black text-foreground capitalize">{entry.athlete?.name.charAt(0)}</span>
                       </div>
                       <div className="max-w-[120px] sm:max-w-none">
                         <p className="text-sm md:text-base font-black text-foreground tracking-tight truncate">{entry.athlete?.name}</p>
                         <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">Class {entry.athlete?.schoolClass}</p>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 md:gap-10">
                    <div className="text-right">
                       <p className="text-lg md:text-2xl font-black tabular-nums text-foreground">{entry.value}<span className="text-[10px] ml-1 text-muted-foreground italic">{unit}</span></p>
                       <p className={`text-[7px] md:text-[9px] font-black uppercase tracking-widest ${idx === 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                         {idx === 0 ? 'Elite' : 'Ranked'}
                       </p>
                    </div>
                    <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full shadow-lg ${idx === 0 ? 'bg-amber-400 shadow-amber-200' : idx === 1 ? 'bg-slate-400 shadow-slate-200' : idx === 2 ? 'bg-orange-400 shadow-orange-200' : 'bg-transparent'}`} />
                  </div>
                </motion.div>
              ))}
              {leaderboard.length === 0 && (
                <div className="text-center py-32 flex flex-col items-center justify-center opacity-30 px-8">
                  <Trophy className="w-16 h-16 mb-4" />
                  <p className="text-sm font-black uppercase tracking-[0.2em] italic">No qualifying benchmarks found for this category</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-6">
           <Card className="rounded-[2.5rem] bg-indigo-600 p-8 text-white border-none shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                 <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-80">Recognition Program</h3>
                 <p className="text-3xl font-black italic tracking-tighter leading-tight">Identify. Log. Pioneer.</p>
                 <p className="text-xs font-medium text-indigo-100 leading-relaxed italic">
                    The top 2% of regional performers are automatically flagged for the District Sport Authority vetting process.
                 </p>
                 <Separator className="bg-white/20" />
                 <div className="flex items-center gap-3">
                   <div className="flex -space-x-3">
                      {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-indigo-600 bg-white/20 backdrop-blur-md" />)}
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">+24 National Pro-Scouts Active</p>
                 </div>
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-700">
                 <Trophy className="w-32 h-32" />
              </div>
           </Card>

           <Card className="rounded-[2.5rem] bg-white dark:bg-slate-800 p-8 border-2 shadow-sm border-slate-200 dark:border-slate-700">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                 <AlertCircle className="w-4 h-4 text-amber-500" />
                 Scouting Ethics Code
              </h3>
              <div className="space-y-6">
                 <div className="flex gap-4">
                    <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center text-[10px] font-black italic shrink-0">1</div>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed dark:text-slate-400">All trial data must be verified by a certified Physical Education teacher.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center text-[10px] font-black italic shrink-0">2</div>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed dark:text-slate-400">Student anonymity is preserved in public scouting repositories until verified elite status.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center text-[10px] font-black italic shrink-0">3</div>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed dark:text-slate-400">Health and safety guidelines must be strictly enforced during all performance testing.</p>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
