import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  loadLessonsFromStorage, 
  saveLessonsToStorage, 
  resetLessonsToDefault 
} from './utils/storage';
import { 
  getWeekNumberFromSept, 
  getWeekParity 
} from './utils/parity';
import { Header } from './components/Header';
import { DayView } from './components/DayView';
import { WeekView } from './components/WeekView';
import { ActivityModal } from './components/ActivityModal';
import { getCurrentTimeMinutes } from './utils/timeStatus';
import { Sparkles } from 'lucide-react';

function getDayOfWeekNumber(d) {
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  return day === 0 ? 7 : day;
}

export default function App() {
  // Initial State Initialization
  const [lessons, setLessons] = useState(() => loadLessonsFromStorage());

  // Dynamic Current Date: default to real current date
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week'
  
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

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState(null);

  // Auto-save lessons to localStorage
  useEffect(() => {
    saveLessonsToStorage(lessons);
  }, [lessons]);

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

  // CRUD Handlers
  const handleSaveLesson = (lessonData) => {
    if (Array.isArray(lessonData)) {
      setLessons(prev => {
        const idsToRemove = new Set(lessonData.map(l => l.id).filter(Boolean));
        const filtered = prev.filter(l => !idsToRemove.has(l.id));
        return [...filtered, ...lessonData];
      });
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      showToast(`Добавлено занятий: ${lessonData.length}`);
    } else if (lessonData.id) {
      setLessons(prev => prev.map(l => l.id === lessonData.id ? lessonData : l));
      showToast(`Предмет "${lessonData.title}" обновлен`);
    } else {
      const newLesson = {
        ...lessonData,
        id: 'user-add-' + Date.now()
      };
      setLessons(prev => [...prev, newLesson]);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      showToast(`Добавлено: "${lessonData.title}"`);
    }
  };

  const handleDeleteLesson = (id) => {
    const target = lessons.find(l => l.id === id);
    setLessons(prev => prev.filter(l => l.id !== id));
    showToast(`Удалено: "${target?.title || ''}"`);
  };

  // Open Modal helpers
  const handleOpenAddModal = () => {
    setEditingLesson(null);
    setIsModalOpen(true);
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
      periodicity: 'weekly'
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
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full px-2 sm:px-4 py-1.5 sm:py-2 overflow-hidden flex flex-col min-h-0">
        {viewMode === 'day' ? (
          <DayView
            lessons={lessons}
            selectedDayOfWeek={selectedDayOfWeek}
            currentParity={currentParity}
            nowMinutes={nowMinutes}
            isToday={isSelectedToday}
            onLessonClick={handleEditLesson}
            onAddAtTime={handleAddAtTime}
          />
        ) : (
          <WeekView
            lessons={lessons}
            currentParity={currentParity}
            todayDayOfWeek={todayDayOfWeek}
            nowMinutes={nowMinutes}
            onLessonClick={handleEditLesson}
            onAddAtDay={handleAddAtDay}
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
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-md flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-slate-300" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
