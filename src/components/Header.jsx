import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  LayoutGrid, 
  Clock, 
  School,
  BookOpen,
  User
} from 'lucide-react';
import { DAYS_OF_WEEK } from '../utils/parity';

export function Header({
  currentDate,
  currentWeekNumber,
  currentParity,
  viewMode,
  setViewMode,
  selectedDayOfWeek,
  setSelectedDayOfWeek,
  onPrevWeek,
  onNextWeek,
  onResetWeek,
  onOpenAddModal,
  userProfile,
  onOpenAuthModal
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs shrink-0">
      <div className="w-full px-2.5 sm:px-6 py-2 space-y-2">
        {/* Top Row: Title, Week Parity Widget, Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          {/* Brand & Class Info */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-slate-900 text-white shrink-0">
              <School className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 leading-tight">
                  Расписание 10-Б
                </h1>
                <span className="px-1.5 py-0.2 text-[9px] sm:text-[10px] font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  1 группа • Облако
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 hidden xs:block">
                Школа 10-Б & New Uzbekistan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* User Profile Button */}
            <button
              onClick={onOpenAuthModal}
              className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                userProfile && !userProfile.isGuest
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="Настройки личного профиля"
            >
              <div className={`w-5 h-5 rounded-full ${userProfile?.isGuest ? 'bg-slate-300' : 'bg-indigo-600'} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
                {userProfile?.name ? userProfile.name[0].toUpperCase() : <User className="w-3 h-3" />}
              </div>
              <span className="max-w-[80px] sm:max-w-[120px] truncate text-[11px] sm:text-xs">
                {userProfile?.name || 'Войти'}
              </span>
            </button>

            {/* WEEK PARITY WIDGET */}
            <div className="flex items-center bg-slate-50 p-0.5 rounded-lg border border-slate-200 text-xs font-medium shrink-0">
              <button
                onClick={onPrevWeek}
                title="Предыдущая неделя"
                className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="px-1.5 py-0.5 font-semibold text-slate-800 flex items-center gap-1 text-[11px] sm:text-xs whitespace-nowrap">
                <span>{currentWeekNumber} нед</span>
                <span className="text-slate-400">•</span>
                <span className={`uppercase font-bold ${currentParity === 'toq' ? 'text-slate-900' : 'text-slate-700'}`}>
                  {currentParity === 'toq' ? 'TOQ' : 'JUFT'}
                </span>
              </div>

              <button
                onClick={onNextWeek}
                title="Следующая неделя"
                className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onResetWeek}
                title="Перейти на сегодняшний день"
                className="ml-0.5 px-1.5 py-0.5 text-[11px] sm:text-xs text-slate-500 hover:text-slate-900 transition-colors"
              >
                Сегодня
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={onOpenAddModal}
                className="px-2.5 sm:px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Добавить</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: View Modes & Day Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-100">
          
          {/* Day / Week / Homework View Mode Switcher */}
          <div className="flex p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs shrink-0 self-center sm:self-auto w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setViewMode('day')}
              className={`flex-1 sm:flex-initial px-3 py-1 sm:py-0.5 rounded-lg font-semibold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                viewMode === 'day'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Текущий день</span>
            </button>

            <button
              onClick={() => setViewMode('week')}
              className={`flex-1 sm:flex-initial px-3 py-1 sm:py-0.5 rounded-lg font-semibold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Обзор недели</span>
            </button>

            <button
              onClick={() => setViewMode('homework')}
              className={`flex-1 sm:flex-initial px-3 py-1 sm:py-0.5 rounded-lg font-semibold flex items-center justify-center gap-1 transition-all whitespace-nowrap ${
                viewMode === 'homework'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3 h-3 text-indigo-600" />
              <span>Домашка 📚</span>
            </button>
          </div>

          {/* Days Tabs (Mon-Sun) */}
          <div className="flex items-center gap-1 overflow-x-auto w-full no-scrollbar py-0.5 scroll-smooth">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDayOfWeek === day.id;
              return (
                <button
                  key={day.id}
                  onClick={() => {
                    setSelectedDayOfWeek(day.id);
                    if (viewMode !== 'day') setViewMode('day');
                  }}
                  className={`flex-1 sm:flex-initial px-2.5 py-1 sm:py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap text-center transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{day.short}</span>
                  <span className="hidden md:inline ml-1 font-normal opacity-70">({day.fullShort})</span>
                </button>
              );
            })}
          </div>

        </div>

      </div>
    </header>
  );
}
