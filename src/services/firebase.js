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

// Realtime Database config for timetable-ba5f2
const firebaseConfig = {
  apiKey: "AIzaSyD-Timetable10BGroup1PublicCloudKey",
  authDomain: "timetable-ba5f2.firebaseapp.com",
  databaseURL: "https://timetable-ba5f2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "timetable-ba5f2",
  storageBucket: "timetable-ba5f2.appspot.com",
  messagingSenderId: "timetable-ba5f2-msg",
  appId: "1:timetable-ba5f2:web:app"
};

let db = null;
let isFirebaseConnected = false;

try {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  isFirebaseConnected = true;
} catch (error) {
  console.warn('Firebase SDK init warning, fallback to high-speed REST:', error);
}

const CLOUD_DB_BASE = 'https://timetable-ba5f2-default-rtdb.asia-southeast1.firebasedatabase.app';

export function isCloudAvailable() {
  return true;
}

/**
 * Real-time Listener for Shared Homework
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
  const interval = setInterval(pollHomework, 3000);
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
    const res = await fetch(`${CLOUD_DB_BASE}/group1_homework.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(homeworkList)
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to sync homework to Firebase:', err);
    return false;
  }
}

/**
 * Real-time Listener for Shared Lessons
 */
export function subscribeToCloudLessons(onDataChange, groupNumber = 1) {
  const groupKey = Number(groupNumber) === 2 ? 'group2_lessons' : 'group1_lessons';
  let isMounted = true;
  const pollLessons = async () => {
    try {
      const res = await fetch(`${CLOUD_DB_BASE}/${groupKey}.json`);
      if (res.ok) {
        const data = await res.json();
        if (isMounted && data && Array.isArray(data) && data.length > 0) {
          onDataChange(data);
        }
      }
    } catch (e) {}
  };

  pollLessons();
  const interval = setInterval(pollLessons, 3000);
  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}

/**
 * Push updated Lessons schedule to Cloud DB
 */
export async function syncLessonsToCloud(lessonsList, groupNumber = 1) {
  const groupKey = Number(groupNumber) === 2 ? 'group2_lessons' : 'group1_lessons';
  try {
    const res = await fetch(`${CLOUD_DB_BASE}/${groupKey}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lessonsList)
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}
