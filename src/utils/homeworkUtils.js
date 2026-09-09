import { getWeekParity, isLessonVisibleInParity } from './parity';

/**
 * Unique list of subjects present in schedule
 */
export function getAvailableSubjects(lessons) {
  const defaultSubjects = [
    'Алгебра',
    'Геометрия',
    'Физика',
    'Информатика',
    'Английский язык',
    'История Узбекистана',
    'Всемирная история',
    'Узбекский язык',
    'Родной язык',
    'Литература',
    'Физкультура',
    'НВП',
    'Воспитание',
    'Кл. час'
  ];

  const lessonTitles = (lessons || []).map(l => l.title?.trim()).filter(Boolean);
  const combined = Array.from(new Set([...defaultSubjects, ...lessonTitles]));
  return combined.sort((a, b) => a.localeCompare(b, 'ru'));
}

/**
 * Finds the date string (YYYY-MM-DD) and human description of the NEXT upcoming lesson for a subject
 */
export function findNextLessonDate(subjectTitle, lessons = [], baseDate = new Date()) {
  if (!subjectTitle) return null;

  const normalizedSubject = subjectTitle.trim().toLowerCase();
  
  // Search starting from tomorrow up to 14 days ahead
  for (let offset = 1; offset <= 14; offset++) {
    const testDate = new Date(baseDate);
    testDate.setDate(testDate.getDate() + offset);

    // JS Day: 0=Sun, 1=Mon, ..., 6=Sat -> App Day: 1=Mon ... 7=Sun
    const jsDay = testDate.getDay();
    const appDayOfWeek = jsDay === 0 ? 7 : jsDay;

    const parity = getWeekParity(testDate);

    // Check if there is a matching lesson on this day
    const matchingLesson = lessons.find(l => {
      const matchTitle = l.title?.trim().toLowerCase() === normalizedSubject ||
        (normalizedSubject.includes('алгебр') && l.title.toLowerCase().includes('алгебр')) ||
        (normalizedSubject.includes('физик') && l.title.toLowerCase().includes('физик')) ||
        (normalizedSubject.includes('англ') && l.title.toLowerCase().includes('англ')) ||
        (normalizedSubject.includes('информ') && l.title.toLowerCase().includes('информ'));
      
      const matchDay = Number(l.dayOfWeek) === Number(appDayOfWeek);
      const isVisible = isLessonVisibleInParity(l.periodicity, parity);

      return matchTitle && matchDay && isVisible;
    });

    if (matchingLesson) {
      const year = testDate.getFullYear();
      const month = String(testDate.getMonth() + 1).padStart(2, '0');
      const day = String(testDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Human label
      const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      const monthsRu = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
      
      let relativeLabel = '';
      if (offset === 1) relativeLabel = 'Завтра';
      else if (offset === 2) relativeLabel = 'Послезавтра';
      else relativeLabel = `Через ${offset} дн.`;

      const formattedLabel = `${relativeLabel} (${dayNames[jsDay]}, ${testDate.getDate()} ${monthsRu[testDate.getMonth()]})`;

      return {
        dateStr,
        formattedLabel,
        lesson: matchingLesson
      };
    }
  }

  // Fallback: Default to tomorrow if not found in 14 days
  const tomorrow = new Date(baseDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  
  return {
    dateStr: `${year}-${month}-${day}`,
    formattedLabel: `Завтра (${tomorrow.getDate()}.${month})`,
    lesson: null
  };
}

/**
 * Get distinct subject color style
 */
export function getSubjectColorStyle(subjectName = '') {
  const lower = subjectName.toLowerCase();
  if (lower.includes('алгебр') || lower.includes('матан') || lower.includes('геометр')) {
    return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', tag: 'bg-indigo-600 text-white' };
  }
  if (lower.includes('физик')) {
    return { bg: 'bg-purple-50 text-purple-700 border-purple-200', tag: 'bg-purple-600 text-white' };
  }
  if (lower.includes('информ')) {
    return { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', tag: 'bg-cyan-600 text-white' };
  }
  if (lower.includes('англ') || lower.includes('english')) {
    return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', tag: 'bg-emerald-600 text-white' };
  }
  if (lower.includes('истор') || lower.includes('узбек')) {
    return { bg: 'bg-amber-50 text-amber-800 border-amber-200', tag: 'bg-amber-600 text-white' };
  }
  return { bg: 'bg-slate-100 text-slate-700 border-slate-200', tag: 'bg-slate-800 text-white' };
}
