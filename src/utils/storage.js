import { INITIAL_LESSONS, getInitialLessonsForGroup } from '../data/seedData';

const getStorageKeyForGroup = (g = 1) => `school_timetable_10b_v4_g${Number(g) === 2 ? 2 : 1}`;
const HOMEWORK_STORAGE_KEY = 'school_homework_10b_v1';
const USER_PROFILE_KEY = 'school_user_profile_10b_v1';

export const INITIAL_HOMEWORK = [];

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
      return [];
    }
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed.filter(item => !item.id?.startsWith('hw-seed-'));
    }
    return [];
  } catch (error) {
    console.error('Failed to load homework from localStorage:', error);
    return [];
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
