import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Check, 
  Lock, 
  ShieldCheck, 
  LogOut, 
  Sparkles, 
  UserPlus, 
  LogIn, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  KeyRound 
} from 'lucide-react';

const AVATAR_COLORS = [
  { id: 'indigo', name: 'Синий', bg: 'bg-indigo-600', text: 'text-indigo-600', ring: 'ring-indigo-600' },
  { id: 'emerald', name: 'Изумрудный', bg: 'bg-emerald-600', text: 'text-emerald-600', ring: 'ring-emerald-600' },
  { id: 'purple', name: 'Фиолетовый', bg: 'bg-purple-600', text: 'text-purple-600', ring: 'ring-purple-600' },
  { id: 'amber', name: 'Янтарный', bg: 'bg-amber-600', text: 'text-amber-600', ring: 'ring-amber-600' },
  { id: 'rose', name: 'Розовый', bg: 'bg-rose-600', text: 'text-rose-600', ring: 'ring-rose-600' },
  { id: 'cyan', name: 'Бирюзовый', bg: 'bg-cyan-600', text: 'text-cyan-600', ring: 'ring-cyan-600' },
  { id: 'slate', name: 'Графитовый', bg: 'bg-slate-800', text: 'text-slate-800', ring: 'ring-slate-800' }
];

export function AuthModal({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
  isOnboarding = false,
  cloudUsers = {}
}) {
  const registeredUsersList = useMemo(() => {
    return Object.values(cloudUsers || {}).filter(u => u && u.name && !u.isGuest);
  }, [cloudUsers]);

  const isLoggedIn = Boolean(currentProfile && !currentProfile.isGuest);

  // Tab: 'login' | 'register' | 'edit'
  const [activeTab, setActiveTab] = useState(() => {
    if (isLoggedIn) return 'edit';
    return registeredUsersList.length > 0 ? 'login' : 'register';
  });

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [group, setGroup] = useState(1);
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [error, setError] = useState(null);

  const passwordInputRef = useRef(null);

  // Reset or initialize values when modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      if (currentProfile && !currentProfile.isGuest) {
        setName(currentProfile.name || '');
        setGroup(currentProfile.group || 1);
        setSelectedColor(currentProfile.color || 'indigo');
        setPassword(currentProfile.password || '');
        setActiveTab('edit');
      } else {
        setName('');
        setPassword('');
        setGroup(1);
        setSelectedColor('indigo');
        setActiveTab(registeredUsersList.length > 0 ? 'login' : 'register');
      }
      setShowPassword(false);
      setError(null);
    }
  }, [currentProfile, isOpen, registeredUsersList.length]);

  // Check if entered name already exists in cloud
  const matchedExistingUser = useMemo(() => {
    if (!name.trim()) return null;
    const clean = name.trim().toLowerCase();
    return registeredUsersList.find(u => u.name.trim().toLowerCase() === clean);
  }, [name, registeredUsersList]);

  // Selecting a cloud user from the quick list
  const handleSelectUser = (user) => {
    setName(user.name);
    setError(null);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Пожалуйста, введите ваше имя');
      return;
    }

    if (!password.trim()) {
      setError('Пожалуйста, введите пароль (любой, без ограничений)');
      return;
    }

    const profileId = 'user-' + cleanName.toLowerCase().replace(/\s+/g, '-');
    const existing = registeredUsersList.find(
      u => u.id === profileId || u.name.trim().toLowerCase() === cleanName.toLowerCase()
    );

    // MODE 1: LOGIN
    if (activeTab === 'login') {
      if (!existing) {
        setError(`Аккаунт «${cleanName}» не найден в облаке. Перейдите на вкладку «Новый ученик» для регистрации.`);
        return;
      }

      // If user has a password in cloud DB, verify match
      if (existing.password && existing.password !== password.trim()) {
        setError('Неверный пароль! Проверьте пароль и попробуйте снова.');
        return;
      }

      const updatedProfile = {
        ...existing,
        password: password.trim(),
        isGuest: false
      };

      onSaveProfile(updatedProfile);
      if (onClose) onClose();
      return;
    }

    // MODE 2: REGISTER
    if (activeTab === 'register') {
      if (existing) {
        setError(`Ученик с именем «${cleanName}» уже зарегистрирован. Перейдите на вкладку «Войти в аккаунт».`);
        return;
      }

      const newProfile = {
        id: profileId,
        name: cleanName,
        password: password.trim(),
        group: Number(group) || 1,
        color: selectedColor,
        isGuest: false
      };

      onSaveProfile(newProfile);
      if (onClose) onClose();
      return;
    }

    // MODE 3: EDIT CURRENT PROFILE
    if (activeTab === 'edit') {
      const updatedProfile = {
        ...(currentProfile || {}),
        name: cleanName,
        password: password.trim(),
        group: Number(group) || 1,
        color: selectedColor,
        isGuest: false
      };

      onSaveProfile(updatedProfile);
      if (onClose) onClose();
      return;
    }
  };

  const handleLogoutToGuest = () => {
    const guestProfile = {
      id: 'user-guest',
      name: 'Гость',
      group: 1,
      color: 'slate',
      isGuest: true
    };
    onSaveProfile(guestProfile);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col text-slate-900 max-h-[92dvh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isOnboarding ? 'Вход в расписание 10-Б' : activeTab === 'edit' ? 'Настройки профиля' : 'Вход в расписание'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Облачный доступ к урокам, ДЗ и личным делам
                </p>
              </div>
            </div>

            {!isOnboarding && onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>

          <div className="p-5 space-y-4 overflow-y-auto text-xs no-scrollbar">
            
            {/* Friendly Cloud Sync & Security Banner */}
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-950 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold block text-indigo-950">Защита личных дел:</span>
                Ваш пароль защищает личные дела и позволяет безопасно заходить со смартфона, ноутбука или планшета. <b>Строгих правил нет</b> — введите любой пароль, который вам удобен!
              </div>
            </div>

            {/* Mode Switcher Tabs (only shown when not editing an active profile) */}
            {activeTab !== 'edit' ? (
              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'login'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Войти в аккаунт</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'register'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Новый ученик</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                <span className="text-slate-600 font-medium">Редактирование профиля</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setName('');
                    setPassword('');
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px]"
                >
                  Войти под другим именем →
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-medium">
                {error}
              </div>
            )}

            {/* TAB 1: LOGIN TO EXISTING ACCOUNT */}
            {activeTab === 'login' && (
              <div className="space-y-3.5">
                {/* 1. Quick Select From Registered Cloud Accounts */}
                {registeredUsersList.length > 0 && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-2 text-xs">
                      Выберите ваш профиль из облака:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-0.5 no-scrollbar">
                      {registeredUsersList.map((user) => {
                        const avatar = AVATAR_COLORS.find(c => c.id === user.color) || AVATAR_COLORS[0];
                        const isSelected = name.trim().toLowerCase() === user.name.toLowerCase();

                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleSelectUser(user)}
                            className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all group ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-7 h-7 rounded-full ${avatar.bg} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                                {user.name[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs truncate leading-tight">{user.name}</div>
                                <div className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                  {user.group || 1} группа
                                </div>
                              </div>
                            </div>

                            <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                              isSelected ? 'text-white' : 'text-slate-400'
                            }`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Login Form: Name + Password */}
                <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-slate-100">
                  {/* Name Input */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                      Имя ученика <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setError(null);
                        }}
                        placeholder="напр. Шохрух"
                        autoFocus={!registeredUsersList.length}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
                        required
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-800 text-xs">
                        Пароль <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">без строгих правил</span>
                    </div>
                    <div className="relative">
                      <input
                        ref={passwordInputRef}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError(null);
                        }}
                        placeholder="Введите ваш пароль"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
                        required
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                        title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {matchedExistingUser ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full ${AVATAR_COLORS.find(c => c.id === matchedExistingUser.color)?.bg || 'bg-indigo-600'} text-white flex items-center justify-center font-bold text-xs`}>
                          {matchedExistingUser.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs">Аккаунт найден в облаке!</div>
                          <div className="text-[10px] text-emerald-700">{matchedExistingUser.group} группа • Введите пароль для входа</div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-md text-xs sm:text-sm mt-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Войти в аккаунт</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: REGISTER NEW ACCOUNT */}
            {activeTab === 'register' && (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* 1. Name */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                    Ваше имя или никнейм <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError(null);
                      }}
                      placeholder="напр. Шохрух, Мадина, Азиз"
                      autoFocus
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
                      required
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* 2. Password (NO STRICT RULES) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-slate-800 text-xs">
                      Придумайте пароль <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">любой удобный</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Любой пароль (напр. 1234)"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                      title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Без строгих правил (любые цифры или буквы). Запомните его для входа с других устройств.
                  </p>
                </div>

                {/* 3. Group Selection */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                    Ваша группа <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 1, label: '1 группа' },
                      { id: 2, label: '2 группа' }
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGroup(g.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          group === g.id
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{g.label}</span>
                          {group === g.id && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Color Selection */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                    Цвет профиля и аватарки <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedColor(c.id)}
                        title={c.name}
                        className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center transition-all ${
                          selectedColor === c.id
                            ? 'ring-3 ring-offset-2 ring-slate-900 scale-110 shadow-md'
                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {selectedColor === c.id && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview */}
                {name.trim() && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${AVATAR_COLORS.find(c => c.id === selectedColor)?.bg || 'bg-indigo-600'} text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}>
                      {name.trim()[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate text-xs">{name.trim()}</div>
                      <div className="text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-700">{group} группа</span> • Новый облачный аккаунт
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  {!isOnboarding && onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                    >
                      Отмена
                    </button>
                  )}
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-md text-xs sm:text-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Зарегистрироваться и войти</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: EDIT CURRENT LOGGED-IN PROFILE */}
            {activeTab === 'edit' && (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* 1. Name */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                    Ваше имя или никнейм
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError(null);
                      }}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-slate-900 transition-colors"
                      required
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* 2. Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-slate-800 text-xs">
                      Пароль аккаунта
                    </label>
                    <span className="text-[10px] text-slate-400">без ограничений</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Ваш пароль"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-slate-900 transition-colors"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 3. Group */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                    Группа
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 1, label: '1 группа' },
                      { id: 2, label: '2 группа' }
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGroup(g.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          group === g.id
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{g.label}</span>
                          {group === g.id && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Color */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5 text-xs">
                    Цвет профиля
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedColor(c.id)}
                        title={c.name}
                        className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center transition-all ${
                          selectedColor === c.id
                            ? 'ring-3 ring-offset-2 ring-slate-900 scale-110 shadow-md'
                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {selectedColor === c.id && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-md text-xs sm:text-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Сохранить настройки</span>
                  </button>
                </div>
              </form>
            )}

            {/* Logout Option (when already logged in) */}
            {!isOnboarding && currentProfile && !currentProfile.isGuest && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Вы вошли как: <b>{currentProfile.name}</b>
                </span>
                <button
                  type="button"
                  onClick={handleLogoutToGuest}
                  className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors flex items-center gap-1.5 text-[11px]"
                >
                  <LogOut className="w-3.5 h-3.5" /> Выйти из аккаунта
                </button>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
