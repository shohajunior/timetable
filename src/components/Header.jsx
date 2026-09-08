import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  LayoutGrid, 
  Clock, 
  School
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
  onResetData
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs shrink-0">
      <div className="w-full px-2.5 sm:px-6 py-2 space-y-2">
        {/* Top Row: Title, Week Parity Widget, Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          {/* Brand & Class Info */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
              <School className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 leading-tight">
                  Расписание 10-Б
                </h1>
                <span className="px-1 py-0.2 text-[9px] sm:text-[10px] font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                  1 группа
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 hidden xs:block">
                Школа 10-Б & New Uzbekistan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
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
                className="px-2.5 sm:px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Добавить</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: View Modes & Day Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-100">
          
          {/* Day / Week View Mode Switcher */}
          <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs shrink-0 self-center sm:self-auto w-full sm:w-auto">
            <button
              onClick={() => setViewMode('day')}
              className={`flex-1 sm:flex-initial px-3 py-1 sm:py-0.5 rounded font-semibold flex items-center justify-center gap-1 transition-all ${
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
              className={`flex-1 sm:flex-initial px-3 py-1 sm:py-0.5 rounded font-semibold flex items-center justify-center gap-1 transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Обзор недели</span>
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
