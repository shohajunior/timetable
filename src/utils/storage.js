import { INITIAL_LESSONS } from '../data/seedData';

const STORAGE_KEY = 'school_timetable_10b_v3';

export function loadLessonsFromStorage() {
  try {
    // Clear old versions if present
    localStorage.removeItem('school_timetable_10b_v1');
    localStorage.removeItem('school_timetable_10b_v2');

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LESSONS));
      return INITIAL_LESSONS;
    }
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_LESSONS;
  } catch (error) {
    console.error('Failed to load lessons from localStorage:', error);
    return INITIAL_LESSONS;
  }
}

export function saveLessonsToStorage(lessons) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
  } catch (error) {
    console.error('Failed to save lessons to localStorage:', error);
  }
}

export function resetLessonsToDefault() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LESSONS));
  return INITIAL_LESSONS;
}
