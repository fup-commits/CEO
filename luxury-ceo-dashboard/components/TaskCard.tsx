
import React, { useState } from 'react';
import { Task, TaskType } from '../types';
import { Plus, Check, Circle, Trash2, Hash } from 'lucide-react';

interface TaskCardProps {
  title: string;
  type: TaskType;
  tasks: Task[];
  onAddTask: (text: string, type: TaskType) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  className?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  title, type, tasks, onAddTask, onToggleTask, onDeleteTask, className = "" 
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddTask(inputValue.trim(), type);
      setInputValue('');
    }
  };

  return (
    <div className={`glass-panel p-8 flex flex-col ${className}`}>
      <div className="flex items-center gap-3 mb-8">
        <Hash size={12} className="text-white/20" />
        <h3 className="text-[11px] font-bold tracking-[0.4em] text-white/40 uppercase">{title}</h3>
      </div>

      <div className="flex-1 space-y-5 mb-8 overflow-y-auto pr-2 custom-scrollbar">
        {tasks.length === 0 ? (
          <p className="text-[11px] text-white/10 italic font-light">No active assignments</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-4 group">
              <button 
                onClick={() => onToggleTask(task.id)}
                className={`mt-0.5 transition-all ${task.completed ? 'text-emerald-500' : 'text-white/20 hover:text-white/40'}`}
              >
                {task.completed ? <Check size={16} strokeWidth={3} /> : <Circle size={16} strokeWidth={1.5} />}
              </button>
              <span className={`text-sm flex-1 leading-snug tracking-tight font-light ${task.completed ? 'text-white/10 line-through' : 'text-white/70'}`}>
                {task.text}
              </span>
              <button 
                onClick={() => onDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-white/10 hover:text-red-400/50 transition-all"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative mt-auto">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="New Assignment..."
          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all placeholder:text-white/10 font-light"
        />
        <button type="submit" className="absolute right-3 top-2.5 text-white/20 hover:text-white transition-colors">
          <Plus size={18} />
        </button>
      </form>
    </div>
  );
};

export default TaskCard;
