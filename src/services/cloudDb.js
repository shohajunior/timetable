/**
 * Global Real-time Cloud Database Service connected to Firebase Realtime Database
 * Database: timetable-ba5f2
 * Endpoint: https://timetable-ba5f2-default-rtdb.asia-southeast1.firebasedatabase.app
 * All devices (mobile, laptop, PC) synchronize with this Firebase cloud database in real time.
 */

const FIREBASE_RTDB_URL = 'https://timetable-ba5f2-default-rtdb.asia-southeast1.firebasedatabase.app';

// In-memory cache
let cachedCloudData = null;

/**
 * Fetch latest database state from Firebase
 */
export async function fetchCloudData() {
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}/.json`, {
      method: 'GET'
    });

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        cachedCloudData = data;
        return data;
      }
    }
  } catch (error) {
    console.warn('Firebase DB fetch warning (offline or network issue):', error);
  }
  return cachedCloudData;
}

/**
 * Update whole cloud database state or execute updater function
 */
export async function updateCloudData(updaterFn) {
  try {
    const current = (await fetchCloudData()) || {
      group1_lessons: [],
      group2_lessons: [],
      group1_homework: [],
      personal_lessons: {},
      users: {}
    };

    const updated = typeof updaterFn === 'function' ? updaterFn(current) : { ...current, ...updaterFn };

    const res = await fetch(`${FIREBASE_RTDB_URL}/.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updated)
    });

    if (res.ok) {
      cachedCloudData = updated;
      return true;
    }
  } catch (error) {
    console.error('Failed to update Firebase DB:', error);
  }
  return false;
}

/**
 * Subscribe to cloud updates across all devices in real time
 */
export function subscribeToCloudData(onUpdate) {
  let isMounted = true;

  const poll = async () => {
    try {
      const data = await fetchCloudData();
      if (isMounted && data) {
        onUpdate(data);
      }
    } catch (e) {
      // silent network error catch
    }
  };

  // Immediate initial fetch
  poll();

  // Poll every 3 seconds for cross-device live updates
  const interval = setInterval(poll, 3000);

  // Poll immediately on window focus
  const onFocus = () => poll();
  window.addEventListener('focus', onFocus);

  return () => {
    isMounted = false;
    clearInterval(interval);
    window.removeEventListener('focus', onFocus);
  };
}

/**
 * Save Homework list to Firebase Realtime DB
 */
export async function saveCloudHomework(homeworkList) {
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}/group1_homework.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(homeworkList)
    });
    if (res.ok) {
      if (cachedCloudData) cachedCloudData.group1_homework = homeworkList;
      return true;
    }
  } catch (err) {
    console.error('Failed to save homework to Firebase:', err);
  }
  return false;
}

/**
 * Save Shared Lessons to Firebase Realtime DB (group 1 or 2)
 */
export async function saveCloudLessons(lessonsList, groupNumber = 1) {
  const groupKey = Number(groupNumber) === 2 ? 'group2_lessons' : 'group1_lessons';
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}/${groupKey}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lessonsList)
    });
    if (res.ok) {
      if (cachedCloudData) cachedCloudData[groupKey] = lessonsList;
      return true;
    }
  } catch (err) {
    console.error(`Failed to save ${groupKey} to Firebase:`, err);
  }
  return false;
}

/**
 * Save personal schedule activities for a specific user to Firebase Realtime DB
 */
export async function saveCloudPersonalLessons(userId, userPersonalLessons) {
  if (!userId) return false;
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}/personal_lessons/${userId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userPersonalLessons)
    });
    if (res.ok) {
      if (cachedCloudData) {
        if (!cachedCloudData.personal_lessons) cachedCloudData.personal_lessons = {};
        cachedCloudData.personal_lessons[userId] = userPersonalLessons;
      }
      return true;
    }
  } catch (err) {
    console.error('Failed to save personal lessons to Firebase:', err);
  }
  return false;
}

/**
 * Save/Register user profile in Firebase Realtime DB
 */
export async function saveCloudUserProfile(profile) {
  if (!profile || !profile.id) return false;
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}/users/${profile.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (res.ok) {
      if (cachedCloudData) {
        if (!cachedCloudData.users) cachedCloudData.users = {};
        cachedCloudData.users[profile.id] = profile;
      }
      return true;
    }
  } catch (err) {
    console.error('Failed to save user profile to Firebase:', err);
  }
  return false;
}

/**
 * Fetch ONLY users from Firebase (fast, used for login check)
 */
export async function fetchCloudUsers() {
  try {
    const res = await fetch(`${FIREBASE_RTDB_URL}/users.json`);
    if (res.ok) {
      const data = await res.json();
      const users = data && typeof data === 'object' ? data : {};
      // Merge into cache
      if (cachedCloudData) {
        cachedCloudData.users = users;
      } else {
        cachedCloudData = { users };
      }
      return users;
    }
  } catch (err) {
    console.warn('Failed to fetch users from Firebase:', err);
  }
  return (cachedCloudData?.users) || {};
}
