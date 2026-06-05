import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ThreadStatus } from '@/lib/generated/prisma';

type Params = { params: Promise<{ subforumId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { subforumId } = await params;

    const subforum = await prisma.subforum.findUnique({ where: { id: subforumId } });
    if (!subforum) {
      return NextResponse.json({ error: 'Subforo no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
    const sort = searchParams.get('sort') ?? 'recent';

    const threads = await prisma.thread.findMany({
      where: {
        subforumId,
        status: { not: 'deleted' as ThreadStatus },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        tags: true,
        status: true,
        pinned: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { id: true, username: true, avatar: true },
        },
        _count: {
          select: { comments: true },
        },
        votes: {
          select: { value: true },
        },
        comments: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const sorted = threads.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

      if (sort === 'votes') {
        const votesA = a.votes.reduce((sum, v) => sum + v.value, 0);
        const votesB = b.votes.reduce((sum, v) => sum + v.value, 0);
        return votesB - votesA;
      }
      if (sort === 'activity') {
        const lastA = a.comments[0]?.createdAt ?? a.createdAt;
        const lastB = b.comments[0]?.createdAt ?? b.createdAt;
        return lastB.getTime() - lastA.getTime();
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const total = sorted.length;
    const skip = (page - 1) * limit;
    const paginated = sorted.slice(skip, skip + limit);

    const result = paginated.map(({ votes, comments, _count, tags, ...thread }) => ({
      ...thread,
      tags: Array.isArray(tags) ? tags : [],
      voteCount: votes.reduce((sum, v) => sum + v.value, 0),
      commentCount: _count.comments,
      lastActivityAt: (comments[0]?.createdAt ?? thread.createdAt).toISOString(),
    }));

    return NextResponse.json(
      { threads: result, page, limit, total, hasNext: skip + limit < total },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al obtener hilos del subforo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
