import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Key } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { timeToMinutes } from '../utils/collision';
import { DAYS_OF_WEEK } from '../utils/parity';

export function GeminiChatWidget({
  isOpen,
  onClose,
  lessons,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  currentParity
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Привет! Я Gemini Ассистент. Готов помочь изменить расписание.\nНапример:\n• "Отмени физику в пятницу"\n• "Перенеси английский в четверг на 15:00"\n• "Добавь теннис в среду в 17:00"'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSaveKey = (e) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', apiKey.trim());
    setShowKeyInput(false);
    setMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'system',
        text: '🔑 API ключ сохранен!'
      }
    ]);
  };

  // Helper to resolve day of week from text
  const parseDayOfWeek = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('понедельник') || lower.includes('пн') || lower.includes('dushanba')) return 1;
    if (lower.includes('вторник') || lower.includes('вт') || lower.includes('seshanba')) return 2;
    if (lower.includes('среду') || lower.includes('среда') || lower.includes('ср') || lower.includes('chorshanba')) return 3;
    if (lower.includes('четверг') || lower.includes('чт') || lower.includes('payshanba')) return 4;
    if (lower.includes('пятницу') || lower.includes('пятница') || lower.includes('пт') || lower.includes('juma')) return 5;
    return null;
  };

  // Smart fallback NLP handler for immediate state mutation
  const processLocalNLP = (prompt) => {
    const lower = prompt.toLowerCase();

    // 1. DELETE ACTION: "Отмени / удали [subject] в [day]"
    if (lower.includes('отмени') || lower.includes('удали') || lower.includes('убери') || lower.includes('ochir')) {
      const targetDay = parseDayOfWeek(prompt);
      
      const candidate = lessons.find(l => {
        const titleMatch = lower.includes(l.title.toLowerCase()) || 
                           (l.title.toLowerCase().includes('физик') && lower.includes('физик')) ||
                           (l.title.toLowerCase().includes('англ') && lower.includes('англ')) ||
                           (l.title.toLowerCase().includes('алгебр') && lower.includes('алгебр')) ||
                           (l.title.toLowerCase().includes('информ') && lower.includes('информ'));
        const dayMatch = targetDay ? Number(l.dayOfWeek) === Number(targetDay) : true;
        return titleMatch && dayMatch;
      });

      if (candidate) {
        onDeleteActivity(candidate.id);
        const dayName = DAYS_OF_WEEK.find(d => d.id === candidate.dayOfWeek)?.name || '';
        return {
          text: `✅ Занятие "${candidate.title}" (${dayName}, ${candidate.startTime}-${candidate.endTime}) удалено.`,
          actionType: 'delete'
        };
      } else {
        return {
          text: `⚠️ Не удалось найти предмет для удаления.`,
          actionType: 'error'
        };
      }
    }

    // 2. RESCHEDULE / UPDATE ACTION: "Перенеси [subject] в [day] на [time]"
    if (lower.includes('перенеси') || lower.includes('поменяй') || lower.includes('сдвинь') || lower.includes('ko\'chir')) {
      const targetDay = parseDayOfWeek(prompt);
      
      const timeMatch = prompt.match(/(\d{1,2}:\d{2})/);
      const hourOnlyMatch = prompt.match(/на\s+(\d{1,2})(?::00)?/);
      
      let newStart = null;
      if (timeMatch) {
        newStart = timeMatch[1].length === 4 ? '0' + timeMatch[1] : timeMatch[1];
      } else if (hourOnlyMatch) {
        const hr = parseInt(hourOnlyMatch[1], 10);
        newStart = `${hr < 10 ? '0' : ''}${hr}:00`;
      }

      const candidate = lessons.find(l => {
        const titleMatch = lower.includes(l.title.toLowerCase()) || 
                           (l.title.toLowerCase().includes('англ') && lower.includes('англ')) ||
                           (l.title.toLowerCase().includes('физик') && lower.includes('физик')) ||
                           (l.title.toLowerCase().includes('алгебр') && lower.includes('алгебр')) ||
                           (l.title.toLowerCase().includes('информ') && lower.includes('информ'));
        const dayMatch = targetDay ? Number(l.dayOfWeek) === Number(targetDay) : true;
        return titleMatch && dayMatch;
      });

      if (candidate && newStart) {
        const oldStartMin = timeToMinutes(candidate.startTime);
        const oldEndMin = timeToMinutes(candidate.endTime);
        const duration = oldEndMin - oldStartMin > 0 ? oldEndMin - oldStartMin : 45;
        
        const newStartMin = timeToMinutes(newStart);
        const newEndMin = newStartMin + duration;

        const endHours = Math.floor(newEndMin / 60);
        const endMins = newEndMin % 60;
        const newEnd = `${endHours < 10 ? '0' : ''}${endHours}:${endMins < 10 ? '0' : ''}${endMins}`;

        onUpdateActivity(candidate.id, {
          startTime: newStart,
          endTime: newEnd
        });

        const dayName = DAYS_OF_WEEK.find(d => d.id === candidate.dayOfWeek)?.name || '';
        return {
          text: `✅ "${candidate.title}" (${dayName}) перенесён на ${newStart} – ${newEnd}.`,
          actionType: 'update'
        };
      } else {
        return {
          text: `⚠️ Укажите предмет и время (напр: "Перенеси английский в четверг на 15:00").`,
          actionType: 'error'
        };
      }
    }

    // 3. ADD ACTION: "Добавь [subject] в [day] в [time]"
    if (lower.includes('добавь') || lower.includes('запиши') || lower.includes('qosh')) {
      const targetDay = parseDayOfWeek(prompt) || 3;
      const timeMatch = prompt.match(/(\d{1,2}:\d{2})/);
      const hourOnlyMatch = prompt.match(/в\s+(\d{1,2})(?::00)?/);
      
      let startTime = '17:00';
      if (timeMatch) {
        startTime = timeMatch[1].length === 4 ? '0' + timeMatch[1] : timeMatch[1];
      } else if (hourOnlyMatch) {
        const hr = parseInt(hourOnlyMatch[1], 10);
        startTime = `${hr < 10 ? '0' : ''}${hr}:00`;
      }

      let title = 'Доп. Занятие';
      if (lower.includes('теннис')) title = 'Теннис';
      else if (lower.includes('плавание')) title = 'Бассейн';
      else if (lower.includes('английский') || lower.includes('ielts')) title = 'Курсы IELTS';
      else if (lower.includes('репетитор')) title = 'Репетитор';

      const startMin = timeToMinutes(startTime);
      const endMin = startMin + 60;
      const endHours = Math.floor(endMin / 60);
      const endMins = endMin % 60;
      const endTime = `${endHours < 10 ? '0' : ''}${endHours}:${endMins < 10 ? '0' : ''}${endMins}`;

      const newActivity = {
        id: 'ai-add-' + Date.now(),
        title: title,
        type: 'personal',
        dayOfWeek: targetDay,
        startTime: startTime,
        endTime: endTime,
        location: 'Личное',
        teacher: '',
        periodicity: 'weekly'
      };

      onAddActivity(newActivity);
      const dayName = DAYS_OF_WEEK.find(d => d.id === targetDay)?.name || '';
      return {
        text: `✅ Добавлено: "${title}" (${dayName}, ${startTime} – ${endTime}).`,
        actionType: 'add'
      };
    }

    return {
      text: `🤖 Вы можете ввести команду:\n• "Отмени физику в пятницу"\n• "Перенеси английский в четверг на 15:00"\n• "Добавь теннис в среду в 17:00"`,
      actionType: 'info'
    };
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim() || isProcessing) return;

    const userMessage = { id: Date.now(), sender: 'user', text: query };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      if (apiKey.trim()) {
        const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Управление расписанием 10-Б. Уроки: ${JSON.stringify(lessons)}. Команда: "${query}". Выполни изменение и ответь лаконично.`
        });

        const replyText = response.text || 'Готово!';
        const localResult = processLocalNLP(query);

        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'assistant',
            text: replyText.length > 5 ? replyText : localResult.text
          }
        ]);
      } else {
        await new Promise(r => setTimeout(r, 300));
        const result = processLocalNLP(query);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'assistant',
            text: result.text
          }
        ]);
      }
    } catch (err) {
      const result = processLocalNLP(query);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: result.text
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[460px] text-xs text-slate-900"
      >
        {/* Header with Gemini Logo */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-800" />
            <h3 className="font-bold text-slate-900">Gemini Assistant</h3>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              title="API Key"
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* API Key Drawer */}
        {showKeyInput && (
          <form onSubmit={handleSaveKey} className="p-2.5 bg-slate-50 border-b border-slate-200 space-y-1.5">
            <div className="font-medium text-slate-700">API Key Gemini (опционально):</div>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-900 focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-slate-900 text-white rounded font-medium"
              >
                ОК
              </button>
            </div>
          </form>
        )}

        {/* Messages Body */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-white">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] p-2.5 rounded-lg whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white'
                    : msg.sender === 'system'
                    ? 'bg-slate-100 border border-slate-200 text-slate-800'
                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 animate-spin text-slate-700" /> Идет обработка...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Preset Prompt Chips */}
        <div className="px-2.5 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center gap-1 overflow-x-auto text-[10px]">
          <button
            onClick={() => handleSendMessage("Отмени физику в пятницу")}
            className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 shrink-0 transition-colors"
          >
            Отмени физику
          </button>
          <button
            onClick={() => handleSendMessage("Перенеси английский в четверг на 15:00")}
            className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 shrink-0 transition-colors"
          >
            Перенеси английский на 15:00
          </button>
          <button
            onClick={() => handleSendMessage("Добавь теннис в среду в 17:00")}
            className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 shrink-0 transition-colors"
          >
            Добавь теннис
          </button>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-2 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Введите команду..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
