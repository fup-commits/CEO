
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
      // Ensure it fills as much as possible inside the iframe
      return u.toString();
    } catch (e) {
      return url;
    }
  };

  return (
    <div className={`glass-panel p-6 md:p-8 flex flex-col overflow-hidden h-[800px] md:h-[820px] ${className}`}>
      {/* Header Section - More compact to give space to the content below */}
      <div className="flex flex-col gap-6 mb-8 shrink-0">
        <div className="flex items-center gap-4 justify-start">
          <div className="p-2.5 rounded-xl bg-purple-600/10 border border-purple-600/20 shrink-0">
            <CalendarIcon size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-[12px] font-black tracking-[0.5em] text-gray-900/40 dark:text-white/30 uppercase whitespace-nowrap">
            Executive Schedule
          </h3>
        </div>
        
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/5 shrink-0 w-full">
          <button 
            onClick={() => setViewMode('strategic')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-[0.8rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === 'strategic' ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-lg' : 'text-gray-400 dark:text-white/20 hover:text-gray-900 dark:hover:text-white/60'}`}
          >
            <Layout size={14} className="shrink-0" /> STRATEGIC
          </button>
          <button 
            onClick={() => setViewMode('live')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-[0.8rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === 'live' ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-lg' : 'text-gray-400 dark:text-white/20 hover:text-gray-900 dark:hover:text-white/60'}`}
          >
            <Monitor size={14} className="shrink-0" /> LIVE FEED
          </button>
        </div>
      </div>

      {/* Content Area - This is the "Red Box" area */}
      <div className="flex-1 flex flex-col min-h-0">
        {viewMode === 'live' && embedUrl ? (
          <div className="flex-1 w-full rounded-2xl overflow-hidden bg-white/50 dark:bg-black/40 border border-gray-200 dark:border-white/5 h-full">
            <iframe 
              src={getProcessedEmbedUrl(embedUrl)} 
              style={{ border: 0, width: '100%', height: '100%', filter: document.documentElement.classList.contains('dark') ? 'invert(90%) hue-rotate(180deg) brightness(0.8) contrast(1.2)' : 'none' }} 
              frameBorder="0" 
              scrolling="no"
              className="w-full h-full"
            ></iframe>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 shrink-0">
              <span className="text-lg md:text-xl font-black text-gray-900 dark:text-white/80 uppercase tracking-tighter">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex gap-1.5">
                <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all text-gray-400 dark:text-white/30">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all text-gray-400 dark:text-white/30">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 md:gap-1.5 mb-6 text-center shrink-0">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="text-[9px] font-black text-gray-300 dark:text-white/10 py-1.5 uppercase">{d}</div>
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
                    className={`relative aspect-square flex items-center justify-center text-[12px] md:text-[13px] rounded-lg transition-all duration-300 font-bold
                      ${isSelected ? 'bg-blue-600 dark:bg-white text-white dark:text-black font-black shadow-md scale-105' : isToday ? 'text-blue-700 dark:text-blue-400 font-black ring-1 ring-blue-500/20' : 'text-gray-400 dark:text-white/30 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white'}
                    `}
                  >
                    {d}
                    {hasEvents && !isSelected && (
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[9px] font-black text-blue-600 dark:text-white/20 uppercase tracking-[0.4em] whitespace-nowrap">
                  {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} Engagement
                </span>
                <div className="h-[1px] flex-1 bg-gray-200 dark:bg-white/5 ml-6"></div>
              </div>

              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-white/5 rounded-xl w-full"></div>)}
                </div>
              ) : selectedEvents.length === 0 ? (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-xl">
                  <p className="text-[9px] text-gray-300 dark:text-white/10 font-black uppercase tracking-[0.4em]">No Strategic Engagements</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedEvents.map((event) => (
                    <div key={event.id} className="group relative pl-5 py-3 border-l-2 transition-all hover:bg-blue-50 dark:hover:bg-white/[0.02] rounded-r-xl" style={{ borderLeftColor: event.color || '#3b82f6' }}>
                      <h4 className="text-[14px] md:text-[15px] font-black text-gray-900 dark:text-white/90 leading-tight group-hover:text-blue-700 dark:group-hover:text-blue-500 mb-1.5">{event.title}</h4>
                      <div className="flex flex-wrap gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-white/80">
                          <Clock size={11} className="text-blue-600 dark:text-blue-500" />
                          {new Date(event.start).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-white/80">
                            <MapPin size={11} className="text-emerald-500" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="h-10"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarCard;
