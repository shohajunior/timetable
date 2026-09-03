/**
 * Utility functions for academic week calculation and parity (Toq / Juft)
 */

export function getAcademicYearStart(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 = Jan, 8 = Sep
  
  // If month is before September (Jan-Aug), academic year started Sept 1 of previous year
  if (month < 8) {
    return new Date(year - 1, 8, 1);
  }
  return new Date(year, 8, 1);
}

export function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getWeekNumberFromSept(date) {
  const targetDate = new Date(date);
  const sept1 = getAcademicYearStart(targetDate);
  
  const sept1Monday = getMondayOfWeek(sept1);
  const targetMonday = getMondayOfWeek(targetDate);
  
  const diffTime = targetMonday.getTime() - sept1Monday.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7) + 1;
  
  return weekNumber > 0 ? weekNumber : 1;
}

export function getWeekParity(date) {
  const weekNumber = getWeekNumberFromSept(date);
  return weekNumber % 2 !== 0 ? 'toq' : 'juft';
}

export function isLessonVisibleInParity(lessonPeriodicity, currentParity) {
  if (!lessonPeriodicity || lessonPeriodicity === 'weekly') return true;
  if (lessonPeriodicity === 'once') return true;
  if (currentParity === 'toq' && lessonPeriodicity === 'toq_only') return true;
  if (currentParity === 'juft' && lessonPeriodicity === 'juft_only') return true;
  return false;
}

export const DAYS_OF_WEEK = [
  { id: 1, name: "Понедельник", short: "Пн", fullShort: "Понедельник" },
  { id: 2, name: "Вторник", short: "Вт", fullShort: "Вторник" },
  { id: 3, name: "Среда", short: "Ср", fullShort: "Среда" },
  { id: 4, name: "Четверг", short: "Чт", fullShort: "Четверг" },
  { id: 5, name: "Пятница", short: "Пт", fullShort: "Пятница" },
  { id: 6, name: "Суббота", short: "Сб", fullShort: "Суббота" },
  { id: 7, name: "Воскресенье", short: "Вс", fullShort: "Воскресенье" },
];
