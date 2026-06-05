'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare,
  ChevronRight,
  Pin,
  Lock,
  ThumbsUp,
  Plus,
  AlertCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type SubforumInfo = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  forum: { id: string; name: string; faculty: string | null };
};

type ThreadItem = {
  id: string;
  title: string;
  slug: string;
  tags: string[];
  status: 'active' | 'closed';
  pinned: boolean;
  viewCount: number;
  createdAt: string;
  lastActivityAt: string;
  author: { id: string; username: string; avatar: string | null };
  commentCount: number;
  voteCount: number;
};

type ThreadsResponse = {
  threads: ThreadItem[];
  page: number;
  total: number;
  hasNext: boolean;
};

type SortOption = 'recent' | 'votes' | 'activity';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeDate(dateString: string): string {
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

// ─── Thread row ───────────────────────────────────────────────────────────────

function ThreadRow({ thread, subforumId }: { thread: ThreadItem; subforumId: string }) {
  return (
    <Link
      href={`/subforos/${subforumId}/hilos/${thread.id}`}
      className="group flex flex-col gap-1.5 px-4 py-3.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
    >
      {/* Title row */}
      <div className="flex items-start gap-2">
        {thread.pinned && (
          <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" aria-label="Hilo fijado" />
        )}
        <span className="font-medium text-sm leading-snug group-hover:underline underline-offset-2 flex-1 min-w-0">
          {thread.title}
        </span>
        {thread.status === 'closed' && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
            <Lock className="w-3 h-3" />
            Cerrado
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="font-medium text-foreground/70">@{thread.author.username}</span>
        <span>{formatRelativeDate(thread.createdAt)}</span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {thread.commentCount}
        </span>
        <span
          className={cn(
            'flex items-center gap-1',
            thread.voteCount > 0 && 'text-green-600',
            thread.voteCount < 0 && 'text-destructive'
          )}
        >
          <ThumbsUp className="w-3 h-3" />
          {thread.voteCount > 0 ? `+${thread.voteCount}` : thread.voteCount}
        </span>
        {thread.lastActivityAt !== thread.createdAt && (
          <span className="text-muted-foreground/70">
            Actividad: {formatRelativeDate(thread.lastActivityAt)}
          </span>
        )}
      </div>

      {/* Tags */}
      {thread.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
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
    </Link>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function ThreadSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-4 py-3.5 border-b border-border last:border-0 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="flex gap-3">
        <div className="h-3 bg-muted rounded w-20" />
        <div className="h-3 bg-muted rounded w-16" />
        <div className="h-3 bg-muted rounded w-10" />
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="animate-pulse space-y-2 mb-6">
      <div className="h-7 bg-muted rounded w-48" />
      <div className="h-4 bg-muted rounded w-80" />
      <div className="flex gap-2 mt-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 w-16 bg-muted rounded-full" />
        ))}
      </div>
    </div>
  );
}

// ─── Sort tabs ────────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Recientes' },
  { value: 'votes', label: 'Más votados' },
  { value: 'activity', label: 'Última actividad' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubforoPage() {
  const params = useParams();
  const subforumId = params.subforumId as string;

  const [subforum, setSubforum] = useState<SubforumInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [threadsError, setThreadsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [sort, setSort] = useState<SortOption>('recent');

  const LIMIT = 20;

  // Load subforum info
  useEffect(() => {
    async function loadInfo() {
      try {
        const res = await fetch(`/api/subforums/${subforumId}`);
        if (!res.ok) throw new Error('Subforo no encontrado');
        const data: SubforumInfo = await res.json();
        setSubforum(data);
      } catch (err) {
        setInfoError(err instanceof Error ? err.message : 'Error al cargar subforo');
      } finally {
        setLoadingInfo(false);
      }
    }
    loadInfo();
  }, [subforumId]);

  // Load threads
  const loadThreads = useCallback(
    async (p: number, s: SortOption) => {
      setLoadingThreads(true);
      setThreadsError(null);
      try {
        const res = await fetch(
          `/api/subforums/${subforumId}/threads?page=${p}&limit=${LIMIT}&sort=${s}`
        );
        if (!res.ok) throw new Error('No se pudieron cargar los hilos');
        const data: ThreadsResponse = await res.json();
        setThreads(data.threads);
        setTotal(data.total);
        setHasNext(data.hasNext);
      } catch (err) {
        setThreadsError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setLoadingThreads(false);
      }
    },
    [subforumId]
  );

  useEffect(() => {
    loadThreads(page, sort);
  }, [loadThreads, page, sort]);

  function handleSortChange(newSort: SortOption) {
    setSort(newSort);
    setPage(1);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
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
            {subforum ? (
              <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-xs">
                {subforum.name}
              </span>
            ) : (
              <span className="text-foreground font-medium">…</span>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Subforum header */}
        {loadingInfo && <HeaderSkeleton />}

        {!loadingInfo && infoError && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive mb-6">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {infoError}
          </div>
        )}

        {!loadingInfo && subforum && (
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight">{subforum.name}</h1>
                {subforum.description && (
                  <p className="text-sm text-muted-foreground mt-1">{subforum.description}</p>
                )}
                {subforum.forum.faculty && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {subforum.forum.name}
                  </p>
                )}
              </div>
              <Button asChild className="shrink-0">
                <Link href={`/subforos/${subforumId}/nuevo-hilo`}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Nuevo hilo
                </Link>
              </Button>
            </div>

            {/* Subforum tags */}
            {subforum.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {subforum.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border bg-muted text-muted-foreground"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sort tabs */}
        <div className="flex items-center gap-1 mb-4 border-b border-border pb-3">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSortChange(opt.value)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                sort === opt.value
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {opt.label}
            </button>
          ))}
          {!loadingThreads && (
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {total} {total === 1 ? 'hilo' : 'hilos'}
            </span>
          )}
        </div>

        {/* Threads */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          {loadingThreads && (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <ThreadSkeleton key={i} />
              ))}
            </>
          )}

          {!loadingThreads && threadsError && (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {threadsError}
            </div>
          )}

          {!loadingThreads && !threadsError && threads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium mb-1">No hay hilos todavía</p>
              <p className="text-xs text-muted-foreground mb-4">
                ¡Sé el primero en iniciar una discusión!
              </p>
              <Button size="sm" asChild>
                <Link href={`/subforos/${subforumId}/nuevo-hilo`}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Crear primer hilo
                </Link>
              </Button>
            </div>
          )}

          {!loadingThreads && !threadsError && threads.length > 0 && (
            <>
              {threads.map((thread) => (
                <ThreadRow key={thread.id} thread={thread} subforumId={subforumId} />
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {!loadingThreads && totalPages > 1 && (
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
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
