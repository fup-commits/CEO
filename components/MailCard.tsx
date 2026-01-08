
import React from 'react';
import { Mail } from '../types';
import { Mail as MailIcon, ExternalLink, ArrowRight } from 'lucide-react';

interface MailCardProps {
  title: string;
  mails: Mail[];
  isLoading: boolean;
  isNaverAuto?: boolean;
}

const MailCard: React.FC<MailCardProps> = ({ title, mails, isLoading, isNaverAuto }) => {
  return (
    <div className="glass-panel p-6 flex flex-col h-[300px]">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase flex items-center gap-2">
          {title}
        </h3>
        {mails.length > 0 && (
          <span className="text-[9px] font-bold bg-white text-black px-2 py-0.5 rounded-sm">
            {mails.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex flex-col justify-center space-y-4">
            <div className="h-4 w-2/3 bg-white/5 animate-pulse rounded"></div>
            <div className="h-3 w-full bg-white/5 animate-pulse rounded"></div>
          </div>
        ) : mails.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <MailIcon size={24} strokeWidth={1} className="mb-3" />
            <p className="text-[10px] tracking-widest uppercase">
              {isNaverAuto ? "Forwarding Active" : "Inbox Clear"}
            </p>
          </div>
        ) : (
          mails.slice(0, 6).map((mail) => (
            <a 
              key={mail.id} 
              href={mail.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors truncate">
                  {mail.from}
                </span>
                {mail.isNaver && (
                  <span className="text-[8px] bg-[#2DB400]/20 text-[#2DB400] border border-[#2DB400]/30 px-1 rounded-sm font-bold">NAVER</span>
                )}
              </div>
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] text-white/30 group-hover:text-white/50 transition-colors leading-relaxed line-clamp-2">
                  {mail.subject}
                </p>
                <ArrowRight size={10} className="mt-1 opacity-0 group-hover:opacity-40 transition-all group-hover:translate-x-1" />
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
};

export default MailCard;
