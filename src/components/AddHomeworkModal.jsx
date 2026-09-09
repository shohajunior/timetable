import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Calendar, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { getAvailableSubjects, findNextLessonDate } from '../utils/homeworkUtils';

export function AddHomeworkModal({ isOpen, onClose, onAddHomework, lessons, userProfile }) {
  const availableSubjects = getAvailableSubjects(lessons);

  const [subject, setSubject] = useState(availableSubjects[0] || 'Алгебра');
  const [description, setDescription] = useState('');
  const [dueType, setDueType] = useState('next_lesson'); // 'next_lesson' | 'custom_date'
  const [customDate, setCustomDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [nextLessonInfo, setNextLessonInfo] = useState(null);
  const [error, setError] = useState(null);

  // Recalculate next lesson whenever subject or lessons change
  useEffect(() => {
    if (subject) {
      const info = findNextLessonDate(subject, lessons);
      setNextLessonInfo(info);
    }
  }, [subject, lessons]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Пожалуйста, напишите задание по предмету');
      return;
    }

    let finalDueDate = customDate;
    if (dueType === 'next_lesson' && nextLessonInfo?.dateStr) {
      finalDueDate = nextLessonInfo.dateStr;
    }

    const newHomework = {
      id: 'hw-user-' + Date.now(),
      subject: subject,
      description: description.trim(),
      dueDate: finalDueDate,
      dueType: dueType,
      dueDateLabel: dueType === 'next_lesson' ? nextLessonInfo?.formattedLabel : null,
      createdBy: userProfile?.name || 'Ученик',
      createdById: userProfile?.id || 'user-guest',
      createdAt: new Date().toISOString(),
      isCompleted: false
    };

    onAddHomework(newHomework);
    setDescription('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col text-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-slate-900 text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Новое домашнее задание
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-medium">
                {error}
              </div>
            )}

            {/* Subject Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Предмет <span className="text-rose-500">*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-slate-900"
              >
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Что задали (Задание) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setError(null);
                }}
                placeholder="напр. Упр 45-50 стр 112, подготовить доклад к уроку..."
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
                required
              />
            </div>

            {/* Due Date Option */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700">
                Когда проверят / Сдать до: <span className="text-rose-500">*</span>
              </label>

              {/* Radio 1: Next Lesson */}
              <label
                onClick={() => setDueType('next_lesson')}
                className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                  dueType === 'next_lesson'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="dueType"
                  checked={dueType === 'next_lesson'}
                  onChange={() => setDueType('next_lesson')}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5" /> К следующему уроку
                  </div>
                  {nextLessonInfo && (
                    <div className={`text-[11px] mt-0.5 font-medium ${dueType === 'next_lesson' ? 'text-slate-300' : 'text-emerald-700'}`}>
                      {nextLessonInfo.formattedLabel}
                    </div>
                  )}
                </div>
              </label>

              {/* Radio 2: Custom Date */}
              <label
                onClick={() => setDueType('custom_date')}
                className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                  dueType === 'custom_date'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="dueType"
                  checked={dueType === 'custom_date'}
                  onChange={() => setDueType('custom_date')}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <Calendar className="w-3.5 h-3.5" /> Выбрать другую дату
                  </div>
                  {dueType === 'custom_date' && (
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none"
                    />
                  )}
                </div>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                Опубликовать ДЗ
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
