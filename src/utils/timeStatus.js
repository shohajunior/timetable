import { timeToMinutes } from './collision';

/**
 * Utility to calculate current lesson status and countdowns
 */
export function getLessonLiveStatus(lesson, nowMinutes) {
  if (!lesson || !lesson.startTime || !lesson.endTime) return null;

  const start = timeToMinutes(lesson.startTime);
  const end = timeToMinutes(lesson.endTime);

  if (nowMinutes >= start && nowMinutes < end) {
    const remaining = end - nowMinutes;
    return {
      status: 'active',
      badgeText: `осталось ${remaining} мин`,
      fullText: `Идёт сейчас • осталось ${remaining} мин`,
      minutes: remaining
    };
  }

  if (nowMinutes < start) {
    const untilStart = start - nowMinutes;
    // Highlight if starting soon (within 60 minutes)
    if (untilStart <= 60) {
      return {
        status: 'next',
        badgeText: `через ${untilStart} мин`,
        fullText: `Перемена • урок через ${untilStart} мин`,
        minutes: untilStart
      };
    }
  }

  return null;
}

export function getCurrentTimeMinutes(simulatedDate = null) {
  const d = simulatedDate ? new Date(simulatedDate) : new Date();
  return d.getHours() * 60 + d.getMinutes();
}
