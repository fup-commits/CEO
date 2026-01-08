
import React, { useState } from 'react';
import { Task, TaskType } from '../types';
import { Plus, Check, Circle, Trash2, Hash, RefreshCw } from 'lucide-react';

interface TaskCardProps {
  title: string;
  type: TaskType;
  tasks: Task[];
  onAddTask: (text: string, type: TaskType) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  className?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ title, type, tasks, onAddTask, onToggleTask, onDeleteTask, className = "" }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddTask(inputValue.trim(), type);
      setInputValue('');
    }
  };

  return (
    <div className={`glass-panel p-8 md:p-10 flex flex-col h-[480px] md:h-[520px] ${className}`}>
      <div className="flex items-center justify-between mb-10 shrink-0">
        <div className="flex items-center gap-5">
          <Hash size={16} className="text-blue-600/30 dark:text-blue-500/30" />
          <h3 className="text-[13px] font-black tracking-[0.6em] text-gray-900/40 dark:text-white/30 uppercase">{title}</h3>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="text-gray-300 dark:text-white/10 hover:text-blue-500 transition-all"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex-1 space-y-7 mb-6 overflow-y-auto pr-3 custom-scrollbar pb-12">
        {tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-5">
            <Check size={48} strokeWidth={1} className="mb-5 text-gray-900 dark:text-white" />
            <p className="text-[12px] tracking-[0.4em] font-black uppercase text-gray-900 dark:text-white">Zero Operations Pending</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-6 group">
              <button onClick={() => onToggleTask(task.id)} className={`mt-1.5 transition-all ${task.completed ? 'text-emerald-500 scale-125' : 'text-gray-300 dark:text-white/10 hover:text-blue-600 dark:hover:text-blue-500'}`}>
                {task.completed ? <Check size={20} strokeWidth={4} /> : <Circle size={20} strokeWidth={1.5} />}
              </button>
              <span className={`text-[15px] flex-1 leading-snug tracking-tight font-bold ${task.completed ? 'text-gray-300 dark:text-white/10 line-through' : 'text-gray-800 dark:text-white/80'}`}>
                {task.text}
              </span>
              <button onClick={() => onDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 dark:text-white/10 hover:text-red-500 transition-all p-1">
                <Trash2 size={18} strokeWidth={2} />
              </button>
            </div>
          ))
        )}
        <div className="h-4 shrink-0"></div>
      </div>

      <form onSubmit={handleSubmit} className="relative mt-auto shrink-0">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="INITIATE NEW ASSIGNMENT..."
          className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[1.25rem] px-6 py-5 text-[11px] font-black tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white dark:focus:bg-white/10 transition-all placeholder:text-gray-400 dark:placeholder:text-white/10 dark:text-white/80"
        />
        <button type="submit" className="absolute right-6 top-5 text-blue-600 dark:text-blue-500 hover:scale-110 transition-all">
          <Plus size={24} strokeWidth={3} />
        </button>
      </form>
    </div>
  );
};

export default TaskCard;
