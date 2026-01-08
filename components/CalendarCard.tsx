
import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, Monitor, Layout } from 'lucide-react';

interface CalendarCardProps {
  events: CalendarEvent[];
  isLoading: boolean;
  className?: string;
  embedUrl?: string;
}

const CalendarCard: React.FC<CalendarCardProps> = ({ events, isLoading, className = "", embedUrl }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'strategic' | 'live'>('strategic');

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === currentDate.getMonth() && 
             eventDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const selectedEvents = getEventsForDay(selectedDate.getDate());

  const getProcessedEmbedUrl = (url: string) => {
    if (!url) return "";
    try {
      const u = new URL(url);
      const isDark = document.documentElement.classList.contains('dark');
      u.searchParams.set('bgcolor', isDark ? '#000000' : '#f2f4f7');
      u.searchParams.set('showTitle', '0');
      u.searchParams.set('showPrint', '0');
      u.searchParams.set('showCalendars', '0');
      u.searchParams.set('showTz', '0');
      return u.toString();
    } catch (e) {
      return url;
    }
  };

  return (
    <div className={`glass-panel p-10 flex flex-col overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-12 shrink-0">
        <div className="flex items-center gap-5">
          <div className="p-3 rounded-2xl bg-purple-600/10 border border-purple-600/20">
            <CalendarIcon size={22} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-[13px] font-black tracking-[0.6em] text-gray-900/40 dark:text-white/30 uppercase">Executive Schedule</h3>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl border border-gray-200 dark:border-white/5">
          <button 
            onClick={() => setViewMode('strategic')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[0.9rem] text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'strategic' ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xl' : 'text-gray-400 dark:text-white/20 hover:text-gray-900 dark:hover:text-white/60'}`}
          >
            <Layout size={14} /> STRATEGIC
          </button>
          <button 
            onClick={() => setViewMode('live')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[0.9rem] text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'live' ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xl' : 'text-gray-400 dark:text-white/20 hover:text-gray-900 dark:hover:text-white/60'}`}
          >
            <Monitor size={14} /> LIVE FEED
          </button>
        </div>
      </div>

      {viewMode === 'live' && embedUrl ? (
        <div className="flex-1 w-full rounded-3xl overflow-hidden bg-white/50 dark:bg-black/40 border border-gray-200 dark:border-white/5">
          <iframe 
            src={getProcessedEmbedUrl(embedUrl)} 
            style={{ border: 0, width: '100%', height: '100%', filter: document.documentElement.classList.contains('dark') ? 'invert(90%) hue-rotate(180deg) brightness(0.8) contrast(1.2)' : 'none' }} 
            frameBorder="0" 
            scrolling="no"
          ></iframe>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-10 shrink-0">
            <span className="text-2xl font-black text-gray-900 dark:text-white/80 uppercase tracking-tighter">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <div className="flex gap-3">
              <button onClick={prevMonth} className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all text-gray-400 dark:text-white/30 hover:text-blue-600">
                <ChevronLeft size={22} />
              </button>
              <button onClick={nextMonth} className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all text-gray-400 dark:text-white/30 hover:text-blue-600">
                <ChevronRight size={22} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-10 text-center shrink-0">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-[11px] font-black text-gray-300 dark:text-white/10 py-3 uppercase">{d}</div>
            ))}
            {blanks.map(b => <div key={`b-${b}`} className="aspect-square"></div>)}
            {days.map(d => {
              const hasEvents = getEventsForDay(d).length > 0;
              const isToday = d === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
              const isSelected = d === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth();

              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), d))}
                  className={`relative aspect-square flex items-center justify-center text-[14px] rounded-2xl transition-all duration-400 font-bold
                    ${isSelected ? 'bg-blue-600 dark:bg-white text-white dark:text-black font-black shadow-xl scale-110' : isToday ? 'text-blue-700 dark:text-blue-400 font-black ring-2 ring-blue-500/20' : 'text-gray-400 dark:text-white/30 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white'}
                  `}
                >
                  {d}
                  {hasEvents && !isSelected && (
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 dark:bg-blue-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar min-h-[200px]">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[11px] font-black text-blue-600 dark:text-white/20 uppercase tracking-[0.4em]">
                {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} Engagement
              </span>
              <div className="h-[1px] flex-1 bg-gray-200 dark:bg-white/5 ml-8"></div>
            </div>

            {isLoading ? (
              <div className="space-y-8 animate-pulse">
                {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-white/5 rounded-3xl w-full"></div>)}
              </div>
            ) : selectedEvents.length === 0 ? (
              <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-3xl">
                <p className="text-[11px] text-gray-300 dark:text-white/10 font-black uppercase tracking-[0.5em]">No Strategic Engagements</p>
              </div>
            ) : (
              <div className="space-y-8">
                {selectedEvents.map((event) => (
                  <div key={event.id} className="group relative pl-8 py-5 border-l-4 transition-all hover:bg-blue-50 dark:hover:bg-white/[0.02] rounded-r-3xl" style={{ borderLeftColor: event.color || '#3b82f6' }}>
                    <h4 className="text-[17px] font-black text-gray-900 dark:text-white/90 leading-tight group-hover:text-blue-700 dark:group-hover:text-blue-500 mb-3">{event.title}</h4>
                    <div className="flex flex-wrap gap-7 opacity-40 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-white/80">
                        <Clock size={14} className="text-blue-600 dark:text-blue-500" />
                        {new Date(event.start).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-white/80">
                          <MapPin size={14} className="text-emerald-500" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarCard;
