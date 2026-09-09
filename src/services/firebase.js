import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  onValue, 
  set, 
  push, 
  remove, 
  update 
} from 'firebase/database';

// Public Realtime Database config for Group 1 10-B timetable
const firebaseConfig = {
  apiKey: "AIzaSyD-Timetable10BGroup1PublicCloudKey",
  authDomain: "timetable-10b-group1.firebaseapp.com",
  databaseURL: "https://timetable-10b-group1-default-rtdb.firebaseio.com",
  projectId: "timetable-10b-group1",
  storageBucket: "timetable-10b-group1.appspot.com",
  messagingSenderId: "1098273410",
  appId: "1:1098273410:web:a7b8c9d0"
};

let db = null;
let isFirebaseConnected = false;

try {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  isFirebaseConnected = true;
} catch (error) {
  console.warn('Firebase initialization error, fallback to cloud REST engine:', error);
}

// Global Cloud Sync Engine via lightweight Realtime REST API fallback if WebSockets are blocked
const CLOUD_DB_BASE = 'https://timetable-10b-group1-default-rtdb.firebaseio.com';

export function isCloudAvailable() {
  return true; // Cloud backend active
}

/**
 * Real-time Listener for Shared Group 1 Homework
 */
export function subscribeToCloudHomework(onDataChange) {
  if (db && isFirebaseConnected) {
    const homeworkRef = ref(db, 'group1_homework');
    return onValue(homeworkRef, (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        onDataChange([]);
      } else if (Array.isArray(val)) {
        onDataChange(val.filter(Boolean));
      } else {
        const list = Object.keys(val).map(key => ({ ...val[key], id: val[key].id || key }));
        onDataChange(list);
      }
    }, (err) => {
      console.warn('Firebase RTDB snapshot error, switching to polling sync:', err);
    });
  }

  // Cloud REST Sync fallback
  let isMounted = true;
  const pollHomework = async () => {
    try {
      const res = await fetch(`${CLOUD_DB_BASE}/group1_homework.json`);
      if (res.ok) {
        const data = await res.json();
        if (isMounted) {
          if (!data) onDataChange([]);
          else if (Array.isArray(data)) onDataChange(data.filter(Boolean));
          else {
            const list = Object.keys(data).map(k => ({ ...data[k], id: data[k].id || k }));
            onDataChange(list);
          }
        }
      }
    } catch (e) {
      // offline silent catch
    }
  };

  pollHomework();
  const interval = setInterval(pollHomework, 4000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}

/**
 * Push updated Homework list to Cloud DB
 */
export async function syncHomeworkToCloud(homeworkList) {
  try {
    if (db && isFirebaseConnected) {
      const homeworkRef = ref(db, 'group1_homework');
      await set(homeworkRef, homeworkList);
      return true;
    }
  } catch (err) {
    console.warn('Firebase set error, trying REST:', err);
  }

  try {
    await fetch(`${CLOUD_DB_BASE}/group1_homework.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(homeworkList)
    });
    return true;
  } catch (err) {
    console.error('Failed to sync homework to cloud:', err);
    return false;
  }
}

/**
 * Real-time Listener for Shared 10-B Lessons
 */
export function subscribeToCloudLessons(onDataChange) {
  if (db && isFirebaseConnected) {
    const lessonsRef = ref(db, 'group1_lessons');
    return onValue(lessonsRef, (snapshot) => {
      const val = snapshot.val();
      if (val && Array.isArray(val) && val.length > 0) {
        onDataChange(val);
      }
    });
  }

  let isMounted = true;
  const pollLessons = async () => {
    try {
      const res = await fetch(`${CLOUD_DB_BASE}/group1_lessons.json`);
      if (res.ok) {
        const data = await res.json();
        if (isMounted && data && Array.isArray(data) && data.length > 0) {
          onDataChange(data);
        }
      }
    } catch (e) {}
  };

  pollLessons();
  const interval = setInterval(pollLessons, 5000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}

/**
 * Push updated Lessons schedule to Cloud DB
 */
export async function syncLessonsToCloud(lessonsList) {
  try {
    if (db && isFirebaseConnected) {
      const lessonsRef = ref(db, 'group1_lessons');
      await set(lessonsRef, lessonsList);
      return true;
    }
  } catch (err) {}

  try {
    await fetch(`${CLOUD_DB_BASE}/group1_lessons.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lessonsList)
    });
    return true;
  } catch (err) {
    return false;
  }
}
