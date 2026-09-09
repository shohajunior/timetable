import { INITIAL_LESSONS } from '../data/seedData';

const STORAGE_KEY = 'school_timetable_10b_v3';
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

export function loadLessonsFromStorage() {
  try {
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
      const defaultUser = { id: 'user-guest', name: 'Ученик (1 группа)', isGuest: true, color: 'indigo' };
      return defaultUser;
    }
    return JSON.parse(saved);
  } catch (error) {
    return { id: 'user-guest', name: 'Ученик (1 группа)', isGuest: true, color: 'indigo' };
  }
}

export function saveUserProfile(profile) {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to save user profile:', error);
  }
}
