import React from 'react';
import { Plus, Calendar, Clock } from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { timeToMinutes } from '../utils/collision';
import { DAYS_OF_WEEK, isLessonVisibleInParity } from '../utils/parity';
import { getLessonLiveStatus } from '../utils/timeStatus';

export function DayView({
  lessons,
  selectedDayOfWeek,
  currentParity,
  nowMinutes,
  isToday,
  onLessonClick,
  onAddAtTime
}) {
  const dayObj = DAYS_OF_WEEK.find(d => d.id === selectedDayOfWeek) || DAYS_OF_WEEK[0];

  // Filter lessons for selected day and parity (Sorted by startTime)
  const dayLessons = lessons
    .filter(l => Number(l.dayOfWeek) === Number(selectedDayOfWeek))
    .filter(l => isLessonVisibleInParity(l.periodicity, currentParity))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  // Find active or next upcoming lesson for top summary bar
  let currentActiveLesson = null;
  let nextUpcomingLesson = null;

  if (isToday) {
    for (const l of dayLessons) {
      const status = getLessonLiveStatus(l, nowMinutes);
      if (status?.status === 'active') {
        currentActiveLesson = { lesson: l, status };
        break;
      }
      if (status?.status === 'next' && !nextUpcomingLesson) {
        nextUpcomingLesson = { lesson: l, status };
      }
    }
  }

  // Build sequential timeline sequence covering 07:00 to 22:00
  const timelineItems = [];
  const DAY_START = "07:00";
  const DAY_END = "22:00";

  let lastEndTime = DAY_START;

  if (dayLessons.length > 0) {
    dayLessons.forEach((lesson, index) => {
      // Check for gap before this lesson
      if (timeToMinutes(lesson.startTime) > timeToMinutes(lastEndTime) + 5) {
        timelineItems.push({
          type: 'gap',
          id: `gap-${index}`,
          startTime: lastEndTime,
          endTime: lesson.startTime
        });
      }

      timelineItems.push({
        type: 'lesson',
        id: lesson.id,
        lesson: lesson,
        startTime: lesson.startTime,
        endTime: lesson.endTime
      });

      lastEndTime = lesson.endTime;
    });

    if (timeToMinutes(lastEndTime) < timeToMinutes(DAY_END)) {
      timelineItems.push({
        type: 'gap',
        id: `gap-end`,
        startTime: lastEndTime,
        endTime: DAY_END
      });
    }
  } else {
    timelineItems.push({
      type: 'gap',
      id: `gap-empty-day`,
      startTime: DAY_START,
      endTime: DAY_END
    });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2">
      {/* Subheader with Live Status Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 rounded-lg bg-white border border-slate-200 shrink-0 text-xs gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-slate-700" />
          <span className="font-bold text-slate-900">{dayObj.name}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600 font-medium">{currentParity.toUpperCase()} неделя</span>

          {/* LIVE STATUS BANNER */}
          {isToday && currentActiveLesson && (
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Идёт: {currentActiveLesson.lesson.title} ({currentActiveLesson.status.badgeText})
            </span>
          )}

          {isToday && !currentActiveLesson && nextUpcomingLesson && (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold flex items-center gap-1 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Перемена • след: {nextUpcomingLesson.lesson.title} ({nextUpcomingLesson.status.badgeText})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Занятий: <strong className="text-slate-900">{dayLessons.length}</strong></span>
          <button
            onClick={() => onAddAtTime('18:00', selectedDayOfWeek)}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" /> Добавить
          </button>
        </div>
      </div>

      {/* Timeline List */}
      <div className="flex-1 rounded-xl bg-white border border-slate-200 p-2.5 overflow-y-auto space-y-1.5 text-xs">
        {timelineItems.map((item) => {
          if (item.type === 'lesson') {
            const { lesson } = item;
            const liveStatus = isToday ? getLessonLiveStatus(lesson, nowMinutes) : null;

            return (
              <div key={item.id} className="flex items-center gap-2 py-0.5 border-b border-slate-100 last:border-0">
                {/* Start Time Column */}
                <div className="w-14 shrink-0 font-mono text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{lesson.startTime}</span>
                </div>

                {/* Lesson Block */}
                <div className="flex-1 min-w-0">
                  <ActivityCard
                    lesson={lesson}
                    onClick={onLessonClick}
                    liveStatus={liveStatus}
                  />
                </div>
              </div>
            );
          } else {
            return (
              <div
                key={item.id}
                onClick={() => onAddAtTime(item.startTime, selectedDayOfWeek)}
                className="flex items-center justify-between px-2.5 py-1 rounded border border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer text-[11px] text-slate-400 transition-colors group"
              >
                <span className="font-mono">{item.startTime} – {item.endTime} (Свободное окно)</span>
                <span className="font-semibold text-slate-600 opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                  <Plus className="w-3 h-3" /> Запланировать
                </span>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
