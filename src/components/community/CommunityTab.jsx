import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Zap, Send, Trash2, ChevronDown, ChevronUp, Users, Pencil, Check, X, Smile } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Skeleton from '../ui/Skeleton';

const IMAGE_URL_RE = /https?:\/\/\S+\.(?:gif|webp|png|jpg|jpeg)(?:\?\S*)?/gi;
const GIPHY_RE = /https?:\/\/(?:media\d*\.)?giphy\.com\/\S+/gi;
const TENOR_RE = /https?:\/\/(?:c\.)?tenor\.com\/\S+/gi;
const URL_RE = /https?:\/\/\S+/gi;

function isImageUrl(url) {
  return IMAGE_URL_RE.test(url) || GIPHY_RE.test(url) || TENOR_RE.test(url);
}

// Splits text into segments: { type: 'text'|'image'|'link', value }
function parseContent(text) {
  // Reset lastIndex since we reuse regexes with /g
  const tokenRe = /https?:\/\/\S+/gi;
  const segments = [];
  let last = 0;
  let match;
  while ((match = tokenRe.exec(text)) !== null) {
    if (match.index > last) segments.push({ type: 'text', value: text.slice(last, match.index) });
    const url = match[0];
    // Strip trailing punctuation that's likely not part of the URL
    const clean = url.replace(/[.,;:!?)]+$/, '');
    if (/\.(gif|webp|png|jpg|jpeg)(\?|$)/i.test(clean) || /giphy\.com/i.test(clean) || /tenor\.com/i.test(clean)) {
      segments.push({ type: 'image', value: clean });
    } else {
      segments.push({ type: 'link', value: clean });
    }
    last = match.index + url.length;
  }
  if (last < text.length) segments.push({ type: 'text', value: text.slice(last) });
  return segments;
}

function RichContent({ text }) {
  const segments = parseContent(text);
  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.type === 'image') {
          return (
            <span key={i} className="block mt-2">
              <img
                src={seg.value}
                alt="gif"
                className="max-w-xs rounded-xl border border-gray-200 dark:border-gray-700"
                style={{ maxHeight: 280 }}
                loading="lazy"
              />
            </span>
          );
        }
        if (seg.type === 'link') {
          return (
            <a key={i} href={seg.value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">
              {seg.value}
            </a>
          );
        }
        return <span key={i} className="whitespace-pre-wrap">{seg.value}</span>;
      })}
    </span>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const EVENT_META = {
  achievement_unlocked: { icon: '🏆', color: 'text-amber-500' },
  goal_completed:       { icon: '🎯', color: 'text-green-500' },
  streak_milestone:     { icon: '🔥', color: 'text-orange-500' },
  level_up:             { icon: '⬆️', color: 'text-blue-500' },
};

function FeedCard({ event }) {
  const meta = EVENT_META[event.event_type] || { icon: '🎉', color: 'text-gray-400' };
  return (
    <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg flex-shrink-0">
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{event.title}</p>
        {event.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{event.description}</p>}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {event.user_name && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{event.user_name}</span>}
          {event.team_name && <span className="text-xs text-indigo-500 dark:text-indigo-400">{event.team_name}</span>}
          <span className="text-xs text-gray-400 dark:text-gray-600">{timeAgo(event.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👀'];

function ReactionBar({ reactions, onToggle }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => onToggle(r.emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
            r.reacted
              ? 'bg-blue-50 border-blue-300 dark:bg-blue-500/10 dark:border-blue-500/40 text-blue-600 dark:text-blue-400 font-medium'
              : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <span>{r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className="flex items-center justify-center w-7 h-[22px] rounded-full text-xs border border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          title="Add reaction"
        >
          <Smile size={12} />
        </button>
        {pickerOpen && (
          <div className="absolute bottom-full mb-1.5 left-0 flex items-center gap-0.5 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-20">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { onToggle(emoji); setPickerOpen(false); }}
                className="text-base p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-125 transition-all"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButtons({ canEdit, canDelete, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
      {canEdit && (
        <button onClick={onEdit} className="p-1 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors" title="Edit">
          <Pencil size={12} />
        </button>
      )}
      {canDelete && (
        <button onClick={onDelete} className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Delete">
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

function EditBox({ initial, onSave, onCancel, rows = 3, textSize = 'text-sm' }) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!value.trim() || value.trim() === initial.trim()) { onCancel(); return; }
    setSaving(true);
    await onSave(value.trim());
    setSaving(false);
  }

  return (
    <div className="space-y-1.5 mt-1.5">
      <textarea
        autoFocus
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave(); }}
        className={`w-full px-3 py-2 rounded-xl border border-blue-400 dark:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-100 ${textSize} focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
      />
      <div className="flex items-center gap-2">
        <button onClick={handleSave} disabled={saving || !value.trim()} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold transition-colors">
          <Check size={11} /> Save
        </button>
        <button onClick={onCancel} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <X size={11} /> Cancel
        </button>
        <span className="text-[10px] text-gray-400 dark:text-gray-600">⌘↵ to save</span>
      </div>
    </div>
  );
}

function PostCard({ post: initialPost, org, orgActions, currentUserId, isAdmin, onDeleted, onUpdated }) {
  const [post, setPost] = useState(initialPost);
  const [reactions, setReactions] = useState(initialPost.reactions || []);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyCount, setReplyCount] = useState(Number(initialPost.reply_count));
  const [editingPost, setEditingPost] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);

  // Sync if parent refreshes the post (polling)
  useEffect(() => { setPost(initialPost); }, [initialPost.content, initialPost.updated_at]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setReactions(initialPost.reactions || []); }, [JSON.stringify(initialPost.reactions)]);

  const isEdited = post.updated_at && post.updated_at !== post.created_at;

  async function loadReplies() {
    if (replies !== null) { setShowReplies((v) => !v); return; }
    setShowReplies(true);
    try {
      const data = await orgActions.getPostReplies(org.id, post.id);
      setReplies(data);
    } catch { setReplies([]); }
  }

  async function toggleReaction(emoji) {
    // Optimistic update
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        const updated = { ...existing, count: existing.count - 1, reacted: false };
        return updated.count === 0 ? prev.filter((r) => r.emoji !== emoji) : prev.map((r) => r.emoji === emoji ? updated : r);
      }
      return [...prev, { emoji, count: 1, reacted: true }];
    });
    try {
      const fresh = await orgActions.togglePostReaction(org.id, post.id, emoji);
      setReactions(fresh);
    } catch { /* revert by re-fetching would be ideal; silently leave optimistic state */ }
  }

  async function savePostEdit(content) {
    await orgActions.updateOrgPost(org.id, post.id, content);
    const updated = { ...post, content, updated_at: new Date().toISOString() };
    setPost(updated);
    onUpdated?.(updated);
    setEditingPost(false);
  }

  async function submitReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const reply = await orgActions.createPostReply(org.id, post.id, replyText.trim());
      setReplies((prev) => [...(prev || []), reply]);
      setReplyCount((n) => n + 1);
      setReplyText('');
    } catch { /* silent */ }
    finally { setSubmittingReply(false); }
  }

  async function saveReplyEdit(replyId, content) {
    await orgActions.updatePostReply(org.id, post.id, replyId, content);
    setReplies((prev) => prev.map((r) => r.id === replyId ? { ...r, content, updated_at: new Date().toISOString() } : r));
    setEditingReplyId(null);
  }

  async function deleteReply(replyId) {
    try {
      await orgActions.deletePostReply(org.id, post.id, replyId);
      setReplies((prev) => prev.filter((r) => r.id !== replyId));
      setReplyCount((n) => Math.max(0, n - 1));
    } catch { /* silent */ }
  }

  async function deletePost() {
    try {
      await orgActions.deleteOrgPost(org.id, post.id);
      onDeleted(post.id);
    } catch { /* silent */ }
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Post header + body */}
      <div className="px-5 py-4">
        <div className="flex items-start gap-3 group">
          <Avatar name={post.name} picture={post.picture} className="w-9 h-9 text-sm flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{post.name || 'Unknown'}</span>
                <span className="text-xs text-gray-400 dark:text-gray-600 flex-shrink-0">{timeAgo(post.created_at)}</span>
                {isEdited && <span className="text-[10px] text-gray-400 dark:text-gray-600 flex-shrink-0">(edited)</span>}
              </div>
              <ActionButtons
                canEdit={post.user_id === currentUserId}
                canDelete={post.user_id === currentUserId || isAdmin}
                onEdit={() => setEditingPost(true)}
                onDelete={deletePost}
              />
            </div>
            {editingPost
              ? <EditBox initial={post.content} onSave={savePostEdit} onCancel={() => setEditingPost(false)} />
              : <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5"><RichContent text={post.content} /></p>
            }
            <ReactionBar reactions={reactions} onToggle={toggleReaction} />
          </div>
        </div>
      </div>

      {/* Reply toggle */}
      <div className="border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={loadReplies}
          className="flex items-center gap-1.5 px-5 py-2.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors w-full"
        >
          <MessageSquare size={13} />
          {replyCount > 0 ? `${replyCount} repl${replyCount === 1 ? 'y' : 'ies'}` : 'Reply'}
          {replyCount > 0 && (showReplies ? <ChevronUp size={13} className="ml-auto" /> : <ChevronDown size={13} className="ml-auto" />)}
        </button>

        {showReplies && (
          <div className="border-t border-gray-100 dark:border-gray-800">
            {replies === null && (
              <div className="px-5 py-3 space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {replies?.map((r) => {
              const replyEdited = r.updated_at && r.updated_at !== r.created_at;
              return (
                <div key={r.id} className="flex items-start gap-3 px-5 py-3 border-b border-gray-50 dark:border-gray-800/50 last:border-0 group">
                  <Avatar name={r.name} picture={r.picture} className="w-7 h-7 text-xs flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{r.name}</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(r.created_at)}</span>
                        {replyEdited && <span className="text-[10px] text-gray-400">(edited)</span>}
                      </div>
                      <ActionButtons
                        canEdit={r.user_id === currentUserId}
                        canDelete={r.user_id === currentUserId || isAdmin}
                        onEdit={() => setEditingReplyId(r.id)}
                        onDelete={() => deleteReply(r.id)}
                      />
                    </div>
                    {editingReplyId === r.id
                      ? <EditBox initial={r.content} rows={2} textSize="text-xs" onSave={(c) => saveReplyEdit(r.id, c)} onCancel={() => setEditingReplyId(null)} />
                      : <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5"><RichContent text={r.content} /></p>
                    }
                    <ReactionBar
                      reactions={r.reactions || []}
                      onToggle={async (emoji) => {
                        // Optimistic update
                        setReplies((prev) => prev.map((rr) => {
                          if (rr.id !== r.id) return rr;
                          const existing = (rr.reactions || []).find((x) => x.emoji === emoji);
                          let updated;
                          if (existing) {
                            const next = { ...existing, count: existing.count - 1, reacted: false };
                            updated = next.count === 0
                              ? (rr.reactions || []).filter((x) => x.emoji !== emoji)
                              : (rr.reactions || []).map((x) => x.emoji === emoji ? next : x);
                          } else {
                            updated = [...(rr.reactions || []), { emoji, count: 1, reacted: true }];
                          }
                          return { ...rr, reactions: updated };
                        }));
                        try {
                          const fresh = await orgActions.toggleReplyReaction(org.id, post.id, r.id, emoji);
                          setReplies((prev) => prev.map((rr) => rr.id === r.id ? { ...rr, reactions: fresh } : rr));
                        } catch { /* leave optimistic state */ }
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Reply input */}
            <form onSubmit={submitReply} className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/40">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={submittingReply || !replyText.trim()}
                className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors flex-shrink-0"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunityTab({ org, orgActions, auth }) {
  const [view, setView] = useState('feed');
  const [feed, setFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postText, setPostText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const postInputRef = useRef(null);

  const currentUserId = auth?.user?.id;
  const isAdmin = !!org?.is_admin;

  useEffect(() => {
    if (!org?.id) return;
    if (view === 'feed') {
      setFeedLoading(true);
      orgActions.getOrgCelebrations(org.id).then(setFeed).catch(() => setFeed([])).finally(() => setFeedLoading(false));
    } else {
      setPostsLoading(true);
      orgActions.getOrgPosts(org.id).then(setPosts).catch(() => setPosts([])).finally(() => setPostsLoading(false));

      const interval = setInterval(() => {
        orgActions.getOrgPosts(org.id).then((fresh) => {
          setPosts((prev) => {
            const byId = Object.fromEntries(fresh.map((p) => [p.id, p]));
            // Update existing posts with fresh content/updated_at; prepend truly new posts
            const merged = prev.map((p) => byId[p.id] ? { ...p, ...byId[p.id] } : p);
            const prevIds = new Set(prev.map((p) => p.id));
            const newPosts = fresh.filter((p) => !prevIds.has(p.id));
            return [...newPosts, ...merged];
          });
        }).catch(() => {});
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [org?.id, view]);

  async function submitPost(e) {
    e.preventDefault();
    if (!postText.trim()) return;
    setSubmitting(true);
    try {
      const post = await orgActions.createOrgPost(org.id, postText.trim());
      setPosts((prev) => [post, ...prev]);
      setPostText('');
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  }

  if (!org) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Users size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
        <p className="text-gray-800 dark:text-gray-200 font-semibold">No organization yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Join or create an organization to see the community feed and message board.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Community</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{org.name}</p>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 p-1 rounded-2xl bg-gray-100 dark:bg-gray-800">
        {[
          { id: 'feed',  label: 'Activity Feed', icon: Zap },
          { id: 'board', label: 'Message Board', icon: MessageSquare },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors ${
              view === id
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      {view === 'feed' && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          {feedLoading && (
            <div className="px-5 py-4 space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className={`h-3.5 ${i % 2 === 0 ? 'w-48' : 'w-36'}`} />
                    <Skeleton className={`h-3 ${i % 3 === 0 ? 'w-full' : 'w-3/4'}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!feedLoading && feed.length === 0 && (
            <div className="px-5 py-12 text-center">
              <Zap size={28} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No activity yet. Complete tasks and achievements to see events here.</p>
            </div>
          )}
          {!feedLoading && feed.map((event) => <FeedCard key={event.id} event={event} />)}
        </div>
      )}

      {/* Message Board */}
      {view === 'board' && (
        <div className="space-y-4">
          {/* Compose */}
          <form onSubmit={submitPost} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <textarea
              ref={postInputRef}
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder={`Share something with ${org.name}…`}
              rows={3}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitPost(e); }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400 dark:text-gray-600">⌘↵ to post</span>
              <button
                type="submit"
                disabled={submitting || !postText.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
              >
                <Send size={14} />
                Post
              </button>
            </div>
          </form>

          {/* Posts */}
          {postsLoading && (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-4/5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!postsLoading && posts.length === 0 && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-12 text-center">
              <MessageSquare size={28} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No posts yet. Be the first to share something!</p>
            </div>
          )}
          {!postsLoading && posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              org={org}
              orgActions={orgActions}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
              onUpdated={(updated) => setPosts((prev) => prev.map((p) => p.id === updated.id ? { ...p, ...updated } : p))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
