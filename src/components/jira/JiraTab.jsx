import { useState } from 'react';
import { ExternalLink, RefreshCw, ChevronDown, Loader2, Circle, List, Columns, Play } from 'lucide-react';
import Skeleton from '../ui/Skeleton';

const PRIORITY_CONFIG = {
  Highest: { label: 'Highest', dot: 'bg-red-500', ring: 'ring-red-500/30' },
  High:    { label: 'High',    dot: 'bg-orange-500', ring: 'ring-orange-500/30' },
  Medium:  { label: 'Medium',  dot: 'bg-yellow-500', ring: 'ring-yellow-500/30' },
  Low:     { label: 'Low',     dot: 'bg-blue-400', ring: 'ring-blue-400/30' },
  Lowest:  { label: 'Lowest',  dot: 'bg-gray-500', ring: 'ring-gray-500/30' },
};

const CATEGORY_META = {
  new:           { accent: 'bg-gray-500',  header: 'border-t-gray-500',  badge: 'bg-gray-500/20 text-gray-400' },
  indeterminate: { accent: 'bg-blue-500',  header: 'border-t-blue-500',  badge: 'bg-blue-500/20 text-blue-400' },
  done:          { accent: 'bg-green-500', header: 'border-t-green-500', badge: 'bg-green-500/20 text-green-400' },
};

const CATEGORY_ORDER = ['new', 'indeterminate', 'done'];

// Deterministic project → color mapping
const PROJECT_COLORS = [
  'bg-cyan-500/20 text-cyan-300 border-cyan-500/25',
  'bg-purple-500/20 text-purple-300 border-purple-500/25',
  'bg-pink-500/20 text-pink-300 border-pink-500/25',
  'bg-amber-500/20 text-amber-300 border-amber-500/25',
  'bg-teal-500/20 text-teal-300 border-teal-500/25',
  'bg-indigo-500/20 text-indigo-300 border-indigo-500/25',
];

function projectColor(name) {
  if (!name) return PROJECT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PROJECT_COLORS[hash % PROJECT_COLORS.length];
}

function formatSeconds(secs) {
  if (!secs) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

// ─── List row ────────────────────────────────────────────────────────────────

function IssueRow({ issue, onTransition, getTransitions, onStartTimer }) {
  const [transitioning, setTransitioning] = useState(false);
  const [transitions, setTransitions] = useState(null);
  const [transitionOpen, setTransitionOpen] = useState(false);

  const priority = PRIORITY_CONFIG[issue.priority] || { dot: 'bg-gray-400' };
  const cat = CATEGORY_META[issue.statusCategory] || CATEGORY_META.new;

  async function openTransitions() {
    if (transitions) { setTransitionOpen((o) => !o); return; }
    setTransitioning(true);
    try { const list = await getTransitions(issue.key); setTransitions(list); setTransitionOpen(true); }
    finally { setTransitioning(false); }
  }

  const timeSpent = formatSeconds(issue.timeSpentSeconds);
  const estimate  = formatSeconds(issue.originalEstimateSeconds);

  return (
    <div className="group rounded-xl border border-white/8 bg-white/4 hover:bg-white/7 p-4 transition-colors">
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 flex-shrink-0 w-2.5 h-2.5 rounded-full ${priority.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-500 font-mono flex-shrink-0 mt-0.5">{issue.key}</span>
            <a href={issue.url} target="_blank" rel="noopener noreferrer"
              className="text-sm font-medium text-gray-100 hover:text-blue-400 transition-colors flex-1 leading-snug">
              {issue.summary}
            </a>
            <button
              onClick={() => onStartTimer({ description: `${issue.key}: ${issue.summary}`, category: 'ticket', jiraKey: issue.key })}
              title="Track time on this ticket"
              className="flex-shrink-0 p-1 rounded text-gray-600 hover:text-green-500 hover:bg-green-500/10 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Play size={13} />
            </button>
            <ExternalLink size={13} className="flex-shrink-0 text-gray-600 group-hover:text-gray-400 mt-0.5 transition-colors" />
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <button onClick={openTransitions}
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border transition-colors ${cat.badge} border-white/10`}>
              {transitioning ? <Loader2 size={10} className="animate-spin" /> : issue.status}
              <ChevronDown size={10} />
            </button>

            {transitionOpen && transitions && (
              <div className="flex gap-1 flex-wrap">
                {transitions.map((t) => (
                  <button key={t.id} onClick={() => { setTransitionOpen(false); onTransition(issue.key, t.id); }}
                    className="text-[11px] px-2 py-0.5 rounded border border-white/15 bg-white/8 hover:bg-white/15 text-gray-300 transition-colors">
                    {t.name}
                  </button>
                ))}
              </div>
            )}

            {issue.project && (
              <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${projectColor(issue.project)}`}>{issue.project}</span>
            )}

            {(timeSpent || estimate) && (
              <span className="text-xs text-gray-600 flex items-center gap-1">
                {timeSpent ? `${timeSpent} logged` : '0h logged'}
                {estimate && ` / ${estimate} est`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Kanban card ─────────────────────────────────────────────────────────────

function KanbanCard({ issue, onTransition, getTransitions, onStartTimer }) {
  const [transitions, setTransitions] = useState(null);
  const [transitionOpen, setTransitionOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const priority = PRIORITY_CONFIG[issue.priority] || { dot: 'bg-gray-400', label: '' };
  const timeSpent = formatSeconds(issue.timeSpentSeconds);
  const estimate  = formatSeconds(issue.originalEstimateSeconds);

  async function openTransitions() {
    if (transitions) { setTransitionOpen((o) => !o); return; }
    setTransitioning(true);
    try { const list = await getTransitions(issue.key); setTransitions(list); setTransitionOpen(true); }
    finally { setTransitioning(false); }
  }

  return (
    <div className="group rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/6 hover:border-gray-300 dark:hover:border-white/18 hover:bg-gray-50 dark:hover:bg-white/9 shadow-sm dark:shadow-none transition-all cursor-default">
      {/* Card body */}
      <div className="p-3 space-y-2.5">
        {/* Project badge */}
        {issue.project && (
          <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide ${projectColor(issue.project)}`}>
            {issue.project}
          </span>
        )}

        {/* Summary */}
        <a href={issue.url} target="_blank" rel="noopener noreferrer"
          className="block text-sm font-medium text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-snug">
          {issue.summary}
        </a>

        {/* Time row */}
        {(timeSpent || estimate) && (
          <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
            {estimate && <span>{estimate} est</span>}
            {timeSpent && <span className="text-gray-500 dark:text-gray-400">{timeSpent} logged</span>}
          </div>
        )}

        {/* Transition selector */}
        {transitionOpen && transitions && (
          <div className="flex flex-col gap-1 pt-1 border-t border-gray-100 dark:border-white/8">
            {transitions.map((t) => (
              <button key={t.id}
                onClick={() => { setTransitionOpen(false); onTransition(issue.key, t.id); }}
                className="text-[11px] px-2 py-1 rounded border border-gray-200 dark:border-white/12 bg-gray-50 dark:bg-white/6 hover:bg-gray-100 dark:hover:bg-white/12 text-gray-600 dark:text-gray-300 transition-colors text-left">
                → {t.name}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Card footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-white/6">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priority.dot}`} title={priority.label} />
          <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">{issue.key}</span>
          <a href={issue.url} target="_blank" rel="noopener noreferrer"
            className="text-gray-300 dark:text-gray-700 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">
            <ExternalLink size={10} />
          </a>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onStartTimer({ description: `${issue.key}: ${issue.summary}`, category: 'ticket', jiraKey: issue.key })}
            title="Track time"
            className="p-1.5 rounded text-gray-400 dark:text-gray-500 hover:text-green-500 hover:bg-green-500/10 transition-colors"
          >
            <Play size={11} />
          </button>
          <button onClick={openTransitions} title="Change status"
            className="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-white/8 transition-colors">
            {transitioning ? <Loader2 size={9} className="animate-spin" /> : <ChevronDown size={10} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Kanban column ────────────────────────────────────────────────────────────

function KanbanColumn({ column, issues, onTransition, getTransitions, onStartTimer }) {
  const cat = CATEGORY_META[column.category] || CATEGORY_META.new;

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className={`rounded-t-xl border-t-2 ${cat.header} bg-gray-100 dark:bg-white/4 border-x border-b border-gray-200 dark:border-white/8 px-3 py-2.5 flex items-center gap-2`}>
        <span className="text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider flex-1 truncate">
          {column.name}
        </span>
        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-white/8 rounded px-1.5 py-0.5 flex-shrink-0">
          {issues.length}
        </span>
      </div>

      {/* Cards area */}
      <div className="flex-1 bg-gray-50 dark:bg-white/[0.02] border-x border-b border-gray-200 dark:border-white/8 rounded-b-xl p-2 space-y-2 min-h-[120px]">
        {issues.length === 0 ? (
          <div className="flex items-center justify-center h-16">
            <p className="text-[11px] text-gray-400 dark:text-gray-700">No issues</p>
          </div>
        ) : (
          issues.map((issue) => (
            <KanbanCard key={issue.key} issue={issue}
              onTransition={onTransition} getTransitions={getTransitions} onStartTimer={onStartTimer} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Column builder ───────────────────────────────────────────────────────────

function buildColumns(issues) {
  const statusMap = new Map();
  for (const issue of issues) {
    if (!statusMap.has(issue.status)) {
      statusMap.set(issue.status, { name: issue.status, category: issue.statusCategory || 'new' });
    }
  }
  const columns = [...statusMap.values()].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category);
    const bi = CATEGORY_ORDER.indexOf(b.category);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  return columns.map((col) => ({ ...col, issues: issues.filter((i) => i.status === col.name) }));
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function JiraTab({ jira, onStartTimer }) {
  const { status, issues, issuesLoading, connect, getTransitions, transition, refetch } = jira;

  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('board');

  if (!status.connected) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <svg className="w-12 h-12 text-blue-400 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.485V1.005A1.001 1.001 0 0 0 23.013 0z" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-100 mb-2">Connect Jira</h2>
        <p className="text-gray-400 text-sm mb-6">Link your Atlassian account to see assigned tickets, track time, and update status.</p>
        <button onClick={connect} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors">
          Connect to Jira
        </button>
      </div>
    );
  }

  const projects = [...new Set(issues.map((i) => i.project).filter(Boolean))];
  const filtered  = filter === 'all' ? issues : issues.filter((i) => i.project === filter);
  const columns   = buildColumns(filtered);

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col h-full px-4 py-6 min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <svg className="w-7 h-7 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.485V1.005A1.001 1.001 0 0 0 23.013 0z" />
          </svg>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{status.siteName}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {issues.length} open {issues.length === 1 ? 'issue' : 'issues'} assigned to you
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-white/10 overflow-hidden">
            <button onClick={() => setView('list')} title="List view"
              className={`p-2 transition-colors ${view === 'list' ? 'bg-white/12 text-gray-100' : 'text-gray-500 hover:text-gray-300 hover:bg-white/6'}`}>
              <List size={15} />
            </button>
            <button onClick={() => setView('board')} title="Board view"
              className={`p-2 transition-colors ${view === 'board' ? 'bg-white/12 text-gray-100' : 'text-gray-500 hover:text-gray-300 hover:bg-white/6'}`}>
              <Columns size={15} />
            </button>
          </div>
          <button onClick={refetch} disabled={issuesLoading}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/8 transition-colors disabled:opacity-50">
            <RefreshCw size={15} className={issuesLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Project filter pills */}
      {projects.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap flex-shrink-0">
          <button onClick={() => setFilter('all')}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${filter === 'all' ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/15 text-gray-400 hover:text-gray-200'}`}>
            All
          </button>
          {projects.map((p) => (
            <button key={p} onClick={() => setFilter(p)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${filter === p ? 'bg-blue-600 border-blue-600 text-white' : 'border-white/15 text-gray-400 hover:text-gray-200'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {issuesLoading ? (
        view === 'list' ? (
          <div className="space-y-2 overflow-y-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/4 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-gray-700 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2 items-center">
                      <Skeleton className="h-3 w-14 bg-gray-700" />
                      <Skeleton className={`h-3 bg-gray-700 ${i % 3 === 0 ? 'w-64' : i % 3 === 1 ? 'w-48' : 'w-56'}`} />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-20 rounded-full bg-gray-700" />
                      <Skeleton className="h-5 w-16 rounded-full bg-gray-700" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 min-h-0 pb-2">
            <div className="flex gap-3 items-start min-w-max">
              {['To Do', 'In Progress', 'Done'].map((col) => (
                <div key={col} className="w-72 flex-shrink-0">
                  <div className="rounded-t-xl border-t-2 border-t-gray-600 bg-white/4 border-x border-b border-white/8 px-3 py-2.5 flex items-center gap-2">
                    <Skeleton className="h-3 w-20 bg-gray-700" />
                  </div>
                  <div className="bg-white/[0.02] border-x border-b border-white/8 rounded-b-xl p-2 space-y-2 min-h-[120px]">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="rounded-xl border border-white/8 bg-white/4 p-3 space-y-2.5">
                        <Skeleton className="h-4 w-16 rounded-full bg-gray-700" />
                        <Skeleton className={`h-3.5 bg-gray-700 ${i % 2 === 0 ? 'w-full' : 'w-4/5'}`} />
                        <Skeleton className="h-3 w-3/5 bg-gray-700" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Circle size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No open issues assigned to you.</p>
        </div>
      ) : view === 'list' ? (
        <div className="space-y-2 overflow-y-auto">
          {filtered.map((issue) => (
            <IssueRow key={issue.key} issue={issue}
              onTransition={transition} getTransitions={getTransitions} onStartTimer={onStartTimer} />
          ))}
        </div>
      ) : (
        /* Board — horizontal scroll, fixed-width columns */
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 pb-2">
          <div className="flex gap-3 items-start min-w-max">
            {columns.map((col) => (
              <KanbanColumn key={col.name} column={col} issues={col.issues}
                onTransition={transition} getTransitions={getTransitions} onStartTimer={onStartTimer} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
