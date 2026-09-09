import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2, Save, Plus, Clock, MapPin, User, Calendar, RefreshCw } from 'lucide-react';
import { checkTimeCollision } from '../utils/collision';
import { DAYS_OF_WEEK } from '../utils/parity';

export function ActivityModal({ isOpen, onClose, onSave, onDelete, initialLesson, existingLessons, currentParity, userProfile }) {
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

  const [selectedDays, setSelectedDays] = useState([1]);
  const [collisionWarning, setCollisionWarning] = useState(null);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (initialLesson) {
      const initialDay = Number(initialLesson.dayOfWeek || 1);
      setFormData({
        id: initialLesson.id,
        title: initialLesson.title || '',
        type: initialLesson.type || 'school',
        dayOfWeek: initialDay,
        startTime: initialLesson.startTime || '08:30',
        endTime: initialLesson.endTime || '09:15',
        location: initialLesson.location || '',
        teacher: initialLesson.teacher || '',
        periodicity: initialLesson.periodicity || 'weekly',
        specificDate: initialLesson.specificDate || '',
        userId: initialLesson.userId || (initialLesson.type === 'personal' ? userProfile?.id : null)
      });
      setSelectedDays([initialDay]);
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
      setSelectedDays([1]);
    }
    setValidationError(null);
  }, [initialLesson, isOpen, userProfile]);

  // Check collision whenever form values change
  useEffect(() => {
    if (!formData.startTime || !formData.endTime || selectedDays.length === 0) {
      setCollisionWarning(null);
      return;
    }

    let warningMsg = null;
    for (const day of selectedDays) {
      const testData = { ...formData, dayOfWeek: day };
      const result = checkTimeCollision(
        testData,
        existingLessons || [],
        formData.id || null,
        currentParity
      );
      if (result.hasCollision) {
        const dayObj = DAYS_OF_WEEK.find(d => d.id === day);
        warningMsg = `${dayObj?.short || `День ${day}`}: ${result.message}`;
        break;
      }
    }

    setCollisionWarning(warningMsg);
  }, [formData, selectedDays, existingLessons, currentParity]);

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
    if (selectedDays.length === 0) {
      setValidationError('Выберите хотя бы один день недели');
      return;
    }

    const payloadBase = {
      ...formData,
      userId: formData.type === 'personal' ? (formData.userId || userProfile?.id || 'user-guest') : null
    };

    if (formData.id) {
      if (selectedDays.length === 1) {
        onSave({ ...payloadBase, dayOfWeek: selectedDays[0] });
      } else {
        const updatedFirst = { ...payloadBase, dayOfWeek: selectedDays[0] };
        const newOthers = selectedDays.slice(1).map(day => ({
          ...payloadBase,
          dayOfWeek: day,
          id: 'user-add-' + Date.now() + '-' + day
        }));
        onSave([updatedFirst, ...newOthers]);
      }
    } else {
      if (selectedDays.length === 1) {
        onSave({ ...payloadBase, dayOfWeek: selectedDays[0] });
      } else {
        const newLessons = selectedDays.map(day => ({
          ...payloadBase,
          dayOfWeek: day,
          id: 'user-add-' + Date.now() + '-' + day
        }));
        onSave(newLessons);
      }
    }

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
          className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] text-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50 shrink-0">
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 text-slate-900">
              {formData.id ? 'Редактировать предмет' : 'Новый предмет / событие'}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto no-scrollbar text-xs">
            {/* Collision Warning Banner */}
            {collisionWarning && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-950">Конфликт расписания!</div>
                  <div>{collisionWarning}</div>
                </div>
              </div>
            )}

            {/* Validation Error Banner */}
            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-medium">
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
                className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 transition-colors text-xs sm:text-sm"
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
                    className={`py-2 px-2 rounded-xl font-medium border text-center transition-all ${
                      formData.type === cat.id
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-Day Selection & Periodicity */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-slate-700">
                    Дни проведения <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedDays([1, 2, 3, 4, 5, 6, 7])}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        selectedDays.length === 7
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Ежедневно
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        selectedDays.length === 5 && [1, 2, 3, 4, 5].every(d => selectedDays.includes(d))
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Пн-Пт
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {DAYS_OF_WEEK.map(day => {
                    const isSelected = selectedDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (selectedDays.length > 1) {
                              setSelectedDays(selectedDays.filter(d => d !== day.id));
                            }
                          } else {
                            setSelectedDays([...selectedDays, day.id].sort((a, b) => a - b));
                          }
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                        title={day.name}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Чётность недели
                </label>
                <select
                  value={formData.periodicity}
                  onChange={(e) => handleChange('periodicity', e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-800 text-xs sm:text-sm"
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
                  className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-800 text-xs sm:text-sm"
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
                  className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-800 text-xs sm:text-sm"
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
                  className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-800 text-xs sm:text-sm"
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
                  className="w-full px-3 py-2.5 sm:py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-slate-800 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-3 pb-1 flex items-center justify-between border-t border-slate-100 shrink-0">
              {formData.id ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Удалить предмет "${formData.title}"?`)) {
                      onDelete(formData.id);
                      onClose();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold transition-colors flex items-center gap-1 text-xs"
                >
                  <Trash2 className="w-4 h-4" /> Удалить
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5 transition-colors text-xs shadow-xs"
                >
                  <Save className="w-4 h-4" /> Сохранить
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
