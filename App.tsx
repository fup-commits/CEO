
import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskType, Mail, NewsItem } from './types';
import UnicornBackground from './components/UnicornBackground';
import MailCard from './components/MailCard';
import TaskCard from './components/TaskCard';
import { 
  Lock, Clock, Calendar as CalendarIcon, 
  RefreshCw, TrendingUp, ShieldCheck,
  ChevronRight, LogOut, ArrowUpRight, GripVertical
} from 'lucide-react';

const PIN_CODE = '0925';

const MAIL_CONFIG = {
  personal: 'https://script.google.com/macros/s/AKfycbxPt7-RQromTNCVGjk1KW9UIf9hj6voRQEjJrlmZNy_oA3CHI03apedJWrDCbvpUU9njg/exec',
  company: 'https://script.google.com/macros/s/AKfycbyXlpoE7c6MGH-uzEBwsTzoEVZf_GNBvJGe-gSRBk_uaZdl6TIDpglDqS6uamBQ5XAQ/exec'
};

const NEWS_SOURCES = [
  { name: '에프유피글로벌파트너스', query: '에프유피글로벌파트너스' },
  { name: '와이낫글로벌이니셔티브', query: '와이낫글로벌이니셔티브' }
];

const App: React.FC = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [personalMails, setPersonalMails] = useState<Mail[]>([]);
  const [companyMails, setCompanyMails] = useState<Mail[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [isLoadingMails, setIsLoadingMails] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 대시보드 레이아웃 순서 상태
  const [layout, setLayout] = useState({
    top: ['comms'],
    left: ['tasks', 'news'],
    right: ['yesterday', 'agenda', 'logout']
  });

  const [draggedId, setDraggedId] = useState<{ id: string, section: 'top' | 'left' | 'right' } | null>(null);

  useEffect(() => {
    const isUnlocked = localStorage.getItem('ceo_unlocked') === 'true';
    if (isUnlocked) setUnlocked(true);
    
    const savedTasks = localStorage.getItem('ceo_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));

    const savedLayout = localStorage.getItem('ceo_layout');
    if (savedLayout) setLayout(JSON.parse(savedLayout));

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin === PIN_CODE) {
      setUnlocked(true);
      localStorage.setItem('ceo_unlocked', 'true');
    } else {
      alert('Security violation: Incorrect PIN');
      setPin('');
    }
  };

  const handleLogout = () => {
    setUnlocked(false);
    localStorage.removeItem('ceo_unlocked');
  };

  const addTask = (text: string, type: TaskType) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      completed: false,
      type,
      createdAt: Date.now(),
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    localStorage.setItem('ceo_tasks', JSON.stringify(updated));
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    localStorage.setItem('ceo_tasks', JSON.stringify(updated));
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    localStorage.setItem('ceo_tasks', JSON.stringify(updated));
  };

  const fetchMails = useCallback(async () => {
    setIsLoadingMails(true);
    try {
      const fetchSet = async (url: string) => {
        const res = await fetch(url);
        const data = await res.json();
        return (data || []).map((m: any, idx: number) => ({
          id: `mail-${idx}-${Date.now()}`,
          from: m.from.split('<')[0].replace(/"/g, '').trim(),
          subject: m.subject,
          link: m.link,
          isNaver: m.from.includes('@naver')
        }));
      };
      const [pMails, cMails] = await Promise.all([
        fetchSet(MAIL_CONFIG.personal),
        fetchSet(MAIL_CONFIG.company)
      ]);
      setPersonalMails(pMails);
      setCompanyMails(cMails);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMails(false);
    }
  }, []);

  const fetchNews = useCallback(async () => {
    setIsLoadingNews(true);
    try {
      const allNews: NewsItem[] = [];
      for (const source of NEWS_SOURCES) {
        const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
          `https://news.google.com/rss/search?q=${source.query}&hl=ko&gl=KR&ceid=KR:ko`
        )}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.items) {
          allNews.push(...data.items.slice(0, 3).map((item: any) => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate.split(' ')[0],
            source: source.name
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
  }, [fetchMails, fetchNews]);

  useEffect(() => {
    if (unlocked) {
      refreshAll();
    }
  }, [unlocked, refreshAll]);

  // Drag and Drop 핸들러
  const onDragStart = (id: string, section: 'top' | 'left' | 'right') => {
    setDraggedId({ id, section });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (targetId: string, targetSection: 'top' | 'left' | 'right') => {
    if (!draggedId || draggedId.section !== targetSection) return;

    const newLayout = { ...layout };
    const sectionList = [...newLayout[targetSection]];
    const draggedIndex = sectionList.indexOf(draggedId.id);
    const targetIndex = sectionList.indexOf(targetId);

    sectionList.splice(draggedIndex, 1);
    sectionList.splice(targetIndex, 0, draggedId.id);

    newLayout[targetSection] = sectionList;
    setLayout(newLayout);
    localStorage.setItem('ceo_layout', JSON.stringify(newLayout));
    setDraggedId(null);
  };

  const renderSection = (id: string) => {
    switch (id) {
      case 'comms':
        return (
          <section className="mb-12 animate-fade-up">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-blue-400/60" />
                <h2 className="text-[11px] font-bold tracking-[0.4em] text-white/40 uppercase">Communications</h2>
              </div>
              <button onClick={refreshAll} className="text-white/20 hover:text-white transition-colors">
                <RefreshCw size={14} className={isLoadingMails ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MailCard title="Work Gmail" mails={companyMails} isLoading={isLoadingMails} />
              <MailCard title="Personal Gmail" mails={personalMails} isLoading={isLoadingMails} />
              <MailCard title="Work Naver" mails={companyMails.filter(m => m.isNaver)} isLoading={isLoadingMails} isNaverAuto />
              <MailCard title="Personal Naver" mails={personalMails.filter(m => m.isNaver)} isLoading={isLoadingMails} isNaverAuto />
            </div>
          </section>
        );
      case 'tasks':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <TaskCard title="Today's Priorities" type={TaskType.TODAY} tasks={tasks.filter(t => t.type === TaskType.TODAY)} onAddTask={addTask} onToggleTask={toggleTask} onDeleteTask={deleteTask} className="h-[450px]" />
            <TaskCard title="Executive Checklist" type={TaskType.CHECKLIST} tasks={tasks.filter(t => t.type === TaskType.CHECKLIST)} onAddTask={addTask} onToggleTask={toggleTask} onDeleteTask={deleteTask} className="h-[450px]" />
          </div>
        );
      case 'news':
        return (
          <div className="glass-panel p-10 min-h-[500px]">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <TrendingUp size={18} className="text-orange-400/60" />
                <h3 className="text-[11px] font-bold tracking-[0.4em] text-white/40 uppercase">Strategic Intelligence</h3>
              </div>
              <button onClick={fetchNews} className="text-white/20 hover:text-white transition-colors">
                <RefreshCw size={16} className={isLoadingNews ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="grid gap-10">
              {news.map((item, idx) => (
                <div key={idx} className="group flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{item.source}</span>
                    <div className="h-[1px] flex-1 bg-white/5"></div>
                    <span className="text-[10px] text-white/20">{item.pubDate}</span>
                  </div>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-lg font-normal text-white/70 group-hover:text-white transition-all flex items-center justify-between leading-snug tracking-tight">
                    {item.title}
                    <ArrowUpRight size={18} className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shrink-0 ml-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        );
      case 'yesterday':
        return <TaskCard title="Yesterday Review" type={TaskType.YESTERDAY} tasks={tasks.filter(t => t.type === TaskType.YESTERDAY)} onAddTask={addTask} onToggleTask={toggleTask} onDeleteTask={deleteTask} className="h-[320px] mb-8" />;
      case 'agenda':
        return (
          <div className="glass-panel p-8 min-h-[350px] mb-8">
            <h3 className="text-[11px] font-bold tracking-[0.4em] text-white/40 uppercase mb-10">Agenda</h3>
            <div className="space-y-8">
              <div className="relative pl-6"><div className="absolute left-0 top-1 bottom-1 w-[2px] bg-blue-500"></div><div className="text-[10px] text-white/30 font-bold uppercase mb-1">09:00 — 10:30</div><div className="text-base font-medium text-white/90">Internal Strategy Board</div></div>
              <div className="relative pl-6 opacity-40"><div className="absolute left-0 top-1 bottom-1 w-[2px] bg-purple-500"></div><div className="text-[10px] text-white/30 font-bold uppercase mb-1">13:00 — 14:30</div><div className="text-base font-normal text-white">Global Partners Sync</div></div>
              <div className="relative pl-6 opacity-40"><div className="absolute left-0 top-1 bottom-1 w-[2px] bg-orange-500"></div><div className="text-[10px] text-white/30 font-bold uppercase mb-1">16:30 — 17:00</div><div className="text-base font-normal text-white">Advisory Panel Call</div></div>
            </div>
          </div>
        );
      case 'logout':
        return (
          <button onClick={handleLogout} className="w-full glass-panel p-6 flex items-center justify-center gap-4 text-red-400/40 hover:text-red-400 hover:bg-red-400/5 transition-all text-[11px] font-bold uppercase tracking-[0.3em]">
            <LogOut size={16} strokeWidth={1.5} /> Terminate Session
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
        <div className="glass-panel max-w-sm w-full p-12 text-center relative z-10 animate-fade-up">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
            <Lock className="text-white/40" size={24} strokeWidth={1.2} />
          </div>
          <div className="mb-10">
            <h1 className="text-xl font-bold tracking-[-0.04em] text-white uppercase leading-none mb-2">fupglobalpartners</h1>
            <p className="text-[10px] text-white/30 tracking-[0.5em] uppercase font-light">CEO DASHBOARD</p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-6">
            <div className="relative">
              <input 
                type="password"
                maxLength={4}
                value={pin}
                autoFocus
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-center text-2xl tracking-[0.6em] focus:outline-none focus:border-white/20 transition-all font-light placeholder:text-white/10"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-white/10 hover:bg-white/15 text-white/90 font-medium py-4 rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2 group backdrop-blur-md"
            >
              Verify <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform opacity-40" />
            </button>
          </form>
          <div className="mt-12">
            <span className="text-[8px] uppercase tracking-[0.4em] text-white/10">Private Access Only</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content relative">
      <UnicornBackground />
      
      <div className="max-w-[1600px] mx-auto relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8 pt-4">
          <div className="animate-fade-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
              <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold">Strategic Intelligence Unit</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-black tracking-[-0.05em] text-white uppercase leading-none">
              fupglobalpartners<br/>
              <span className="text-xl lg:text-2xl font-light tracking-[0.4em] text-white/30">CEO DASHBOARD</span>
            </h1>
          </div>
          <div className="flex flex-col md:items-end gap-2 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 text-white/30 font-light text-sm tracking-wide">
              <CalendarIcon size={14} strokeWidth={1.5} />
              {currentTime.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
            </div>
            <div className="flex items-center gap-4 text-white text-4xl lg:text-5xl font-bold tracking-tighter">
              <Clock size={20} className="text-white/20" />
              {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
              <span className="text-lg text-white/20 ml-[-8px] font-light">{currentTime.toLocaleTimeString('ko-KR', { second: '2-digit' })}</span>
            </div>
          </div>
        </header>

        {/* 상단 섹션 (커뮤니케이션 등) */}
        {layout.top.map((id) => (
          <div 
            key={id} 
            draggable 
            onDragStart={() => onDragStart(id, 'top')}
            onDragOver={onDragOver}
            onDrop={() => onDrop(id, 'top')}
            className="relative group mb-4"
          >
            <div className="absolute -left-6 top-0 bottom-0 flex items-center opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing">
              <GripVertical size={20} />
            </div>
            {renderSection(id)}
          </div>
        ))}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
          {/* 왼쪽 컬럼 (8/12) */}
          <div className="lg:col-span-8 space-y-4">
            {layout.left.map((id) => (
              <div 
                key={id} 
                draggable 
                onDragStart={() => onDragStart(id, 'left')}
                onDragOver={onDragOver}
                onDrop={() => onDrop(id, 'left')}
                className="relative group"
              >
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing">
                  <GripVertical size={20} />
                </div>
                {renderSection(id)}
              </div>
            ))}
          </div>

          {/* 오른쪽 컬럼 (4/12) */}
          <div className="lg:col-span-4 space-y-4">
            {layout.right.map((id) => (
              <div 
                key={id} 
                draggable 
                onDragStart={() => onDragStart(id, 'right')}
                onDragOver={onDragOver}
                onDrop={() => onDrop(id, 'right')}
                className="relative group"
              >
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing">
                  <GripVertical size={20} />
                </div>
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
