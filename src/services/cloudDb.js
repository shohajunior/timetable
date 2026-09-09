/**
 * Global Real-time Cloud Database Service
 * Uses a persistent cloud JSON storage bin with CORS support.
 * All devices (mobile, laptop, PC) synchronize with this cloud database in real time.
 */

const CLOUD_BIN_URL = 'https://extendsclass.com/api/json-storage/bin/eaabffb';

// In-memory cache
let cachedCloudData = null;
let lastETag = null;

/**
 * Fetch latest database state from cloud
 */
export async function fetchCloudData() {
  try {
    const res = await fetch(CLOUD_BIN_URL, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (res.ok) {
      const data = await res.json();
      cachedCloudData = data;
      return data;
    }
  } catch (error) {
    console.warn('Cloud DB fetch warning (offline or network issue):', error);
  }
  return cachedCloudData;
}

/**
 * Update whole cloud database state
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

    const res = await fetch(CLOUD_BIN_URL, {
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
    console.error('Failed to update Cloud DB:', error);
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
 * Save Homework list to Cloud DB
 */
export async function saveCloudHomework(homeworkList) {
  return updateCloudData(current => ({
    ...current,
    group1_homework: homeworkList
  }));
}

/**
 * Save Shared Lessons to Cloud DB (group 1 or 2)
 */
export async function saveCloudLessons(lessonsList, groupNumber = 1) {
  const groupKey = Number(groupNumber) === 2 ? 'group2_lessons' : 'group1_lessons';
  return updateCloudData(current => ({
    ...current,
    [groupKey]: lessonsList
  }));
}

/**
 * Save personal schedule activities for a specific user to Cloud DB
 */
export async function saveCloudPersonalLessons(userId, userPersonalLessons) {
  if (!userId) return false;
  return updateCloudData(current => ({
    ...current,
    personal_lessons: {
      ...(current.personal_lessons || {}),
      [userId]: userPersonalLessons
    }
  }));
}

/**
 * Save/Register user profile in Cloud DB
 */
export async function saveCloudUserProfile(profile) {
  if (!profile || !profile.id) return false;
  return updateCloudData(current => ({
    ...current,
    users: {
      ...(current.users || {}),
      [profile.id]: profile
    }
  }));
}
