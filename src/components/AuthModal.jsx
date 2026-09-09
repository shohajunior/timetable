import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Check, Lock, ShieldCheck, LogOut } from 'lucide-react';

const AVATAR_COLORS = [
  { id: 'indigo', bg: 'bg-indigo-600', text: 'text-white' },
  { id: 'emerald', bg: 'bg-emerald-600', text: 'text-white' },
  { id: 'purple', bg: 'bg-purple-600', text: 'text-white' },
  { id: 'amber', bg: 'bg-amber-600', text: 'text-white' },
  { id: 'rose', bg: 'bg-rose-600', text: 'text-white' },
  { id: 'slate', bg: 'bg-slate-800', text: 'text-white' }
];

export function AuthModal({ isOpen, onClose, currentProfile, onSaveProfile }) {
  const [name, setName] = useState(currentProfile?.name || '');
  const [selectedColor, setSelectedColor] = useState(currentProfile?.color || 'indigo');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Пожалуйста, введите ваше имя');
      return;
    }

    const profileId = 'user-' + name.trim().toLowerCase().replace(/\s+/g, '-');

    const updatedProfile = {
      id: profileId,
      name: name.trim(),
      color: selectedColor,
      isGuest: false
    };

    onSaveProfile(updatedProfile);
    onClose();
  };

  const handleLogoutToGuest = () => {
    const guestProfile = {
      id: 'user-guest',
      name: 'Ученик (1 группа)',
      color: 'slate',
      isGuest: true
    };
    onSaveProfile(guestProfile);
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
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Личный профиль ученика
                </h3>
                <p className="text-[11px] text-slate-500">
                  Для доступа к личным делам в расписании
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
            {/* Info Banner */}
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold block text-indigo-950">Приватность личного расписания:</span>
                Школьные уроки и Домашние задания видны всем, а ваши <b>Личные дела</b> (репетиторы, спорт) будут видны только под вашим аккаунтом.
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-medium">
                {error}
              </div>
            )}

            {/* Name Field */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ваше имя или никнейм <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="напр. Шохрух, Мадина, Азиз"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
                required
              />
            </div>

            {/* Color Avatar Picker */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Цвет аватарки
              </label>
              <div className="flex items-center gap-2">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.id)}
                    className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center transition-transform ${
                      selectedColor === c.id ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105 opacity-80'
                    }`}
                  >
                    {selectedColor === c.id && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Account Card */}
            {currentProfile && !currentProfile.isGuest && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full bg-${currentProfile.color || 'indigo'}-600 text-white flex items-center justify-center font-bold text-xs`}>
                    {currentProfile.name ? currentProfile.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{currentProfile.name}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" /> Активный аккаунт
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogoutToGuest}
                  className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors flex items-center gap-1 text-[11px]"
                >
                  <LogOut className="w-3 h-3" /> Выйти
                </button>
              </div>
            )}

            {/* Form Footer */}
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
                Сохранить профиль
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
