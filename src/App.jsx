import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  loadLessonsFromStorage, 
  saveLessonsToStorage, 
  loadHomeworkFromStorage,
  saveHomeworkToStorage,
  loadUserProfile,
  saveUserProfile
} from './utils/storage';
import { 
  getWeekNumberFromSept, 
  getWeekParity 
} from './utils/parity';
import { 
  subscribeToCloudData, 
  fetchCloudData,
  saveCloudHomework, 
  saveCloudLessons, 
  saveCloudPersonalLessons, 
  saveCloudUserProfile 
} from './services/cloudDb';
import { Header } from './components/Header';
import { DayView } from './components/DayView';
import { WeekView } from './components/WeekView';
import { ActivityModal } from './components/ActivityModal';
import { HomeworkView } from './components/HomeworkView';
import { AddHomeworkModal } from './components/AddHomeworkModal';
import { AuthModal } from './components/AuthModal';
import { getCurrentTimeMinutes } from './utils/timeStatus';
import { Sparkles, Cloud } from 'lucide-react';

function getDayOfWeekNumber(d) {
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  return day === 0 ? 7 : day;
}

export default function App() {
  // User Profile state
  const [userProfile, setUserProfile] = useState(() => loadUserProfile());
  const [cloudUsers, setCloudUsers] = useState({});

  // Onboarding flag: prompt immediately if user has no profile or name
  const [isOnboarding, setIsOnboarding] = useState(() => {
    const p = loadUserProfile();
    return !p || p.isGuest || !p.name;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => {
    const p = loadUserProfile();
    return !p || p.isGuest || !p.name;
  });

  // Active viewing group: defaults to user profile group or 1
  const [activeGroup, setActiveGroup] = useState(() => {
    const p = loadUserProfile();
    return Number(p?.group) || 1;
  });

  // Align activeGroup with profile group
  useEffect(() => {
    if (userProfile?.group) {
      setActiveGroup(Number(userProfile.group));
    }
  }, [userProfile?.group]);

  // Schedule Lessons & Homework
  const [lessons, setLessons] = useState(() => loadLessonsFromStorage(userProfile?.group || 1));
  const [homeworkList, setHomeworkList] = useState(() => loadHomeworkFromStorage());

  // Dynamic Current Date: default to real current date
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week' | 'homework'
  
  // Dynamically set selectedDayOfWeek based on current date
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(() => getDayOfWeekNumber(new Date()));

  // Live minute ticker for current lesson status & countdown
  const [nowMinutes, setNowMinutes] = useState(() => getCurrentTimeMinutes());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMinutes(getCurrentTimeMinutes());
      const now = new Date();
      if (now.toDateString() !== currentDate.toDateString()) {
        setCurrentDate(now);
      }
    }, 10000); // refresh every 10 seconds
    return () => clearInterval(interval);
  }, [currentDate]);

  // Real-time Cloud DB Synchronization across all devices
  useEffect(() => {
    const unsubscribe = subscribeToCloudData((cloudData) => {
      if (!cloudData) return;

      // 0. Update Registered Cloud Users List
      if (cloudData.users) {
        setCloudUsers(cloudData.users);
      }

      // 1. Sync Shared Lessons for Active Group + Current User Personal Lessons from Cloud
      const groupKey = activeGroup === 2 ? 'group2_lessons' : 'group1_lessons';
      const sharedLessons = cloudData[groupKey];

      if (Array.isArray(sharedLessons) && sharedLessons.length > 0) {
        const currentUserId = userProfile?.id;
        const userPersonalLessons = (currentUserId && cloudData.personal_lessons?.[currentUserId]) || [];

        // Combine shared lessons and current user personal lessons
        const combined = [...sharedLessons, ...userPersonalLessons];
        setLessons(combined);
        saveLessonsToStorage(combined, activeGroup);
      }

      // 2. Sync Shared Homework from Cloud
      if (Array.isArray(cloudData.group1_homework)) {
        setHomeworkList(cloudData.group1_homework);
        saveHomeworkToStorage(cloudData.group1_homework);
      }

      // 3. Sync User Profile if registered or updated on another computer
      if (userProfile?.id && cloudData.users?.[userProfile.id]) {
        const remoteUser = cloudData.users[userProfile.id];
        if (
          remoteUser.group !== userProfile.group || 
          remoteUser.color !== userProfile.color || 
          remoteUser.password !== userProfile.password ||
          remoteUser.name !== userProfile.name
        ) {
          const updated = { ...userProfile, ...remoteUser };
          setUserProfile(updated);
          saveUserProfile(updated);
        }
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [userProfile?.id, activeGroup]);

  // When activeGroup changes, immediately update lessons view
  useEffect(() => {
    const localLessons = loadLessonsFromStorage(activeGroup);
    const userPersonal = (userProfile?.id && localLessons.filter(l => l.type === 'personal' && l.userId === userProfile.id)) || [];
    const sharedOnly = localLessons.filter(l => l.type !== 'personal');
    setLessons([...sharedOnly, ...userPersonal]);

    fetchCloudData().then(cloudData => {
      if (!cloudData) return;
      const groupKey = activeGroup === 2 ? 'group2_lessons' : 'group1_lessons';
      const shared = cloudData[groupKey];
      if (Array.isArray(shared) && shared.length > 0) {
        const cloudPersonal = (userProfile?.id && cloudData.personal_lessons?.[userProfile.id]) || [];
        const combined = [...shared, ...cloudPersonal];
        setLessons(combined);
        saveLessonsToStorage(combined, activeGroup);
      }
    });
  }, [activeGroup, userProfile?.id]);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [isAddHomeworkOpen, setIsAddHomeworkOpen] = useState(false);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState(null);

  // Auto-save userProfile to local storage
  useEffect(() => {
    if (userProfile) {
      saveUserProfile(userProfile);
    }
  }, [userProfile]);

  // Filter lessons for Privacy Scoping:
  // Shared lessons ('school', 'new_uzbekistan') are visible to EVERYONE.
  // Personal lessons ('personal') are visible ONLY to the owner account!
  const visibleLessons = useMemo(() => {
    return lessons.filter(lesson => {
      if (lesson.type !== 'personal') return true;
      if (userProfile?.isGuest) {
        return !lesson.userId || lesson.userId === 'user-guest';
      }
      return lesson.userId === userProfile?.id;
    });
  }, [lessons, userProfile]);

  // Derived parity & week number
  const currentWeekNumber = getWeekNumberFromSept(currentDate);
  const currentParity = getWeekParity(currentDate);

  const todayDayOfWeek = getDayOfWeekNumber(new Date());
  const isSelectedToday = selectedDayOfWeek === todayDayOfWeek;

  // Toast trigger
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Week Navigation Handlers
  const handlePrevWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() - 7);
    setCurrentDate(next);
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const handleResetWeek = () => {
    const d = new Date();
    setCurrentDate(d);
    setSelectedDayOfWeek(getDayOfWeekNumber(d));
    showToast('Сброшено на сегодняшний день');
  };

  // CRUD Handlers for Schedule Lessons (Syncs to Cloud DB)
  const handleSaveLesson = (lessonData) => {
    let updatedLessons = [];
    if (Array.isArray(lessonData)) {
      setLessons(prev => {
        const idsToRemove = new Set(lessonData.map(l => l.id).filter(Boolean));
        const filtered = prev.filter(l => !idsToRemove.has(l.id));
        updatedLessons = [...filtered, ...lessonData];
        return updatedLessons;
      });
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      showToast(`Добавлено занятий: ${lessonData.length}`);
    } else if (lessonData.id) {
      setLessons(prev => {
        updatedLessons = prev.map(l => l.id === lessonData.id ? lessonData : l);
        return updatedLessons;
      });
      showToast(`Предмет "${lessonData.title}" обновлен`);
    } else {
      const newLesson = {
        ...lessonData,
        id: 'user-add-' + Date.now()
      };
      setLessons(prev => {
        updatedLessons = [...prev, newLesson];
        return updatedLessons;
      });
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      showToast(`Добавлено: "${lessonData.title}"`);
    }

    // Sync to Cloud DB:
    setTimeout(() => {
      const finalLessons = updatedLessons.length > 0 ? updatedLessons : lessons;
      saveLessonsToStorage(finalLessons, activeGroup);

      // Separate shared vs personal
      const shared = finalLessons.filter(l => l.type !== 'personal');
      saveCloudLessons(shared, activeGroup);

      if (userProfile?.id) {
        const userPersonal = finalLessons.filter(l => l.type === 'personal' && l.userId === userProfile.id);
        saveCloudPersonalLessons(userProfile.id, userPersonal);
      }
    }, 100);
  };

  const handleDeleteLesson = (id) => {
    const target = lessons.find(l => l.id === id);
    const updated = lessons.filter(l => l.id !== id);
    setLessons(updated);
    saveLessonsToStorage(updated, activeGroup);

    const shared = updated.filter(l => l.type !== 'personal');
    saveCloudLessons(shared, activeGroup);

    if (userProfile?.id) {
      const userPersonal = updated.filter(l => l.type === 'personal' && l.userId === userProfile.id);
      saveCloudPersonalLessons(userProfile.id, userPersonal);
    }

    showToast(`Удалено: "${target?.title || ''}"`);
  };

  // CRUD Handlers for Homework (Syncs to Cloud DB)
  const handleAddHomework = (newHw) => {
    const updated = [newHw, ...homeworkList];
    setHomeworkList(updated);
    saveHomeworkToStorage(updated);
    saveCloudHomework(updated);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    showToast(`ДЗ по предм. "${newHw.subject}" опубликовано в облаке! ☁️`);
  };

  const handleToggleHomeworkComplete = (id) => {
    const updated = homeworkList.map(item => {
      if (item.id === id) {
        const nextStatus = !item.isCompleted;
        if (nextStatus) {
          showToast(`Задание по "${item.subject}" выполнено! 🎉`);
        }
        return { ...item, isCompleted: nextStatus };
      }
      return item;
    });
    setHomeworkList(updated);
    saveHomeworkToStorage(updated);
    saveCloudHomework(updated);
  };

  const handleDeleteHomework = (id) => {
    const target = homeworkList.find(i => i.id === id);
    const updated = homeworkList.filter(i => i.id !== id);
    setHomeworkList(updated);
    saveHomeworkToStorage(updated);
    saveCloudHomework(updated);
    showToast(`Удалено ДЗ по "${target?.subject || ''}"`);
  };

  // Profile Save / Login Handler
  const handleSaveProfile = async (prof) => {
    setUserProfile(prof);
    saveUserProfile(prof);
    const targetGroup = Number(prof.group) || 1;
    setActiveGroup(targetGroup);
    setIsOnboarding(false);
    setIsAuthModalOpen(false);
    showToast(`Добро пожаловать, ${prof.name}! (${targetGroup} группа) 🎉`);

    // Sync user profile to Cloud DB
    await saveCloudUserProfile(prof);

    // Fetch and restore this user's group lessons and personal lessons immediately
    try {
      const cloudData = await fetchCloudData();
      if (cloudData) {
        if (cloudData.users) setCloudUsers(cloudData.users);
        const groupKey = targetGroup === 2 ? 'group2_lessons' : 'group1_lessons';
        const sharedLessons = cloudData[groupKey] || [];
        const userPersonalLessons = (prof.id && cloudData.personal_lessons?.[prof.id]) || [];
        const combined = [...sharedLessons, ...userPersonalLessons];
        setLessons(combined);
        saveLessonsToStorage(combined, targetGroup);
      }
    } catch (e) {
      console.warn('Could not immediately pull personal lessons:', e);
    }
  };

  // Quick toggle between viewing 1 and 2 group
  const handleToggleGroup = () => {
    const nextGroup = activeGroup === 1 ? 2 : 1;
    setActiveGroup(nextGroup);
    showToast(`Переключено на расписание: ${nextGroup} группа 📚`);
  };

  // Open Modal helpers
  const handleOpenAddModal = () => {
    if (viewMode === 'homework') {
      setIsAddHomeworkOpen(true);
    } else {
      setEditingLesson(null);
      setIsModalOpen(true);
    }
  };

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setIsModalOpen(true);
  };

  const handleAddAtTime = (startTime, dayOfWeek) => {
    setEditingLesson({
      startTime: startTime,
      endTime: '16:00',
      dayOfWeek: dayOfWeek,
      type: 'school',
      periodicity: 'weekly'
    });
    setIsModalOpen(true);
  };

  const handleAddAtDay = (dayOfWeek) => {
    setEditingLesson({
      dayOfWeek: dayOfWeek,
      startTime: '14:00',
      endTime: '15:00',
      type: 'personal',
      periodicity: 'weekly',
      userId: userProfile?.id
    });
    setIsModalOpen(true);
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-slate-50 text-slate-900 flex flex-col overflow-hidden selection:bg-slate-900 selection:text-white">
      
      {/* Header */}
      <Header
        currentDate={currentDate}
        currentWeekNumber={currentWeekNumber}
        currentParity={currentParity}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedDayOfWeek={selectedDayOfWeek}
        setSelectedDayOfWeek={setSelectedDayOfWeek}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onResetWeek={handleResetWeek}
        onOpenAddModal={handleOpenAddModal}
        userProfile={userProfile}
        activeGroup={activeGroup}
        onToggleGroup={handleToggleGroup}
        onOpenAuthModal={() => {
          setIsOnboarding(false);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full px-2 sm:px-4 py-1.5 sm:py-2 overflow-hidden flex flex-col min-h-0">
        {viewMode === 'day' && (
          <DayView
            lessons={visibleLessons}
            selectedDayOfWeek={selectedDayOfWeek}
            currentParity={currentParity}
            nowMinutes={nowMinutes}
            isToday={isSelectedToday}
            onLessonClick={handleEditLesson}
            onAddAtTime={handleAddAtTime}
          />
        )}
        {viewMode === 'week' && (
          <WeekView
            lessons={visibleLessons}
            currentParity={currentParity}
            todayDayOfWeek={todayDayOfWeek}
            nowMinutes={nowMinutes}
            onLessonClick={handleEditLesson}
            onAddAtDay={handleAddAtDay}
          />
        )}
        {viewMode === 'homework' && (
          <HomeworkView
            homeworkList={homeworkList}
            onAddClick={() => setIsAddHomeworkOpen(true)}
            onToggleComplete={handleToggleHomeworkComplete}
            onDeleteHomework={handleDeleteHomework}
            lessons={lessons}
            userProfile={userProfile}
          />
        )}
      </main>

      {/* Activity Add / Edit Modal */}
      <ActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLesson}
        onDelete={handleDeleteLesson}
        initialLesson={editingLesson}
        existingLessons={lessons}
        currentParity={currentParity}
        userProfile={userProfile}
      />

      {/* Add Homework Modal */}
      <AddHomeworkModal
        isOpen={isAddHomeworkOpen}
        onClose={() => setIsAddHomeworkOpen(false)}
        onAddHomework={handleAddHomework}
        lessons={lessons}
        userProfile={userProfile}
      />

      {/* Auth / Onboarding Modal (Opens immediately on start if user has no profile) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={isOnboarding ? null : () => setIsAuthModalOpen(false)}
        currentProfile={userProfile}
        onSaveProfile={handleSaveProfile}
        isOnboarding={isOnboarding}
        cloudUsers={cloudUsers}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2 border border-slate-700">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
