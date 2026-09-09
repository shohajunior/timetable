import { INITIAL_LESSONS, getInitialLessonsForGroup } from '../data/seedData';

const getStorageKeyForGroup = (g = 1) => `school_timetable_10b_v3_g${Number(g) === 2 ? 2 : 1}`;
const HOMEWORK_STORAGE_KEY = 'school_homework_10b_v1';
const USER_PROFILE_KEY = 'school_user_profile_10b_v1';

export const INITIAL_HOMEWORK = [
  {
    id: 'hw-seed-1',
    subject: 'Алгебра',
    description: 'Решить №124, 126 на стр. 48. Подготовиться к самостоятельной работы по тригонометрии.',
    dueDate: '2026-09-09',
    dueType: 'next_lesson',
    createdBy: 'Шохрух',
    createdById: 'user-default-1',
    createdAt: new Date().toISOString(),
    isCompleted: false
  },
  {
    id: 'hw-seed-2',
    subject: 'Информатика',
    description: 'Лабораторная работа: дописать скрипт на Python и сдать отчёт.',
    dueDate: '2026-09-10',
    dueType: 'next_lesson',
    createdBy: 'Мадина',
    createdById: 'user-default-2',
    createdAt: new Date().toISOString(),
    isCompleted: false
  },
  {
    id: 'hw-seed-3',
    subject: 'Английский язык',
    description: 'Student Book page 52 ex 3-5. Выучить новые слова по теме Unit 4.',
    dueDate: '2026-09-11',
    dueType: 'next_lesson',
    createdBy: 'Тимур',
    createdById: 'user-default-3',
    createdAt: new Date().toISOString(),
    isCompleted: true
  }
];

export function loadLessonsFromStorage(groupNumber = 1) {
  const defaultLessons = getInitialLessonsForGroup(groupNumber);
  const key = getStorageKeyForGroup(groupNumber);
  try {
    const saved = localStorage.getItem(key);
    if (!saved) {
      localStorage.setItem(key, JSON.stringify(defaultLessons));
      return defaultLessons;
    }
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return defaultLessons;
  } catch (error) {
    console.error('Failed to load lessons from localStorage:', error);
    return defaultLessons;
  }
}

export function saveLessonsToStorage(lessons, groupNumber = 1) {
  try {
    const key = getStorageKeyForGroup(groupNumber);
    localStorage.setItem(key, JSON.stringify(lessons));
  } catch (error) {
    console.error('Failed to save lessons to localStorage:', error);
  }
}

export function resetLessonsToDefault(groupNumber = 1) {
  const defaultLessons = getInitialLessonsForGroup(groupNumber);
  const key = getStorageKeyForGroup(groupNumber);
  localStorage.setItem(key, JSON.stringify(defaultLessons));
  return defaultLessons;
}

export function loadHomeworkFromStorage() {
  try {
    const saved = localStorage.getItem(HOMEWORK_STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(HOMEWORK_STORAGE_KEY, JSON.stringify(INITIAL_HOMEWORK));
      return INITIAL_HOMEWORK;
    }
    return JSON.parse(saved);
  } catch (error) {
    console.error('Failed to load homework from localStorage:', error);
    return INITIAL_HOMEWORK;
  }
}

export function saveHomeworkToStorage(homeworkList) {
  try {
    localStorage.setItem(HOMEWORK_STORAGE_KEY, JSON.stringify(homeworkList));
  } catch (error) {
    console.error('Failed to save homework to localStorage:', error);
  }
}

export function loadUserProfile() {
  try {
    const saved = localStorage.getItem(USER_PROFILE_KEY);
    if (!saved) {
      return null;
    }
    return JSON.parse(saved);
  } catch (error) {
    return null;
  }
}

export function saveUserProfile(profile) {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to save user profile:', error);
  }
}
