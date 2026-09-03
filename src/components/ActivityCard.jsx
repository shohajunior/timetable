import React from 'react';
import { motion } from 'framer-motion';

export function ActivityCard({ lesson, onClick, compact = false, liveStatus = null }) {
  const getTypeBadge = (type) => {
    switch (type) {
      case 'school':
        return {
          bg: 'bg-white hover:bg-slate-50',
          border: 'border-slate-200 hover:border-slate-300',
          tag: 'bg-slate-100 text-slate-700',
          label: 'Школа'
        };
      case 'new_uzbekistan':
        return {
          bg: 'bg-blue-50/50 hover:bg-blue-50',
          border: 'border-blue-200 hover:border-blue-300',
          tag: 'bg-blue-100 text-blue-800',
          label: 'New Uzb'
        };
      case 'personal':
      default:
        return {
          bg: 'bg-amber-50/50 hover:bg-amber-50',
          border: 'border-amber-200 hover:border-amber-300',
          tag: 'bg-amber-100 text-amber-900',
          label: 'Личное'
        };
    }
  };

  const getPeriodicityBadge = (periodicity) => {
    switch (periodicity) {
      case 'toq_only':
        return <span className="text-[9px] font-medium px-1 rounded bg-slate-100 text-slate-600 border border-slate-200">TOQ</span>;
      case 'juft_only':
        return <span className="text-[9px] font-medium px-1 rounded bg-slate-100 text-slate-600 border border-slate-200">JUFT</span>;
      case 'once':
        return <span className="text-[9px] font-medium px-1 rounded bg-rose-100 text-rose-700 border border-rose-200">Разово</span>;
      case 'weekly':
      default:
        return null;
    }
  };

  const style = getTypeBadge(lesson.type);

  // Live status highlighting styling
  let liveRing = '';
  if (liveStatus?.status === 'active') {
    liveRing = 'ring-2 ring-emerald-500 bg-emerald-50/60 shadow-sm';
  } else if (liveStatus?.status === 'next') {
    liveRing = 'ring-2 ring-amber-500/80 bg-amber-50/60 shadow-sm';
  }

  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick && onClick(lesson)}
      className={`cursor-pointer rounded-lg ${compact ? 'px-2 py-1.5' : 'px-3 py-2'} border transition-all ${style.bg} ${style.border} ${liveRing} flex flex-col justify-between gap-1 group min-w-0 relative`}
    >
      {/* USER REQUIREMENT: LIVE COUNTDOWN BADGE TOP RIGHT */}
      {liveStatus && (
        <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-0.5 text-[10px] font-bold">
          {liveStatus.status === 'active' ? (
            <span className="text-emerald-700 flex items-center gap-1 bg-emerald-100 px-1.5 py-0.2 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Идёт сейчас • {liveStatus.badgeText}
            </span>
          ) : (
            <span className="text-amber-800 flex items-center gap-1 bg-amber-100 px-1.5 py-0.2 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Следующий урок • {liveStatus.badgeText}
            </span>
          )}
        </div>
      )}

      {/* 1ST PRIORITY: SUBJECT TITLE FIRST AND PROMINENT */}
      <div className="flex items-start justify-between gap-1 min-w-0">
        <h4 className="text-xs font-bold text-slate-900 truncate leading-tight flex-1">
          {lesson.title}
        </h4>

        {/* Time badge on the right */}
        <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
          {lesson.startTime}–{lesson.endTime}
        </span>
      </div>

      {/* SECONDARY ROW: Badges and Details */}
      <div className="flex items-center gap-1 text-[10px] text-slate-500 overflow-hidden">
        <span className={`text-[9px] font-semibold px-1 rounded shrink-0 ${style.tag}`}>
          {style.label}
        </span>

        {getPeriodicityBadge(lesson.periodicity)}

        {lesson.location && (
          <span className="truncate text-slate-500 ml-0.5">
            {lesson.location}
          </span>
        )}

        {lesson.teacher && !compact && (
          <span className="truncate text-slate-400 hidden lg:inline">
            • {lesson.teacher}
          </span>
        )}
      </div>
    </motion.div>
  );
}
