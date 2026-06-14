import { useEffect, useRef, useState } from 'react';
import { Sparkles, Copy, Check, Upload, X } from 'lucide-react';
import { buildPromptTemplate, parsePlanText } from '../../utils/aiPlan';
import { getTodayString } from '../../utils/helpers';

export default function AIPlanImport({ jobs, tasks, meetings, googleEvents, date, onAddTask, onAddMeeting }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [planDate, setPlanDate] = useState(date || getTodayString());

  useEffect(() => {
    if (date) setPlanDate(date);
  }, [date]);
  const [planText, setPlanText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  function handleCopyPrompt() {
    const prompt = buildPromptTemplate({ jobs, tasks, meetings, googleEvents, date: planDate });
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPlanText(String(reader.result || ''));
    reader.readAsText(file);
  }

  function handleImport() {
    setError('');
    setSuccess('');
    try {
      const { tasks: newTasks, meetings: newMeetings } = parsePlanText(planText, jobs, planDate);
      newTasks.forEach((t) => onAddTask(t));
      newMeetings.forEach((m) => onAddMeeting(m));
      setSuccess(`Imported ${newTasks.length} task${newTasks.length === 1 ? '' : 's'} and ${newMeetings.length} meeting${newMeetings.length === 1 ? '' : 's'}.`);
      setPlanText('');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <Sparkles size={16} className="text-purple-500" />
        AI Day Planner
      </button>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-gray-100">
          <Sparkles size={16} className="text-purple-500" />
          AI Day Planner
        </h3>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <label htmlFor="ai-plan-date">Plan for:</label>
        <input
          id="ai-plan-date"
          type="date"
          value={planDate}
          onChange={(e) => setPlanDate(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <p>1. Copy this prompt and paste it into a chat with Claude. Tell Claude what you need to get done on that day.</p>
        <button
          onClick={handleCopyPrompt}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy prompt'}
        </button>

        <p>2. When Claude gives you the JSON plan, paste it below (or upload it as a file) and import it.</p>
      </div>

      <textarea
        value={planText}
        onChange={(e) => setPlanText(e.target.value)}
        placeholder="Paste Claude's JSON plan here..."
        rows={6}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={handleImport}
          className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Import Plan
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Upload size={16} />
          Upload file
        </button>
        <input ref={fileInputRef} type="file" accept=".json,.txt,.md" onChange={handleFileUpload} className="hidden" />
      </div>
    </div>
  );
}
