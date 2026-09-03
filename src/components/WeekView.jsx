import React from 'react';
import { Plus } from 'lucide-react';
import { DAYS_OF_WEEK, isLessonVisibleInParity } from '../utils/parity';
import { timeToMinutes } from '../utils/collision';
import { ActivityCard } from './ActivityCard';
import { getLessonLiveStatus } from '../utils/timeStatus';

export function WeekView({
  lessons,
  currentParity,
  todayDayOfWeek,
  nowMinutes,
  onLessonClick,
  onAddAtDay
}) {
  return (
    <div className="flex-1 h-full overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-1.5 h-full">
        {DAYS_OF_WEEK.map((day) => {
          const isTodayColumn = Number(day.id) === Number(todayDayOfWeek);
          const dayLessons = lessons
            .filter(l => Number(l.dayOfWeek) === Number(day.id))
            .filter(l => isLessonVisibleInParity(l.periodicity, currentParity))
            .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

          return (
            <div
              key={day.id}
              className={`flex flex-col rounded-xl bg-white border shadow-2xs overflow-hidden h-full ${
                isTodayColumn ? 'border-slate-400 ring-1 ring-slate-300' : 'border-slate-200'
              }`}
            >
              {/* Day Header */}
              <div className={`px-2 py-1 border-b flex items-center justify-between shrink-0 ${
                isTodayColumn ? 'bg-slate-900 text-white border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-200'
              }`}>
                <h3 className="font-bold text-[11px] truncate">
                  {day.short} {isTodayColumn && <span className="text-[9px] font-normal opacity-80">(Сегодня)</span>}
                </h3>
                <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                  isTodayColumn ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {dayLessons.length}
                </span>
              </div>

              {/* Day Lessons List */}
              <div className="p-1 flex-1 space-y-1 overflow-y-auto">
                {dayLessons.length > 0 ? (
                  dayLessons.map(lesson => {
                    const liveStatus = isTodayColumn ? getLessonLiveStatus(lesson, nowMinutes) : null;
                    return (
                      <ActivityCard
                        key={lesson.id}
                        lesson={lesson}
                        onClick={onLessonClick}
                        compact
                        liveStatus={liveStatus}
                      />
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center py-4 text-[10px] text-slate-400">
                    Свободно
                  </div>
                )}
              </div>

              {/* Add button */}
              <div className="p-1 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  onClick={() => onAddAtDay(day.id)}
                  className="w-full py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold flex items-center justify-center gap-0.5 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Добавить</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
