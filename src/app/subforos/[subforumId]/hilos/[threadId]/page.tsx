'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Pin,
  Lock,
  Eye,
  MessageSquare,
  Bookmark,
  Bell,
  Flag,
  Paperclip,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Tag,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Author = {
  id: string;
  username: string;
  avatar: string | null;
  role: 'user' | 'verified' | 'moderator' | 'admin';
  emailVerified: boolean;
};

type ThreadDetail = {
  id: string;
  title: string;
  content: string;
  slug: string;
  status: 'active' | 'closed';
  pinned: boolean;
  tags: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: Author;
  subforum: {
    id: string;
    name: string;
    forum: { id: string; name: string; faculty: string | null };
  };
  stats: { votes: number; views: number; comments: number };
};

type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  voteCount: number;
  author: { id: string; username: string; avatar: string | null; role: string };
  quotedComment?: {
    id: string;
    content: string;
    author: { id: string; username: string };
  } | null;
};

type CommentsResponse = {
  comments: CommentItem[];
  page: number;
  total: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 30) return `hace ${diffDays} días`;
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('mock-token') : null;
}

// ─── RoleBadge ────────────────────────────────────────────────────────────────

function RoleBadge({ role, emailVerified }: { role: string; emailVerified?: boolean }) {
  if (role === 'admin')
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-violet-100 text-violet-700">
        Admin
      </span>
    );
  if (role === 'moderator')
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700">
        Mod
      </span>
    );
  if (role === 'verified' || emailVerified)
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">
        ✓
      </span>
    );
  return null;
}

// ─── VoteButtons ──────────────────────────────────────────────────────────────

function VoteButtons({
  count,
  userVote,
  onVote,
  disabled,
}: {
  count: number;
  userVote: 1 | -1 | null;
  onVote: (value: 1 | -1) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[2rem]">
      <button
        onClick={() => onVote(1)}
        disabled={disabled}
        aria-label="Upvote"
        className={cn(
          'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
          userVote === 1
            ? 'bg-green-100 text-green-600'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <span
        className={cn(
          'text-sm font-semibold tabular-nums',
          count > 0 && 'text-green-600',
          count < 0 && 'text-destructive',
          count === 0 && 'text-muted-foreground'
        )}
      >
        {count > 0 ? `+${count}` : count}
      </span>
      <button
        onClick={() => onVote(-1)}
        disabled={disabled}
        aria-label="Downvote"
        className={cn(
          'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
          userVote === -1
            ? 'bg-red-100 text-red-600'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function ThreadSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-7 bg-muted rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-5 bg-muted rounded-full w-24" />
        <div className="h-5 bg-muted rounded-full w-20" />
      </div>
      <div className="space-y-2 pt-4">
        {[1, 0.9, 1, 0.75, 0.85].map((w, i) => (
          <div key={i} className="h-4 bg-muted rounded" style={{ width: `${w * 100}%` }} />
        ))}
      </div>
    </div>
  );
}

function CommentSkeleton() {
  return (
    <div className="flex gap-4 px-4 py-4 border-b border-border last:border-0 animate-pulse">
      <div className="w-8 shrink-0 space-y-1.5">
        <div className="w-8 h-8 bg-muted rounded-md" />
        <div className="h-4 bg-muted rounded mx-1" />
        <div className="w-8 h-8 bg-muted rounded-md" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <div className="h-3.5 bg-muted rounded w-24" />
          <div className="h-3.5 bg-muted rounded w-16" />
        </div>
        <div className="h-3.5 bg-muted rounded w-full" />
        <div className="h-3.5 bg-muted rounded w-5/6" />
      </div>
    </div>
  );
}

// ─── CommentCard ──────────────────────────────────────────────────────────────

function CommentCard({
  comment,
  onQuote,
}: {
  comment: CommentItem;
  onQuote: (comment: CommentItem) => void;
}) {
  return (
    <div className="flex gap-3 px-4 py-4 border-b border-border last:border-0">
      {/* Vote buttons (visual — comment vote endpoint out of scope) */}
      <VoteButtons count={comment.voteCount} userVote={null} onVote={() => {}} disabled />

      {/* Body */}
      <div className="flex-1 min-w-0">
        {/* Author row */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 select-none">
            {comment.author.username[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium">@{comment.author.username}</span>
          <RoleBadge role={comment.author.role} />
          <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
          {comment.updatedAt !== comment.createdAt && (
            <span className="text-xs text-muted-foreground italic">(editado)</span>
          )}
        </div>

        {/* Quoted comment */}
        {comment.quotedComment && (
          <blockquote className="mb-3 border-l-4 border-primary/30 bg-muted/50 rounded-r-md px-3 py-2">
            <p className="text-xs text-muted-foreground mb-1">
              Citando a{' '}
              <span className="font-medium">@{comment.quotedComment.author.username}</span>…
            </p>
            <p className="text-sm text-muted-foreground italic line-clamp-3">
              {comment.quotedComment.content}
            </p>
          </blockquote>
        )}

        {/* Content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-2.5">
          <button
            onClick={() => onQuote(comment)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Quote className="w-3 h-3" />
            Citar
          </button>
          <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
            <Flag className="w-3 h-3" />
            Reportar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HiloPage() {
  const params = useParams();
  const subforumId = params.subforumId as string;
  const threadId = params.threadId as string;

  // Thread
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [threadLoading, setThreadLoading] = useState(true);
  const [threadError, setThreadError] = useState<string | null>(null);

  // Thread vote
  const [voteCount, setVoteCount] = useState(0);
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  // UI toggles
  const [saved, setSaved] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  // Comments
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  // New comment
  const [commentText, setCommentText] = useState('');
  const [quotedComment, setQuotedComment] = useState<CommentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // ── Load thread ────────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadThread() {
      try {
        const res = await fetch(`/api/threads/${threadId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Hilo no encontrado');
        setThread(data as ThreadDetail);
        setVoteCount((data as ThreadDetail).stats.votes);
      } catch (err) {
        setThreadError(err instanceof Error ? err.message : 'Error al cargar el hilo');
      } finally {
        setThreadLoading(false);
      }
    }
    loadThread();
  }, [threadId]);

  // ── Load comments ──────────────────────────────────────────────────────────

  const loadComments = useCallback(
    async (p: number) => {
      setCommentsLoading(true);
      setCommentsError(null);
      try {
        const res = await fetch(
          `/api/threads/${threadId}/comments?page=${p}&limit=${LIMIT}&sort=recent`
        );
        if (!res.ok) throw new Error('No se pudieron cargar los comentarios');
        const data: CommentsResponse = await res.json();
        setComments(data.comments);
        setTotal(data.total);
      } catch (err) {
        setCommentsError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setCommentsLoading(false);
      }
    },
    [threadId]
  );

  useEffect(() => {
    loadComments(page);
  }, [loadComments, page]);

  // ── Vote ───────────────────────────────────────────────────────────────────

  async function handleVote(value: 1 | -1) {
    if (voting) return;
    setVoteError(null);
    const token = getToken();
    if (!token) {
      setVoteError('Necesitás iniciar sesión para votar.');
      return;
    }
    setVoting(true);
    try {
      const res = await fetch(`/api/threads/${threadId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVoteError(data.error ?? 'No se pudo registrar el voto.');
        return;
      }
      setVoteCount(data.voteCount);
      setUserVote(data.userVote);
    } catch {
      setVoteError('Error de conexión.');
    } finally {
      setVoting(false);
    }
  }

  // ── Submit comment ─────────────────────────────────────────────────────────

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    setCommentError(null);
    const token = getToken();
    try {
      const res = await fetch(`/api/threads/${threadId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: commentText.trim(),
          ...(quotedComment ? { quotedCommentId: quotedComment.id } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCommentError(
          res.status === 401
            ? 'Necesitás iniciar sesión para comentar.'
            : data.error ?? 'Error al enviar el comentario.'
        );
        return;
      }
      setCommentText('');
      setQuotedComment(null);
      // Volver a página 1 para ver el nuevo comentario
      setPage(1);
      loadComments(1);
    } catch {
      setCommentError('Error de conexión. Intentá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleQuote(comment: CommentItem) {
    setQuotedComment(comment);
    document.getElementById('comment-textarea')?.focus();
  }

  const totalPages = Math.ceil(total / LIMIT);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky breadcrumb */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <nav
            className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap"
            aria-label="Ruta de navegación"
          >
            <Link href="/foros" className="hover:text-foreground transition-colors shrink-0">
              Foros
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            {thread ? (
              <>
                <Link
                  href={`/subforos/${thread.subforum.id}`}
                  className="hover:text-foreground transition-colors truncate max-w-[140px] sm:max-w-[200px]"
                >
                  {thread.subforum.name}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                <span className="text-foreground font-medium truncate max-w-[160px] sm:max-w-xs">
                  {thread.title}
                </span>
              </>
            ) : (
              <span className="text-foreground font-medium">…</span>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* ── Thread ─────────────────────────────────────────────────────── */}

        {threadLoading && (
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <ThreadSkeleton />
          </div>
        )}

        {!threadLoading && threadError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {threadError}
          </div>
        )}

        {!threadLoading && thread && (
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-border">
              {/* Title + badges */}
              <div className="flex items-start gap-2 mb-3 flex-wrap">
                {thread.pinned && (
                  <Pin className="w-4 h-4 text-amber-500 shrink-0 mt-1" aria-label="Hilo fijado" />
                )}
                <h1 className="text-xl font-bold tracking-tight leading-snug flex-1 min-w-0">
                  {thread.title}
                </h1>
                {thread.status === 'closed' && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full shrink-0">
                    <Lock className="w-3 h-3" />
                    Cerrado
                  </span>
                )}
              </div>

              {/* Author + meta */}
              <div className="flex items-center gap-3 flex-wrap text-sm mb-3">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 select-none">
                  {thread.author.username[0].toUpperCase()}
                </div>
                <span className="font-medium">@{thread.author.username}</span>
                <RoleBadge role={thread.author.role} emailVerified={thread.author.emailVerified} />
                <span className="text-muted-foreground text-xs">{formatDate(thread.createdAt)}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="w-3.5 h-3.5" />
                  {thread.stats.views} vistas
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {thread.stats.comments} comentarios
                </span>
              </div>

              {/* Tags */}
              {thread.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {thread.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSaved((s) => !s)}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors',
                    saved
                      ? 'border-amber-300 bg-amber-50 text-amber-700'
                      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  )}
                >
                  <Bookmark className={cn('w-3.5 h-3.5', saved && 'fill-current')} />
                  {saved ? 'Guardado' : 'Guardar'}
                </button>
                <button
                  onClick={() => setSubscribed((s) => !s)}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors',
                    subscribed
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  )}
                >
                  <Bell className={cn('w-3.5 h-3.5', subscribed && 'fill-current')} />
                  {subscribed ? 'Suscripto' : 'Suscribirse'}
                </button>
                <button className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors">
                  <Flag className="w-3.5 h-3.5" />
                  Reportar
                </button>
              </div>
            </div>

            {/* Vote error */}
            {voteError && (
              <div className="flex items-center gap-2 px-6 py-2 text-xs text-destructive bg-destructive/5 border-b border-destructive/20">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {voteError}
              </div>
            )}

            {/* Vote buttons + content */}
            <div className="flex gap-4 px-6 py-5">
              <VoteButtons
                count={voteCount}
                userVote={userVote}
                onVote={handleVote}
                disabled={voting}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {thread.content}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Comments ───────────────────────────────────────────────────── */}

        {!threadLoading && thread && (
          <div>
            <h2 className="text-base font-semibold mb-3">
              Comentarios
              {!commentsLoading && (
                <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
                  ({total})
                </span>
              )}
            </h2>

            <div className="border border-border rounded-lg bg-card overflow-hidden">
              {commentsLoading && (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <CommentSkeleton key={i} />
                  ))}
                </>
              )}

              {!commentsLoading && commentsError && (
                <div className="flex items-center gap-2 px-4 py-6 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {commentsError}
                </div>
              )}

              {!commentsLoading && !commentsError && comments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                    <MessageSquare className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium mb-1">No hay comentarios todavía</p>
                  <p className="text-xs text-muted-foreground">¡Sé el primero en comentar!</p>
                </div>
              )}

              {!commentsLoading && !commentsError && comments.length > 0 && (
                <>
                  {comments.map((comment) => (
                    <CommentCard key={comment.id} comment={comment} onQuote={handleQuote} />
                  ))}
                </>
              )}
            </div>

            {/* Paginación */}
            {!commentsLoading && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Caja de comentario ─────────────────────────────────────────── */}

        {!threadLoading && thread && (
          <div>
            {thread.status === 'closed' ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3.5 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 shrink-0" />
                Este hilo fue cerrado. No se pueden agregar nuevos comentarios.
              </div>
            ) : (
              <div className="border border-border rounded-lg bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-medium">Agregar comentario</h3>
                </div>
                <form onSubmit={handleSubmitComment} className="p-4 space-y-3">
                  {commentError && (
                    <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {commentError}
                    </div>
                  )}

                  {/* Vista previa de cita */}
                  {quotedComment && (
                    <div className="flex items-start gap-2">
                      <blockquote className="flex-1 border-l-4 border-primary/30 bg-muted/50 rounded-r-md px-3 py-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          Citando a{' '}
                          <span className="font-medium">@{quotedComment.author.username}</span>…
                        </p>
                        <p className="text-sm text-muted-foreground italic line-clamp-2">
                          {quotedComment.content}
                        </p>
                      </blockquote>
                      <button
                        type="button"
                        onClick={() => setQuotedComment(null)}
                        aria-label="Quitar cita"
                        className="text-muted-foreground hover:text-foreground mt-1 text-sm leading-none"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <textarea
                    id="comment-textarea"
                    rows={4}
                    placeholder="Escribí tu comentario…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={submitting}
                    className={cn(
                      'w-full resize-y rounded-md border border-input bg-transparent px-3 py-2.5 text-sm',
                      'placeholder:text-muted-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      'min-h-[100px]'
                    )}
                  />

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      disabled
                      title="Disponible próximamente"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground border border-dashed border-border rounded-lg px-3 py-2 cursor-not-allowed opacity-60 select-none"
                    >
                      <Paperclip className="w-4 h-4 shrink-0" />
                      Adjuntar
                    </button>
                    <Button type="submit" size="sm" disabled={submitting || !commentText.trim()}>
                      {submitting ? 'Enviando…' : 'Comentar'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
