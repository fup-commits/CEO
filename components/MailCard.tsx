
import React from 'react';
import { Mail } from '../types';
import { Mail as MailIcon, ArrowRight, AlertCircle } from 'lucide-react';

interface MailCardProps {
  title: string;
  mails: Mail[];
  isLoading: boolean;
  error?: string | null;
  isNaverAuto?: boolean;
}

const MailCard: React.FC<MailCardProps> = ({ title, mails, isLoading, error, isNaverAuto }) => {
  return (
    <div className={`glass-panel p-8 flex flex-col h-[360px] transition-all duration-400 ${error ? 'border-red-500/30' : ''}`}>
      <div className="flex items-center justify-between mb-10">
        <h3 className="text-[11px] font-black tracking-[0.5em] text-gray-900/40 dark:text-white/30 uppercase flex items-center gap-2">
          {title}
        </h3>
        {mails.length > 0 && !error && (
          <span className="text-[10px] font-black bg-gray-900 dark:bg-blue-600 text-white dark:text-white px-3 py-1.5 rounded-xl shadow-lg">
            {mails.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-7 pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex flex-col justify-center space-y-6">
            <div className="h-4 w-2/3 bg-gray-200 dark:bg-white/5 animate-pulse rounded-full"></div>
            <div className="h-3 w-full bg-gray-200 dark:bg-white/5 animate-pulse rounded-full"></div>
            <div className="h-3 w-3/4 bg-gray-200 dark:bg-white/5 animate-pulse rounded-full"></div>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <AlertCircle size={32} strokeWidth={1.5} className="mb-5 text-red-500 opacity-40" />
            <p className="text-[10px] text-gray-400 dark:text-white/30 uppercase tracking-[0.3em] font-black mb-2">Sync Interrupted</p>
            <p className="text-[11px] text-gray-400/50 dark:text-white/10 font-bold leading-relaxed uppercase">Authorization Required</p>
          </div>
        ) : mails.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-10">
            <MailIcon size={36} strokeWidth={1} className="mb-5 text-gray-900 dark:text-white" />
            <p className="text-[11px] tracking-[0.6em] uppercase font-black text-gray-900 dark:text-white">
              {isNaverAuto ? "INTEL READY" : "PROTOCOL CLEAR"}
            </p>
          </div>
        ) : (
          mails.slice(0, 7).map((mail) => (
            <a key={mail.id} href={mail.link} target="_blank" rel="noopener noreferrer" className="group block">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[13px] font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors truncate">
                  {mail.from}
                </span>
                {mail.isNaver && (
                  <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/30 px-2 py-0.5 rounded-md font-black tracking-tight uppercase">NAVER</span>
                )}
              </div>
              <div className="flex items-start justify-between gap-5">
                <p className="text-[12px] text-gray-500 dark:text-white/30 group-hover:text-gray-900 dark:group-hover:text-white/70 transition-colors leading-snug line-clamp-2 font-semibold">
                  {mail.subject}
                </p>
                <ArrowRight size={14} className="mt-1 opacity-0 group-hover:opacity-40 transition-all group-hover:translate-x-2 text-blue-600 dark:text-blue-500" />
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
};

export default MailCard;
