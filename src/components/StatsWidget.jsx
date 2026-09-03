import React from 'react';
import { School, GraduationCap, UserCheck, Clock, Zap, BookOpen } from 'lucide-react';
import { isLessonVisibleInParity } from '../utils/parity';
import { timeToMinutes } from '../utils/collision';

export function StatsWidget({ lessons, selectedDayOfWeek, currentParity }) {
  const dayLessons = lessons
    .filter(l => Number(l.dayOfWeek) === Number(selectedDayOfWeek))
    .filter(l => isLessonVisibleInParity(l.periodicity, currentParity))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const schoolCount = dayLessons.filter(l => l.type === 'school').length;
  const nuCount = dayLessons.filter(l => l.type === 'new_uzbekistan').length;
  const personalCount = dayLessons.filter(l => l.type === 'personal').length;

  // Calculate first start and last end
  let spanText = "Уроков нет";
  if (dayLessons.length > 0) {
    const firstLesson = dayLessons[0];
    const lastLesson = dayLessons[dayLessons.length - 1];
    spanText = `${firstLesson.startTime} – ${lastLesson.endTime}`;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Lessons */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Всего занятий</div>
          <div className="text-xl font-black text-white">{dayLessons.length}</div>
        </div>
      </div>

      {/* School vs University Balance */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Школа / New Uzb</div>
          <div className="text-xl font-black text-white flex items-center gap-1">
            <span className="text-indigo-400">{schoolCount}</span>
            <span className="text-slate-600">/</span>
            <span className="text-emerald-400">{nuCount}</span>
          </div>
        </div>
      </div>

      {/* Personal Activities */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Личные / Доп.</div>
          <div className="text-xl font-black text-amber-400">{personalCount}</div>
        </div>
      </div>

      {/* Active Time Span */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Время занятий</div>
          <div className="text-sm font-bold text-slate-200 truncate">{spanText}</div>
        </div>
      </div>
    </div>
  );
}
