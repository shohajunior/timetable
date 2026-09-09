import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  Filter, 
  UserCheck, 
  AlertCircle,
  Sparkles 
} from 'lucide-react';
import { getSubjectColorStyle, getAvailableSubjects } from '../utils/homeworkUtils';

export function HomeworkView({
  homeworkList,
  onAddClick,
  onToggleComplete,
  onDeleteHomework,
  lessons,
  userProfile
}) {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'completed'
  const [selectedSubject, setSelectedSubject] = useState('all');

  const availableSubjects = getAvailableSubjects(lessons);

  // Filter homework
  const filteredItems = homeworkList.filter(item => {
    // Status filter
    if (filterStatus === 'pending' && item.isCompleted) return false;
    if (filterStatus === 'completed' && !item.isCompleted) return false;

    // Subject filter
    if (selectedSubject !== 'all' && item.subject !== selectedSubject) return false;

    return true;
  });

  const pendingCount = homeworkList.filter(i => !i.isCompleted).length;
  const completedCount = homeworkList.filter(i => i.isCompleted).length;

  // Format date helper
  const formatDueDate = (dateStr, dueType, labelStr) => {
    if (labelStr) return labelStr;
    if (!dateStr) return 'Без даты';

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      const monthsRu = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
      return `${parts[2]} ${monthsRu[dateObj.getMonth()]}`;
    }
    return dateStr;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 text-slate-900">
      
      {/* Top Bar / Toolbar */}
      <div className="p-3 sm:p-4 bg-white border-b border-slate-200 shrink-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Домашние задания 
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  1 группа
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Общая база домашних заданий 10-Б класса
              </p>
            </div>
          </div>

          <button
            onClick={onAddClick}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить ДЗ</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          
          {/* Status Tabs */}
          <div className="flex p-0.5 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Все ({homeworkList.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                filterStatus === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              К сдаче ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterStatus === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Выполнено ({completedCount})
            </button>
          </div>

          {/* Subject Filter Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none"
            >
              <option value="all">Все предметы</option>
              {availableSubjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Homework Cards List */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 no-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-200 space-y-2">
            <div className="p-3 rounded-full bg-slate-100 text-slate-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800">Заданий не найдено</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              {filterStatus === 'pending'
                ? 'Отлично! Все домашние задания на текущий момент выполнены.'
                : 'Список домашних заданий пуст. Нажмите "+ Добавить ДЗ", чтобы добавить первое задание.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {filteredItems.map(item => {
                const colors = getSubjectColorStyle(item.subject);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 relative ${
                      item.isCompleted
                        ? 'bg-slate-50/70 border-slate-200 opacity-75'
                        : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                    }`}
                  >
                    {/* Header: Subject & Due Date Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${colors.bg}`}>
                          {item.subject}
                        </span>
                        {item.dueType === 'next_lesson' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" /> След. урок
                          </span>
                        )}
                      </div>

                      {/* Complete Checkbox */}
                      <button
                        onClick={() => onToggleComplete(item.id)}
                        className={`p-1 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium ${
                          item.isCompleted
                            ? 'text-emerald-600 hover:text-emerald-700'
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title={item.isCompleted ? 'Отметить как невыполненное' : 'Отметить как выполненное'}
                      >
                        {item.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>
                    </div>

                    {/* Task Description */}
                    <div className={`text-xs leading-relaxed whitespace-pre-line ${
                      item.isCompleted ? 'line-through text-slate-500' : 'text-slate-800 font-medium'
                    }`}>
                      {item.description}
                    </div>

                    {/* Card Footer: Due Date & Author */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1 text-slate-700 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDueDate(item.dueDate, item.dueType, item.dueDateLabel)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <UserCheck className="w-3 h-3" /> {item.createdBy || 'Ученик'}
                        </span>

                        <button
                          onClick={() => {
                            if (confirm(`Удалить задание по предмета "${item.subject}"?`)) {
                              onDeleteHomework(item.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Удалить ДЗ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

    </div>
  );
}
