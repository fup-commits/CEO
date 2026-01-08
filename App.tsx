
import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskType, Mail, NewsItem, CalendarEvent } from './types';
import UnicornBackground from './components/UnicornBackground';
import MailCard from './components/MailCard';
import TaskCard from './components/TaskCard';
import CalendarCard from './components/CalendarCard';
import { 
  Lock, Clock, Calendar as CalendarIcon, 
  RefreshCw, TrendingUp, ShieldCheck,
  ChevronRight, LogOut, ArrowUpRight, GripVertical,
  Settings, Cloud, CloudOff, Loader2, CheckCircle2,
  User, Mail as MailIcon, Key, AlertCircle, Info, Link, HelpCircle,
  Sun, Moon
} from 'lucide-react';

const PIN_CODE = '0925';
const DEFAULT_STORAGE_URL = 'https://script.google.com/macros/s/AKfycbzHsj5xZgL0js_7t8XXW8ksG634xp4mBGwkLJIIUbedZkYiDJEzJkaDq8m8iLUNLMVK7g/exec';
const DEFAULT_CALENDAR_URL = 'https://calendar.google.com/calendar/embed?src=fup%40fupglobalpartners.com&ctz=Asia%2FSeoul';

const MAIL_CONFIG = {
  company: 'https://script.google.com/macros/s/AKfycbyXlpoE7c6MGH-uzEBwsTzoEVZf_GNBvJGe-gSRBk_uaZdl6TIDpglDqS6uamBQ5XAQ/exec',
  personal: 'https://script.google.com/macros/s/AKfycbxPt7-RQromTNCVGjk1KW9UIf9hj6voRQEjJrlmZNy_oA3CHI03apedJWrDCbvpUU9njg/exec'
};

const NEWS_SOURCES = [
  { name: '에프유피글로벌파트너스', query: '에프유피글로벌파트너스' },
  { name: '와이낫글로벌이니셔티브', query: '와이낫글로벌이니셔티브' }
];

const App: React.FC = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [personalMails, setPersonalMails] = useState<Mail[]>([]);
  const [companyMails, setCompanyMails] = useState<Mail[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [isLoadingMails, setIsLoadingMails] = useState(false);
  const [mailError, setMailError] = useState<string | null>(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [storageUrl, setStorageUrl] = useState(DEFAULT_STORAGE_URL);
  
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState(DEFAULT_CALENDAR_URL);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<{name: string, email: string, picture: string} | null>(null);

  const [layout, setLayout] = useState({
    top: ['comms'],
    left: ['tasks', 'news'],
    right: ['yesterday', 'agenda', 'logout']
  });

  const [draggedId, setDraggedId] = useState<{ id: string, section: 'top' | 'left' | 'right' } | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const isValidClientId = (id: string) => id.trim().endsWith('.apps.googleusercontent.com');

  const extractCalendarIdFromUrl = (url: string) => {
    try {
      const u = new URL(url);
      return u.searchParams.get('src') || "";
    } catch (e) {
      return "";
    }
  };

  const fetchGoogleCalendarEvents = useCallback(async (token: string) => {
    setIsLoadingCalendar(true);
    try {
      const calId = extractCalendarIdFromUrl(googleCalendarUrl) || 'primary';
      const now = new Date().toISOString();
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?timeMin=${now}&maxResults=20&orderBy=startTime&singleEvents=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.items) {
        setCalendarEvents(data.items.map((item: any) => ({
          id: item.id,
          title: item.summary,
          start: item.start.dateTime || item.start.date,
          end: item.end.dateTime || item.end.date,
          location: item.location,
          description: item.description,
          color: item.colorId ? '#60a5fa' : '#3b82f6'
        })));
      }
    } catch (error) {
      console.error("Calendar Error:", error);
    } finally {
      setIsLoadingCalendar(false);
    }
  }, [googleCalendarUrl]);

  const fetchGoogleUserInfo = useCallback(async (token: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const user = { name: data.name, email: data.email, picture: data.picture };
      setGoogleUser(user);
      localStorage.setItem('ceo_google_user', JSON.stringify(user));
    } catch (error) {
      console.error("User Info Error:", error);
    }
  }, []);

  const handleGoogleLogin = () => {
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: googleClientId.trim(),
      scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: (response: any) => {
        if (response.access_token) {
          setAccessToken(response.access_token);
          localStorage.setItem('ceo_google_token', response.access_token);
          fetchGoogleUserInfo(response.access_token);
          fetchGoogleCalendarEvents(response.access_token);
        }
      },
    });
    client.requestAccessToken();
  };

  const handleGoogleLogout = () => {
    setAccessToken(null);
    setGoogleUser(null);
    localStorage.removeItem('ceo_google_token');
    localStorage.removeItem('ceo_google_user');
  };

  const syncToCloud = useCallback(async (updatedTasks: Task[], updatedLayout: any) => {
    if (!storageUrl) return;
    setIsSyncing(true);
    try {
      await fetch(storageUrl, {
        method: 'POST', mode: 'no-cors', 
        body: JSON.stringify({ tasks: updatedTasks, layout: updatedLayout, lastUpdated: Date.now() })
      });
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error("Sync Error:", error);
    } finally {
      setTimeout(() => setIsSyncing(false), 1000);
    }
  }, [storageUrl]);

  const fetchFromCloud = useCallback(async () => {
    if (!storageUrl) return;
    setIsSyncing(true);
    try {
      const res = await fetch(storageUrl);
      const data = await res.json();
      if (data && data.tasks) {
        setTasks(data.tasks);
        localStorage.setItem('ceo_tasks', JSON.stringify(data.tasks));
      }
      if (data && data.layout) {
        setLayout(data.layout);
        localStorage.setItem('ceo_layout', JSON.stringify(data.layout));
      }
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setTimeout(() => setIsSyncing(false), 1000);
    }
  }, [storageUrl]);

  useEffect(() => {
    const isUnlocked = localStorage.getItem('ceo_unlocked') === 'true';
    if (isUnlocked) setUnlocked(true);
    
    const savedTasks = localStorage.getItem('ceo_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));

    const savedLayout = localStorage.getItem('ceo_layout');
    if (savedLayout) setLayout(JSON.parse(savedLayout));

    const savedUrl = localStorage.getItem('ceo_storage_url');
    if (savedUrl) setStorageUrl(savedUrl);

    const savedClientId = localStorage.getItem('ceo_google_client_id');
    if (savedClientId) setGoogleClientId(savedClientId);

    const savedCalendarUrl = localStorage.getItem('ceo_google_calendar_url');
    setGoogleCalendarUrl(savedCalendarUrl || DEFAULT_CALENDAR_URL);

    const savedToken = localStorage.getItem('ceo_google_token');
    const savedUser = localStorage.getItem('ceo_google_user');
    
    if (savedToken) {
      setAccessToken(savedToken);
      fetchGoogleCalendarEvents(savedToken);
    }
    if (savedUser) setGoogleUser(JSON.parse(savedUser));

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchGoogleCalendarEvents]);

  useEffect(() => {
    if (unlocked && storageUrl) {
      fetchFromCloud();
      const pollInterval = setInterval(fetchFromCloud, 60000);
      return () => clearInterval(pollInterval);
    }
  }, [unlocked, storageUrl, fetchFromCloud]);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin === PIN_CODE) {
      setUnlocked(true);
      localStorage.setItem('ceo_unlocked', 'true');
    } else {
      alert('Access Denied');
      setPin('');
    }
  };

  const handleLogout = () => {
    setUnlocked(false);
    localStorage.removeItem('ceo_unlocked');
  };

  const saveState = (updatedTasks: Task[], updatedLayout: any) => {
    setTasks(updatedTasks);
    setLayout(updatedLayout);
    localStorage.setItem('ceo_tasks', JSON.stringify(updatedTasks));
    localStorage.setItem('ceo_layout', JSON.stringify(updatedLayout));
    syncToCloud(updatedTasks, updatedLayout);
  };

  const addTask = (text: string, type: TaskType) => {
    const newTask: Task = { id: Math.random().toString(36).substr(2, 9), text, completed: false, type, createdAt: Date.now() };
    saveState([...tasks, newTask], layout);
  };

  const toggleTask = (id: string) => saveState(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t), layout);
  const deleteTask = (id: string) => saveState(tasks.filter(t => t.id !== id), layout);

  const fetchMails = useCallback(async () => {
    setIsLoadingMails(true);
    setMailError(null);
    try {
      const fetchSet = async (url: string) => {
        const res = await fetch(url);
        const data = await res.json();
        return (data || []).map((m: any, idx: number) => ({
          id: `mail-${idx}-${Date.now()}`,
          from: m.from ? m.from.split('<')[0].replace(/"/g, '').trim() : "Unknown Sender",
          subject: m.subject || "(No Subject)",
          link: m.link || "#",
          isNaver: m.from ? m.from.toLowerCase().includes('naver.com') : false
        }));
      };
      const [pMails, cMails] = await Promise.all([fetchSet(MAIL_CONFIG.personal), fetchSet(MAIL_CONFIG.company)]);
      setPersonalMails(pMails);
      setCompanyMails(cMails);
    } catch (error) {
      setMailError("Mail sync issues detected.");
    } finally {
      setIsLoadingMails(false);
    }
  }, []);

  const fetchNews = useCallback(async () => {
    setIsLoadingNews(true);
    try {
      const allNews: NewsItem[] = [];
      for (const source of NEWS_SOURCES) {
        const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://news.google.com/rss/search?q=${source.query}&hl=ko&gl=KR&ceid=KR:ko`)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.items) {
          allNews.push(...data.items.slice(0, 3).map((item: any) => ({
            title: item.title, link: item.link, pubDate: item.pubDate.split(' ')[0], source: source.name
          })));
        }
      }
      setNews(allNews);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingNews(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchMails();
    fetchNews();
    if (storageUrl) fetchFromCloud();
    if (accessToken) fetchGoogleCalendarEvents(accessToken);
  }, [fetchMails, fetchNews, fetchFromCloud, fetchGoogleCalendarEvents, storageUrl, accessToken]);

  useEffect(() => { if (unlocked) refreshAll(); }, [unlocked, refreshAll]);

  const onDragStart = (id: string, section: 'top' | 'left' | 'right') => setDraggedId({ id, section });
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (targetId: string, targetSection: 'top' | 'left' | 'right') => {
    if (!draggedId || draggedId.section !== targetSection) return;
    const sectionList = [...layout[targetSection]];
    sectionList.splice(sectionList.indexOf(draggedId.id), 1);
    sectionList.splice(sectionList.indexOf(targetId), 0, draggedId.id);
    saveState(tasks, { ...layout, [targetSection]: sectionList });
    setDraggedId(null);
  };

  const renderSection = (id: string) => {
    switch (id) {
      case 'comms':
        return (
          <section className="mb-20 animate-fade-up">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-blue-600/10 border border-blue-600/20">
                  <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-[13px] font-black tracking-[0.6em] text-gray-900/40 dark:text-white/30 uppercase">Intelligence Network</h2>
                  <p className="text-[10px] text-gray-400 dark:text-white/10 uppercase tracking-widest font-bold">Consolidated comms monitoring</p>
                </div>
              </div>
              <button onClick={refreshAll} className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all text-gray-400 dark:text-white/30">
                <RefreshCw size={18} className={isLoadingMails ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <MailCard title="GLOBAL CORPORATE" mails={companyMails.filter(m => !m.isNaver)} isLoading={isLoadingMails} error={mailError} />
              <MailCard title="PRIVATE INTEL" mails={personalMails.filter(m => !m.isNaver)} isLoading={isLoadingMails} error={mailError} />
              <MailCard title="NAVER WORK" mails={companyMails.filter(m => m.isNaver)} isLoading={isLoadingMails} error={mailError} isNaverAuto />
              <MailCard title="NAVER PERSONAL" mails={personalMails.filter(m => m.isNaver)} isLoading={isLoadingMails} error={mailError} isNaverAuto />
            </div>
          </section>
        );
      case 'tasks':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            <TaskCard title="STRATEGIC PRIORITIES" type={TaskType.TODAY} tasks={tasks.filter(t => t.type === TaskType.TODAY)} onAddTask={addTask} onToggleTask={toggleTask} onDeleteTask={deleteTask} className="h-[520px]" />
            <TaskCard title="EXECUTIVE CHECKLIST" type={TaskType.CHECKLIST} tasks={tasks.filter(t => t.type === TaskType.CHECKLIST)} onAddTask={addTask} onToggleTask={toggleTask} onDeleteTask={deleteTask} className="h-[520px]" />
          </div>
        );
      case 'news':
        return (
          <div className="glass-panel p-12 min-h-[600px]">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-orange-600/10 border border-orange-600/20">
                  <TrendingUp size={22} className="text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-[13px] font-black tracking-[0.6em] text-gray-900/40 dark:text-white/30 uppercase">Global Strategic Intel</h3>
              </div>
              <button onClick={fetchNews} className="text-gray-400 dark:text-white/30 hover:text-gray-900 dark:hover:text-white transition-colors">
                <RefreshCw size={20} className={isLoadingNews ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="grid gap-14">
              {news.map((item, idx) => (
                <div key={idx} className="group flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.4em]">{item.source}</span>
                    <div className="h-[1px] flex-1 bg-gray-200 dark:bg-white/5"></div>
                    <span className="text-[11px] text-gray-400 dark:text-white/20 font-mono font-bold">{item.pubDate}</span>
                  </div>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-2xl font-bold text-gray-900 dark:text-white/90 group-hover:text-blue-600 dark:group-hover:text-white transition-all flex items-center justify-between leading-tight tracking-tight">
                    {item.title}
                    <ArrowUpRight size={24} className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 shrink-0 ml-8 text-orange-500" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        );
      case 'yesterday':
        return <TaskCard title="OPERATIONAL AUDIT" type={TaskType.YESTERDAY} tasks={tasks.filter(t => t.type === TaskType.YESTERDAY)} onAddTask={addTask} onToggleTask={toggleTask} onDeleteTask={deleteTask} className="h-[360px] mb-10" />;
      case 'agenda':
        return <CalendarCard events={calendarEvents} isLoading={isLoadingCalendar} className="h-[600px] mb-10" embedUrl={googleCalendarUrl} />;
      case 'logout':
        return (
          <button onClick={handleLogout} className="w-full glass-panel p-8 flex items-center justify-center gap-5 text-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all text-[13px] font-black uppercase tracking-[0.5em]">
            <LogOut size={20} strokeWidth={2} /> SECURE LOGOUT
          </button>
        );
      default: return null;
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black relative">
        <UnicornBackground />
        <div className="glass-panel max-w-sm w-full p-20 text-center relative z-10 animate-fade-up">
          <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-12 border border-white/10 shadow-2xl">
            <Lock className="text-white/20" size={32} strokeWidth={1} />
          </div>
          <div className="mb-14">
            <h1 className="text-3xl font-black tracking-[-0.04em] text-white uppercase mb-4">FUP GLOBAL</h1>
            <p className="text-[11px] text-white/20 tracking-[0.8em] uppercase font-bold">ENCRYPTED PORTAL</p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-10">
            <input type="password" maxLength={4} value={pin} autoFocus onChange={(e) => setPin(e.target.value)} placeholder="••••" className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-6 text-center text-4xl tracking-[0.8em] focus:outline-none focus:border-white/30 transition-all font-light placeholder:text-white/10" />
            <button type="submit" className="w-full bg-white/10 hover:bg-white/20 text-white font-black py-6 rounded-3xl border border-white/10 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-xs">Verify Access <ChevronRight size={20} /></button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content relative bg-[#f2f4f7] dark:bg-black">
      <UnicornBackground />
      <div className="max-w-[1600px] mx-auto relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-10 pt-10">
          <div className="animate-fade-up">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]"></div>
              <span className="text-[12px] uppercase tracking-[0.6em] text-gray-500 dark:text-white/40 font-black">Strategic Intelligence Unit</span>
            </div>
            <h1 className="text-6xl lg:text-8xl font-black tracking-[-0.07em] text-gray-900 dark:text-white uppercase leading-[0.85]">
              FUP GLOBAL<br/>
              <span className="text-2xl lg:text-3xl font-bold tracking-[0.4em] text-gray-400 dark:text-white/20 block mt-4 uppercase">Executive Dashboard</span>
            </h1>
          </div>
          <div className="flex flex-col md:items-end gap-8 animate-fade-up">
            <div className="flex items-center gap-5">
              {googleUser && (
                <div className="hidden md:flex items-center gap-5 glass-panel px-6 py-3.5 bg-white/5 dark:bg-white/[0.01] border-white/5">
                  <img src={googleUser.picture} className="w-10 h-10 rounded-full ring-2 ring-blue-500/20" alt="profile" />
                  <div className="text-right">
                    <p className="text-[11px] font-black text-gray-900 dark:text-white leading-tight uppercase tracking-widest">{googleUser.name}</p>
                    <p className="text-[10px] text-gray-400 dark:text-white/30 leading-tight">{googleUser.email}</p>
                  </div>
                </div>
              )}
              <button onClick={toggleTheme} className="p-4 rounded-[1.5rem] border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:scale-105 transition-all text-gray-600 dark:text-white/60">
                {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
              </button>
              <button onClick={() => setShowSettings(!showSettings)} className={`p-4 rounded-[1.5rem] border transition-all ${showSettings ? 'bg-blue-600 border-blue-500 shadow-xl text-white' : 'border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-gray-600 dark:text-white/60'}`}>
                <Settings size={22} />
              </button>
              <div className="text-right ml-6">
                <div className="text-gray-400 dark:text-white/30 text-[12px] font-black tracking-[0.3em] uppercase mb-2">{currentTime.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</div>
                <div className="text-gray-900 dark:text-white text-6xl lg:text-7xl font-black tracking-tighter leading-none">{currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
              </div>
            </div>
          </div>
        </header>

        {showSettings && (
          <div className="glass-panel p-12 mb-20 animate-fade-up border-blue-500/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
              <div className="space-y-8">
                <h3 className="text-sm font-black uppercase tracking-[0.5em] text-blue-600 dark:text-blue-500 mb-8">Cloud Connectivity</h3>
                <input type="text" placeholder="Storage Endpoint URL" value={storageUrl} onChange={(e) => { setStorageUrl(e.target.value); localStorage.setItem('ceo_storage_url', e.target.value); }} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-5 text-xs font-mono font-bold text-gray-600 dark:text-white/40 focus:outline-none focus:ring-2 ring-blue-500/30" />
                <div className="flex gap-4">
                  <button onClick={() => setStorageUrl(DEFAULT_STORAGE_URL)} className="px-8 py-4 rounded-2xl bg-gray-200 dark:bg-white/5 text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-white/40 transition-all">Reset</button>
                  <button onClick={refreshAll} className="px-8 py-4 rounded-2xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-3 transition-all"><RefreshCw size={16} /> Global Sync</button>
                </div>
              </div>
              <div className="space-y-8">
                <h3 className="text-sm font-black uppercase tracking-[0.5em] text-purple-600 dark:text-purple-500 mb-8">Encryption & Security</h3>
                <input type="text" placeholder="OAuth Client ID" value={googleClientId} onChange={(e) => { setGoogleClientId(e.target.value); localStorage.setItem('ceo_google_client_id', e.target.value); }} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-5 text-xs font-mono font-bold text-gray-600 dark:text-white/40" />
                {!googleUser ? (
                  <button onClick={handleGoogleLogin} disabled={!isValidClientId(googleClientId)} className="w-full py-5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-4 hover:opacity-90 disabled:opacity-20 transition-all">
                    <Key size={18} /> Authorize Access
                  </button>
                ) : (
                  <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest flex items-center gap-3"><CheckCircle2 size={20} /> Secure Connection Active</span>
                    <button onClick={handleGoogleLogout} className="text-red-500 hover:text-red-600 transition-colors p-2"><LogOut size={22} /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {layout.top.map(id => (
          <div key={id} draggable onDragStart={() => onDragStart(id, 'top')} onDragOver={onDragOver} onDrop={() => onDrop(id, 'top')} className="relative group mb-10">
            <div className="absolute -left-12 top-0 bottom-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"><GripVertical size={28} className="text-gray-300 dark:text-white/10" /></div>
            {renderSection(id)}
          </div>
        ))}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start pb-40">
          <div className="lg:col-span-8 space-y-12">
            {layout.left.map(id => (
              <div key={id} draggable onDragStart={() => onDragStart(id, 'left')} onDragOver={onDragOver} onDrop={() => onDrop(id, 'left')} className="relative group">
                <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"><GripVertical size={28} className="text-gray-300 dark:text-white/10" /></div>
                {renderSection(id)}
              </div>
            ))}
          </div>
          <div className="lg:col-span-4 space-y-12">
            {layout.right.map(id => (
              <div key={id} draggable onDragStart={() => onDragStart(id, 'right')} onDragOver={onDragOver} onDrop={() => onDrop(id, 'right')} className="relative group">
                <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"><GripVertical size={28} className="text-gray-300 dark:text-white/10" /></div>
                {renderSection(id)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
