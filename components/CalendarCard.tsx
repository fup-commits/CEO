
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

  // 다크 모드 파라미터 강제 적용 (URL 최적화)
  const getProcessedEmbedUrl = (url: string) => {
    if (!url) return "";
    try {
      const u = new URL(url);
      u.searchParams.set('bgcolor', '#000000');
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
    <div className={`glass-panel p-6 flex flex-col overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <CalendarIcon size={14} className="text-white/20" />
          <h3 className="text-[11px] font-bold tracking-[0.4em] text-white/40 uppercase">Executive Schedule</h3>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('strategic')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${viewMode === 'strategic' ? 'bg-white text-black' : 'text-white/30 hover:text-white/60'}`}
          >
            <Layout size={10} /> Strategic
          </button>
          <button 
            onClick={() => setViewMode('live')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${viewMode === 'live' ? 'bg-white text-black' : 'text-white/30 hover:text-white/60'}`}
          >
            <Monitor size={10} /> Live Feed
          </button>
        </div>
      </div>

      {viewMode === 'live' && embedUrl ? (
        <div className="flex-1 w-full rounded-xl overflow-hidden bg-black/40 border border-white/5">
          <iframe 
            src={getProcessedEmbedUrl(embedUrl)} 
            style={{ border: 0, width: '100%', height: '100%', filter: 'invert(90%) hue-rotate(180deg) brightness(0.8) contrast(1.2)' }} 
            frameBorder="0" 
            scrolling="no"
          ></iframe>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6 shrink-0">
            <span className="text-xs font-medium text-white/60">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-1 hover:bg-white/5 rounded-md transition-colors text-white/40 hover:text-white">
                <ChevronLeft size={16} />
              </button>
              <button onClick={nextMonth} className="p-1 hover:bg-white/5 rounded-md transition-colors text-white/40 hover:text-white">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-6 text-center shrink-0">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-[9px] font-bold text-white/10 py-2">{d}</div>
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
                  className={`relative aspect-square flex items-center justify-center text-[11px] rounded-full transition-all duration-300
                    ${isSelected ? 'bg-white text-black font-bold' : isToday ? 'text-blue-400 font-bold border border-blue-400/30' : 'text-white/40 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  {d}
                  {hasEvents && !isSelected && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/20 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[150px]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
              </span>
              <div className="h-[1px] flex-1 bg-white/5 ml-4"></div>
            </div>

            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl w-full"></div>)}
              </div>
            ) : selectedEvents.length === 0 ? (
              <p className="text-[11px] text-white/10 italic py-4">No scheduled engagements for this date</p>
            ) : (
              <div className="space-y-4">
                {selectedEvents.map((event) => (
                  <div key={event.id} className="group relative pl-4 py-3 border-l-2 transition-all hover:bg-white/[0.02] rounded-r-xl" style={{ borderLeftColor: event.color || '#3b82f6' }}>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-medium text-white/90 leading-tight group-hover:text-white">{event.title}</h4>
                    </div>
                    <div className="flex flex-wrap gap-4 opacity-40 group-hover:opacity-60 transition-opacity">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <Clock size={10} />
                        {new Date(event.start).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <MapPin size={10} />
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
