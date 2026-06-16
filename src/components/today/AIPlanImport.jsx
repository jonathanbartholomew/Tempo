import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, X, Download } from 'lucide-react';
import { parsePlanText } from '../../utils/aiPlan';
import { getTodayString } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AIPlanImport({ jobs, tasks, meetings, googleEvents, date, onAddTask, onAddMeeting, onAiPlanImported }) {
  const { auth } = useAuth();
  const [open, setOpen] = useState(false);
  const [planDate, setPlanDate] = useState(date || getTodayString());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingJson, setPendingJson] = useState(null);
  const [imported, setImported] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (date) setPlanDate(date); }, [date]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function extractJson(text) {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    return match ? match[1].trim() : null;
  }

  async function startConversation(dateToUse) {
    setMessages([]);
    setPendingJson(null);
    setImported(false);
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ai-plan/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello, I want to plan my day.' }],
          context: { jobs, tasks, meetings, googleEvents, date: dateToUse },
        }),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error(`Server returned: ${text.slice(0, 300)}`); }
      if (!res.ok) throw new Error(data.error || 'Failed to connect');

      const assistantMsg = { role: 'assistant', content: data.content };
      setMessages([assistantMsg]);

      const json = extractJson(data.content);
      if (json) setPendingJson(json);
      if (data.remaining != null) setRemaining(data.remaining);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    if (messages.length === 0) startConversation(planDate);
  }

  function handleClose() {
    setOpen(false);
    setError('');
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/ai-plan/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({
          messages: updatedMessages,
          context: { jobs, tasks, meetings, googleEvents, date: planDate },
        }),
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error(`Server returned: ${text.slice(0, 300)}`); }
      if (!res.ok) throw new Error(data.error || 'Failed to get response');

      const assistantMsg = { role: 'assistant', content: data.content };
      setMessages((prev) => [...prev, assistantMsg]);

      const json = extractJson(data.content);
      if (json) setPendingJson(json);
      if (data.remaining != null) setRemaining(data.remaining);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleImport() {
    if (!pendingJson) return;
    try {
      const { tasks: newTasks, meetings: newMeetings } = parsePlanText(pendingJson, jobs, planDate);
      newTasks.forEach((t) => onAddTask(t));
      if (onAddMeeting) newMeetings.forEach((m) => onAddMeeting(m));
      if (onAiPlanImported) onAiPlanImported();
      setImported(true);
      setPendingJson(null);
    } catch (err) {
      setError(err.message);
    }
  }

  function renderMessage(content) {
    return content.replace(/```(?:json)?[\s\S]*?```/gi, '').trim();
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <Sparkles size={16} className="text-blue-400" />
        AI Day Planner
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col" style={{ height: '420px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-blue-400" />
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">AI Day Planner</span>
          <input
            type="date"
            value={planDate}
            onChange={(e) => {
              setPlanDate(e.target.value);
              startConversation(e.target.value);
            }}
            className="ml-2 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-3">
          {remaining != null && (
            <span className="text-xs text-gray-400">{remaining} requests left today</span>
          )}
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
              }`}
            >
              {renderMessage(msg.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-3 py-2">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {pendingJson && !imported && (
          <div className="flex justify-start">
            <button
              onClick={handleImport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              <Download size={14} />
              Import plan into today
            </button>
          </div>
        )}

        {imported && (
          <p className="text-xs text-green-500 font-medium text-center">Plan imported successfully!</p>
        )}

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Tell Claude what you need to get done…"
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
