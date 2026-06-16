import { ExternalLink, ChevronRight, Loader2 } from 'lucide-react';

const STATUS_COLORS = {
  'new':           'bg-gray-500/20 text-gray-500 dark:text-gray-400',
  'indeterminate': 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  'done':          'bg-green-500/20 text-green-600 dark:text-green-400',
};

const PRIORITY_DOTS = {
  Highest: 'bg-red-500',
  High:    'bg-orange-500',
  Medium:  'bg-yellow-500',
  Low:     'bg-blue-400',
  Lowest:  'bg-gray-400',
};

export default function JiraCard({ issues, issuesLoading, siteName, onGoToJira }) {
  const preview = issues.slice(0, 5);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm dark:shadow-none p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.485V1.005A1.001 1.001 0 0 0 23.013 0z" />
          </svg>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Jira</span>
          {siteName && <span className="text-xs text-gray-400 dark:text-gray-500">· {siteName}</span>}
        </div>
        <button onClick={onGoToJira} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
          View all <ChevronRight size={12} />
        </button>
      </div>

      {issuesLoading ? (
        <div className="flex items-center gap-2 py-4 text-gray-400 dark:text-gray-500 text-sm">
          <Loader2 size={14} className="animate-spin" /> Loading issues…
        </div>
      ) : preview.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-2">No open issues assigned to you.</p>
      ) : (
        <ul className="space-y-2">
          {preview.map((issue) => (
            <li key={issue.key}>
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${PRIORITY_DOTS[issue.priority] || 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono flex-shrink-0">{issue.key}</span>
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-tight truncate flex-1"
                    >
                      {issue.summary}
                    </a>
                    <ExternalLink size={11} className="flex-shrink-0 text-gray-300 dark:text-gray-600 mt-0.5 transition-colors" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[issue.statusCategory] || STATUS_COLORS.new}`}>
                      {issue.status}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-600">{issue.project}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
