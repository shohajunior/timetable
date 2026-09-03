import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2, Save, Plus, Clock, MapPin, User, Calendar, RefreshCw } from 'lucide-react';
import { checkTimeCollision } from '../utils/collision';
import { DAYS_OF_WEEK } from '../utils/parity';

export function ActivityModal({ isOpen, onClose, onSave, onDelete, initialLesson, existingLessons, currentParity }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'school',
    dayOfWeek: 1,
    startTime: '08:30',
    endTime: '09:15',
    location: '',
    teacher: '',
    periodicity: 'weekly',
    specificDate: ''
  });

  const [collisionWarning, setCollisionWarning] = useState(null);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (initialLesson) {
      setFormData({
        id: initialLesson.id,
        title: initialLesson.title || '',
        type: initialLesson.type || 'school',
        dayOfWeek: initialLesson.dayOfWeek || 1,
        startTime: initialLesson.startTime || '08:30',
        endTime: initialLesson.endTime || '09:15',
        location: initialLesson.location || '',
        teacher: initialLesson.teacher || '',
        periodicity: initialLesson.periodicity || 'weekly',
        specificDate: initialLesson.specificDate || ''
      });
    } else {
      setFormData({
        title: '',
        type: 'school',
        dayOfWeek: 1,
        startTime: '08:30',
        endTime: '09:15',
        location: 'Школа (10-Б)',
        teacher: '',
        periodicity: 'weekly',
        specificDate: ''
      });
    }
    setValidationError(null);
  }, [initialLesson, isOpen]);

  // Check collision whenever form values change
  useEffect(() => {
    if (!formData.startTime || !formData.endTime || !formData.dayOfWeek) {
      setCollisionWarning(null);
      return;
    }

    const result = checkTimeCollision(
      formData,
      existingLessons || [],
      formData.id || null,
      currentParity
    );

    if (result.hasCollision) {
      setCollisionWarning(result.message);
    } else {
      setCollisionWarning(null);
    }
  }, [formData, existingLessons, currentParity]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setValidationError('Пожалуйста, укажите название предмета или события');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      setValidationError('Пожалуйста, укажите время начала и окончания');
      return;
    }
    if (formData.startTime >= formData.endTime) {
      setValidationError('Время окончания должно быть позже времени начала');
      return;
    }

    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-md rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden text-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <h3 className="text-base font-bold flex items-center gap-2 text-slate-900">
              {formData.id ? 'Редактировать предмет' : 'Новый предмет / событие'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
            {/* Collision Warning Banner */}
            {collisionWarning && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-950">Конфликт расписания!</div>
                  <div>{collisionWarning}</div>
                </div>
              </div>
            )}

            {/* Validation Error Banner */}
            {validationError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-medium">
                {validationError}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Название предмета <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="напр. Algebra, Physical Culture, Репетитор"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 transition-colors"
                required
              />
            </div>

            {/* Category / Type */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Категория
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'school', label: 'Школа 10-Б' },
                  { id: 'new_uzbekistan', label: 'New Uzbekistan' },
                  { id: 'personal', label: 'Личное' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleChange('type', cat.id)}
                    className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-all ${
                      formData.type === cat.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Day of Week & Periodicity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  День недели
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => handleChange('dayOfWeek', Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-800"
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day.id} value={day.id}>
                      {day.name} ({day.short})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Чётность недели
                </label>
                <select
                  value={formData.periodicity}
                  onChange={(e) => handleChange('periodicity', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-800"
                >
                  <option value="weekly">Еженедельно</option>
                  <option value="toq_only">TOQ ONLY (Нечётная)</option>
                  <option value="juft_only">JUFT ONLY (Чётная)</option>
                  <option value="once">Разово</option>
                </select>
              </div>
            </div>

            {/* Time Slot (Start & End Time) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Время начала
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Время окончания
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-800"
                  required
                />
              </div>
            </div>

            {/* Location & Teacher */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Кабинет / Место
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="напр. каб. 1-08"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Преподаватель
                </label>
                <input
                  type="text"
                  value={formData.teacher}
                  onChange={(e) => handleChange('teacher', e.target.value)}
                  placeholder="напр. Amankulov S"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              {formData.id ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Удалить предмет "${formData.title}"?`)) {
                      onDelete(formData.id);
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Удалить
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> Сохранить
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
