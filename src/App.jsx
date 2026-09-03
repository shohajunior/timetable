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
import { GeminiChatWidget } from './components/GeminiChatWidget';
import { getCurrentTimeMinutes } from './utils/timeStatus';
import { Sparkles } from 'lucide-react';

function getDayOfWeekNumber(d) {
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 4 = Thu
  return day === 0 ? 7 : day;
}

export default function App() {
  // Initial State Initialization
  const [lessons, setLessons] = useState(() => loadLessonsFromStorage());

  // Default Current Date: September 3, 2026 (Thursday)
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setFullYear(2026, 8, 3);
    return d;
  });

  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week'
  
  // Dynamically set selectedDayOfWeek based on currentDate (Sept 3 = 4 = Thursday)
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(() => getDayOfWeekNumber(new Date(2026, 8, 3)));

  // Live minute ticker for current lesson status & countdown
  const [nowMinutes, setNowMinutes] = useState(() => getCurrentTimeMinutes());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMinutes(getCurrentTimeMinutes());
    }, 10000); // refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);

  // Gemini AI Assistant Chat state
  const [isGeminiOpen, setIsGeminiOpen] = useState(false);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState(null);

  // Auto-save lessons to localStorage
  useEffect(() => {
    saveLessonsToStorage(lessons);
  }, [lessons]);

  // Derived parity & week number
  const currentWeekNumber = getWeekNumberFromSept(currentDate);
  const currentParity = getWeekParity(currentDate);

  const todayDayOfWeek = getDayOfWeekNumber(new Date(2026, 8, 3));
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
    d.setFullYear(2026, 8, 3);
    setCurrentDate(d);
    setSelectedDayOfWeek(getDayOfWeekNumber(d)); // 4 = Thursday
    showToast('Сброшено на 3 сентября (Четверг)');
  };

  // CRUD Handlers
  const handleSaveLesson = (lessonData) => {
    if (lessonData.id) {
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

  const handleResetData = () => {
    if (confirm('Сбросить расписание к базовому 10-Б?')) {
      const defaults = resetLessonsToDefault();
      setLessons(defaults);
      showToast('Расписание сброшено');
    }
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
    <div className="h-screen max-h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden selection:bg-slate-900 selection:text-white">
      
      {/* Header (Navbar without AI button) */}
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
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full px-2 sm:px-4 py-2 overflow-hidden flex flex-col">
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

      {/* DRAGGABLE & MOVABLE FLOATING GEMINI AI BUTTON */}
      {!isGeminiOpen && (
        <motion.button
          drag
          dragMomentum={false}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsGeminiOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 cursor-grab active:cursor-grabbing flex items-center justify-center border border-slate-700"
          title="Перетащите иконку AI в любое место экрана"
        >
          <Sparkles className="w-5 h-5 text-white pointer-events-none" />
        </motion.button>
      )}

      {/* Gemini Chat Drawer */}
      <GeminiChatWidget
        isOpen={isGeminiOpen}
        onClose={() => setIsGeminiOpen(false)}
        lessons={lessons}
        onAddActivity={handleSaveLesson}
        onUpdateActivity={(id, patch) => {
          setLessons(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
        }}
        onDeleteActivity={handleDeleteLesson}
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
