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
  subscribeToCloudHomework, 
  syncHomeworkToCloud, 
  subscribeToCloudLessons, 
  syncLessonsToCloud 
} from './services/firebase';
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
  // Initial State Initialization
  const [lessons, setLessons] = useState(() => loadLessonsFromStorage());
  const [homeworkList, setHomeworkList] = useState(() => loadHomeworkFromStorage());
  const [userProfile, setUserProfile] = useState(() => loadUserProfile());

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

  // Real-time Cloud DB Subscriptions across devices
  useEffect(() => {
    const unsubHomework = subscribeToCloudHomework((cloudHomework) => {
      if (cloudHomework && Array.isArray(cloudHomework)) {
        setHomeworkList(cloudHomework);
        saveHomeworkToStorage(cloudHomework);
      }
    });

    const unsubLessons = subscribeToCloudLessons((cloudLessons) => {
      if (cloudLessons && Array.isArray(cloudLessons) && cloudLessons.length > 0) {
        setLessons(cloudLessons);
        saveLessonsToStorage(cloudLessons);
      }
    });

    return () => {
      if (typeof unsubHomework === 'function') unsubHomework();
      if (typeof unsubLessons === 'function') unsubLessons();
    };
  }, []);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddHomeworkOpen, setIsAddHomeworkOpen] = useState(false);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState(null);

  // Auto-save userProfile to localStorage
  useEffect(() => {
    saveUserProfile(userProfile);
  }, [userProfile]);

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

  // CRUD Handlers for Schedule Lessons
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

    setTimeout(() => {
      syncLessonsToCloud(updatedLessons.length > 0 ? updatedLessons : lessons);
    }, 100);
  };

  const handleDeleteLesson = (id) => {
    const target = lessons.find(l => l.id === id);
    const updated = lessons.filter(l => l.id !== id);
    setLessons(updated);
    syncLessonsToCloud(updated);
    showToast(`Удалено: "${target?.title || ''}"`);
  };

  // CRUD Handlers for Homework
  const handleAddHomework = (newHw) => {
    const updated = [newHw, ...homeworkList];
    setHomeworkList(updated);
    saveHomeworkToStorage(updated);
    syncHomeworkToCloud(updated);
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
    syncHomeworkToCloud(updated);
  };

  const handleDeleteHomework = (id) => {
    const target = homeworkList.find(i => i.id === id);
    const updated = homeworkList.filter(i => i.id !== id);
    setHomeworkList(updated);
    saveHomeworkToStorage(updated);
    syncHomeworkToCloud(updated);
    showToast(`Удалено ДЗ по "${target?.subject || ''}"`);
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
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
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

      {/* Auth / User Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentProfile={userProfile}
        onSaveProfile={(prof) => {
          setUserProfile(prof);
          showToast(`Добро пожаловать, ${prof.name}!`);
        }}
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
