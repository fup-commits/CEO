
import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskType, Mail, NewsItem, CalendarEvent } from './types';
import UnicornBackground from './components/UnicornBackground';
import MailCard from './components/MailCard';
import TaskCard from './components/TaskCard';
import CalendarCard from './components/CalendarCard';
import { summarizeExecutiveNews } from './services/geminiService';
import { 
  Lock, RefreshCw, TrendingUp, ShieldCheck,
  ChevronRight, LogOut, ArrowUpRight, GripVertical,
  Settings, CheckCircle2, Key, Sun, Moon,
  Cloud, Sun as SunIcon, CloudRain, Wind, Droplets,
  Smile, Meh, Frown, Skull, Hash
} from 'lucide-react';

const PIN_CODE = '0925';
const DEFAULT_STORAGE_URL = 'https://script.google.com/macros/s/AKfycbzHsj5xZgL0js_7t8XXW8ksG634xp4mBGwkLJIIUbedZkYiDJEzJkaDq8m8iLUNLMVK7g/exec';
const DEFAULT_CALENDAR_URL = 'https://calendar.google.com/calendar/embed?src=fup%40fupglobalpartners.com&ctz=Asia%2FSeoul';

const LOGO_WHITE = "https://cdn.imweb.me/thumbnail/20260107/50068ffadaeef.png";
const LOGO_BLACK = "https://cdn.imweb.me/thumbnail/20260109/e6b72f2ab0260.png";

const GANGNAM_COORDS = { lat: 37.5173, lon: 127.0474 };

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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [storageUrl, setStorageUrl] = useState(DEFAULT_STORAGE_URL);
  
  const [weather, setWeather] = useState<{ temp: number; humidity: number; icon: string } | null>(null);
  const [airQuality, setAirQuality] = useState<{ value: number; status: string; face: 'good' | 'normal' | 'bad' | 'danger' } | null>(null);

  const [googleClientId, setGoogleClientId] = useState('');
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState(DEFAULT_CALENDAR_URL);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [layout, setLayout] = useState({
    top: ['comms'],
    left: ['tasks', 'news'],
    right: ['yesterday', 'agenda', 'logout']
  });

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

  const fetchIntelligence = useCallback(async () => {
    try {
      const { lat, lon } = GANGNAM_COORDS;
      const [wRes, aRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`),
        fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10`)
      ]);
      const wData = await wRes.json();
      const aData = await aRes.json();

      setWeather({ 
        temp: Math.round(wData.current.temperature_2m),
        humidity: Math.round(wData.current.relative_humidity_2m),
        icon: wData.current.weather_code <= 3 ? 'sun' : wData.current.weather_code >= 60 ? 'rain' : 'cloud'
      });

      const pm10 = aData.current.pm10;
      let status = '좋음';
      let face: 'good' | 'normal' | 'bad' | 'danger' = 'good';
      
      if (pm10 > 20) { status = '주의'; face = 'normal'; }
      if (pm10 > 50) { status = '위험'; face = 'bad'; }
      if (pm10 > 100) { status = '매우위험'; face = 'danger'; }
      
      setAirQuality({ value: Math.round(pm10), status, face });
    } catch (e) { console.error("Intel fetch failed", e); }
  }, []);

  const fetchGoogleCalendarEvents = useCallback(async (token: string) => {
    setIsLoadingCalendar(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=20&orderBy=startTime&singleEvents=true`,
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
          color: '#3b82f6'
        })));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingCalendar(false);
    }
  }, []);

  const handleGoogleLogin = () => {
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: googleClientId.trim(),
      scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: (response: any) => {
        if (response.access_token) {
          setAccessToken(response.access_token);
          fetchGoogleCalendarEvents(response.access_token);
        }
      },
    });
    client.requestAccessToken();
  };

  const fetchMails = useCallback(async () => {
    setIsLoadingMails(true);
    try {
      const fetchSet = async (url: string) => {
        const res = await fetch(url);
        const data = await res.json();
        return (data || []).slice(0, 10).map((m: any, idx: number) => ({
          id: `mail-${idx}-${Date.now()}`,
          from: m.from ? m.from.split('<')[0].replace(/"/g, '').trim() : "Unknown",
          subject: m.subject || "(No Subject)",
          link: m.link || "#",
          isNaver: m.from ? m.from.toLowerCase().includes('naver.com') : false
        }));
      };
      const [pMails, cMails] = await Promise.all([fetchSet(MAIL_CONFIG.personal), fetchSet(MAIL_CONFIG.company)]);
      setPersonalMails(pMails);
      setCompanyMails(cMails);
    } catch (error) {
      setMailError("Mail sync failed");
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
    fetchIntelligence();
    if (accessToken) fetchGoogleCalendarEvents(accessToken);
  }, [fetchMails, fetchNews, fetchIntelligence, fetchGoogleCalendarEvents, accessToken]);

  useEffect(() => {
    const isUnlocked = localStorage.getItem('ceo_unlocked') === 'true';
    if (isUnlocked) setUnlocked(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { if (unlocked) refreshAll(); }, [unlocked, refreshAll]);

  const addTask = (text: string, type: TaskType) => {
    const newTask: Task = { id: Math.random().toString(36).substr(2, 9), text, completed: false, type, createdAt: Date.now() };
    setTasks([...tasks, newTask]);
  };

  const toggleTask = (id: string) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));

  const renderWeatherIcon = (code: string) => {
    switch (code) {
      case 'rain': return <CloudRain size={24} className="text-blue-400" />;
      case 'cloud': return <Cloud size={24} className="text-gray-400" />;
      default: return <SunIcon size={24} className="text-orange-400" />;
    }
  };

  const renderAirFace = (face: 'good' | 'normal' | 'bad' | 'danger') => {
    switch (face) {
      case 'good': return <Smile size={24} className="text-emerald-500" />;
      case 'normal': return <Meh size={24} className="text-yellow-500" />;
      case 'bad': return <Frown size={24} className="text-orange-500" />;
      case 'danger': return <Skull size={24} className="text-red-500" />;
    }
  };

  const renderSection = (id: string) => {
    switch (id) {
      case 'comms':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            <MailCard title="Operational Directives" mails={companyMails} isLoading={isLoadingMails} error={mailError} />
            <MailCard title="Personal Intelligence" mails={personalMails} isLoading={isLoadingMails} error={mailError} isNaverAuto={true} />
          </div>
        );
      case 'tasks':
        return (
          <TaskCard 
            title="Immediate Objectives" 
            type={TaskType.TODAY} 
            tasks={tasks.filter(t => t.type === TaskType.TODAY)} 
            onAddTask={addTask} 
            onToggleTask={toggleTask} 
            onDeleteTask={deleteTask} 
          />
        );
      case 'news':
        return (
          <div className="glass-panel p-10 space-y-8 h-full min-h-[400px]">
            <div className="flex items-center gap-5 mb-2">
              <TrendingUp size={16} className="text-emerald-600/30 dark:text-emerald-500/30" />
              <h3 className="text-[13px] font-black tracking-[0.6em] text-gray-900/40 dark:text-white/30 uppercase">Strategic Briefing</h3>
            </div>
            
            <div className="space-y-8 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {isLoadingNews ? (
                <div className="animate-pulse space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-3">
                      <div className="h-2 w-20 bg-gray-200 dark:bg-white/5 rounded-full"></div>
                      <div className="h-4 bg-gray-200 dark:bg-white/5 rounded-full w-full"></div>
                    </div>
                  ))}
                </div>
              ) : news.length > 0 ? (
                news.map((item, idx) => (
                  <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="block group border-b border-gray-100 dark:border-white/5 pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest">{item.source}</span>
                      <span className="text-[10px] text-gray-400 dark:text-white/20 font-bold">{item.pubDate}</span>
                    </div>
                    <p className="text-[15px] font-black text-gray-900 dark:text-white/80 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all leading-snug">{item.title}</p>
                    <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-black uppercase text-blue-600">Full Report</span>
                      <ArrowUpRight size={12} className="text-blue-600" />
                    </div>
                  </a>
                ))
              ) : (
                <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-3xl">
                  <p className="text-[11px] text-gray-300 dark:text-white/10 font-black uppercase tracking-[0.5em]">No external intel reported</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'yesterday':
        return (
          <TaskCard 
            title="Retro-Analysis" 
            type={TaskType.YESTERDAY} 
            tasks={tasks.filter(t => t.type === TaskType.YESTERDAY)} 
            onAddTask={addTask} 
            onToggleTask={toggleTask} 
            onDeleteTask={deleteTask} 
          />
        );
      case 'agenda':
        return (
          <CalendarCard 
            events={calendarEvents} 
            isLoading={isLoadingCalendar} 
            embedUrl={googleCalendarUrl}
          />
        );
      case 'logout':
        return (
          <button 
            onClick={() => { localStorage.removeItem('ceo_unlocked'); setUnlocked(false); }}
            className="glass-panel w-full p-10 flex items-center justify-center gap-6 text-gray-400 dark:text-white/10 hover:text-red-500 hover:bg-red-500/5 transition-all group"
          >
            <LogOut size={24} className="group-hover:-translate-x-3 transition-transform" />
            <span className="text-[12px] font-black tracking-[0.8em] uppercase">Terminate Session</span>
          </button>
        );
      default:
        return null;
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black relative">
        <UnicornBackground />
        <div className="glass-panel max-w-sm w-full p-12 md:p-20 text-center relative z-10 animate-fade-up">
          <div className="mb-10 md:mb-14 flex flex-col items-center">
            <img src={LOGO_WHITE} className="max-w-[200px] w-full h-auto object-contain mb-6" alt="FUP Global Partners" />
            <p className="text-[10px] text-white/20 tracking-[0.6em] uppercase font-bold">ENCRYPTED PORTAL</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (pin === PIN_CODE) { setUnlocked(true); localStorage.setItem('ceo_unlocked', 'true'); } else { alert('Access Denied'); setPin(''); } }} className="space-y-8 md:space-y-10">
            <input type="password" maxLength={4} value={pin} autoFocus onChange={(e) => setPin(e.target.value)} placeholder="••••" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-center text-3xl tracking-[0.6em] focus:outline-none focus:border-white/30 transition-all placeholder:text-white/10" />
            <button type="submit" className="w-full bg-white/10 hover:bg-white/20 text-white font-black py-5 rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px]">Verify Access <ChevronRight size={18} /></button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content relative bg-[#f2f4f7] dark:bg-black">
      <UnicornBackground />
      <div className="max-w-[1600px] mx-auto relative z-10">
        <header className="flex flex-col gap-4 md:gap-8 pt-2 md:pt-10 mb-8 md:mb-16">
          
          {/* Logo Section (Red Box Area) */}
          <div className="animate-fade-up flex justify-start pl-1">
            <img 
              src={theme === 'dark' ? LOGO_WHITE : LOGO_BLACK} 
              className="h-4 md:h-6 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity duration-500" 
              alt="FUP Logo" 
            />
          </div>

          {/* Main Title Section (Light Blue Box Area) */}
          <div className="animate-fade-up flex flex-col md:flex-row md:items-baseline gap-2 md:gap-6">
            <h1 className="text-xl md:text-4xl font-extrabold tracking-[0.3em] text-gray-900 dark:text-white uppercase leading-none">
              CEO <span className="text-gray-400 dark:text-white/10 mx-1 md:mx-2 font-light">_</span> 
              Junseok Lee <span className="text-gray-400 dark:text-white/10 mx-1 md:mx-2 font-light">_</span> 
              Dashboard
            </h1>
          </div>

          {/* Combined Desktop Bar / Mobile Grid */}
          <div className="w-full animate-fade-up">
            {/* Desktop Horizontal Bar Layout */}
            <div className="hidden md:flex items-stretch gap-3 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3 rounded-[32px] shadow-sm">
              
              {/* Left Group (1, 2, 3, 4) */}
              <div className="flex gap-3">
                {/* 1: Theme Toggle */}
                <button 
                  onClick={toggleTheme} 
                  className="w-[80px] h-[80px] flex items-center justify-center rounded-2xl border border-gray-200 dark:border-white/10 bg-white/90 dark:bg-white/5 text-gray-600 dark:text-white/60 transition-all hover:scale-[1.03] active:scale-95 shadow-sm"
                >
                  {theme === 'dark' ? <Sun size={28} /> : <Moon size={28} />}
                </button>
                
                {/* 2: Settings */}
                <button 
                  onClick={() => setShowSettings(!showSettings)} 
                  className={`w-[80px] h-[80px] flex items-center justify-center rounded-2xl border transition-all hover:scale-[1.03] active:scale-95 shadow-sm ${showSettings ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-200 dark:border-white/10 bg-white/90 dark:bg-white/5 text-gray-600 dark:text-white/60'}`}
                >
                  <Settings size={28} />
                </button>

                {/* 3: Weather */}
                <div className="w-[80px] h-[80px] flex flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-white/10 bg-white/90 dark:bg-white/5 shadow-sm">
                  {weather ? (
                    <>
                      <div className="mb-1">{renderWeatherIcon(weather.icon)}</div>
                      <div className="flex items-center gap-1 leading-none">
                        <span className="text-[13px] font-black text-gray-900 dark:text-white">{weather.temp}°</span>
                        <span className="text-[9px] font-bold text-blue-500/60 dark:text-blue-400/50">{weather.humidity}%</span>
                      </div>
                    </>
                  ) : <div className="w-5 h-5 rounded-full bg-gray-400/20 animate-pulse" />}
                </div>

                {/* 4: Air Quality */}
                <div className="w-[80px] h-[80px] flex flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-white/10 bg-white/90 dark:bg-white/5 px-0.5 shadow-sm">
                  {airQuality ? (
                    <>
                      <div className="mb-1">{renderAirFace(airQuality.face)}</div>
                      <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                        {airQuality.status}
                      </span>
                    </>
                  ) : <div className="w-5 h-5 rounded-full bg-gray-400/20 animate-pulse" />}
                </div>
              </div>

              {/* Right Group (5: Clock + Info) - Fills the rest of the bar */}
              <div className="flex-1 flex items-center justify-between px-8 py-2 ml-4 bg-gray-100/50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-2xl">
                <div className="flex flex-col">
                  <div className="text-gray-400 dark:text-white/30 text-[13px] font-black tracking-[0.2em] uppercase">
                    {currentTime.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                  </div>
                  <div className="text-[10px] text-emerald-500 font-bold tracking-[0.25em] uppercase opacity-60 mt-1">
                    Strategic Grid Balanced
                  </div>
                </div>
                <div className="text-gray-900 dark:text-white text-5xl font-black tracking-tighter leading-none tabular-nums">
                  {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
              </div>
            </div>

            {/* Mobile Grid Layout (Responsive fallback) */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4 md:hidden w-full">
              <button onClick={toggleTheme} className="col-span-1 aspect-square flex items-center justify-center rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-gray-600 dark:text-white/60 shadow-sm">{theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}</button>
              <button onClick={() => setShowSettings(!showSettings)} className={`col-span-1 aspect-square flex items-center justify-center rounded-2xl border shadow-sm ${showSettings ? 'bg-blue-600 border-blue-500 text-white' : 'border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-gray-600 dark:text-white/60'}`}><Settings size={24} /></button>
              <div className="col-span-2 row-span-2 flex flex-col justify-between p-5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 shadow-sm">
                <div className="text-gray-400 dark:text-white/30 text-[12px] font-black tracking-widest uppercase">{currentTime.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</div>
                <div className="flex flex-col items-end mt-4">
                  <div className="text-gray-900 dark:text-white text-5xl font-black tracking-tighter leading-none mb-1">{currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                  <div className="text-[8px] text-emerald-500 font-bold tracking-widest uppercase opacity-60">Strategic Grid Balanced</div>
                </div>
              </div>
              <div className="col-span-1 aspect-square flex flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 shadow-sm">
                {weather ? <><div className="mb-0.5">{renderWeatherIcon(weather.icon)}</div><div className="text-[12px] font-black text-gray-900 dark:text-white">{weather.temp}°</div></> : <div className="w-5 h-5 rounded-full bg-gray-400/20 animate-pulse" />}
              </div>
              <div className="col-span-1 aspect-square flex flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 shadow-sm">
                {airQuality ? <><div className="mb-0.5">{renderAirFace(airQuality.face)}</div><span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">{airQuality.status}</span></> : <div className="w-5 h-5 rounded-full bg-gray-400/20 animate-pulse" />}
              </div>
            </div>
          </div>
        </header>

        {showSettings && (
          <div className="glass-panel p-8 md:p-12 mb-12 animate-fade-up border-blue-500/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-5">
                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-600 dark:text-blue-500">Cloud Connectivity</h3>
                <input type="text" placeholder="Storage Endpoint URL" value={storageUrl} onChange={(e) => setStorageUrl(e.target.value)} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 text-[10px] font-mono text-gray-600 dark:text-white/40 focus:outline-none" />
                <button onClick={refreshAll} className="px-6 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><RefreshCw size={14} /> Global Sync</button>
              </div>
              <div className="space-y-5">
                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-purple-600 dark:text-purple-500">Security</h3>
                <input type="text" placeholder="OAuth Client ID" value={googleClientId} onChange={(e) => setGoogleClientId(e.target.value)} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-5 py-4 text-[10px] font-mono text-gray-600 dark:text-white/40" />
                <button onClick={handleGoogleLogin} className="w-full py-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3"><Key size={16} /> Authorize Access</button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 items-start pb-40">
          <div className="lg:col-span-8 space-y-10">
            {layout.top.map(id => renderSection(id))}
            {layout.left.map(id => renderSection(id))}
          </div>
          <div className="lg:col-span-4 space-y-10">
            {layout.right.map(id => renderSection(id))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
